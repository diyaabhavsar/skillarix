from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from ....schemas.conversation import EvaluationRequest, ConversationPair, EvaluationResponse
from ....services.product import get_product
from ....services.auth import verify_bearer_token
from ....services.conversation import (generate_answer_rag, evaluate_individual_answer,
                                       evaluate_mid_conversation, evaluate_complete_conversation,
                                       evaluate_additional_criteria, extract_score, calculate_metrics,
                                       save_conversation, get_conversations_by_product, get_conversation_by_id,
                                       )
from ....services.test_configuration import convert_objectids_to_strings
from bson import ObjectId
from bson.errors import InvalidId
from ....database import db
from math import ceil
from datetime import datetime, timezone

conversation_collection = db["conversations"]

router = APIRouter()

@router.post("")
async def evaluate_conversation(
    evaluation_request: EvaluationRequest,
    _ = Depends(verify_bearer_token)
):
    product = get_product(evaluation_request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    context = product["content"]
    conversation = evaluation_request.conversation

    # Get the last exchange for individual evaluation
    last_exchange = conversation[-1]
    rag_answer = generate_answer_rag(
    context,
    last_exchange['visitor_text'],
    len(conversation) == 1,
    conversation[:-1]
)
        # Evaluate individual answer
    individual_evaluation = evaluate_individual_answer(
        rag_answer,
        last_exchange['salesperson_text'],
        last_exchange['visitor_text'],
        len(conversation) == 1,
        conversation[:-1]
    )
    
    # Check if we need a mid-conversation evaluation (every 4 pairs)
    mid_evaluation = None
    if len(conversation) % 4 == 0:
        mid_evaluation = evaluate_mid_conversation(conversation, context)
    
    # Get complete evaluation and additional criteria evaluation if conversation is complete
    complete_evaluation = None
    additional_criteria_evaluation = None
    if evaluation_request.is_complete:
        # Perform complete evaluation
        complete_evaluation = evaluate_complete_conversation(conversation, context)
        
        # Perform additional criteria evaluation if criteria are provided
        if hasattr(evaluation_request, 'additional_criteria') and evaluation_request.additional_criteria:
            additional_criteria_evaluation = evaluate_additional_criteria(
                conversation,
                evaluation_request.additional_criteria,
                context
            )
        else:
            additional_criteria_evaluation = "No additional criteria selected"
    # Calculate metrics
    score = extract_score(individual_evaluation)
    metrics = calculate_metrics(conversation)
    
    # Save all evaluation data
    evaluation_data = {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "is_complete": evaluation_request.is_complete
    }
    
    conversation_id = save_conversation(
        evaluation_request.product_id,
        conversation,
        evaluation_data
    )
    
    return {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "conversation_id": str(conversation_id.inserted_id)
    }

@router.post("/additional-criteria")
async def evaluate_with_criteria(
    conversation: List[ConversationPair],
    criteria: str,
    product_id: str,
    _ = Depends(verify_bearer_token)
):
    product = get_product(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    evaluation = evaluate_additional_criteria(conversation, criteria, product["content"])
    
    # Save the additional criteria evaluation
    evaluation_data = {
        "additional_criteria_evaluation": evaluation,
        "criteria": criteria
    }
    
    conversation_id = save_conversation(
        ObjectId(product_id),
        conversation,
        evaluation_data
    )
    
    return {
        "evaluation": evaluation,
        "conversation_id": str(conversation_id.inserted_id)
    }

@router.post("/complete")
async def evaluate_full_conversation(
    conversation: List[ConversationPair],
    product_id: str,
    _ = Depends(verify_bearer_token)
):
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get all mid-conversation evaluations
    mid_evaluations = []
    for i in range(len(conversation)):
        mid_eval = evaluate_mid_conversation(conversation[:i+1], product["content"])
        mid_evaluations.append(mid_eval)
    
    # Get complete evaluation
    complete_evaluation = evaluate_complete_conversation(conversation, product["content"])
    score = extract_score(complete_evaluation)
    metrics = calculate_metrics(conversation)
    
    # Save the complete evaluation data
    evaluation_data = {
        "mid_evaluations": mid_evaluations,
        "complete_evaluation": complete_evaluation,
        "score": score,
        "metrics": metrics,
        "is_complete": True
    }
    
    conversation_id = save_conversation(
        ObjectId(product_id),
        conversation,
        evaluation_data
    )
    
    return EvaluationResponse(
        evaluation=complete_evaluation,
        score=score,
        metrics=metrics,
        conversation_id=str(conversation_id.inserted_id)
    )

@router.get("/history/{product_id}")
async def get_conversation_history(
    product_id: str,
    token = Depends(verify_bearer_token)
):
    conversations = get_conversations_by_product(ObjectId(product_id), token)
    return conversations

@router.get("/details/{conversation_id}")
async def get_conversation_details(
    conversation_id: str,
    _ = Depends(verify_bearer_token)
):
    conversation = get_conversation_by_id(ObjectId(conversation_id))
    # Manually convert ObjectId fields to string before returning
    if "_id" in conversation:
        conversation["_id"] = str(conversation["_id"])
    if "product_id" in conversation:
        conversation["product_id"] = str(conversation["product_id"])
    if "user_id" in conversation:
        conversation["user_id"] = str(conversation["user_id"])
    # Handle potential ObjectId in evaluation_data
    if "evaluation_data" in conversation and conversation["evaluation_data"] and "test_configuration_id" in conversation["evaluation_data"]:
         if isinstance(conversation["evaluation_data"]["test_configuration_id"], ObjectId):
              conversation["evaluation_data"]["test_configuration_id"] = str(conversation["evaluation_data"]["test_configuration_id"])
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

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
        base_query = {}
    else:
        base_query = {"user_id": ObjectId(token["id"])}
        
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

@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Get a specific conversation by its ID.
    Returns the conversation data including evaluation results.
    """
    try:
        # Convert string ID to ObjectId
        conversation_obj_id = ObjectId(conversation_id)
        
        # Get conversation from database
        conversation = get_conversation_by_id(conversation_obj_id)
        
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
            
        # Check if user has permission to access this conversation
        # Admin can access all conversations, regular users can only access their own
        if token["role"] != "admin" and str(conversation["user_id"]) != token["id"]:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this conversation"
            )
        
        # Convert ObjectId fields to strings for JSON serialization
        if "_id" in conversation:
            conversation["_id"] = str(conversation["_id"])
        if "product_id" in conversation:
            conversation["product_id"] = str(conversation["product_id"])
        if "user_id" in conversation:
            conversation["user_id"] = str(conversation["user_id"])
            
        # Handle potential ObjectId in evaluation_data
        if "evaluation_data" in conversation and conversation["evaluation_data"]:
            if "test_configuration_id" in conversation["evaluation_data"]:
                test_config_id = conversation["evaluation_data"]["test_configuration_id"]
                if isinstance(test_config_id, ObjectId):
                    conversation["evaluation_data"]["test_configuration_id"] = str(test_config_id)
        
        return conversation
        
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID format"
        )
    except Exception as e:
        print(f"Error fetching conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching conversation"
        )


@router.delete("/{conversation_id}")
async def soft_delete_conversation(
    conversation_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Soft delete a conversation by its ID.
    Only admins are allowed to perform this action.
    """
    try:
        if token["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admins can delete conversations."
            )
        conversation_obj_id = ObjectId(conversation_id)
        result = conversation_collection.update_one(
            {"_id": conversation_obj_id, "is_deleted": False},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.now(),
                    "updated_by": ObjectId(token["id"])
                }
            }
        )
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or already deleted."
            )
        return {"detail": "Conversation soft deleted successfully."}
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID format"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error soft deleting conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while deleting conversation"
        )






