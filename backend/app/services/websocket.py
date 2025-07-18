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
    base_system_prompt = f"""
We are in a simulation designed to evaluate the skills of a sales representative.
 Each exchange contains a question from the customer (denoted by “Customer:”) and a response from the sales rep (denoted by “Salesperson:”).
The agent (customer) should only ask questions to the sales rep about the product based on the provided product description and visitor persona.
 The agent must not answer any product or service-related questions. The agent is here as a visitor, not a salesperson.
Your task is:
To generate the next follow-up question the customer might ask based on the complete history of the conversation (all prior exchanges).
Ensure the follow-up question is natural, relevant, and continues the flow of the conversation.


product description: {product_context}

Visitor Persona (who is actually an agent):
{json.dumps(persona, indent=2)}

Exchanges:
{conversation_context}


### 📝 Final Output Instructions

* Do **not** include any labels, metadata, or formatting
* The message must:

  * Be contextual and in-character
  * Respect the simulation and role constraints
"""
    base_system_prompt1 = """
    Greet the salesperson naturally (e.g., “Hi there!”).
    """
    if is_follow_up:
        prompt = base_system_prompt
    else:
        prompt = base_system_prompt1
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

def evaluate_complete_conversation(full_conversation: List[dict], context: str, persona: dict) -> str:
    """
    Evaluate the entire sales conversation for overall effectiveness and outcomes.
    """

    def select_evaluation_prompt(prompt_data):
        """Selects the main or first available prompt from prompt_data."""
        if prompt_data and 'prompt' in prompt_data and len(prompt_data['prompt']) > 0:
            for prompt_item in prompt_data['prompt']:
                if prompt_item.get('condition') == 'main':
                    return prompt_item.get('prompt', '')
            return prompt_data['prompt'][0].get('prompt', '')
        return ''

    def fill_prompt_placeholders(prompt: str, persona: dict, context: str, conversation: List[dict]) -> str:
        """Replaces placeholders in the prompt with actual values."""
        return (
            prompt
            .replace("{{Visitor_persona}}", json.dumps(persona, indent=2))
            .replace("{{Product_detail}}", context)
            .replace("{{Conversion_history}}", format_conversation_history(conversation))
        )

    def stream_response_openai(prompt: str) -> str:
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

    def stream_response_groq(prompt: str) -> str:
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

    prompt_data = get_prompt_by_title("Complete Evaluation")
    print(prompt_data)
    evaluation_prompt = select_evaluation_prompt(prompt_data)
    prompt = fill_prompt_placeholders(evaluation_prompt, persona, context, full_conversation)

    if FLAG == 1:
        return stream_response_openai(prompt)
    else:
        return stream_response_groq(prompt)

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
    
    # Extract the actual prompt text from the prompt_data structure based on criteria
    evaluation_prompt = ""
    if prompt_data and 'prompt' in prompt_data and len(prompt_data['prompt']) > 0:
        # Map criteria to condition names
        criteria_mapping = {
            "Distraction Handling": "distraction_handling",
            "Communication Simplicity": "communication_simplicity"
        }
        
        target_condition = criteria_mapping.get(criteria)
        
        if target_condition:
            # Look for the specific condition
            for prompt_item in prompt_data['prompt']:
                if prompt_item.get('condition') == target_condition:
                    evaluation_prompt = prompt_item.get('prompt', '')
                    break
        
        # If no specific condition found, use fallback
        if not evaluation_prompt and len(prompt_data['prompt']) > 0:
            evaluation_prompt = prompt_data['prompt'][0].get('prompt', '')
    
    # Use the evaluation prompt from database instead of hardcoded prompts
    if not evaluation_prompt:
        return "No evaluation prompt found for the specified criteria."
    
    # Format conversation history
    conversation_text = format_conversation_history(conversation)
    
    # Create the full prompt
    full_prompt = f"""
Based on the following conversation and product context, evaluate the salesperson's performance according to the specified criteria.

Customer Persona:
{json.dumps(persona, indent=2)}

Product Context:
{context}

Conversation:
{conversation_text}

{evaluation_prompt}

Your evaluation:
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
            model="meta-llama/llama-4-scout-17b-16e-instruct",
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
You are evaluating a series of recent exchanges in a sales conversation. Analyze the last few interactions 
to assess the conversation's progress and effectiveness.

Customer Persona:
{json.dumps(persona, indent=2)}

Context from product documentation:
{context}

Recent Exchanges:
{exchanges_text}

Evaluate the following aspects:
1. Conversation Direction (0-3 points)
   - Is the conversation moving towards a clear goal?
   - Are key product benefits being effectively communicated?
   - Is there a logical progression in the discussion?
   - Is the sales approach appropriate for this specific customer persona?

2. Information Consistency (0-3 points)
   - Are the salesperson's responses consistent with previous statements?
   - Is product information accurately maintained throughout?
   - Are customer concerns being tracked and addressed?
   - Is the technical level appropriate for the customer's knowledge?

3. Customer Engagement (0-4 points)
   - Is the customer showing increasing interest?
   - Are their questions being fully addressed?
   - Is the salesperson building rapport and trust?
   - Is the conversation becoming more specific/detailed?
   - Is the salesperson addressing the customer's:
     * Product Knowledge Level
     * Product Familiarity
     * Technical Expertise
     * Key Challenges
     * Buying Objective
     * Budget Range
     * Decision Authority
     * Exhibition Objective

Provide:
1. Scores for each category
2. Specific examples from the conversation
3. Actionable recommendations for improvement
4. Suggested next steps or topics to address
5. How well the salesperson is adapting to this specific customer persona

Your evaluation:
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
