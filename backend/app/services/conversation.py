from bson import ObjectId
from fastapi import HTTPException
from typing import List, Optional
from groq import Groq
from openai import OpenAI
import openai
import re
from datetime import datetime, timezone
from bson import ObjectId
from ..database import db
import json
from ..config import settings
import traceback
from .prompt import get_prompt_by_title
import logging

logger = logging.getLogger(__name__)

conversation_collection = db["conversations"]

# Initialize Groq Client
client = Groq(api_key=settings.GROQ_API_KEY)
# Initialize OpenAI Client
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
FLAG = settings.MODEL
MODEL_NAME = settings.MODEL_NAME

# -----------------------------
# Helper / Formatter functions
# -----------------------------
def format_conversation_history(history: List[dict]):
    formatted = []
    for i, exchange in enumerate(history, 1):
        formatted.append(f"Exchange {i}:")
        formatted.append(f"Customer: {exchange.get('visitor_text','')}")
        formatted.append(f"Salesperson: {exchange.get('salesperson_text','')}")
        formatted.append("")
    return "\n".join(formatted)

def build_product_context(product: dict) -> str:
    """Build combined product context from content and description"""
    product_content_str = product.get("content", "")
    product_description_str = product.get("description", "")
    
    if product_content_str and product_description_str:
        return f"Product Content: {product_content_str}\nProduct Description: {product_description_str}"
    elif product_content_str:
        return f"Product Content: {product_content_str}"
    elif product_description_str:
        return f"Product Description: {product_description_str}"
    return ""

def remove_surrounding_code_blocks(text: str) -> str:
    t = text.strip()
    if t.startswith("```json"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()

def safe_json_load(s: str) -> Optional[dict]:
    """Try to load JSON, otherwise return None."""
    if not s:
        return None
    try:
        s_clean = remove_surrounding_code_blocks(s)
        return json.loads(s_clean)
    except Exception:
        # fallback attempt: locate first JSON object in string
        try:
            start = s.find("{")
            end = s.rfind("}") + 1
            if start != -1 and end != -1 and end > start:
                return json.loads(s[start:end])
        except Exception:
            pass
    return None

# -----------------------------
# RAG / Salesperson response
# -----------------------------
def generate_answer_rag(context: str, question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
    """
    Generate reference (ideal) answer using RAG-style prompt.
    Keeps persona and product context in the prompt.
    Returns string response (plain text).
    """
    try:
        greeting_instruction = "Start with a warm greeting." if is_first_exchange else "Skip the greeting."
        
        conversation_context = ""
        if conversation_history and len(conversation_history) > 0:
            conversation_context = f"""
Previous conversation:
{format_conversation_history(conversation_history)}

Continue the conversation naturally, referring back to previous exchanges when relevant.
"""

        prompt = f"""
You are a model producing an ideal reference answer for a salesperson at a product exhibition. The output must be a short, human-friendly paragraph (1-3 sentences) that a top-performing salesperson would give in response to the customer's question.

GUIDELINES:
- Tailor the answer to the visitor persona below.
- Lead with benefits, then mention key features only if necessary.
- Keep the answer concise and actionable.
- If is_first_exchange is true, begin with a warm greeting.
- End with a short follow-up that helps the salesperson continue the conversation.

Visitor Persona:
{json.dumps(persona, indent=2)}

Product Context:
{context}

{conversation_context}

Customer Question:
{question}

RETURN:
A single short paragraph (1-3 sentences). No JSON, no lists, just the human-readable reference answer.
"""
        if FLAG == 1:
            # OpenAI path (streaming)
            response_stream = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                top_p=1,
                max_tokens=512,
                stream=True,
            )
            full_response = ""
            for chunk in response_stream:
                if getattr(chunk.choices[0].delta, "content", None):
                    full_response += chunk.choices[0].delta.content
            return full_response.strip()
        else:
            # Groq path (streaming)
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_completion_tokens=512,
                top_p=1,
                stream=True,
                stop=None,
            )
            full_response = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    full_response += chunk.choices[0].delta.content
            return full_response.strip()
    except Exception as e:
        print(f"Error generating RAG answer: {e}")
        traceback.print_exc()
        raise

# -----------------------------
# EVALUATION PROMPTS - PERSONA AWARE & JSON STRICT
# -----------------------------
def evaluate_individual_answer(rag_answer: str, salesperson_answer: str, customer_question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
    """
    Compare salesperson_answer vs rag_answer relative to the customer_question and persona.
    RETURNS: A JSON string with structure:
    {
      "evaluation": "one-paragraph feedback",
      "rating": {
        "question_relevance": {"score": X, "max": 3},
        "technical_accuracy": {"score": X, "max": 3},
        "sales_effectiveness": {"score": X, "max": 4},
        "total": {"score": X, "max": 10}
      }
    }
    The LLM is instructed to return JSON ONLY.
    """
    try:
        conversation_context = ""
        if conversation_history and len(conversation_history) > 0:
            conversation_context = f"\nPrevious conversation:\n{format_conversation_history(conversation_history)}\n"
        
        # --- OLD PROMPT (COMMENTED FOR REFERENCE) ---
        # prompt = f"""
        # You are a senior sales evaluator. Return ONLY a single valid JSON object (no markdown, no backticks, no extra text).
        #
        # The JSON must have exactly two keys: "evaluation" and "rating".
        #
        # - "evaluation": a single paragraph (1-3 sentences) giving constructive, actionable feedback to improve the salesperson's next answer.
        # - "rating": an object with these numeric fields:
        #   * "question_relevance": {{ "score": X, "max": 3 }}
        #   * "technical_accuracy": {{ "score": X, "max": 3 }}
        #   * "sales_effectiveness": {{ "score": X, "max": 4 }}
        #   * "total": {{ "score": Y, "max": 10 }}  // total must equal sum of the three sub-scores.
        #
        # Consider the visitor persona carefully and score relative to what this persona expects and needs. Penalize overly-technical replies for non-technical personas and reward clarity and benefits-first language.
        #
        # Visitor Persona:
        # {json.dumps(persona, indent=2)}
        #
        # Customer Question:
        # {customer_question}
        #
        # Salesperson Answer (to evaluate):
        # {salesperson_answer}
        #
        # Reference (ideal) Answer:
        # {rag_answer}
        #
        # Previous context (if any):
        # {conversation_context}
        #
        # INSTRUCTIONS:
        # 1) Provide objective, persona-aware scoring.
        # 2) Ensure "total" is numeric and equals the sum of the three scores.
        # 3) Keep "evaluation" constructive and include 1-2 specific suggestions.
        # 4) Return JSON only.
        # """
        # --------------------------------------------

        prompt = f"""
You are a strict and critical sales evaluator. Return ONLY a single valid JSON object (no markdown, no backticks, no extra text).

The JSON must have exactly two keys: "evaluation" and "rating".

- "evaluation": a single paragraph (1-3 sentences) giving constructive, actionable feedback.
- "rating": an object with these numeric fields:
  * "question_relevance": {{ "score": X, "max": 3 }}
  * "technical_accuracy": {{ "score": X, "max": 3 }}
  * "sales_effectiveness": {{ "score": X, "max": 4 }}
  * "total": {{ "score": Y, "max": 10 }}  // total must equal sum of the three sub-scores.

SCORING RUBRIC (BE STRICT):
- **Question Relevance (0-3)**:
  * 0: Completely irrelevant, "I don't know", or ignores the question.
  * 1: Vague response, misses the main point.
  * 2: Addresses the question but lacks depth.
  * 3: Perfectly addresses the specific question.
- **Technical Accuracy (0-3)**:
  * 0: Factually incorrect, contradicts product info, or hallucinated.
  * 1: Mostly correct but misses key product details.
  * 2: Accurate.
  * 3: Accurate and demonstrates deep product knowledge.
- **Sales Effectiveness (0-4)**:
  * 0: Rude, dismissive, extremely short (e.g., "yes", "no"), or unprofessional.
  * 1: Generic/Robotic, lacks empathy, or sound like a bot.
  * 2: Polite but standard/average.
  * 3: Persuasive, persona-aware, good flow.
  * 4: Exceptional, highly persuasive, perfectly tailored to the persona.

CRITICAL INSTRUCTION:
- If the salesperson's answer is short, dismissive, generic, or factually wrong, you MUST give a low score (total < 5).
- Compare the "Salesperson Answer" strictly against the "Reference Answer" and "Product Context".
- Do NOT be generous. High scores (9-10) are reserved for perfection.

Visitor Persona:
{json.dumps(persona, indent=2)}

Customer Question:
{customer_question}

Salesperson Answer (to evaluate):
{salesperson_answer}

Reference (ideal) Answer:
{rag_answer}

Previous context (if any):
{conversation_context}

INSTRUCTIONS:
1) Provide objective, STRICT scoring based on the rubric above.
2) Ensure "total" is numeric and equals the sum of the three scores.
3) Keep "evaluation" constructive and include 1-2 specific suggestions.
4) Return JSON only.
"""
        if FLAG == 1:
            # OpenAI path
            response_stream = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role":"user","content":prompt}],
                temperature=0.0,
                top_p=1,
                max_tokens=1024,
                stream=True,
            )
            full_response = ""
            for chunk in response_stream:
                if getattr(chunk.choices[0].delta, "content", None):
                    full_response += chunk.choices[0].delta.content
            # Ensure we only return the JSON string (no extra whitespace)
            return full_response.strip()
        else:
            # Groq path
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role":"user","content":prompt}],
                temperature=0.0,
                max_completion_tokens=1024,
                top_p=1,
                stream=True,
                stop=None,
            )
            full_response = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    full_response += chunk.choices[0].delta.content
            return full_response.strip()
    except Exception as e:
        print(f"Error in evaluate_individual_answer: {e}")
        traceback.print_exc()
        raise

