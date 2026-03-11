from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from ....schemas.conversation import EvaluationRequest, ConversationPair, EvaluationResponse
from ....services.product import get_product
from ....services.auth import verify_bearer_token
from ....services.conversation import (
    generate_answer_rag,
    evaluate_individual_answer,
    evaluate_mid_conversation,
    evaluate_complete_conversation,
    evaluate_additional_criteria,
    extract_score,
    calculate_metrics,
    save_conversation,
    get_conversation_by_id  # âœ… FIXED IMPORT
)
from ....services.gamification import award_xp, update_streak, check_milestones
from ....services.test_configuration import convert_objectids_to_strings
from bson import ObjectId
from bson.errors import InvalidId
from ....database import db
from math import ceil
from datetime import datetime

conversation_collection = db["conversations"]
assignments_collection = db["assignments"]
router = APIRouter()

async def process_gamification(user_id: str, score: float):
    """
    Triggers gamification updates:
    - Updates streak
    - Awards XP for completion and score
    - Checks session milestones
    """
    try:
        # 1. Update Streak
        await update_streak(user_id)
        
        # 2. Award XP for completion
        await award_xp(user_id, 50, "conversation_complete")
        
        # 3. Award XP for score (Max 100 XP for perfect score)
        # Handle score being 0-10 or 0-100
        bonus_xp = 0
        if score <= 10:
             bonus_xp = int(score * 10)
        else:
             bonus_xp = int(score) # already percentage
             
        if bonus_xp > 0:
            await award_xp(user_id, bonus_xp, "score_bonus")

        # 4. Check Milestones (Sessions)
        # Optimized count - maybe cache this later
        session_count = conversation_collection.count_documents({"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
        
        # We pass the session_count as the current value
        # But check_milestones implementation might need update if it expects incremental.
        # Our implementation:
        # if not user_ms: current >= target
        # else: current > user_ms["current_value"] -> update
        # So passing absolute count is correct.
        await check_milestones(user_id, "sessions", session_count)
        
    except Exception as e:
        print(f"Gamification Error: {e}")


# -----------------------------------------------------------
# 1ï¸âƒ£  Evaluate Single Turn Conversation
# -----------------------------------------------------------
@router.post("")
async def evaluate_conversation(
    evaluation_request: EvaluationRequest,
    token=Depends(verify_bearer_token)
):
    product = get_product(evaluation_request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    context = product.get("content", "")
    conversation = evaluation_request.conversation

    # FORMAT INPUT TO DICT LIST
    conversation_dict = [{"visitor_text": c.visitor_text,
                          "salesperson_text": c.salesperson_text}
                         for c in conversation]

    last_exchange = conversation_dict[-1]

    # âœ… Correct call signature for RAG answer
    rag_answer = generate_answer_rag(
        context=context,
        question=last_exchange["visitor_text"],
        persona={},               # No persona for this API
        is_first_exchange=len(conversation) == 1,
        conversation_history=conversation_dict[:-1]
    )

    # âœ… Correct evaluation function signature
    individual_evaluation = evaluate_individual_answer(
        rag_answer=rag_answer,
        salesperson_answer=last_exchange["salesperson_text"],
        customer_question=last_exchange["visitor_text"],
        persona={},
        is_first_exchange=len(conversation) == 1,
        conversation_history=conversation_dict[:-1]
    )

    # MID CONVERSATION CHECK
    mid_evaluation = (
        evaluate_mid_conversation(conversation_dict, context)
        if len(conversation) % 4 == 0 else None
    )

    # FINAL EVALUATION (if complete)
    complete_evaluation = None
    additional_criteria_evaluation = None
    if evaluation_request.is_complete:
        complete_evaluation = evaluate_complete_conversation(
            conversation_dict, context
        )

        if evaluation_request.additional_criteria:
            additional_criteria_evaluation = evaluate_additional_criteria(
                conversation_dict,
                evaluation_request.additional_criteria,
                context
            )
        else:
            additional_criteria_evaluation = "No additional criteria selected"

    score = extract_score(individual_evaluation)
    metrics = calculate_metrics(conversation_dict)

    evaluation_data = {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "is_complete": evaluation_request.is_complete
    }

    saved = save_conversation(
        product_id=ObjectId(evaluation_request.product_id),
        category_id=product["category_id"],
        conversation_data={"pairs": conversation_dict},
        user_id=token["id"],
        evaluation_data=evaluation_data,
        prod_name=product["name"],
        cat_name=product.get("category_name", "")
    )

    # Trigger Gamification if complete
    if evaluation_request.is_complete:
        # Use complete evaluation score if available, otherwise fallback to current turn score
        final_score = score
        if complete_evaluation:
             final_score = extract_score(complete_evaluation)
        await process_gamification(token["id"], final_score)

        # Update Assignment if exists
        try:
            assignment = assignments_collection.find_one({
                "salesperson_id": ObjectId(token["id"]),
                "product_id": ObjectId(evaluation_request.product_id),
                "status": "accepted"
            })
            
            if assignment:
                assignments_collection.update_one(
                    {"_id": assignment["_id"]},
                    {
                        "$set": {
                            "status": "completed",
                            "score": final_score,
                            "conversation_id": saved,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                print(f"âœ… Assignment {assignment['_id']} marked as completed.")
        except Exception as e:
            print(f"âš ï¸  Failed to update assignment: {e}")


    return {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "conversation_id": str(saved)
    }


# -----------------------------------------------------------
# 2ï¸âƒ£  Additional Criteria Evaluation
# -----------------------------------------------------------
@router.post("/additional-criteria")
async def evaluate_with_criteria(
    conversation: List[ConversationPair],
    criteria: str,
    product_id: str,
    token=Depends(verify_bearer_token)
):
    product = get_product(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    conversation_dict = [
        {"visitor_text": c.visitor_text, "salesperson_text": c.salesperson_text}
        for c in conversation
    ]

    evaluation = evaluate_additional_criteria(
        conversation_dict,
        criteria,
        product["content"]
    )
    saved = save_conversation(
        product_id=ObjectId(product_id),
        category_id=product["category_id"],
        conversation_data={"pairs": conversation_dict},
        user_id=token["id"],
        evaluation_data={
            "additional_criteria_evaluation": evaluation,
            "criteria": criteria
        },
        prod_name=product["name"],
        cat_name=product.get("category_name", "")
    )

    #saved = save_conversation(
    #    ObjectId(product_id),
    #    {"pairs": conversation_dict},
    #    {"additional_criteria_evaluation": evaluation, "criteria": criteria}
    #)

    return {"evaluation": evaluation, "conversation_id": str(saved)}


# -----------------------------------------------------------
# 3ï¸âƒ£  Full Conversation Evaluation
# -----------------------------------------------------------
@router.post("/complete")
async def evaluate_full_conversation(
    conversation: List[ConversationPair],
    product_id: str,
    token=Depends(verify_bearer_token)
):
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    conversation_dict = [
        {"visitor_text": c.visitor_text, "salesperson_text": c.salesperson_text}
        for c in conversation
    ]

    mid_evaluations = [
        evaluate_mid_conversation(conversation_dict[:i+1], product["content"])
        for i in range(len(conversation_dict))
    ]

    complete_evaluation = evaluate_complete_conversation(
        conversation_dict, product["content"]
    )

    score = extract_score(complete_evaluation)
    metrics = calculate_metrics(conversation_dict)

    saved = save_conversation(
        product_id=ObjectId(product_id),
        category_id=product["category_id"],
        conversation_data={"pairs": conversation_dict},
        user_id=token["id"],
        evaluation_data={
            "mid_evaluations": mid_evaluations,
            "complete_evaluation": complete_evaluation,
            "score": score,
            "metrics": metrics,
            "is_complete": True
        },
        prod_name=product["name"],
        cat_name=product.get("category_name", "")
    )

    # Trigger Gamification
    await process_gamification(token["id"], score)

    # Update Assigmnemt if exists
    try:
        assignment = assignments_collection.find_one({
            "salesperson_id": ObjectId(token["id"]),
            "product_id": ObjectId(product_id),
            "status": "accepted"
        })
        
        if assignment:
            assignments_collection.update_one(
                {"_id": assignment["_id"]},
                {
                    "$set": {
                        "status": "completed",
                        "score": score,
                        "conversation_id": saved,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"âœ… Assignment {assignment['_id']} marked as completed.")
    except Exception as e:
        print(f"âš ï¸  Failed to update assignment: {e}")
 #saved = save_conversation(
        # ObjectId(product_id),
        #{"pairs": conversation_dict},
        #{
            #"mid_evaluations": mid_evaluations,
            #"complete_evaluation": complete_evaluation,
            #"score": score,
            #"metrics": metrics,
            #"is_complete": True
        #}
    #)

    return EvaluationResponse(
        evaluation=complete_evaluation,
        score=score,
        metrics=metrics,
        conversation_id=str(saved)
    )


# -----------------------------------------------------------
# 4ï¸âƒ£ Conversation History
# -----------------------------------------------------------
@router.get("/history/{product_id}")
async def get_conversation_history(product_id: str, token=Depends(verify_bearer_token)):
    conversations = list(
        conversation_collection.find(
            {"product_id": ObjectId(product_id), "user_id": ObjectId(token["id"])},
            sort=[("created_at", -1)]
        )
    )

    return convert_objectids_to_strings(conversations)


# -----------------------------------------------------------
# 8ï¸âƒ£ Get Conversation Stats (Dashboard)
# -----------------------------------------------------------
@router.get("/stats")
async def get_conversation_stats(token=Depends(verify_bearer_token)):
    """
    Returns aggregated statistics for the user's Dashboard.
    Includes: Total Sessions, Average Score, Product Count.
    """
    # 1. Base Query (Filter out deleted)
    if token["role"] == "admin":
        base_query = {"is_deleted": {"$ne": True}}
    else:
        base_query = {"user_id": ObjectId(token["id"]), "is_deleted": {"$ne": True}}

    print(f"DEBUG: token_id={token.get('id')} role={token.get('role')}")
    print(f"DEBUG: base_query={base_query}")

    # 2. Fetch all valid conversations (projection for speed)
    conversations = list(conversation_collection.find(
        base_query,
        {
            "evaluation_data.complete_rating.total.score": 1, 
            "evaluation_data.complete_rating.total.max": 1,
            "product_id": 1,
            "created_at": 1,
            "updated_at": 1
        }
    ))
    
    print(f"DEBUG: Found {len(conversations)} conversations")

    total_sessions = len(conversations)
    unique_products = len(set(str(c.get("product_id")) for c in conversations if c.get("product_id")))
    
    total_percentage = 0
    scored_sessions_count = 0
    current_max_percentage = 0
    total_duration_minutes = 0

    for c in conversations:
        # Navigate safely to score
        eval_data = c.get("evaluation_data", {})
        rating = eval_data.get("complete_rating", {}) 
        # Support both nested 'total' object or direct structure if any legacy data
        total_obj = rating.get("total", {})
        
        score = total_obj.get("score", 0)
        max_score = total_obj.get("max", 0)

        # Only count if max_score > 0 to avoid division by zero
        if max_score > 0:
            percentage = (score / max_score) * 100
            total_percentage += percentage
            scored_sessions_count += 1
            if percentage > current_max_percentage:
                current_max_percentage = percentage

        # Calculate duration
        created_at = c.get("created_at")
        updated_at = c.get("updated_at")
        if created_at and updated_at:
             # Ensure they are datetime objects
             if isinstance(created_at, str):
                 try:
                     created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                 except:
                     pass
             if isinstance(updated_at, str):
                 try:
                     updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                 except:
                     pass
            
             if isinstance(created_at, datetime) and isinstance(updated_at, datetime):
                 diff = (updated_at - created_at).total_seconds()
                 if diff > 0:
                     total_duration_minutes += (diff / 60)


    avg_score = round(total_percentage / scored_sessions_count) if scored_sessions_count > 0 else 0
    best_score = round(current_max_percentage)

    return {
        "total_sessions": total_sessions,
        "average_score": avg_score,
        "best_score": best_score,
        "products_active": unique_products,
        "total_duration_minutes": round(total_duration_minutes),
        "sessions_this_week": 0 # Placeholder or implement date filtering if needed
    }


# -----------------------------------------------------------
# 5ï¸âƒ£ GET Specific Conversation
# -----------------------------------------------------------
@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, token=Depends(verify_bearer_token)):
    try:
        conversation = get_conversation_by_id(ObjectId(conversation_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if token["role"] != "admin" and str(conversation["user_id"]) != token["id"]:
            raise HTTPException(status_code=403, detail="No permission")

        return convert_objectids_to_strings([conversation])[0]

    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")


# -----------------------------------------------------------
# 6ï¸âƒ£ Soft Delete
# -----------------------------------------------------------
@router.delete("/{conversation_id}")
async def soft_delete_conversation(conversation_id: str, token=Depends(verify_bearer_token)):
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    conversation = conversation_collection.find_one({"_id": ObjectId(conversation_id)})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Allow if admin OR if user owns the conversation
    if token["role"] != "admin" and str(conversation.get("user_id")) != token["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this conversation")

    result = conversation_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
    )

    return {"detail": "Conversation deleted successfully"}
# -----------------------------------------------------------
# 7ï¸âƒ£ Get All Conversations (History)
# -----------------------------------------------------------
@router.get("")
async def get_all_conversations_for_user(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Max number of items to return. If not provided, returns all records"),
    token = Depends(verify_bearer_token)
):
    """
    Retrieves conversations based on user role:
    - Admin: Returns all conversations in the database.
    - Employee: Returns only conversations belonging to the logged-in user.
    When limit is not provided, returns all records.
    """
    conversations = []
    # Check the role of the authenticated user
    if token["role"] == "admin":
        base_query = {"is_deleted": {"$ne": True}}
    else:
        base_query = {"user_id": ObjectId(token["id"]), "is_deleted": {"$ne": True}}
        
    total_count = conversation_collection.count_documents(base_query)
    
    # If limit is not provided, set it to total count to return all records
    if limit is None:
        limit = total_count
        
    # Calculate skip from page
    skip = (page - 1) * limit
    total_pages = ceil(total_count / limit) if total_count > 0 else 1
    conversations_cursor = (
        conversation_collection.find(base_query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    conversations = list(conversations_cursor)
    conversations = convert_objectids_to_strings(conversations)
    return {
        "data": conversations,
        "page": page,
        "limit": limit,
        "count": len(conversations),
        "total_count": total_count,
        "total_pages": total_pages
    }


