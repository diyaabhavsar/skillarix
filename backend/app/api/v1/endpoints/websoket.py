from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from ....services.websocket import (
    generate_customer_question, evaluate_complete_conversation,
    remove_invalid_json_chars, evaluate_additional_criteria,
    evaluate_mid_conversation
)
from ....services.conversation import generate_answer_rag, evaluate_individual_answer, save_conversation
from ....services.product import get_product
from ....services.user import get_current_user
from bson import ObjectId
from ....database import db
import json
import traceback

test_configurations_collection = db["test_configurations"]
product_collection = db["products"]
category_collection = db["categories"]

router = APIRouter()

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # print("connected")
    await websocket.accept()
    # --- AUTHENTICATION PATCH START ---
    try:
        if not token:
            await websocket.send_json({"error": "Authentication required (no token provided)"})
            await websocket.close()
            return
        user = await get_current_user(token)
        user_id = user.id
    except Exception as e:
        await websocket.send_json({"error": "Authentication failed"})
        await websocket.close()
        return
    # --- AUTHENTICATION PATCH END ---

    try:
        # Receive initial data including product_id and optionally test_configuration_id
        data = await websocket.receive_json()
        
        if data.get("type") == "start":
            product_id_str = data.get("product_id")
            test_config_id_str = data.get("test_configuration_id") # Get the test config ID

            if not product_id_str:
                 await websocket.send_json({"error": "product_id is required to start session"})
                 await websocket.close()
                 return

            product_id = ObjectId(product_id_str)
            product = get_product(product_id)
            if not product:
                await websocket.send_json({"error": "Product not found"})
                await websocket.close()
                return

            # Load test configuration if provided
            persona = {} # Default empty persona
            # additional_criteria_config = None # Default no additional criteria config

            if test_config_id_str:
                 test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
                 if test_config:
                      persona = test_config.get("visitorPersona", {})
                    #   additional_criteria_config = test_config.get("additionalCriteria", None)
                 else:
                      # Optionally send a warning to the client if config not found
                      print(f"Warning: Test configuration {test_config_id_str} not found.")

            # Combine product content and description into a single context string
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

            conversation_history = []
            # Generate initial customer question using the loaded persona
            question = generate_customer_question(combined_product_context, conversation_history, persona)
            await websocket.send_json({
                "type": "question",
                "content": question,
                # Optionally send persona/criteria back to the client for display or confirmation
                # "persona": persona,
                # "additional_criteria_config": additional_criteria_config
            })
            # print("question")   

        # Handle subsequent messages in the conversation
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "answer":
                # Process salesperson's answer
                product_id_str = data.get("product_id")
                # test_config_id_str = data.get("test_configuration_id") # Can retrieve again if needed, or pass in each message

                # You might want to retrieve the test config here again if not stored client-side
                # and needed for generate_customer_question or evaluation

                product = get_product(ObjectId(product_id_str))
                if not product:
                     await websocket.send_json({"error": "Product not found"})
                     continue # Keep the connection open? Or close? Based on desired flow.
                
                # Combine product content and description for ongoing context
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

                conversation_history = data.get("history", [])
                salesperson_answer = data.get("answer")
                last_question = data.get("last_question")

                if salesperson_answer is None or last_question is None:
                     await websocket.send_json({"error": "Answer or last question missing"})
                     continue

                # Retrieve persona and additional criteria for evaluation and next question
                # This assumes test_configuration_id is sent with each answer message
                # Alternatively, store it server-side in the websocket handler state
                current_persona = {} # Default
                current_additional_criteria_config = None # Default

                test_config_id_str_current = data.get("test_configuration_id") # Check if passed in message
                if test_config_id_str_current:
                     test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str_current)})
                     if test_config:
                          current_persona = test_config.get("visitorPersona", {})
                          current_additional_criteria_config = test_config.get("additionalCriteria", None)
                     # else: Log warning if config not found again


                # Generate next question using the persona
                next_question = generate_customer_question(
                    combined_product_context,
                    conversation_history + [{
                        "visitor_text": last_question,
                        "salesperson_text": salesperson_answer
                    }],
                    current_persona # Use the loaded persona for the next question
                )

                await websocket.send_json({
                    "type": "next_question",
                    # "evaluation": evaluation_text,
                    # "rating": rating,
                    "content": next_question
                })
                
            elif data.get("type") == "end_session":
                 # Handle session completion and final evaluation
                 product_id_str = data.get("product_id")
                 conversation_history = data.get("history", [])
                 test_config_id_str = data.get("test_configuration_id") # Get config ID for final eval

                 # --- ADD THIS BLOCK: append the last Q&A to the history ---
                 last_question = data.get("last_question")
                 last_answer = data.get("answer")
                 if last_question and last_answer:
                     conversation_history = conversation_history + [{
                         "visitor_text": last_question,
                         "salesperson_text": last_answer
                     }]
                 # --- END OF ADDED BLOCK ---

                 if not product_id_str:
                      await websocket.send_json({"error": "product_id is required for final evaluation"})
                      await websocket.close()
                      return

                 product_id = ObjectId(product_id_str)
                 product = get_product(product_id)
                 if not product:
                      await websocket.send_json({"error": "Product not found for final evaluation"})
                      await websocket.close()
                      return

                 # Load test configuration for final evaluation
                 current_persona = {}
                 final_additional_criteria_config = None
                 if test_config_id_str:
                      test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
                      if test_config:
                           current_persona = test_config.get("visitorPersona", {})
                           final_additional_criteria_config = test_config.get("additionalCriteria", None)
                      # else: Log warning

                 # Combine product content and description for final context
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

                 print("combined_product_context", combined_product_context)


                 # Perform complete evaluation
                 complete_evaluation_raw = evaluate_complete_conversation(
                     conversation_history,
                     combined_product_context,
                     current_persona  # Add the persona parameter
                 )

                 # Initialize default values
                 # Default complete_evaluation to the raw text in case parsing fails
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

                 # Mapping from config keys to prompt keys
                 criteria_key_map = {
                     "distraction_handling": "Distraction Handling",
                     "communication_simplicity": "Communication Simplicity"
                 }

                 additional_criteria_evaluation = {}
                 if final_additional_criteria_config:
                     for criteria, enabled in final_additional_criteria_config.items():
                         if enabled:
                             prompt_key = criteria_key_map.get(criteria, criteria)
                             eval_text = evaluate_additional_criteria(
                                 conversation_history,
                                 prompt_key,
                                 combined_product_context,
                                 current_persona  # Add the persona parameter
                             )
                             additional_criteria_evaluation[criteria] = eval_text
                 else:
                     additional_criteria_evaluation = "No additional criteria selected for this test configuration."


                 # 1. Generate individual evaluations for each exchange
                 individual_evaluations = []
                 for idx, exchange in enumerate(conversation_history):
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

                 # 2. Optionally, generate mid-evaluations (e.g., every 4 exchanges)
                 mid_evaluations = []
                 for i in range(3, len(conversation_history), 4):
                     mid_eval = evaluate_mid_conversation(conversation_history[:i+1], combined_product_context, current_persona)
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
                           {"pairs": conversation_history},
                           ObjectId(user_id),
                           evaluation_data,
                           test_name=test_name,
                           prod_name=prod_name,
                           cat_name=cat_name
                      )
                      conversation_db_id = str(saved_conversation_result)
                      print(f"Conversation saved with ID: {conversation_db_id}")
                      
                      # Send the final evaluation results back to the client
                      await websocket.send_json({
                          "type": "end_session",
                          "conversation_id": conversation_db_id,
                          "evaluation": {
                              "individual_evaluations": individual_evaluations,
                              "mid_evaluations": mid_evaluations,
                              "complete_evaluation": complete_evaluation_to_save,
                              "complete_rating": complete_rating_to_save,
                              "additional_criteria_evaluation": additional_criteria_evaluation
                          }
                      })
                 except Exception as save_error:
                      print(f"Error saving conversation: {save_error}")
                      await websocket.send_json({
                          "type": "error",
                          "message": f"Error saving conversation: {str(save_error)}"
                      })

                 await websocket.close()
                 return


    except WebSocketDisconnect:
        # Handle websocket disconnect
        print("WebSocket disconnected.")
        pass
    except Exception as e:
        # Catch any other exceptions during websocket communication
        print(f"WebSocket error: {e}")
        traceback.print_exc()
        try:
            # Attempt to send error message before closing
            await websocket.send_json({"error": str(e)})
        except:
            # Ignore errors if sending fails during closing
            pass
        try:
            await websocket.close(code=1011)
        except RuntimeError:
            pass
