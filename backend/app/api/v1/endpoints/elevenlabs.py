from fastapi import APIRouter, Depends
from ....schemas.elevenlabs import ElevenLabsSchema
from bson import ObjectId
import requests
from ....services.auth import verify_bearer_token
from ....services.websocket import (
    evaluate_complete_conversation,
    remove_invalid_json_chars, evaluate_additional_criteria,
    evaluate_mid_conversation
)
from ....database import db
import json
from ....services.conversation import generate_answer_rag, evaluate_individual_answer, save_transcript_conversation


test_configurations_collection = db["test_configurations"]
product_collection = db["products"]
category_collection = db["categories"]

router = APIRouter()


@router.post("/transcript")
async def get_transcript(data: ElevenLabsSchema, token = Depends(verify_bearer_token)):
    test_config_id_str = data.test_config_id_str
    product_id_str = data.product_id_str
    product = product_collection.find_one({"_id": ObjectId(product_id_str)})
    category = category_collection.find_one({"_id": product["category_id"]})
    test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
    current_persona = test_config.get("visitorPersona", {})
    structured_output = []
    data_dict = data.model_dump()
    # Filter transcript to remove the first agent message
    filtered_transcript = data_dict["transcript"]

    for i in range(0, len(filtered_transcript) - 1, 2):
        if filtered_transcript[i]["source"] == "ai" and filtered_transcript[i + 1]["source"] == "user":
            structured_output.append({
                "salesperson_text": filtered_transcript[i + 1]["text"],
                "visitor_text": filtered_transcript[i]["text"],
            })

    transcript_text = structured_output
    product_content_str = product.get("content") if product.get("content") else ""
    product_description_str = product.get("description") if product.get("description") else ""
    
    combined_product_context = ""
    if product_content_str and product_description_str:
        combined_product_context = f"Product Content: {product_content_str}\nProduct Description: {product_description_str}"
    elif product_content_str:
        combined_product_context = f"Product Content: {product_content_str}"
    elif product_description_str:
        combined_product_context = f"Product Description: {product_description_str}"
    else:
        combined_product_context = "" # Or None
    complete_evaluation_raw = evaluate_complete_conversation(
                     transcript_text,
                     combined_product_context,
                     current_persona  # Add the persona parameter
                 )
    complete_evaluation_to_save = complete_evaluation_raw
    complete_rating_to_save = {
        "overall_progress": {"score": 0, "max": 3},
        "sales_strategy": {"score": 0, "max": 3},
        "customer_journey": {"score": 0, "max": 2},
        "technical_accuracy": {"score": 0, "max": 2},
        "total": {"score": 0, "max": 10}
    }

    try:
        # Clean the response - remove markdown code block markers and clean invalid characters
        cleaned_complete_eval = complete_evaluation_raw.strip()
        # Remove markdown code block
        if cleaned_complete_eval.startswith('```json'): # Be more specific with json marker
            cleaned_complete_eval = cleaned_complete_eval[7:]
        elif cleaned_complete_eval.startswith('```'):
            cleaned_complete_eval = cleaned_complete_eval[3:]
        if cleaned_complete_eval.endswith('```'):
            cleaned_complete_eval = cleaned_complete_eval[:-3]
        cleaned_complete_eval = cleaned_complete_eval.strip()
        
        # Remove any remaining invalid control characters
        cleaned_complete_eval = remove_invalid_json_chars(cleaned_complete_eval)
        # print("Cleaned complete_evaluation:", repr(cleaned_complete_eval))

        # Attempt to parse the cleaned string
        complete_eval_json = json.loads(cleaned_complete_eval, strict=False)
        # print("PARSED complete_evaluation:", complete_eval_json)

        # Check if parsing resulted in a dictionary with the expected keys
        if isinstance(complete_eval_json, dict):
            # If parsing was successful and the expected keys exist, use the parsed values
            if "complete_evaluation" in complete_eval_json and isinstance(complete_eval_json["complete_evaluation"], dict):
                complete_evaluation_to_save = complete_eval_json["complete_evaluation"] # Save the nested evaluation object
            elif "complete_evaluation" in complete_eval_json:
                complete_evaluation_to_save = complete_eval_json["complete_evaluation"] # Save the value even if not a dict (e.g., string fallback from LLM)

            if "complete_rating" in complete_eval_json and isinstance(complete_eval_json["complete_rating"], dict):
                complete_rating_to_save = complete_eval_json["complete_rating"] # Save the rating object
            
        # If parsing failed or the structure wasn't as expected,
        # complete_evaluation_to_save remains the raw text,
        # and complete_rating_to_save remains the default structure.

    except Exception as e:
        print(f"JSON decode or parsing error for complete evaluation: {e}")
        # On error, complete_evaluation_to_save remains the raw text
        # and complete_rating_to_save remains the default structure.
        pass # Continue with the default/raw values



    criteria_key_map = {
        "distraction_handling": "Distraction Handling",
        "communication_simplicity": "Communication Simplicity"
    }

    additional_criteria_evaluation = {}
    final_additional_criteria_config = test_config.get("additionalCriteria", None)
    if final_additional_criteria_config:
        for criteria, enabled in final_additional_criteria_config.items():
            if enabled:
                prompt_key = criteria_key_map.get(criteria, criteria)
                eval_text = evaluate_additional_criteria(
                    transcript_text,
                    prompt_key,
                    combined_product_context,
                    current_persona  # Add the persona parameter
                )
                additional_criteria_evaluation[criteria] = eval_text
    else:
        additional_criteria_evaluation = "No additional criteria selected for this test configuration."

    individual_evaluations = []
    # for idx, exchange in enumerate(transcript_text):
    #     rag_answer = generate_answer_rag(
    #         combined_product_context,
    #         exchange["visitor_text"],
    #         current_persona,
    #         idx == 0,
    #         transcript_text[:idx]
    #     )
    #     indiv_eval = evaluate_individual_answer(
    #         rag_answer,
    #         exchange["salesperson_text"],
    #         exchange["visitor_text"],
    #         current_persona,
    #         idx == 0,
    #         transcript_text[:idx]
    #     )
        
    #     # --- MODIFIED PARSING START ---
    #     individual_eval_obj = None # Initialize to None
    #     parsed_evaluation_text = indiv_eval # Default to raw text on failure
    #     parsed_rating = None # Default rating to None

    #     try:
    #         # --- Apply cleaning here ---
    #         cleaned_indiv_eval = remove_invalid_json_chars(indiv_eval)
    #         # print(f"Cleaned individual evaluation {idx}:", repr(cleaned_indiv_eval))

    #         # Attempt to parse the cleaned string
    #         parsed_json = json.loads(cleaned_indiv_eval)
    #         # If successful, extract the specific keys using .get()
    #         parsed_evaluation_text = parsed_json.get("evaluation", cleaned_indiv_eval) # Fallback to raw if "evaluation" key is missing
    #         parsed_rating = parsed_json.get("rating") # Can be None if "rating" key is missing

    #         # Construct the object to append, now including the reference answer
    #         individual_eval_obj = {
    #             "evaluation": parsed_evaluation_text,
    #             "rating": parsed_rating,  # Store the parsed rating (could be None)
    #             "reference_answer": rag_answer  # <-- Add this line
    #         }

    #     except json.JSONDecodeError as e:
    #         # Handle JSON parsing errors specifically
    #         print(f"JSON decode error for individual evaluation {idx}: {e}")
    #         # Keep parsed_evaluation_text as raw indiv_eval
    #         # Keep parsed_rating as None
    #         individual_eval_obj = {
    #             "evaluation": parsed_evaluation_text,
    #             "rating": { # Provide a default rating structure on parsing error
    #                 "question_relevance": {"score": 0, "max": 3},
    #                 "technical_accuracy": {"score": 0, "max": 3},
    #                 "sales_effectiveness": {"score": 0, "max": 4},
    #                 "total": {"score": 0, "max": 10}
    #             },
    #             "reference_answer": rag_answer
    #         }
    #     except Exception as e:
    #         # Handle any other unexpected errors during parsing/extraction
    #         print(f"Unexpected error parsing individual evaluation {idx}: {e}")
    #         # Keep parsed_evaluation_text as raw indiv_eval
    #         # Keep parsed_rating as None
    #         individual_eval_obj = {
    #             "evaluation": parsed_evaluation_text,
    #             "rating": { # Provide a default rating structure on other errors
    #                 "question_relevance": {"score": 0, "max": 3},
    #                 "technical_accuracy": {"score": 0, "max": 3},
    #                 "sales_effectiveness": {"score": 0, "max": 4},
    #                 "total": {"score": 0, "max": 10}
    #             },
    #             "reference_answer": rag_answer
    #         }
        
    #     # Append the resulting object
    #     individual_evaluations.append(individual_eval_obj)
        # --- MODIFIED PARSING END ---

    # mid_evaluations = []
    # for i in range(3, len(transcript_text), 4):
    #     mid_eval = evaluate_mid_conversation(transcript_text[:i+1], combined_product_context, current_persona)
    #     mid_evaluations.append(mid_eval)

    # 3. Complete evaluation (already done)
    # complete_evaluation = evaluate_complete_conversation(conversation_history, product["content"])

    # 4. Additional criteria evaluation (already done above)

    

    # 5. Save everything
    evaluation_data = {
        "individual_evaluations": individual_evaluations,
        # "mid_evaluations": mid_evaluations,
        "complete_evaluation": complete_evaluation_to_save, # Use the potentially parsed object or raw text
        "complete_rating": complete_rating_to_save,       # Use the potentially parsed object or default structure
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "is_complete": True,
        "test_configuration_id": ObjectId(test_config_id_str) if test_config_id_str else None  # Convert to ObjectId
    }

    try:
        product = product_collection.find_one({"_id": ObjectId(product_id_str)})
        category = category_collection.find_one({"_id": product["category_id"]})
        test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)}) if test_config_id_str else None

        prod_name = product["name"] if product else None
        cat_name = category["name"] if category else None
        test_name = test_config["name"] if test_config else None

        saved_conversation_result = save_transcript_conversation(
            ObjectId(product_id_str),
            ObjectId(product["category_id"]),
            ObjectId(test_config_id_str),
            {"pairs": transcript_text},
            ObjectId(token["id"]),
            evaluation_data,
            test_name=test_name,
            prod_name=prod_name,
            cat_name=cat_name
        )
        test_configurations_collection.update_one({"assessment":True})
        conversation_db_id = str(saved_conversation_result)
        print(f"Conversation saved with ID: {conversation_db_id}")
        
    except Exception as save_error:
        print(f"Error saving conversation: {save_error}")

    return {"transcript":transcript_text}
