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
1. **Voice & Tone**: Adopt a tone matching your persona (e.g., skeptical, enthusiastic, hurried, or detailed).
2. **Knowledge**: If your knowledge is 'Low', ask simple questions. If 'High', ask regarding specs/integration.
3. **Goal-Oriented**: Steer the conversation to address your 'pain_points' and 'goals'.
4. **Natural Interaction**: 
   - React to what the salesperson says.
   - If they are vague, press for details.
   - If they are helpful, show appreciation but keep vetting.
   - Keep responses concise (1-3 sentences).
   - NEVER break character. You are the customer.

**TASK:**
Generate the next natural response (question or comment) for this customer.
"""
    
    # Specific instruction for the first message (greeting) vs follow-up
    if is_follow_up:
         prompt = base_system_prompt + "\n**CURRENT INSTRUCTION**: Respond naturally to the salesperson's last message."
    else:
         prompt = base_system_prompt + "\n**CURRENT INSTRUCTION**: Start the conversation. Approach the salesperson with a greeting and an initial question or statement relevant to your goals."
    if FLAG == 1:
        # Streaming OpenAI Chat completion
        response_stream = openai_client.chat.completions.create(
            model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=1,
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
            messages=[{"role": "user", "content": prompt}],
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
# def generate_customer_question(product_context: str, conversation_history: List[dict], persona: dict) -> str:
#     conversation_context = ""
#     if conversation_history:
#         conversation_context = f"""
# Previous conversation:
# {format_conversation_history(conversation_history)}
# """
#     is_follow_up = len(conversation_history) > 0
#     # Base prompt for customer persona and context
#     # This part will be the common system objective and guidelines
#     base_system_prompt = f"""
# System Objective:
# -We are in a simulation to evaluate sales rep skills. It's important to ask relevant questions. Based on the persona and the complete question and answer history, generate the followup question to the sales rep. The agent is asking the question to the sales rep about the product. The agent is not at all supposed to answer any question related to the product or services because he is here as a visitor and not a sels rep. The sales rep answers the questions.
# Optional Persona Attributes (to vary behavior):
# - Tone: polite | skeptical | rushed | confident | shy
# - Industry knowledge: novice | intermediate | expert
# - Interest level: browsing | serious | ready to buy
# - Behavioral quirks: interrupting | multi-tasking | short-tempered
# Customer Persona:
# {json.dumps(persona, indent=2)}
# Product Documentation:
# {product_context}
# {conversation_context}
# """
#     base_system_prompt1 = f"""
# System Objective:
# You are an intelligent AI simulation system for exhibition training. Your role is to play the part of a potential visitor at a booth. Your job is to simulate realistic buyer conversations to assess the sales representative's readiness, product knowledge, and soft skills.
# You will use the provided customer persona, product context, and conversation history to ask either:
# - An initial greeting and question (first interaction), or
# - A follow-up question based on the salesperson's last response.
# Tone and complexity should match the persona and evolve during the conversation.
# Guidelines for All Output:
# - Be natural and human in tone
# - Align closely with the visitor persona
# - Do not repeat prior questions unless requested
# - Progressively deepen the conversation
# - Use the salesperson's last response to guide your next message
# Optional Persona Attributes (to vary behavior):
# - Tone: polite | skeptical | rushed | confident | shy
# - Industry knowledge: novice | intermediate | expert
# - Interest level: browsing | serious | ready to buy
# - Behavioral quirks: interrupting | multi-tasking | short-tempered
# Customer Persona:
# {json.dumps(persona, indent=2)}
# Product Documentation:
# {product_context}
# {conversation_context}
# """
#     if is_follow_up:
#         prompt = f"""{base_system_prompt1}
# 1. -We are in a simulation to evaluate sales rep skills. It's important to ask relevant questions. Based on the persona and the complete question and answer history, generate the followup question to the sales rep. The agent is asking the question to the sales rep about the product. The agent is not at all supposed to answer any question related to the product or services because he is here as a visitor and not a sels rep. The sales rep answers the questions.
# Modules:
#    Constraints:
#    - Ask only one question
#    - Do not break character
#    - Output only the visitor's message
# """
#     else:
#         prompt = f"""{base_system_prompt1}
# Modules:
# 1. Generate a natural, conversational opening greeting and a relevant first question that:
#    - Aligns with the visitor persona (intent, behavior, and knowledge level)
#    - Reflects early-stage buyer curiosity
#    - Avoids technical jargon unless the persona expects it
#    - Opens the door to deeper discussion
#    - If the salesperson asks for information or requirements, provide a relevant answer based on the persona, instead of just asking another question.
#    Constraints:
#    - Ask only one question
#    - Be polite, engaging, and human-like
#    - Do not mention being an AI or simulator
#    - Output only the visitor's message
# Your initial question or greeting:
# """
#     if FLAG == 1:
#         # Streaming OpenAI Chat completion
#         response_stream = openai_client.chat.completions.create(
#             model="gpt-3.5-turbo",  # or gpt-3.5-turbo / gpt-3.5-turbo
#             messages=[
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=1,
#             top_p=1,
#             max_tokens=1024,
#             stream=True,
#         )
#         full_response = ""
#         for chunk in response_stream:
#             if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content

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
#         full_response = ""
#         for chunk in completion:
#             if chunk.choices[0].delta.content:
#                 full_response += chunk.choices[0].delta.content
#         return full_response.strip()



