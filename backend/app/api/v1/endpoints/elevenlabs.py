<<<<<<< HEAD
from fastapi import APIRouter, Depends
from ....schemas.elevenlabs import ElevenLabsSchema
=======
from fastapi import APIRouter, HTTPException, Depends, WebSocket
from ....schemas.category import CategoryCreate
from ....services.categories import category_register, list_categories, update_category_process, delete_category_process
>>>>>>> 7776bbe (elevanlabs poc)
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
<<<<<<< HEAD
from ....services.conversation import generate_answer_rag, evaluate_individual_answer, save_transcript_conversation

=======
from ....services.conversation import generate_answer_rag, evaluate_individual_answer, save_conversation
import asyncio
from typing import List
from fastapi.responses import JSONResponse
import websockets
>>>>>>> 7776bbe (elevanlabs poc)

test_configurations_collection = db["test_configurations"]
product_collection = db["products"]
category_collection = db["categories"]

router = APIRouter()
<<<<<<< HEAD


@router.post("/transcript")
async def get_transcript(data: ElevenLabsSchema, token = Depends(verify_bearer_token)):
    test_config_id_str = data.test_config_id_str
    product_id_str = data.product_id_str
=======
AGENT_ID="agent_01jy5xxvf1esb82gk80fffvb8f"
ELEVENLABS_API_KEY="sk_5cab7f47605661504fb6e82b4c588f2ede578958db787050"

@router.get("")
def start_conversation():

    # Step 1: Start a new conversation with a dynamic prompt
    start_url = f"https://api.elevenlabs.io/v1/convai/agents/{AGENT_ID}/simulate-conversation"
    headers = {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
    }
    body = {
  "simulation_specification": {
    "simulated_user_config": {}
  }
}

    convo_response = requests.post(start_url,json=body, headers=headers)
    print(convo_response)
    if convo_response.status_code != 200:
        return {'error': 'Failed to start conversation'}

    convo_data = convo_response.json()
    conversation_id = convo_data.get('conversation_id')
    return {"message":conversation_id}

@router.get("/{conversation_id}/{test_config_id_str}/{product_id_str}")
def transcript_webhook(conversation_id:str,test_config_id_str:str,product_id_str:str, token = Depends(verify_bearer_token)):
>>>>>>> 7776bbe (elevanlabs poc)
    product = product_collection.find_one({"_id": ObjectId(product_id_str)})
    category = category_collection.find_one({"_id": product["category_id"]})
    test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
    current_persona = test_config.get("visitorPersona", {})
<<<<<<< HEAD
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
=======
    transcript_url = f"https://api.elevenlabs.io/v1/conversations/{conversation_id}/transcript"
    headers = {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
    }
    transcript_response = requests.get(transcript_url, headers=headers)


    if transcript_response.status_code != 200:
        return {'error': 'Failed to fetch transcript'}

    transcript_data = transcript_response.json()
    transcript_text = transcript_data.get('transcript', 'Transcript not available yet.')
>>>>>>> 7776bbe (elevanlabs poc)
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
<<<<<<< HEAD
        # print("Cleaned complete_evaluation:", repr(cleaned_complete_eval))

        # Attempt to parse the cleaned string
        complete_eval_json = json.loads(cleaned_complete_eval, strict=False)
        # print("PARSED complete_evaluation:", complete_eval_json)
=======
        print("Cleaned complete_evaluation:", repr(cleaned_complete_eval))

        # Attempt to parse the cleaned string
        complete_eval_json = json.loads(cleaned_complete_eval, strict=False)
        print("PARSED complete_evaluation:", complete_eval_json)