def evaluate_mid_conversation(recent_exchanges: List[dict], context: str, persona: dict = None) -> str:
    """
    Evaluate recent exchanges.
    Returns a valid JSON string with scores and recommendations.
    """
    try:
        exchanges_text = "\n".join([
            f"Exchange {i+1}:\nCustomer: {exchange['visitor_text']}\nSalesperson: {exchange['salesperson_text']}"
            for i, exchange in enumerate(recent_exchanges)
        ])

        persona_block = json.dumps(persona, indent=2) if persona else "{}"

        prompt = f"""
You are evaluating a short sequence of recent sales exchanges. Return ONLY a single valid JSON object.

The JSON must have two keys: "scores" and "recommendations".

- "scores": an object with numeric scores:
   * "conversation_direction": {{ "score": X, "max": 3 }}
   * "information_consistency": {{ "score": X, "max": 3 }}
   * "customer_engagement": {{ "score": X, "max": 4 }}
   * "total": {{ "score": Y, "max": 10 }}
- "recommendations": a list of 2 concise strings (actionable advice).

Visitor Persona:
{persona_block}

Product Context:
{context}

Recent Exchanges:
{exchanges_text}

INSTRUCTIONS:
- Be strict. If the salesperson is passive or rude, give low scores.
- Return JSON ONLY.
"""
        if FLAG == 1:
            response_stream = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role":"user","content":prompt}],
                temperature=0.3,
                top_p=1,
                max_tokens=300,
                stream=True,
            )
            full_response = ""
            for chunk in response_stream:
                if getattr(chunk.choices[0].delta, "content", None):
                    full_response += chunk.choices[0].delta.content
            return full_response.strip()
        else:
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role":"user","content":prompt}],
                temperature=0.3,
                max_completion_tokens=300,
                top_p=1,
                stream=True,
                stop=None,
            )
            full_response = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    full_response += chunk.choices[0].delta.content
            return full_response.strip()
    except Exception as e:
        print(f"Error in evaluate_mid_conversation: {e}")
        traceback.print_exc()
        raise

def evaluate_complete_conversation(full_conversation: List[dict], context: str, persona: dict = None) -> str:
    """
    Evaluate entire conversation and RETURN STRICT JSON object:
    {
      "complete_evaluation": { "summary": "...", "strengths": [...], "weaknesses": [...] },
      "complete_rating": { "overall_progress": {"score": X, "max": 3}, ... , "total": {"score": Y, "max": 10} }
    }
    """
    try:
        if persona is None:
            persona = {}

        if not full_conversation or len(full_conversation) < 2:
            logger.warning("Conversation too short for meaningful evaluation. Returning zero scores.")
            return json.dumps({
                "complete_evaluation": {
                    "summary": "The conversation ended before any meaningful interaction could take place. No assessment is possible.",
                    "strengths": ["N/A"],
                    "weaknesses": ["Conversation was too short to evaluate."]
                },
                "complete_rating": {
                    "overall_progress": {"score": 0, "max": 3},
                    "sales_strategy": {"score": 0, "max": 3},
                    "customer_journey": {"score": 0, "max": 2},
                    "technical_accuracy": {"score": 0, "max": 2},
                    "total": {"score": 0, "max": 10}
                }
            })

        def select_main_prompt(prompt_data):
            if prompt_data and 'prompt' in prompt_data and len(prompt_data['prompt']) > 0:
                for prompt_item in prompt_data['prompt']:
                    if prompt_item.get('condition') == 'main':
                        return prompt_item.get('prompt', '')
                return prompt_data['prompt'][0].get('prompt', '')
            return ''

        # Hardcoded strict prompt as fallback
        fallback_prompt = """
You are an expert evaluator of sales conversations. Return ONLY a single valid JSON object.

The JSON must have two keys:
- "complete_evaluation": {
    "summary": "short paragraph (2-4 sentences)",
    "strengths": ["list of 2-4 strings"],
    "weaknesses": ["list of 2-4 strings"]
  }
- "complete_rating": {
    "overall_progress": { 
        "score": X, 
        "max": 3,
        "reasoning": "1-2 sentence explanation of why this specific score was given"
    },
    "sales_strategy": { 
        "score": X, 
        "max": 3,
        "reasoning": "1-2 sentence explanation of why this specific score was given"
    },
    "customer_journey": { 
        "score": X, 
        "max": 2,
        "reasoning": "1-2 sentence explanation of why this specific score was given"
    },
    "technical_accuracy": { 
        "score": X, 
        "max": 2,
        "reasoning": "1-2 sentence explanation of why this specific score was given"
    },
    "total": { "score": Y, "max": 10 }
  }

SCORING GUIDELINES (STRICT BUT FAIR):
- **Overall Progress (0-3)**: 
    * 0: No progress. 
    * 1: Weak/Slow. 
    * 2: Average/Competent (Moved conversation forward).
    * 3: Excellent (Clear outcome).
- **Sales Strategy (0-3)**: 
    * 0: Passive/Reactive. 
    * 1: Mechanical (Just asking Qs). 
    * 2: Competent (Good flow, handled basics). 
    * 3: Strategic/Persuasive (Consultative).
- **Customer Journey (0-2)**: 
    * 0: Poor/Robot-like. 
    * 1: Standard/Polite. 
    * 2: Engaging/Warm.
- **Technical Accuracy (0-2)**: 
    * 0: Errors/Contradictions. 
    * 1: Mostly Accurate (Stuck to script). 
    * 2: Expert (Covered all base points + added relevant extra features/value).

REASONING REQUIREMENTS:
For each category, you MUST provide a "reasoning" field that:
1. References specific examples from the conversation
2. Explains what was done well or poorly
3. Justifies the exact score given (e.g., why 2/3 instead of 3/3)
4. Is actionable and specific (not generic)

Example reasoning:
- Good: "Scored 2/3 because the salesperson addressed the customer's budget concerns and suggested alternatives, but missed the opportunity to ask qualifying questions about timeline."
- Bad: "The salesperson did okay."

CRITICAL RULES:
- **Summation**: "total" MUST be the exact sum of the 4 partial scores.
- **Bonus for Improv**: If the salesman mentions ALL points from the description AND adds relevant, non-contradictory features, reward them with a max score (2/2) in Accuracy.
- **Target Scores**: 
    - **Weak**: 0-3
    - **Average/Decent**: 5-6 (Expect '2's for Progress/Strategy if they did okay)
    - **Strong**: 7-8
    - **Perfect**: 9-10
- **Short Chat**: If the conversation is very short (e.g., < 5 exchanges) and the deal was NOT closed, the score MUST be low (max 3-4). Do not give high scores for incomplete sessions.

Visitor Persona:
{{Visitor_persona}}

Product Context:
{{Product_detail}}

Conversation:
{{Conversion_history}}
"""
        
        # Try to fetch from DB
        prompt = fallback_prompt
        try:
            db_prompt_doc = get_prompt_by_title("Conversation Evaluation Main")
            fetched_text = select_main_prompt(db_prompt_doc)
            if fetched_text:
                logger.info("Using Database Prompt for Evaluation")
                prompt = fetched_text
            else:
                logger.warning("Using Fallback Prompt (DB prompt empty/not found)")
        except Exception as e:
             logger.error(f"Error fetching prompt from DB: {e}. Using fallback.")

        # ...
        prompt = prompt.replace("{{Visitor_persona}}", json.dumps(persona, indent=2))
        prompt = prompt.replace("{{Product_detail}}", context)
        prompt = prompt.replace("{{Conversion_history}}", format_conversation_history(full_conversation))
        
        # --- PENALTY INJECTION FOR SHORT SESSIONS ---
        # If the session is short (< 5 exchanges), explicitly instruct the model to penalize.
        if len(full_conversation) < 5:
            prompt += """
            
CRITICAL INSTRUCTION - SHORT SESSION PENALTY:
This conversation has fewer than 5 exchanges.
UNLESS the customer explicitly agreed to buy/signed up/closed the deal in this short time:
1. The Total Score MUST NOT exceed 4/10.
2. "Overall Progress" should be max 1/3.
3. Mention in the summary that the score is low due to the session being too short/incomplete.
"""
        # --------------------------------------------
        
        logger.info("\n------------------ DEBUG PROMPT START ------------------")
        logger.info(prompt)
        logger.info("------------------ DEBUG PROMPT END --------------------\n")

        if FLAG == 1:
            response_stream = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=1,
                top_p=1,
                max_tokens=1024,
                stream=True,
            )
            return "".join(
                chunk.choices[0].delta.content
                for chunk in response_stream
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content
            ).strip()
        else:
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_completion_tokens=1024,
                top_p=1,
                stream=True,
                stop=None,
            )
            return "".join(
                chunk.choices[0].delta.content
                for chunk in completion
                if chunk.choices[0].delta.content
            ).strip()

    except Exception as e:
        print(f"Error in evaluate_complete_conversation: {e}")
        traceback.print_exc()
        raise

