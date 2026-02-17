from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import json
import asyncio
from functools import partial

from ....services.auth import verify_bearer_token
from ....config import settings
from ....database import db
from ....services.web_search import perform_web_search, format_search_results
from openai import OpenAI
from groq import Groq

router = APIRouter()

client = Groq(api_key=settings.GROQ_API_KEY)
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

FLAG = settings.MODEL
MODEL_NAME = settings.MODEL_NAME

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = [] # [{"role": "user", "content": "..."}]

product_collection = db["products"]

@router.post("/chat")
async def chat_companion(
    request: ChatRequest,
    token=Depends(verify_bearer_token)
):
    print(f"DEBUG: Request received in chat_companion. Message: {request.message}")

    # ---------------------------------------------------------
    # SAFETY TIMEOUTS (Seconds)
    # ---------------------------------------------------------
    DECISION_TIMEOUT = 5.0
    SEARCH_TIMEOUT = 8.0
    GENERATION_TIMEOUT = 25.0 
    
    try:
        # Fetch products for context (Fast DB call)
        print("DEBUG: Fetching products from DB...")
        products_context = "AVAILABLE PRODUCTS:\n"
        
        try:
            # Add a timeout/limit to prevent hanging on large datasets or bad connections
            # We use a simple limit and list conversion
            products_cursor = product_collection.find({"is_deleted": {"$ne": True}}).max_time_ms(2000) # 2s timeout
            products_list = list(products_cursor)
            print(f"DEBUG: Fetched {len(products_list)} products.")
        except Exception as db_err:
            print(f"DEBUG: DB Fetch failed or timed out: {db_err}")
            products_list = []
            products_context += "Error loading products from database.\n"
        
        if not products_list:
            products_context += "No products found in the system.\n"
        else:
            for p in products_list:
                name = p.get("name", "Unknown Product")
                desc = p.get("description", "No description available.")
                content = p.get("content")
                if content is None: content = "No detailed content available."
                if len(str(content)) > 2000: content = str(content)[:2000] + "... (truncated)"
                products_context += f"- Product: {name}\n  Description: {desc}\n  Detailed Content: {content}\n\n"

        # ---------------------------------------------------------
        # STEP 1: Check if we need to search the web
        # We ask the LLM to determine if the query is answerable from context
        # or requires external information (web search).
        # ---------------------------------------------------------
        print(f"DEBUG: Analyzing query: {request.message}")
        search_decision = {"needs_search": False, "search_query": None}
        
        # Only check for search if message is long enough to be a question
        if len(request.message) > 5 and ("?" in request.message or "price" in request.message.lower() or "compare" in request.message.lower()):
            start_messages = [{"role": "user", "content": f"""
Analyze if this User Question needs external info (web search) not present in Product Context.
Product Context: {products_context[:1000]}...
User Question: "{request.message}"
Return JSON: {{ "needs_search": boolean, "search_query": string or null }}
"""}]
            
            loop = asyncio.get_running_loop()
            try:
                # Decide model
                check_model = "gpt-3.5-turbo" if FLAG == 1 else "llama3-8b-8192"
                check_client = openai_client if FLAG == 1 else client
                
                check_completion = await asyncio.wait_for(
                    loop.run_in_executor(
                        None, 
                        partial(
                            check_client.chat.completions.create,
                            model=check_model, 
                            messages=start_messages,
                            temperature=0.0,
                            response_format={"type": "json_object"}
                        )
                    ),
                    timeout=DECISION_TIMEOUT
                )
                search_decision = json.loads(check_completion.choices[0].message.content)
                print(f"DEBUG: Search decision: {search_decision}")
            except Exception as e:
                print(f"DEBUG: Search decision skipped/failed: {e}")
                # Ensure we don't block. Default is False.

        # ---------------------------------------------------------
        # STEP 2: Web Search (Strict Timeout)
        # ---------------------------------------------------------
        search_context = ""
        if search_decision.get("needs_search") and search_decision.get("search_query"):
            query = search_decision['search_query']
            print(f"DEBUG: Performing web search for: {query}")
            
            try:
                loop = asyncio.get_running_loop()
                # Run with a timeout of 5 seconds
                search_results = await asyncio.wait_for(
                    loop.run_in_executor(None, partial(perform_web_search, query)),
                    timeout=SEARCH_TIMEOUT
                )
                search_context = format_search_results(search_results)
                print("DEBUG: Web search completed.")
            except asyncio.TimeoutError:
                print("DEBUG: Web search timed out after 5 seconds.")
                search_context = "Web search attempt timed out. No external results available."
            except Exception as e:
                print(f"DEBUG: Web search error: {e}")
                search_context = "Web search failed. No external results available."

        # ---------------------------------------------------------
        # STEP 3: Final Generation (Strict Timeout)
        # ---------------------------------------------------------
        system_prompt = f"""
You are an expert AI Sales Coach. 
Use Internal Product List and Web Search Results (if any) to answer.
If Web Search failed or is empty, rely on Internal Product List or general sales knowledge.

{products_context}

{search_context}

CRITICAL:
1. Answer directly and concisely.
2. If info is from Web Search:
   - Cite the source URL explicitly at the end of the point (e.g., "[Source: https://example.com]").
   - Format the answer in clear, easy-to-read bullet points.
3. Formatting: Use actual newlines (\\n) to separate bullet points so it is easy to read.
4. Refuse purely non-sales topics (e.g. "Who is the President?").
"""
        messages = [{"role": "system", "content": system_prompt}]
        recent_history = request.history[-6:] if request.history else [] # Limit history to last 6 for speed
        messages.extend(recent_history)
        messages.append({"role": "user", "content": request.message})

        print("DEBUG: Generating answer...")
        try:
            loop = asyncio.get_running_loop()
            gen_client = openai_client if FLAG == 1 else client
            gen_model = MODEL_NAME if FLAG == 1 else "llama-3.3-70b-versatile"
            
            completion = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    partial(
                        gen_client.chat.completions.create,
                        model=gen_model,
                        messages=messages,
                        temperature=0.7,
                         max_tokens=600 if FLAG == 1 else None,
                        max_completion_tokens=600 if FLAG != 1 else None
                    )
                ),
                timeout=GENERATION_TIMEOUT
            )
            print("DEBUG: Answer generated.")
            return {"response": completion.choices[0].message.content}
            
        except asyncio.TimeoutError:
             print("DEBUG: Final generation timed out.")
             return {"response": "I'm sorry, I'm taking too long to think properly right now. Please ask me again or rephrase your question."}

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"DEBUG: Critical error in chat_companion: {e}")
        print(f"DEBUG: Traceback: {error_details}")
        return {"response": f"I encountered an error: {str(e)[:50]}... Please try again."}