# Helper function to remove invalid control characters from a string
def remove_invalid_json_chars(raw_string: str) -> str:
    """
    Removes characters that are invalid in JSON strings.
    Specifically targets control characters except allowed ones (\b, \f, \n, \r, \t).
    """
    # JSON allows \b, \f, \n, \r, \t. Other control characters (0x00-0x1F excluding these) are invalid unescaped.
    # Regex matches characters in range 0x00-0x1F EXCEPT 0x08 (\b), 0x09 (\t), 0x0a (\n), 0x0c (\f), 0x0d (\r)
    # More simply, target chars < 32 that are not \t, \n, \r. \b, \f are less common.
    # Let's remove all control characters except the most common newlines and tabs for simplicity and robustness.
    # A common pattern is to remove all non-printable ASCII characters.
    # Or, stick strictly to JSON invalid characters: \x00-\x07, \x0b, \x0e-\x1f
    # Let's use a regex that removes these specific invalid ones.
    control_char_regex = re.compile(r'[\x00-\x07\x0B\x0C\x0E-\x1F]+')
    return control_char_regex.sub('', raw_string)

def evaluate_additional_criteria(conversation: List[dict], criteria: str, context: str, persona: dict) -> str:  
    """
    Evaluate the conversation based on additional criteria.
    
    Args:
        conversation: List of conversation exchanges
        criteria: The selected criteria to evaluate
        context: Product context from PDF
        persona: Customer persona details
    
    Returns:
        str: Evaluation text
    """
    
    prompt_data = get_prompt_by_title("Additional Criteria Evaluation")
    print(prompt_data)
    
    # Hardcoded strict prompt to ensure JSON output
    criteria_prompt = ""
    if criteria == "Distraction Handling":
        criteria_prompt = """
Evaluate how well the salesperson manages distractions and off-topic questions.
Return JSON: { "evaluation": "short text", "rating": { "focus_maintenance": {"score": X, "max":3}, "off_topic_response": {"score": X, "max":3}, "flow_management": {"score": X, "max":4}, "total": {"score": Y, "max":10} } }
Include 1-2 short examples from the conversation.
"""
    elif criteria == "Communication Simplicity":
        criteria_prompt = """
Evaluate clarity and simplicity of explanations.
Return JSON: { "evaluation": "short text", "rating": { "clarity": {"score": X, "max":3}, "examples_usage": {"score": X, "max":3}, "organization": {"score": X, "max":4}, "total": {"score": Y, "max":10} } }
Include 1-2 short examples from the conversation.
"""
    else:
        criteria_prompt = f"Evaluate according to {criteria}. Return JSON: {{ 'evaluation': 'text', 'rating': {{ 'total': {{ 'score': X, 'max': 10 }} }} }}"

    evaluation_prompt = criteria_prompt
    
    # Use the evaluation prompt from database instead of hardcoded prompts
    if not evaluation_prompt:
        return "No evaluation prompt found for the specified criteria."
    
    # Format conversation history
    conversation_text = format_conversation_history(conversation)
    
    # Create the full prompt
    full_prompt = f""".
Based on the following conversation and product context, evaluate the salesperson's performance according to the specified criteria.

Customer Persona:
{json.dumps(persona, indent=2)}

Product Context:
{context}

Conversation:
{conversation_text}

Instructions:
{evaluation_prompt}

Return JSON only when the criteria_prompt above expects JSON. Otherwise return plain text.

CRITICAL: Be strict in your scoring. High scores should only be given for exceptional performance.
"""
    if FLAG == 1:
        # Streaming OpenAI Chat completion
        response_stream = openai_client.chat.completions.create(
            model=MODEL_NAME,  # or gpt-3.5-turbo / gpt-3.5-turbo
            messages=[
                {"role": "user", "content": full_prompt}
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
        # Generate evaluation using Groq
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": full_prompt}],
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