def evaluate_additional_criteria(conversation: List[dict], criteria: str, context: str, persona: dict = None) -> str:
    """
    Evaluate based on additional criteria.
    Returns a JSON object string with "evaluation" and "rating" fields OR plain text if criteria is exploratory.
    """
    try:
        persona_block = json.dumps(persona, indent=2) if persona else "{}"
        
        # Get specific persona requirements if available
        comm_req = persona.get('communication_simplicity', 'normal') if persona else 'normal'
        dist_req = persona.get('distraction_handling', 'none') if persona else 'none'

        if criteria == "Distraction Handling":
            criteria_prompt = f"""
Evaluate how well the salesperson manages distractions and off-topic questions.
The visitor has a distraction level of: {dist_req}.
Return JSON: {{ "evaluation": "1-2 paragraph feedback text", "rating": {{ "focus_maintenance": {{"score": X, "max":3}}, "off_topic_response": {{"score": X, "max":3}}, "flow_management": {{"score": X, "max":4}}, "total": {{"score": Y, "max":10}} }} }}
Include 1-2 short examples from the conversation.
"""
        elif criteria == "Communication Simplicity":
            criteria_prompt = f"""
Evaluate clarity and simplicity of explanations.
The visitor prefers communication style: {comm_req}.
Return JSON: {{ "evaluation": "1-2 paragraph feedback text", "rating": {{ "clarity": {{"score": X, "max":3}}, "examples_usage": {{"score": X, "max":3}}, "organization": {{"score": X, "max":4}}, "total": {{"score": Y, "max":10}} }} }}
Include 1-2 short examples from the conversation.
"""
        else:
            # default fallback: return JSON for consistency
            criteria_prompt = f"Evaluate according to {criteria}. Return JSON: {{ 'evaluation': '1-2 paragraphs of feedback', 'rating': {{ 'total': {{ 'score': X, 'max': 10 }} }} }} Include 1-2 examples."

        conversation_text = format_conversation_history(conversation)
        prompt = f"""
You are evaluating the conversation for the following additional criteria.

Visitor Persona:
{persona_block}

Product Context:
{context}

Conversation:
{conversation_text}

Instructions:
{criteria_prompt}

CRITICAL: Return ONLY a valid JSON object. No preamble, no conversational text.
"""
        if FLAG == 1:
            response_stream = openai_client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role":"user","content":prompt}],
                temperature=0.0,
                top_p=1,
                max_tokens=1024,
                stream=True,
            )
            full_response = ""
            for chunk in response_stream:
                if getattr(chunk.choices[0].delta, "content", None):
                    full_response += chunk.choices[0].delta.content
            
            full_response = full_response.strip()
            parsed = safe_json_load(full_response)
            if parsed:
                return json.dumps(parsed)
            return full_response
        else:
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[{"role":"user","content":prompt}],
                temperature=0.0,
                max_completion_tokens=1024,
                top_p=1,
                stream=True,
                stop=None,
            )
            full_response = ""
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    full_response += chunk.choices[0].delta.content
            
            full_response = full_response.strip()
            parsed = safe_json_load(full_response)
            if parsed:
                return json.dumps(parsed)
            return full_response
    except Exception as e:
        print(f"Error in evaluate_additional_criteria: {e}")
        traceback.print_exc()
        raise

# -----------------------------
# Scoring / Metrics helpers
# -----------------------------
def extract_score(evaluation_text: str) -> float:
    """
    Try to extract a numeric score. Prefer structured JSON rating.total.score if available.
    Fallback to regex-based extraction.
    """
    try:
        # Try as JSON first
        parsed = safe_json_load(evaluation_text)
        if parsed:
            # Check possible structures
            if isinstance(parsed, dict):
                # If 'rating' top-level exists
                if "rating" in parsed:
                    rating = parsed["rating"]
                    # if rating has 'total'
                    if isinstance(rating, dict) and "total" in rating:
                        total = rating["total"]
                        # total can be dict or number
                        if isinstance(total, dict) and "score" in total:
                            return float(total["score"])
                        elif isinstance(total, (int, float)):
                            return float(total)
                # If complete structure (complete_rating)
                if "complete_rating" in parsed:
                    cr = parsed["complete_rating"]
                    if isinstance(cr, dict) and "total" in cr:
                        total = cr["total"]
                        if isinstance(total, dict) and "score" in total:
                            return float(total["score"])
                # Try other direct numeric keys
                if "score" in parsed and isinstance(parsed["score"], (int,float)):
                    return float(parsed["score"])
        # Fallback: regex find last number
        score_match = re.search(r'(\d+(?:\.\d+)?)', evaluation_text[::-1])  # reverse to get last number
        if score_match:
            # regex on reversed string; convert index back
            sr = score_match.group(1)[::-1]
            return float(sr)
    except Exception:
        pass
    return 0.0

def calculate_metrics(history: List[dict], current_conversation_only: bool = True) -> dict:
    total_exchanges = len(history)
    if total_exchanges == 0:
        return {
            "total_exchanges": 0,
            "average_response_length": 0,
            "customer_engagement_score": 0
        }
    
    total_salesperson_length = sum(len(exchange.get('salesperson_text','')) for exchange in history)
    total_customer_length = sum(len(exchange.get('visitor_text','')) for exchange in history)
    
    return {
        "total_exchanges": total_exchanges,
        "average_response_length": total_salesperson_length / total_exchanges if total_exchanges else 0,
        "customer_engagement_score": total_customer_length / total_salesperson_length if total_salesperson_length > 0 else 0
    }

# -----------------------------
# DB save helpers
# -----------------------------
#def save_conversation(
  #  product_id: ObjectId,
  #  category_id: ObjectId,
  #  conversation_data: dict,
    #user_id: str,
    #evaluation_data: dict = None,
    #test_name: str = None,
    #prod_name: str = None,
    #cat_name: str = None
#):
    #conversation_doc = {
     #   "product_id": product_id,
      #  "category_id": category_id,
       # "user_id": ObjectId(user_id),
        #"conversation_data": conversation_data,
        #"evaluation_data": evaluation_data if evaluation_data is not None else {},
        #"test_name": test_name,
        #"prod_name": prod_name,
        #"cat_name": cat_name,
        #"created_at": datetime.now(),
        #"updated_at": datetime.now(),
        #"is_deleted": False
    #}
    #result = conversation_collection.insert_one(conversation_doc)
    #return result.inserted_id
