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
    prompt = f"""
You are evaluating a complete sales conversation. Analyze the entire interaction to assess overall 
effectiveness and achievement of sales objectives.

Customer Persona:
{json.dumps(persona, indent=2)}

Key Persona Considerations:
- Product Knowledge: {persona.get('product_knowledge', 'Not specified')}
- Product Familiarity: {persona.get('product_familiarity', 'Not specified')}
- Technical Expertise: {persona.get('technical_expertise', 'Not specified')}
- Key Challenges: {persona.get('key_challenges', 'Not specified')}
- Buying Objective: {persona.get('buying_objective', 'Not specified')}
- Budget Range: {persona.get('budget_range', 'Not specified')}
- Decision Authority: {persona.get('decision_authority', 'Not specified')}
- Exhibition Objective: {persona.get('exhibition_objective', 'Not specified')}

Context from product documentation:
{context}

Complete Conversation:
{format_conversation_history(full_conversation)}

Evaluate the following aspects:
1. Overall Progress (0-3 points)
   - Did the conversation achieve its objectives?
   - Was there clear progression from introduction to closing?
   - Were key decision points effectively handled?
   - Was the approach consistently appropriate for this customer persona?

2. Sales Strategy (0-3 points)
   - Was the sales approach appropriate for this specific customer?
   - Were product benefits effectively communicated in a way that resonated with this customer?
   - Was objection handling effective and persona-appropriate?
   - Was the technical depth consistently appropriate?

3. Customer Journey (0-2 points)
   - Did customer understanding/interest increase?
   - Was there clear movement toward a decision?
   - Was the journey tailored to this customer's decision-making style?

4. Technical Accuracy (0-2 points)
   - Was product information consistently accurate?
   - Were technical details explained at the appropriate level for this customer?
   - Was the technical complexity matched to the customer's knowledge level?

Provide:
1. A comprehensive explanation of the overall performance, integrating detailed insights and specific examples from the 'Overall Progress', 'Sales Strategy', 'Customer Journey', and 'Technical Accuracy' categories. This explanation should be a single, detailed string and should NOT include the numerical overall score.
2. Key successful moments in the conversation (key name to be used: key_successful_moments, the response for this point must be in single string)
3. Critical missed opportunities (key name to be used: critical_missed_opportunities, the response for this point must be in single string)
4. Pattern analysis of effective/ineffective techniques used (key name to be used: pattern_analysis, the response for this point must be in single string)
5. Recommendations for future conversations (key name to be used: recommendations, the response for this point must be in single string)
6. Specific analysis of how well the salesperson adapted to this customer persona throughout the conversation (key name to be used: specific_analysis, the response for this point must be in single string)

IMPORTANT INSTRUCTIONS:
- Return ONLY a valid JSON object, and nothing else.
- All the keys must be in lowercase and instead of space use underscore.
- Do NOT include any explanations, markdown, code blocks, or extra text before or after the JSON.
- The JSON object must have exactly two fields: "complete_evaluation" and "complete_rating".
- "complete_evaluation" should be an object with the following fields, where each field contains a single string:
   - "overall_score": "Explanation of Overall score and breakdown by category, all in a single string."
   - "key_successful_moments": "Detailed description of key successful moments."
   - "critical_missed_opportunities": "Detailed description of critical missed opportunities."
   - "pattern_analysis": "Detailed analysis of effective/ineffective techniques."
   - "recommendations": "Detailed recommendations for future conversations."
   - "specific_analysis": "Detailed specific analysis of persona adaptation."
- "complete_rating" should be an object with the following structure and ONLY numbers as values:

{{
  "complete_evaluation": {{
    "overall_score": "Your comprehensive explanation integrating insights from Overall Progress, Sales Strategy, Customer Journey, and Technical Accuracy, all in a single string.",
    "key_successful_moments": "Your detailed description of key successful moments here.",
    "critical_missed_opportunities": "Your detailed description of critical missed opportunities here.",
    "pattern_analysis": "Your detailed analysis of effective/ineffective techniques here.",
    "recommendations": "Your detailed recommendations for future conversations here.",
    "specific_analysis": "Your detailed specific analysis of persona adaptation here."
  }},
  "complete_rating": {{
    "overall_progress": {{"score": <number>, "max": 3}},
    "sales_strategy": {{"score": <number>, "max": 3}},
    "customer_journey": {{"score": <number>, "max": 2}},
    "technical_accuracy": {{"score": <number>, "max": 2}},
    "total": {{"score": <number>, "max": 10}}
  }}
}}
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
    # Define prompts for different criteria
    prompts = {
        "Distraction Handling": """
You are evaluating how well the salesperson handles distractions and off-topic questions in the conversation.
Focus on:
1. Maintaining Focus (0-3 points)
   - How well does the salesperson stay on topic?
   - Do they acknowledge distractions without losing track of the main conversation?
   - Do they smoothly redirect back to relevant topics?

2. Response to Off-topic Questions (0-3 points)
   - How effectively do they handle questions unrelated to the product?
   - Do they acknowledge the question while maintaining professionalism?
   - Do they find ways to connect off-topic questions back to product benefits?

3. Conversation Flow Management (0-4 points)
   - How well do they maintain conversation momentum?
   - Do they prevent the conversation from derailing?
   - Do they use transitions effectively?
   - Do they keep the customer engaged despite distractions?

Provide specific examples from the conversation and actionable feedback.
""",
        "Communication Simplicity": """
You are evaluating how effectively the salesperson communicates complex information in simple terms.
Focus on:
1. Clarity of Explanation (0-3 points)
   - How well do they break down complex concepts?
   - Do they use simple, understandable language?
   - Do they avoid unnecessary technical jargon?

2. Use of Analogies and Examples (0-3 points)
   - How effectively do they use relatable examples?
   - Do they make abstract concepts concrete?
   - Do they use analogies that resonate with the customer?

3. Information Organization (0-4 points)
   - How well do they structure their explanations?
   - Do they present information in a logical sequence?
   - Do they use visual or verbal cues to organize information?
   - Do they check for understanding?

Provide specific examples from the conversation and actionable feedback.
"""
    }
    
    # Get the appropriate prompt for the selected criteria
    prompt = prompts.get(criteria, "")
    if not prompt:
        return "Invalid criteria selected."
    
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

{prompt}

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