>>>>>>> 7776bbe (elevanlabs poc)

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
<<<<<<< HEAD
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
=======
    for idx, exchange in enumerate(transcript_text):
        rag_answer = generate_answer_rag(
            combined_product_context,
            exchange["visitor_text"],
            current_persona,
            idx == 0,
            conversation_history[:idx]
        )
        indiv_eval = evaluate_individual_answer(
            rag_answer,
            exchange["salesperson_text"],
            exchange["visitor_text"],
            current_persona,
            idx == 0,
            conversation_history[:idx]
        )
        
        # --- MODIFIED PARSING START ---
        individual_eval_obj = None # Initialize to None
        parsed_evaluation_text = indiv_eval # Default to raw text on failure
        parsed_rating = None # Default rating to None

        try:
            # --- Apply cleaning here ---
            cleaned_indiv_eval = remove_invalid_json_chars(indiv_eval)
            print(f"Cleaned individual evaluation {idx}:", repr(cleaned_indiv_eval))

            # Attempt to parse the cleaned string
            parsed_json = json.loads(cleaned_indiv_eval)
            # If successful, extract the specific keys using .get()
            parsed_evaluation_text = parsed_json.get("evaluation", cleaned_indiv_eval) # Fallback to raw if "evaluation" key is missing
            parsed_rating = parsed_json.get("rating") # Can be None if "rating" key is missing

            # Construct the object to append, now including the reference answer
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": parsed_rating,  # Store the parsed rating (could be None)
                "reference_answer": rag_answer  # <-- Add this line
            }

        except json.JSONDecodeError as e:
            # Handle JSON parsing errors specifically
            print(f"JSON decode error for individual evaluation {idx}: {e}")
            # Keep parsed_evaluation_text as raw indiv_eval
            # Keep parsed_rating as None
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": { # Provide a default rating structure on parsing error
                    "question_relevance": {"score": 0, "max": 3},
                    "technical_accuracy": {"score": 0, "max": 3},
                    "sales_effectiveness": {"score": 0, "max": 4},
                    "total": {"score": 0, "max": 10}
                },
                "reference_answer": rag_answer
            }
        except Exception as e:
            # Handle any other unexpected errors during parsing/extraction
            print(f"Unexpected error parsing individual evaluation {idx}: {e}")
            # Keep parsed_evaluation_text as raw indiv_eval
            # Keep parsed_rating as None
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": { # Provide a default rating structure on other errors
                    "question_relevance": {"score": 0, "max": 3},
                    "technical_accuracy": {"score": 0, "max": 3},
                    "sales_effectiveness": {"score": 0, "max": 4},
                    "total": {"score": 0, "max": 10}
                },
                "reference_answer": rag_answer
            }
        
        # Append the resulting object
        individual_evaluations.append(individual_eval_obj)
        # --- MODIFIED PARSING END ---

    mid_evaluations = []
    for i in range(3, len(transcript_text), 4):
        mid_eval = evaluate_mid_conversation(conversation_history[:i+1], combined_product_context, current_persona)
        mid_evaluations.append(mid_eval)