def save_conversation(
    *args,
    **kwargs
):
    """
    Flexible save_conversation wrapper that supports two calling styles:

    1) Full signature (legacy):
       save_conversation(product_id: ObjectId,
                         category_id: ObjectId,
                         conversation_data: dict,
                         user_id: str,
                         evaluation_data: dict = None,
                         test_name: str = None,
                         prod_name: str = None,
                         cat_name: str = None)

    2) Simplified signature (used by endpoints):
       save_conversation(product_id: ObjectId,
                         conversation_data: dict,
                         evaluation_data: dict)

    The function normalizes inputs and inserts a conversation document.
    Returns: inserted_id (ObjectId)
    """
    # normalize for both styles
    try:
        # If called with kwargs matching the full signature, use them
        if 'category_id' in kwargs or (len(args) >= 4 and isinstance(args[3], str)):
            # legacy style or explicit kwargs
            product_id = kwargs.get('product_id') if 'product_id' in kwargs else args[0]
            category_id = kwargs.get('category_id') if 'category_id' in kwargs else args[1]
            conversation_data = kwargs.get('conversation_data') if 'conversation_data' in kwargs else args[2]
            user_id = kwargs.get('user_id') if 'user_id' in kwargs else args[3]
            evaluation_data = kwargs.get('evaluation_data', {})
            test_name = kwargs.get('test_name')
            prod_name = kwargs.get('prod_name')
            cat_name = kwargs.get('cat_name')
        else:
            # simplified style: (product_id, conversation_data, evaluation_data)
            if len(args) >= 2:
                product_id = args[0]
                conversation_data = args[1]
                evaluation_data = args[2] if len(args) >= 3 else {}
            else:
                # fallback to kwargs
                product_id = kwargs.get('product_id')
                conversation_data = kwargs.get('conversation_data', {})
                evaluation_data = kwargs.get('evaluation_data', {})

            # best-effort values when not provided
            category_id = kwargs.get('category_id') or None
            user_id = kwargs.get('user_id') or None
            test_name = kwargs.get('test_name')
            prod_name = kwargs.get('prod_name')
            cat_name = kwargs.get('cat_name')

        # Ensure types: store ObjectId for product/category if strings provided
        if product_id and not isinstance(product_id, ObjectId):
            try:
                product_id = ObjectId(product_id)
            except Exception:
                product_id = product_id  # leave as-is if can't convert

        if category_id and not isinstance(category_id, ObjectId):
            try:
                category_id = ObjectId(category_id)
            except Exception:
                category_id = category_id

        # If user_id is provided as ObjectId or string, coerce to ObjectId when possible
        user_obj = None
        if user_id:
            try:
                user_obj = ObjectId(user_id)
            except Exception:
                user_obj = user_id

        conversation_doc = {
            "product_id": product_id,
            "category_id": category_id,
            "user_id": user_obj,
            "conversation_data": conversation_data,
            "evaluation_data": evaluation_data if evaluation_data is not None else {},
            "test_name": test_name,
            "prod_name": prod_name,
            "cat_name": cat_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_deleted": False
        }

        result = conversation_collection.insert_one(conversation_doc)
        return result.inserted_id

    except Exception as e:
        print(f"Error in save_conversation: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save conversation")

#def save_transcript_conversation(
 #   product_id: ObjectId,
  #  category_id: ObjectId,
   # test_config_id_str: ObjectId,
    #conversation_data: dict,
    #user_id: str,
    #evaluation_data: dict = None,
    #test_name: str = None,
    #prod_name: str = None,
    #cat_name: str = None
 #):
    #conversation_doc = {
    #    "product_id": product_id,
    #    "category_id": category_id,
    #    "user_id": ObjectId(user_id),
    #    "test_config_id":test_config_id_str,
    #    "conversation_data": conversation_data,
    #    "evaluation_data": evaluation_data if evaluation_data is not None else {},
    #    "test_name": test_name,
    #    "prod_name": prod_name,
    #    "cat_name": cat_name,
    #    "created_at": datetime.now(),
    #    "updated_at": datetime.now(),
    #    "is_deleted": False
    #}
    #result = conversation_collection.insert_one(conversation_doc)
    #return result.inserted_id
def save_transcript_conversation(
    product_id: ObjectId,
    category_id: ObjectId,
    test_config_id_str: ObjectId,
    conversation_data: dict,
    user_id: str,
    evaluation_data: dict = None,
    test_name: str = None,
    prod_name: str = None,
    cat_name: str = None
):
    try:
        # convert ids where appropriate
        if product_id and not isinstance(product_id, ObjectId):
            try:
                product_id = ObjectId(product_id)
            except Exception:
                pass

        if category_id and not isinstance(category_id, ObjectId):
            try:
                category_id = ObjectId(category_id)
            except Exception:
                pass

        if test_config_id_str and not isinstance(test_config_id_str, ObjectId):
            try:
                test_config_id_str = ObjectId(test_config_id_str)
            except Exception:
                pass

        user_obj = None
        if user_id:
            try:
                user_obj = ObjectId(user_id)
            except Exception:
                user_obj = user_id

        conversation_doc = {
            "product_id": product_id,
            "category_id": category_id,
            "user_id": user_obj,
            "test_config_id": test_config_id_str,
            "conversation_data": conversation_data,
            "evaluation_data": evaluation_data if evaluation_data is not None else {},
            "test_name": test_name,
            "prod_name": prod_name,
            "cat_name": cat_name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_deleted": False
        }
        result = conversation_collection.insert_one(conversation_doc)
        return result.inserted_id
    except Exception as e:
        print(f"Error in save_transcript_conversation: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save transcript conversation")
def get_conversations_by_product(product_id: ObjectId, token: dict):
    """
    Return list of conversations for a given product and user (token["id"]).
    token is expected to be the decoded token dict from verify_bearer_token dependency.
    """
    try:
        query = {"product_id": product_id, "is_deleted": False}
        # If role present and not admin, restrict to user's id
        user_id = token.get("id") if isinstance(token, dict) else None
        role = token.get("role") if isinstance(token, dict) else None

        if role != "admin" and user_id:
            try:
                query["user_id"] = ObjectId(user_id)
            except Exception:
                query["user_id"] = user_id

        conversations = list(conversation_collection.find(query).sort("created_at", -1))
        # convert ObjectId fields to strings for safe JSON serialization
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            if "user_id" in conv and isinstance(conv["user_id"], ObjectId):
                conv["user_id"] = str(conv["user_id"])
            if "product_id" in conv and isinstance(conv["product_id"], ObjectId):
                conv["product_id"] = str(conv["product_id"])
            if "category_id" in conv and isinstance(conv.get("category_id"), ObjectId):
                conv["category_id"] = str(conv["category_id"])
        return conversations
    except Exception as e:
        print(f"Error in get_conversations_by_product: {e}")
        traceback.print_exc()
        return []

# -----------------------------
# Transcript processing & top-level flow
# -----------------------------
def process_transcript_data(transcript_data: list) -> list:
    """Process raw transcript data into structured format"""
    structured_output = []
    for i in range(0, len(transcript_data) - 1, 2):
        if transcript_data[i]["source"] == "ai" and transcript_data[i + 1]["source"] == "user":
            structured_output.append({
                "salesperson_text": transcript_data[i + 1]["text"],
                "visitor_text": transcript_data[i]["text"],
            })
    return structured_output

def process_evaluation_data(
    transcript_text: list,
    combined_product_context: str,
    current_persona: dict,
    test_config: dict,
    test_config_id_str: str
) -> dict:
    """Process and evaluate transcript data (persona-aware)."""
    from .websocket import remove_invalid_json_chars  # keep existing helper

    # 1) Generate RAG answers for each exchange (optional — expensive). We'll compute per-exchange evaluation using RAG+LLM.
    individual_evaluations = []
    for idx, exchange in enumerate(transcript_text):
        try:
            rag_answer = generate_answer_rag(
                combined_product_context,
                exchange["visitor_text"],
                current_persona,
                idx == 0,
                transcript_text[:idx]
            )
            indiv_eval_raw = evaluate_individual_answer(
                rag_answer,
                exchange["salesperson_text"],
                exchange["visitor_text"],
                current_persona,
                idx == 0,
                transcript_text[:idx]
            )
            # Attempt to parse JSON (expected)
            parsed = safe_json_load(indiv_eval_raw)
            if parsed and isinstance(parsed, dict):
                individual_evaluations.append(parsed)
            else:
                # Fallback: put raw text into evaluation field and zero rating
                individual_evaluations.append({
                    "evaluation": remove_invalid_json_chars(indiv_eval_raw) if isinstance(indiv_eval_raw, str) else str(indiv_eval_raw),
                    "rating": {
                        "question_relevance": {"score": 0, "max": 3},
                        "technical_accuracy": {"score": 0, "max": 3},
                        "sales_effectiveness": {"score": 0, "max": 4},
                        "total": {"score": 0, "max": 10}
                    }
                })
        except Exception as e:
            print(f"Error evaluating individual exchange {idx}: {e}")
            individual_evaluations.append({
                "evaluation": "Evaluation failed for this exchange.",
                "rating": {
                    "question_relevance": {"score": 0, "max": 3},
                    "technical_accuracy": {"score": 0, "max": 3},
                    "sales_effectiveness": {"score": 0, "max": 4},
                    "total": {"score": 0, "max": 10}
                }
            })

    # 2) Complete conversation evaluation (persona-aware) - returns JSON string
    complete_eval_raw = evaluate_complete_conversation(transcript_text, combined_product_context, current_persona)
    complete_eval_parsed = safe_json_load(complete_eval_raw)
    if complete_eval_parsed and isinstance(complete_eval_parsed, dict):
        complete_evaluation_to_save = complete_eval_parsed.get("complete_evaluation", complete_eval_parsed)
        complete_rating_to_save = complete_eval_parsed.get("complete_rating", {
            "overall_progress": {"score": 0, "max": 3},
            "sales_strategy": {"score": 0, "max": 3},
            "customer_journey": {"score": 0, "max": 2},
            "technical_accuracy": {"score": 0, "max": 2},
            "total": {"score": 0, "max": 10}
        })
    else:
        complete_evaluation_to_save = remove_surrounding_code_blocks(complete_eval_raw)
        complete_rating_to_save = {
            "overall_progress": {"score": 0, "max": 3},
            "sales_strategy": {"score": 0, "max": 3},
            "customer_journey": {"score": 0, "max": 2},
            "technical_accuracy": {"score": 0, "max": 2},
            "total": {"score": 0, "max": 10}
        }

    # 3) Additional criteria
    additional_criteria_evaluation = {}
    final_additional_criteria_config = test_config.get("additionalCriteria", None) if test_config else None
    if final_additional_criteria_config:
        for criteria, enabled in final_additional_criteria_config.items():
            if enabled:
                prompt_key = {
                    "distraction_handling": "Distraction Handling",
                    "communication_simplicity": "Communication Simplicity"
                }.get(criteria, criteria)
                eval_text = evaluate_additional_criteria(
                    transcript_text,
                    prompt_key,
                    combined_product_context,
                    current_persona
                )
                # Try parse
                parsed_crit = safe_json_load(eval_text)
                additional_criteria_evaluation[criteria] = parsed_crit if parsed_crit else eval_text
    else:
        additional_criteria_evaluation = "No additional criteria selected for this test configuration."

    return {
        "individual_evaluations": individual_evaluations,
        "complete_evaluation": complete_evaluation_to_save,
        "complete_rating": complete_rating_to_save,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "is_complete": True,
        "test_configuration_id": ObjectId(test_config_id_str) if test_config_id_str else None
    }

