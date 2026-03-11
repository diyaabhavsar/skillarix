from .prompt import get_prompt_by_title
from .conversation import format_conversation_history
from openai import OpenAI
from groq import Groq
from typing import List
import json
from fastapi import HTTPException
from ..config import settings
import re

client = Groq(api_key=settings.GROQ_API_KEY)
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

FLAG = settings.MODEL
MODEL_NAME = settings.MODEL_NAME

def generate_customer_question(product_context: str, conversation_history: List[dict], persona: dict) -> str:
    print(persona)

    print(product_context, conversation_history, persona)
    conversation_context = ""
    if conversation_history:
        conversation_context = f"""
Previous conversation:
{format_conversation_history(conversation_history)}
"""
    is_follow_up = len(conversation_history) > 0
    # Base prompt for customer persona and context
    # This part will be the common system objective and guidelines
# Here the conersastion always start with "Exchange #" as a verbage under each Exchange, you have understand start with "Customer:" as a question from agent and line starts with "Salesperson" is an asnwer of that question.
    # Dynamic Prompt Construction
    visitor_type = persona.get('visitor_type') or 'Potential Customer'
    name = persona.get('name') or 'Visitor'
    background = persona.get('background') or persona.get('exhibition_objective') or 'Interested in the product'
    
    # Map legacy fields to new prompt structure
    pain_points = persona.get('pain_points') or persona.get('key_challenges') or 'Unknown'
    goals = persona.get('goals') or persona.get('buying_objective') or 'To learn more'
    
    # Map technical knowledge
    tech_map = {
        'general': 'Low', 'basic': 'Low', 'moderate': 'Average', 
        'advanced': 'High', 'expert': 'Expert'
    }
    raw_tech = persona.get('technical_knowledge') or persona.get('technical_expertise')
    knowledge_level = tech_map.get(raw_tech, raw_tech) or 'Average'
    
    base_system_prompt = f"""
You are a roleplaying AI simulating a specific customer persona at a trade show or sales meeting.
Your goal is to realistically act out this persona to test the salesperson's skills.

**YOUR ASSIGNED PERSONA:**
- **Role**: {visitor_type} named {name}
- **Background**: {background}
- **Key Pain Points**: {pain_points}
- **Goals**: {goals}
- **Technical Knowledge**: {knowledge_level}
- **Full Profile**: {json.dumps(persona)}

**PRODUCT CONTEXT:**
{product_context}

**CONVERSATION HISTORY:**
{conversation_context}

**BEHAVIOR CODES:**
1. **Voice & Tone**: Adopt a tone matching your persona (e.g., skeptical, enthusiastic, hurried).
2. **Knowledge**: If your knowledge is 'Low', ask simple questions. If 'High', ask regarding specs/integration.
3. **Goal-Oriented**: Steer the conversation to address your 'pain_points' and 'goals'.
4. **Natural Interaction**: 
   - React to what the salesperson says.
   - If they are vague, press for details.
   - Keep responses concise (1-3 sentences).
   - **CRITICAL**: You are a CUSTOMER. You are NOT helpful. You do NOT guide the salesperson. You challenge them.
   - **NEVER** say "How can I help you?".
   - **NEVER** say "Is there anything else?".
   - **NEVER** act like an assistant.
   - If you are satisfied, asking "What's the pricing?" or "Can I get a demo?" is a natural next step.

**TASK:**
Generate the next natural response (question or comment) for this customer. Speak ONLY as the customer. Do not add ANY meta-commentary.
"""
    
    
    # Specific instruction for the first message (greeting) vs follow-up
    # We append this instruction, but treating the whole blob as a system message is stronger.
    final_instruction = ""
    if is_follow_up:
         final_instruction = "\n**CURRENT INSTRUCTION**: Respond naturally to the salesperson's last message."
    else:
         final_instruction = "\n**CURRENT INSTRUCTION**: Start the conversation. Approach the salesperson with a greeting and an initial question or statement relevant to your goals."
    
    final_prompt = base_system_prompt + final_instruction

    if FLAG == 1:
        # Streaming OpenAI Chat completion
        response_stream = openai_client.chat.completions.create(
            model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
            messages=[
                {"role": "system", "content": final_prompt}
            ],
            temperature=0.9, # Slightly lower than 1 for better coherence while keeping creativity
            top_p=1,
            max_tokens=256,
            stream=True,
        )
        full_response = ""
        for chunk in response_stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content

        return full_response.strip()
    else:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "system", "content": final_prompt}],
            temperature=0.7,
            max_completion_tokens=256,
            top_p=1,
            stream=True,
            stop=None,
        )
        full_response = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content
        return full_response.strip()

# Helper function to remove invalid control characters from a string
def remove_invalid_json_chars(raw_string: str) -> str:
    """
    Removes characters that are invalid in JSON strings.
    Specifically targets control characters except allowed ones (\b, \f, \n, \r, \t).
    """
    control_char_regex = re.compile(r'[\x00-\x07\x0B\x0C\x0E-\x1F]+')
    return control_char_regex.sub('', raw_string)

def evaluate_mid_conversation(recent_exchanges: List[dict], context: str, persona: dict) -> str:
    """
    Evaluate the last 4 exchanges of the conversation to assess progress and direction.
    
    Args:
        recent_exchanges: List of recent conversation exchanges
        context: Product context from PDF
        persona: Customer persona details for context-aware evaluation
    """
    # Format the exchanges into a readable string
    exchanges_text = "\n".join([
        f"Exchange {i+1}:\n"
        f"Customer: {exchange['visitor_text']}\n"
        f"Salesperson: {exchange['salesperson_text']}"
        for i, exchange in enumerate(recent_exchanges)
    ])

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
{json.dumps(persona, indent=2)}

Context from product documentation:
{context}

Recent Exchanges:
{exchanges_text}

INSTRUCTIONS:
- Be strict. If the salesperson is passive or rude, give low scores.
- Return JSON ONLY.
"""
    if FLAG == 1:
        # Streaming OpenAI Chat completion
        response_stream = openai_client.chat.completions.create(
            model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=1,
            top_p=1,
            max_tokens=1024,
            stream=True,
        )

        full_response = ""
        for chunk in response_stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content

        return full_response.strip()
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
        
        full_response = ""
        for chunk in completion:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content
        
        return full_response.strip()