>>>>>>> 7776bbe (elevanlabs poc)

    # 3. Complete evaluation (already done)
    # complete_evaluation = evaluate_complete_conversation(conversation_history, product["content"])

    # 4. Additional criteria evaluation (already done above)

    

    # 5. Save everything
    evaluation_data = {
        "individual_evaluations": individual_evaluations,
<<<<<<< HEAD
        # "mid_evaluations": mid_evaluations,
=======
        "mid_evaluations": mid_evaluations,
>>>>>>> 7776bbe (elevanlabs poc)
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

<<<<<<< HEAD
        saved_conversation_result = save_transcript_conversation(
            ObjectId(product_id_str),
            ObjectId(product["category_id"]),
            ObjectId(test_config_id_str),
=======
        saved_conversation_result = save_conversation(
            ObjectId(product_id_str),
            ObjectId(product["category_id"]),
            {"pairs": transcript_text},
            ObjectId(token["id"]),
            evaluation_data,
            test_name=test_name,
            prod_name=prod_name,
            cat_name=cat_name
        )
        conversation_db_id = str(saved_conversation_result)
        print(f"Conversation saved with ID: {conversation_db_id}")
        
    except Exception as save_error:
        print(f"Error saving conversation: {save_error}")

    return {"transcript":transcript_text}


class ConnectionManager:
    def __init__(self):
        self.ws: WebSocket = None
        self.transcript: List[str] = []
    async def connect(self, websocket: WebSocket):
        self.ws = websocket
        await websocket.accept()
    async def disconnect(self):
        self.ws = None

manager = ConnectionManager()

@router.websocket("/conv")
async def conv_ws(websocket: WebSocket):
    await manager.connect(websocket)
    # Get signed URL
    wss_url = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={AGENT_ID}"
    async with websockets.connect(wss_url, extra_headers={"xi-api-key": ELEVENLABS_API_KEY}) as conv:
        # send init
        init = {"type":"conversation_initiation_client_data","conversation_config_override":{
                    "agent":{"prompt":{"prompt":""}},"tts":{} }}
        await conv.send(json.dumps(init))
        async def from_client():
            async for msg in websocket.iter_text():
                data = json.loads(msg)
                # forward user audio or message
                await conv.send(json.dumps(data))
        async def from_eleven():
            async for msg in conv:
                obj = json.loads(msg)
                typ = obj.get("type")
                if typ == "user_transcript":
                    manager.transcript.append(obj["user_transcription_event"]["user_transcript"])
                # forward full event to client
                await websocket.send_text(msg)
        done, _ = await asyncio.wait(
            [asyncio.create_task(from_client()), asyncio.create_task(from_eleven())],
            return_when=asyncio.FIRST_COMPLETED
        )
    await manager.disconnect()

@router.get("/transcript")
async def get_transcript(conversation_id:str, token = Depends(verify_bearer_token)):
    transcript_url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    headers = {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
    }
    transcript_response = requests.get(transcript_url, headers=headers)
    transcript_data = transcript_response.json()["transcript"]
    # return transcript_data
    test_config_id_str = "68524ed4ec2051cf46151390"
    product_id_str = "6849bfb4db33049c201639a4"
    product = product_collection.find_one({"_id": ObjectId(product_id_str)})
    category = category_collection.find_one({"_id": product["category_id"]})
    test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
    current_persona = test_config.get("visitorPersona", {})
    structured_output = []
    skip_first_agent = True

    # Filter transcript to remove the first agent message
    filtered_transcript = []
    for entry in transcript_data:
        if entry["role"] == "agent" and skip_first_agent:
            skip_first_agent = False
            continue
        filtered_transcript.append(entry)

    # Pair user-agent messages
    for i in range(0, len(filtered_transcript), 2):
        visitor_msg = filtered_transcript[i]["message"] if filtered_transcript[i]["role"] == "user" else ""
        agent_msg = filtered_transcript[i+1]["message"] if i+1 < len(filtered_transcript) and filtered_transcript[i+1]["role"] == "agent" else ""
        
        structured_output.append({
            "visitor_text": visitor_msg,
            "salesperson_text": agent_msg
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
        print("Cleaned complete_evaluation:", repr(cleaned_complete_eval))

        # Attempt to parse the cleaned string
        complete_eval_json = json.loads(cleaned_complete_eval, strict=False)
        print("PARSED complete_evaluation:", complete_eval_json)

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
    for idx, exchange in enumerate(transcript_text):
        rag_answer = generate_answer_rag(
            combined_product_context,
            exchange["visitor_text"],
            current_persona,
            idx == 0,
            transcript_text[:idx]
        )
        indiv_eval = evaluate_individual_answer(
            rag_answer,
            exchange["salesperson_text"],
            exchange["visitor_text"],
            current_persona,
            idx == 0,
            transcript_text[:idx]
        )
        
        # --- MODIFIED PARSING START ---
        individual_eval_obj = None # Initialize to None
        parsed_evaluation_text = indiv_eval # Default to raw text on failure
        parsed_rating = None # Default rating to None

        try:
            # --- Apply cleaning here ---
            cleaned_indiv_eval = remove_invalid_json_chars(indiv_eval)
            print(f"Cleaned individual evaluation {idx}:", repr(cleaned_indiv_eval))

            # Attempt to parse the cleaned string
            parsed_json = json.loads(cleaned_indiv_eval)
            # If successful, extract the specific keys using .get()
            parsed_evaluation_text = parsed_json.get("evaluation", cleaned_indiv_eval) # Fallback to raw if "evaluation" key is missing
            parsed_rating = parsed_json.get("rating") # Can be None if "rating" key is missing

            # Construct the object to append, now including the reference answer
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": parsed_rating,  # Store the parsed rating (could be None)
                "reference_answer": rag_answer  # <-- Add this line
            }

        except json.JSONDecodeError as e:
            # Handle JSON parsing errors specifically
            print(f"JSON decode error for individual evaluation {idx}: {e}")
            # Keep parsed_evaluation_text as raw indiv_eval
            # Keep parsed_rating as None
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": { # Provide a default rating structure on parsing error
                    "question_relevance": {"score": 0, "max": 3},
                    "technical_accuracy": {"score": 0, "max": 3},
                    "sales_effectiveness": {"score": 0, "max": 4},
                    "total": {"score": 0, "max": 10}
                },
                "reference_answer": rag_answer
            }
        except Exception as e:
            # Handle any other unexpected errors during parsing/extraction
            print(f"Unexpected error parsing individual evaluation {idx}: {e}")
            # Keep parsed_evaluation_text as raw indiv_eval
            # Keep parsed_rating as None
            individual_eval_obj = {
                "evaluation": parsed_evaluation_text,
                "rating": { # Provide a default rating structure on other errors
                    "question_relevance": {"score": 0, "max": 3},
                    "technical_accuracy": {"score": 0, "max": 3},
                    "sales_effectiveness": {"score": 0, "max": 4},
                    "total": {"score": 0, "max": 10}
                },
                "reference_answer": rag_answer
            }
        
        # Append the resulting object
        individual_evaluations.append(individual_eval_obj)
        # --- MODIFIED PARSING END ---

    mid_evaluations = []
    for i in range(3, len(transcript_text), 4):
        mid_eval = evaluate_mid_conversation(transcript_text[:i+1], combined_product_context, current_persona)
        mid_evaluations.append(mid_eval)

    # 3. Complete evaluation (already done)
    # complete_evaluation = evaluate_complete_conversation(conversation_history, product["content"])

    # 4. Additional criteria evaluation (already done above)

    

    # 5. Save everything
    evaluation_data = {
        "individual_evaluations": individual_evaluations,
        "mid_evaluations": mid_evaluations,
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

        saved_conversation_result = save_conversation(
            ObjectId(product_id_str),
            ObjectId(product["category_id"]),
>>>>>>> 7776bbe (elevanlabs poc)
            {"pairs": transcript_text},
            ObjectId(token["id"]),
            evaluation_data,
            test_name=test_name,
            prod_name=prod_name,
            cat_name=cat_name
        )
<<<<<<< HEAD
        test_configurations_collection.update_one(
            {"_id": ObjectId(test_config_id_str)},
            {"$set": {"assessment": True}}
        )
=======
>>>>>>> 7776bbe (elevanlabs poc)
        conversation_db_id = str(saved_conversation_result)
        print(f"Conversation saved with ID: {conversation_db_id}")
        
    except Exception as save_error:
        print(f"Error saving conversation: {save_error}")

    return {"transcript":transcript_text}