# -----------------------------
# Access and utility functions
# -----------------------------
def validate_conversation_access(conversation_id: str, user_id: str) -> dict:
    """Validate conversation ID and user access"""
    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    existing_conversation = conversation_collection.find_one({"_id": ObjectId(conversation_id)})
    if not existing_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if existing_conversation.get("user_id") != ObjectId(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return existing_conversation

def get_related_data(product_id_str: str, test_config_id_str: str) -> tuple:
    """Fetch product, category, and test configuration data"""
    product_collection = db["products"]
    category_collection = db["categories"]
    test_configurations_collection = db["test_configurations"]
    
    product = product_collection.find_one({"_id": ObjectId(product_id_str)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    category = category_collection.find_one({"_id": product["category_id"]})
    test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
    if not test_config:
        raise HTTPException(status_code=404, detail="Test configuration not found")
    
    return product, category, test_config

def update_transcript_service(
    conversation_id: str,
    transcript_data: list,
    test_config_id_str: str,
    product_id_str: str,
    user_id: str
) -> dict:
    """Service function to update transcript data"""
    # Validate access
    validate_conversation_access(conversation_id, user_id)
    
    # Get related data
    product, category, test_config = get_related_data(product_id_str, test_config_id_str)
    current_persona = test_config.get("visitorPersona", {})
    
    # Process transcript
    transcript_text = process_transcript_data(transcript_data)
    combined_product_context = build_product_context(product)
    
    # Process evaluation
    evaluation_data = process_evaluation_data(
        transcript_text,
        combined_product_context,
        current_persona,
        test_config,
        test_config_id_str
    )
    
    # Prepare update data
    prod_name = product["name"] if product else None
    cat_name = category["name"] if category else None
    test_name = test_config["name"] if test_config else None

    # Update conversation
    conversations_collection = db["conversations"]
    test_configurations_collection = db["test_configurations"]
    
    update_result = conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "conversation_data": {"pairs": transcript_text},
                "evaluation_data": evaluation_data,
                "product_id": ObjectId(product_id_str),
                "category_id": ObjectId(product["category_id"]),
                "test_config_id": ObjectId(test_config_id_str),
                "test_name": test_name,
                "product_name": prod_name,
                "category_name": cat_name,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if update_result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update conversation")
    
    # Update test configuration
    test_configurations_collection.update_one(
        {"_id": ObjectId(test_config_id_str)},
        {"$set": {"assessment": True}}
    )
    
    return {
        "message": "Transcript updated successfully",
        "conversation_id": conversation_id,
        "transcript": transcript_text,
        "updated_at": datetime.utcnow().isoformat()
    }

def get_transcript_by_id_service(conversation_id: str, user_id: str) -> dict:
    """Service function to get transcript by ID"""
    # Validate access
    conversation = validate_conversation_access(conversation_id, user_id)
    
    # Convert ObjectIds to strings for JSON serialization
    conversation["_id"] = str(conversation["_id"])
    conversation["user_id"] = str(conversation["user_id"])
    conversation["product_id"] = str(conversation["product_id"])
    conversation["category_id"] = str(conversation["category_id"])
    conversation["test_config_id"] = str(conversation["test_config_id"])
    
    if "evaluation_data" in conversation and "test_configuration_id" in conversation["evaluation_data"]:
        conversation["evaluation_data"]["test_configuration_id"] = str(conversation["evaluation_data"]["test_configuration_id"])
    
    return {
        "conversation": conversation,
        "transcript": conversation.get("conversation_data", {}).get("pairs", [])
    }

# -----------------------------
# Fetch conversation by ID
# -----------------------------
def get_conversation_by_id(conversation_id: ObjectId):
    """
    Return a single conversation document from MongoDB by ObjectId.
    """
    try:
        return conversation_collection.find_one({"_id": conversation_id, "is_deleted": False})
    except Exception as e:
        print("Error fetching conversation by ID:", e)
        return None


# from fastapi import HTTPException
# from typing import List
# from groq import Groq
# from openai import OpenAI
# import openai
# import re
# from datetime import datetime, timezone
# from bson import ObjectId
# from ..database import db
# import json
# from ..config import settings
# 
# 
# conversation_collection = db["conversations"]
# 
# # Initialize Groq Client
# client = Groq(api_key=settings.GROQ_API_KEY)
# # Initialize OpenAI Client
# openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
# FLAG = settings.MODEL
# MODEL_NAME = settings.MODEL_NAME
# 
# def generate_answer_rag(context: str, question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
#     try:
#         greeting_instruction = "Start with a warm greeting" if is_first_exchange else "Skip the greeting as this is a continuing conversation"
#         
#         conversation_context = ""
#         if conversation_history and len(conversation_history) > 0:
#             conversation_context = f"""
# Previous conversation:
# {format_conversation_history(conversation_history)}
# 
# Continue the conversation naturally, referring back to previous exchanges when relevant.
# """
#         
#         prompt = f"""
# You are a friendly and knowledgeable sales representative at a product expo. Your goal is to engage customers and help them understand the product's value, focusing on their needs and interests.
# 
# Customer Persona:
# {json.dumps(persona, indent=2)}
# 
# Context from product documentation:
# {context}
# 
# {conversation_context}
# 
# Customer Question: {question}
# 
# Guidelines for your response:
# 1. {greeting_instruction}
# 2. Focus on customer benefits and value first, not technical specifications
# 3. Proactively identify and present solutions to common customer pain points
# 4. Only provide technical details if:
#    - The customer specifically asks for them
#    - They are directly relevant to the customer's question
#    - The customer has shown enough interest to warrant deeper information
# 5. Use simple, non-technical language unless the customer demonstrates technical knowledge
# 6. Connect features to customer benefits and real-world applications
# 7. Be conversational and engaging
# 8. End with an open-ended question that encourages the customer to share more about their needs
# 9. Tailor your response to match the customer's:
#    - Product Knowledge Level
#    - Product Familiarity
#    - Technical Expertise
#    - Key Challenges
#    - Buying Objective
#    - Budget Range
#    - Decision Authority
#    - Exhibition Objective
# 
# Remember:
# - Start with high-level benefits
# - Progress to features only as customer interest grows
# - Save detailed specifications for when they're specifically requested
# - Focus on how the product solves customer problems
# - Use analogies and examples that resonate with customers
# - Never ask the customer to figure out how the product solves their problems
# - Instead, proactively present solutions based on common customer needs
# - Show expertise by anticipating customer concerns and addressing them
# 
# Your response:
# """
#         if FLAG == 1:
#             # Streaming OpenAI Chat completion
#             response_stream = openai_client.chat.completions.create(
#                 model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
#                 messages=[
#                     {"role": "user", "content": prompt}
#                 ],
#                 temperature=1,
#                 top_p=1,
#                 max_tokens=1024,
#                 stream=True,
#             )
# 
#             full_response = ""
#             for chunk in response_stream:
#                 if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                     full_response += chunk.choices[0].delta.content
# 
#             return full_response.strip()
#         else:
#             completion = client.chat.completions.create(
#                 model="meta-llama/llama-4-scout-17b-16e-instruct",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=1,
#                 max_completion_tokens=1024,
#                 top_p=1,
#                 stream=True,
#                 stop=None,
#             )   
#             
#             full_response = ""
#             for chunk in completion:
#                 if chunk.choices[0].delta.content:
#                     full_response += chunk.choices[0].delta.content
#             
#             return full_response.strip()
#         
#     except Exception as e:
#         # Use HTTPException only in API endpoints, not here.
#         # Re-raise the exception or handle it appropriately.
#         print(f"Error generating RAG answer: {str(e)}")
#         raise # Re-raise the exception
# 
# def format_conversation_history(history: List[dict]):
#     formatted = []
#     for i, exchange in enumerate(history, 1):
#         formatted.append(f"Exchange {i}:")
#         formatted.append(f"Customer: {exchange['visitor_text']}")
#         formatted.append(f"Salesperson: {exchange['salesperson_text']}")
#         formatted.append("")
#     return "\n".join(formatted)
# 
# def evaluate_individual_answer(rag_answer: str, salesperson_answer: str, customer_question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
#     """Evaluate salesperson's answer against RAG answer."""
#     greeting_instruction = "For the first interaction, check if the salesperson starts with an appropriate greeting" if is_first_exchange else "A greeting is not necessary since this is not the first interaction"
#     
#     # Format conversation history if available
#     conversation_context = ""
#     if conversation_history and len(conversation_history) > 0:
#         conversation_context = f"""
# Previous conversation context:
# {format_conversation_history(conversation_history)}
# 
# Take into account the conversation flow and whether the salesperson maintains continuity with previous exchanges.
# """
#     
#     prompt = f"""
# You are an experienced sales trainer evaluating a salesperson's performance at a product expo. Compare the salesperson's answer to both the customer's question and the reference answer, focusing on both technical accuracy and sales effectiveness.
# 
# Customer Persona:
# {json.dumps(persona, indent=2)}
# 
# {conversation_context}
# 
# Customer's Question:
# {customer_question}
# 
# Salesperson's Answer:
# {salesperson_answer}
# 
# Reference Answer (Best Practice):
# {rag_answer}
# 
# Important Note: {greeting_instruction}
# 
# Evaluate the salesperson's performance on:
# 1. Question Relevance (0-3 points)
#    - How well does the answer address the specific question asked?
#    - Is the response focused on what the customer wants to know?
#    - Does it avoid going off-topic?
# 
# 2. Technical Accuracy (0-3 points)
#    - Is the information provided factually correct?
#    - Does it align with the product specifications?
#    - Are technical details presented accurately?
# 
# 3. Sales Effectiveness (0-4 points)
#    - Does it proactively present solutions?
#    - Is it customer-centric and benefit-focused?
#    - Does it demonstrate expertise without being overly technical?
#    - Does it engage the customer and encourage further interaction?
#    - {"Does it begin with an appropriate greeting?" if is_first_exchange else ""}
#    - Does it reference previous exchanges appropriately? (if applicable)
#    - Does it appropriately address the customer's:
#      * Product Knowledge Level
#      * Product Familiarity
#      * Technical Expertise
#      * Key Challenges
#      * Buying Objective
#      * Budget Range
#      * Decision Authority
#      * Exhibition Objective
# 
# Give a total score out of 10 and provide specific feedback on how they can improve their pitch and customer interaction.
# 
# IMPORTANT INSTRUCTIONS:
# - Return ONLY a valid JSON object, and nothing else, only single string and no new lines characters.
# - Do NOT include any explanations, markdown, code blocks, or extra text before or after the JSON.
# - The JSON object must have exactly two fields: "evaluation" and "rating".
# - "evaluation" should be a single string containing all your analysis, feedback, and suggestions.
# - "rating" should be an object with the following structure and ONLY numbers as values:
# 
# {{
#   "evaluation": "Your detailed feedback, analysis, and suggestions here.",
#   "rating": {{
#     "question_relevance": {{"score": 2, "max": 3}},
#     "technical_accuracy": {{"score": 1, "max": 3}},
#     "sales_effectiveness": {{"score": 3, "max": 4}},
#     "total": {{"score": 6, "max": 10}}
#   }}
# }}
# """
#     if FLAG == 1:
#         # Streaming OpenAI Chat completion
#         response_stream = openai_client.chat.completions.create(
#             model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
#             messages=[
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=1,
#             top_p=1,
#             max_tokens=1024,
#             stream=True,
#         )
# 
#         full_response = ""
#         for chunk in response_stream:
#             if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
# 
#         return full_response.strip()
#     else:
#         completion = client.chat.completions.create(
#             model="meta-llama/llama-4-scout-17b-16e-instruct",
#             messages=[{"role": "user", "content": prompt}],
#             temperature=0.7,
#             max_completion_tokens=1024,
#             top_p=1,
#             stream=True,
#             stop=None,
#             stop=None,
#         )
#         
#         full_response = ""
#         for chunk in completion:
#             if chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
#         
#         return full_response.strip()
# 
# def evaluate_mid_conversation(recent_exchanges: List[dict], context: str):
#     """
#     Evaluate the last 4 exchanges of the conversation to assess progress and direction.
#     """
#     # Format the exchanges into a readable string
#     exchanges_text = "\n".join([
#         f"Exchange {i+1}:\n"
#         f"Customer: {exchange['visitor_text']}\n"
#         f"Salesperson: {exchange['salesperson_text']}"
#         for i, exchange in enumerate(recent_exchanges)
#     ])
# 
#     prompt = f"""
# You are evaluating a series of recent exchanges in a sales conversation. Analyze the last few interactions 
# to assess the conversation's progress and effectiveness.
# 
# Context from product documentation:
# {context}
# 
# Recent Exchanges:
# {exchanges_text}
# 
# Evaluate the following aspects:
# 1. Conversation Direction (0-3 points)
#    - Is the conversation moving towards a clear goal?
#    - Are key product benefits being effectively communicated?
#    - Is there a logical progression in the discussion?
# 
# 2. Information Consistency (0-3 points)
#    - Are the salesperson's responses consistent with previous statements?
#    - Is product information accurately maintained throughout?
#    - Are customer concerns being tracked and addressed?
# 
# 3. Customer Engagement (0-4 points)
#    - Is the customer showing increasing interest?
#    - Are their questions being fully addressed?
#    - Is the salesperson building rapport and trust?
#    - Is the conversation becoming more specific/detailed?
# 
# Provide:
# 1. Scores for each category
# 2. Specific examples from the conversation
# 3. Actionable recommendations for improvement
# 4. Suggested next steps or topics to address
# 
# Your evaluation:
# """
#     if FLAG == 1:
#         # Streaming OpenAI Chat completion
#         response_stream = openai_client.chat.completions.create(
#             model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
#             messages=[
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=1,
#             top_p=1,
#             max_tokens=1024,
#             stream=True,
#         )
# 
#         full_response = ""
#         for chunk in response_stream:
#             if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
# 
#         return full_response.strip()
#     else:
#         completion = client.chat.completions.create(
#             model="meta-llama/llama-4-scout-17b-16e-instruct",
#             messages=[{"role": "user", "content": prompt}],
#             temperature=0.7,
#             max_completion_tokens=1024,
#             top_p=1,
#             stream=True,
#             stop=None,
#         )
#         
#         full_response = ""
#         for chunk in completion:
#             if chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
#         
#         return full_response.strip()
# 
# def evaluate_complete_conversation(full_conversation: List[dict], context: str) -> str:
#     """
#     Evaluate the entire sales conversation for overall effectiveness and outcomes.
#     """
#     prompt = f"""
# You are evaluating a complete sales conversation. Analyze the entire interaction to assess overall 
# effectiveness and achievement of sales objectives.
# 
# Context from product documentation:
# {context}
# 
# Complete Conversation:
# {format_conversation_history(full_conversation)}
# 
# Evaluate the following aspects:
# 1. Overall Progress (0-3 points)
#    - Did the conversation achieve its objectives?
#    - Was there clear progression from introduction to closing?
#    - Were key decision points effectively handled?
# 
# 2. Sales Strategy (0-3 points)
#    - Was the sales approach appropriate for the customer?
#    - Were product benefits effectively communicated?
#    - Was objection handling effective?
# 
# 3. Customer Journey (0-2 points)
#    - Did customer understanding/interest increase?
#    - Was there clear movement toward a decision?
# 
# 4. Technical Accuracy (0-2 points)
#    - Was product information consistently accurate?
#    - Were technical details explained appropriately?
# 
# Provide:
# 1. Overall score and breakdown by category
# 2. Key successful moments in the conversation
# 3. Critical missed opportunities
# 4. Pattern analysis of effective/ineffective techniques used
# 5. Recommendations for future conversations
# 
# Your evaluation:
# """
#     if FLAG == 1:
#         # Streaming OpenAI Chat completion
#         response_stream = openai_client.chat.completions.create(
#             model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
#             messages=[
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=1,
#             top_p=1,
#             max_tokens=1024,
#             stream=True,
#         )
# 
#         full_response = ""
#         for chunk in response_stream:
#             if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
# 
#             return full_response.strip()
#     else:
#         completion = client.chat.completions.create(
#             model="meta-llama/llama-4-scout-17b-16e-instruct",
#             messages=[{"role": "user", "content": prompt}],
#             temperature=0.7,
#             max_completion_tokens=1024,
#             top_p=1,
#             stream=True,
#             stop=None,
#         )
#         
#         full_response = ""
#         for chunk in completion:
#             if chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
#         
#         return full_response.strip()
# 
# def evaluate_additional_criteria(conversation: List[dict], criteria: str, context: str):
#     """
#     Evaluate the conversation based on additional criteria.
#     
#     Args:
#         conversation: List of conversation exchanges
#         criteria: The selected criteria to evaluate
#         context: Product context from PDF
#     
#     Returns:
#         str: Evaluation text
#     """
#     # Define prompts for different criteria
#     prompts = {
#         "Distraction Handling": """
# You are evaluating how well the salesperson handles distractions and off-topic questions in the conversation.
# Focus on:
# 1. Maintaining Focus (0-3 points)
#    - How well does the salesperson stay on topic?
#    - Do they acknowledge distractions without losing track of the main conversation?
#    - Do they smoothly redirect back to relevant topics?
# 
# 2. Response to Off-topic Questions (0-3 points)
#    - How effectively do they handle questions unrelated to the product?
#    - Do they acknowledge the question while maintaining professionalism?
#    - Do they find ways to connect off-topic questions back to product benefits?
# 
# 3. Conversation Flow Management (0-4 points)
#    - How well do they maintain conversation momentum?
#    - Do they prevent the conversation from derailing?
#    - Do they use transitions effectively?
#    - Do they keep the customer engaged despite distractions?
# 
# Provide specific examples from the conversation and actionable feedback.
# """,
#         "Communication Simplicity": """
# You are evaluating how effectively the salesperson communicates complex information in simple terms.
# Focus on:
# 1. Clarity of Explanation (0-3 points)
#    - How well do they break down complex concepts?
#    - Do they use simple, understandable language?
#    - Do they avoid unnecessary technical jargon?
# 
# 2. Use of Analogies and Examples (0-3 points)
#    - How effectively do they use relatable examples?
#    - Do they make abstract concepts concrete?
#    - Do they use analogies that resonate with the customer?
# 
# 3. Information Organization (0-4 points)
#    - How well do they structure their explanations?
#    - Do they present information in a logical sequence?
#    - Do they use visual or verbal cues to organize information?
#    - Do they check for understanding?
# 
# Provide specific examples from the conversation and actionable feedback.
# """
#     }
#     
#     # Get the appropriate prompt for the selected criteria
#     prompt = prompts.get(criteria, "")
#     if not prompt:
#         return "Invalid criteria selected."
#     
#     # Format conversation history
#     conversation_text = format_conversation_history(conversation)
#     
#     # Create the full prompt
#     full_prompt = f"""
# Based on the following conversation and product context, evaluate the salesperson's performance according to the specified criteria.
# 
# Product Context:
# {context}
# 
# Conversation:
# {conversation_text}
# 
# {prompt}
# 
# Your evaluation:
# """
#     if FLAG == 1:
#         # Streaming OpenAI Chat completion
#         response_stream = openai_client.chat.completions.create(
#             model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
#             messages=[
#                 {"role": "user", "content": full_prompt}
#             ],
#             temperature=1,
#             top_p=1,
#             max_tokens=1024,
#             stream=True,
#         )
# 
#         full_response = ""
#         for chunk in response_stream:
#             if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
# 
#         return full_response.strip()
#     else:
#         # Generate evaluation using Groq
#         completion = client.chat.completions.create(
#             model="meta-llama/llama-4-scout-17b-16e-instruct",
#             messages=[{"role": "user", "content": full_prompt}],
#             temperature=0.7,
#             max_completion_tokens=1024,
#             top_p=1,
#             stream=True,
#             stop=None,
#         )
#         
#         full_response = ""
#         for chunk in completion:
#             if chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
#         
#         return full_response.strip()
# 
# def extract_score(evaluation_text: str) -> float:
#     try:
#         # Look for score in format "Score: X" or "X/100"
#         score_match = re.search(r'Score:\s*(\d+)|(\d+)/100', evaluation_text)
#         if score_match:
#             return float(score_match.group(1) or score_match.group(2))
#         
#         # Look for standalone numbers that might be scores
#         numbers = re.findall(r'\b\d+\b', evaluation_text)
#         if numbers:
#             return float(numbers[-1])  # Take the last number found
#         
#         return 0.0
#     except:
#         return 0.0
# 
# def calculate_metrics(history: List[dict], current_conversation_only: bool = True) -> dict:
#     total_exchanges = len(history)
#     if total_exchanges == 0:
#         return {
#             "total_exchanges": 0,
#             "average_response_length": 0,
#             "customer_engagement_score": 0
#         }
#     
#     total_salesperson_length = sum(len(exchange['salesperson_text']) for exchange in history)
#     total_customer_length = sum(len(exchange['visitor_text']) for exchange in history)
#     
#     return {
#         "total_exchanges": total_exchanges,
#         "average_response_length": total_salesperson_length / total_exchanges,
#         "customer_engagement_score": total_customer_length / total_salesperson_length if total_salesperson_length > 0 else 0
#     }
# 
# def save_conversation(product_id: ObjectId, conversation_data: dict, evaluation_data: dict = None):
#     """
#     Save conversation and its evaluation data.
#     
#     Args:
#         product_id: ObjectId of the product
#         conversation_data: Dictionary containing conversation pairs
#         user_id: ID of the user
#         evaluation_data: Dictionary containing evaluation data including:
#             - current_evaluation: Current exchange evaluation
#             - mid_evaluations: List of evaluations for each exchange
#             - complete_evaluation: Final complete conversation evaluation
#             - metrics: Calculated metrics
#             - score: Overall score
#             - additional_criteria_evaluation: Optional evaluation against custom criteria
#     """
#     conversation = {
#         "product_id": product_id,
#         "conversation_data": conversation_data,
#         "evaluation_data": evaluation_data or {},
#         "created_at": datetime.now(),
#         "updated_at": datetime.now()
#     }
#     conversation = conversation_collection.insert_one(conversation)
#     return conversation
# 
# def save_conversation(
#     product_id: ObjectId,
#     category_id: ObjectId,
#     conversation_data: dict,
#     user_id: str,
#     evaluation_data: dict = None,
#     test_name: str = None,
#     prod_name: str = None,
#     cat_name: str = None
# ):
#     conversation_doc = {
#         "product_id": product_id,
#         "category_id": category_id,
#         "user_id": ObjectId(user_id),
#         "conversation_data": conversation_data,
#         "evaluation_data": evaluation_data if evaluation_data is not None else {},
#         "test_name": test_name,
#         "prod_name": prod_name,
#         "cat_name": cat_name,
#         "created_at": datetime.now(),
#         "updated_at": datetime.now(),
#         "is_deleted": False # Add is_deleted field here
#     }
#     result = conversation_collection.insert_one(conversation_doc)
#     return result.inserted_id
# 
# def save_transcript_conversation(
#     product_id: ObjectId,
#     category_id: ObjectId,
#     test_config_id_str: ObjectId,
#     conversation_data: dict,
#     user_id: str,
#     evaluation_data: dict = None,
#     test_name: str = None,
#     prod_name: str = None,
#     cat_name: str = None
# ):
#     conversation_doc = {
#         "product_id": product_id,
#         "category_id": category_id,
#         "user_id": ObjectId(user_id),
#         "test_config_id":test_config_id_str,
#         "conversation_data": conversation_data,
#         "evaluation_data": evaluation_data if evaluation_data is not None else {},
#         "test_name": test_name,
#         "prod_name": prod_name,
#         "cat_name": cat_name,
#         "created_at": datetime.now(),
#         "updated_at": datetime.now(),
#         "is_deleted": False # Add is_deleted field here
#     }
#     result = conversation_collection.insert_one(conversation_doc)
#     return result.inserted_id
# 
# 
# #def get_conversations_by_product(product_id: ObjectId, token):
#     """Get all conversations for a product with their evaluations."""
#     return list(conversation_collection.find(
#         {"product_id": product_id, "user_id":ObjectId(token["id"])},
#         sort=[("created_at", -1)]
#     ))
# 
# def get_conversation_by_id(conversation_id: ObjectId):
#     """Get a specific conversation with its evaluation data."""
#     return conversation_collection.find_one({"_id": conversation_id})
# 
# 
# def process_transcript_data(transcript_data: list) -> list:
#     """Process raw transcript data into structured format"""
#     structured_output = []
#     for i in range(0, len(transcript_data) - 1, 2):
#         if transcript_data[i]["source"] == "ai" and transcript_data[i + 1]["source"] == "user":
#             structured_output.append({
#                 "salesperson_text": transcript_data[i + 1]["text"],
#                 "visitor_text": transcript_data[i]["text"],
#             })
#     return structured_output
# 
# 
# def build_product_context(product: dict) -> str:
#     """Build combined product context from content and description"""
#     product_content_str = product.get("content", "")
#     product_description_str = product.get("description", "")
#     
#     if product_content_str and product_description_str:
#         return f"Product Content: {product_content_str}\nProduct Description: {product_description_str}"
#     elif product_content_str:
#         return f"Product Content: {product_content_str}"
#     elif product_description_str:
#         return f"Product Description: {product_description_str}"
#     return ""
# 
# 
# def process_evaluation_data(
#     transcript_text: list,
#     combined_product_context: str,
#     current_persona: dict,
#     test_config: dict,
#     test_config_id_str: str
# ) -> dict:
#     """Process and evaluate transcript data"""
#     from .websocket import (
#         evaluate_complete_conversation,
#         remove_invalid_json_chars, 
#         evaluate_additional_criteria
#     )
#     
#     # Evaluate complete conversation
#     complete_evaluation_raw = evaluate_complete_conversation(
#         transcript_text,
#         combined_product_context,
#         current_persona
#     )
#     
#     complete_evaluation_to_save = complete_evaluation_raw
#     complete_rating_to_save = {
#         "overall_progress": {"score": 0, "max": 3},
#         "sales_strategy": {"score": 0, "max": 3},
#         "customer_journey": {"score": 0, "max": 2},
#         "technical_accuracy": {"score": 0, "max": 2},
#         "total": {"score": 0, "max": 10}
#     }
# 
#     # Parse evaluation JSON
#     try:
#         cleaned_complete_eval = complete_evaluation_raw.strip()
#         if cleaned_complete_eval.startswith('```json'):
#             cleaned_complete_eval = cleaned_complete_eval[7:]
#         elif cleaned_complete_eval.startswith('```'):
#             cleaned_complete_eval = cleaned_complete_eval[3:]
#         if cleaned_complete_eval.endswith('```'):
#             cleaned_complete_eval = cleaned_complete_eval[:-3]
#         cleaned_complete_eval = cleaned_complete_eval.strip()
#         
#         cleaned_complete_eval = remove_invalid_json_chars(cleaned_complete_eval)
#         complete_eval_json = json.loads(cleaned_complete_eval, strict=False)
#         
#         if isinstance(complete_eval_json, dict):
#             if "complete_evaluation" in complete_eval_json:
#                 complete_evaluation_to_save = complete_eval_json["complete_evaluation"]
#             if "complete_rating" in complete_eval_json and isinstance(complete_eval_json["complete_rating"], dict):
#                 complete_rating_to_save = complete_eval_json["complete_rating"]
#                 
#     except Exception as e:
#         print(f"JSON decode or parsing error for complete evaluation: {e}")
# 
#     # Handle additional criteria evaluation
#     criteria_key_map = {
#         "distraction_handling": "Distraction Handling",
#         "communication_simplicity": "Communication Simplicity"
#     }
# 
#     additional_criteria_evaluation = {}
#     final_additional_criteria_config = test_config.get("additionalCriteria", None)
#     if final_additional_criteria_config:
#         for criteria, enabled in final_additional_criteria_config.items():
#             if enabled:
#                 prompt_key = criteria_key_map.get(criteria, criteria)
#                 eval_text = evaluate_additional_criteria(
#                     transcript_text,
#                     prompt_key,
#                     combined_product_context,
#                     current_persona
#                 )
#                 additional_criteria_evaluation[criteria] = eval_text
#     else:
#         additional_criteria_evaluation = "No additional criteria selected for this test configuration."
# 
#     return {
#         "individual_evaluations": [],
#         "complete_evaluation": complete_evaluation_to_save,
#         "complete_rating": complete_rating_to_save,
#         "additional_criteria_evaluation": additional_criteria_evaluation,
#         "is_complete": True,
#         "test_configuration_id": ObjectId(test_config_id_str)
#     }
# 
# 
# def validate_conversation_access(conversation_id: str, user_id: str) -> dict:
#     """Validate conversation ID and user access"""
#     if not ObjectId.is_valid(conversation_id):
#         raise HTTPException(status_code=400, detail="Invalid conversation ID format")
#     
#     existing_conversation = conversation_collection.find_one({"_id": ObjectId(conversation_id)})
#     if not existing_conversation:
#         raise HTTPException(status_code=404, detail="Conversation not found")
#     
#     if existing_conversation.get("user_id") != ObjectId(user_id):
#         raise HTTPException(status_code=403, detail="Access denied")
#     
#     return existing_conversation
# 
# 
# def get_related_data(product_id_str: str, test_config_id_str: str) -> tuple:
#     """Fetch product, category, and test configuration data"""
#     product_collection = db["products"]
#     category_collection = db["categories"]
#     test_configurations_collection = db["test_configurations"]
#     
#     product = product_collection.find_one({"_id": ObjectId(product_id_str)})
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
#         
#     category = category_collection.find_one({"_id": product["category_id"]})
#     test_config = test_configurations_collection.find_one({"_id": ObjectId(test_config_id_str)})
#     if not test_config:
#         raise HTTPException(status_code=404, detail="Test configuration not found")
#     
#     return product, category, test_config
# 
# 
# def update_transcript_service(
#     conversation_id: str,
#     transcript_data: list,
#     test_config_id_str: str,
#     product_id_str: str,
#     user_id: str
# ) -> dict:
#     """Service function to update transcript data"""
#     # Validate access
#     validate_conversation_access(conversation_id, user_id)
#     
#     # Get related data
#     product, category, test_config = get_related_data(product_id_str, test_config_id_str)
#     current_persona = test_config.get("visitorPersona", {})
#     
#     # Process transcript
#     transcript_text = process_transcript_data(transcript_data)
#     combined_product_context = build_product_context(product)
#     
#     # Process evaluation
#     evaluation_data = process_evaluation_data(
#         transcript_text,
#         combined_product_context,
#         current_persona,
#         test_config,
#         test_config_id_str
#     )
#     
#     # Prepare update data
#     prod_name = product["name"] if product else None
#     cat_name = category["name"] if category else None
#     test_name = test_config["name"] if test_config else None
# 
#     # Update conversation
#     conversations_collection = db["conversations"]
#     test_configurations_collection = db["test_configurations"]
#     
#     update_result = conversations_collection.update_one(
#         {"_id": ObjectId(conversation_id)},
#         {
#             "$set": {
#                 "conversation_data": {"pairs": transcript_text},
#                 "evaluation_data": evaluation_data,
#                 "product_id": ObjectId(product_id_str),
#                 "category_id": ObjectId(product["category_id"]),
#                 "test_config_id": ObjectId(test_config_id_str),
#                 "test_name": test_name,
#                 "product_name": prod_name,
#                 "category_name": cat_name,
#                 "updated_at": datetime.utcnow()
#             }
#         }
#     )
#     
#     if update_result.modified_count == 0:
#         raise HTTPException(status_code=500, detail="Failed to update conversation")
#     
#     # Update test configuration
#     test_configurations_collection.update_one(
#         {"_id": ObjectId(test_config_id_str)},
#         {"$set": {"assessment": True}}
#     )
#     
#     return {
#         "message": "Transcript updated successfully",
#         "conversation_id": conversation_id,
#         "transcript": transcript_text,
#         "updated_at": datetime.utcnow().isoformat()
#     }
# 
# 
# def get_transcript_by_id_service(conversation_id: str, user_id: str) -> dict:
#     """Service function to get transcript by ID"""
#     # Validate access
#     conversation = validate_conversation_access(conversation_id, user_id)
#     
#     # Convert ObjectIds to strings for JSON serialization
#     conversation["_id"] = str(conversation["_id"])
#     conversation["user_id"] = str(conversation["user_id"])
#     conversation["product_id"] = str(conversation["product_id"])
#     conversation["category_id"] = str(conversation["category_id"])
#     conversation["test_config_id"] = str(conversation["test_config_id"])
#     
#     if "evaluation_data" in conversation and "test_configuration_id" in conversation["evaluation_data"]:
#         conversation["evaluation_data"]["test_configuration_id"] = str(conversation["evaluation_data"]["test_configuration_id"])
#     
#     return {
#         "conversation": conversation,
#         "transcript": conversation.get("conversation_data", {}).get("pairs", [])
#     }
