from fastapi import HTTPException
from typing import List
from groq import Groq
from openai import OpenAI
import openai
import re
from datetime import datetime, timezone
from bson import ObjectId
from ..database import db
import json
from ..config import settings


conversation_collection = db["conversations"]
prompt_collection = db["prompts"]

# Initialize Groq Client
client = Groq(api_key=settings.GROQ_API_KEY)
# Initialize OpenAI Client
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
FLAG = settings.MODEL
MODEL_NAME = settings.MODEL_NAME

def generate_answer_rag(context: str, question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
    try:
        greeting_instruction = "Start with a warm greeting" if is_first_exchange else "Skip the greeting as this is a continuing conversation"
        
        conversation_context = ""
        if conversation_history and len(conversation_history) > 0:
            conversation_context = f"""
Previous conversation:
{format_conversation_history(conversation_history)}

Continue the conversation naturally, referring back to previous exchanges when relevant.
"""
        
        prompt = f"""
You are a friendly and knowledgeable sales representative at a product expo. Your goal is to engage customers and help them understand the product's value, focusing on their needs and interests.

Customer Persona:
{json.dumps(persona, indent=2)}

Context from product documentation:
{context}

{conversation_context}

Customer Question: {question}

Guidelines for your response:
1. {greeting_instruction}
2. Focus on customer benefits and value first, not technical specifications
3. Proactively identify and present solutions to common customer pain points
4. Only provide technical details if:
   - The customer specifically asks for them
   - They are directly relevant to the customer's question
   - The customer has shown enough interest to warrant deeper information
5. Use simple, non-technical language unless the customer demonstrates technical knowledge
6. Connect features to customer benefits and real-world applications
7. Be conversational and engaging
8. End with an open-ended question that encourages the customer to share more about their needs
9. Tailor your response to match the customer's:
   - Product Knowledge Level
   - Product Familiarity
   - Technical Expertise
   - Key Challenges
   - Buying Objective
   - Budget Range
   - Decision Authority
   - Exhibition Objective

Remember:
- Start with high-level benefits
- Progress to features only as customer interest grows
- Save detailed specifications for when they're specifically requested
- Focus on how the product solves customer problems
- Use analogies and examples that resonate with customers
- Never ask the customer to figure out how the product solves their problems
- Instead, proactively present solutions based on common customer needs
- Show expertise by anticipating customer concerns and addressing them

Your response:
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
                temperature=1,
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
        # Use HTTPException only in API endpoints, not here.
        # Re-raise the exception or handle it appropriately.
        print(f"Error generating RAG answer: {str(e)}")
        raise # Re-raise the exception

def dynamic_generate_answer_rag(context: str, question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None):
    prompt_doc = prompt_collection.find_one({"title":"Generate Rag Answer"})
    prompt_dict = build_prompt_dict(prompt["prompt"])
    
    prompt = prompt_dict["prompt_text"]
    
    customer_persona = json.dumps(persona, indent=2)
    conversation_context = ""
    if conversation_history and len(conversation_history) > 0:
        conversation_context = prompt_dict["previous_conversation_context"].format(conversation_history = format_conversation_history(conversation_history))
    
    greeting_instruction = ""
    if is_first_exchange:
        greeting_instruction = prompt_dict["first_exchange"]
    else:
        greeting_instruction = prompt_dict["not_first_exchange"]
    
    
    filled_prompt = prompt.format(
        persona_dict=json.dumps(customer_persona, indent=2),
        context=context,
        conversation_context=conversation_context,
        customer_question=question,
        greeting_instruction=greeting_instruction
    )
    
    
    
    completion = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    messages=[{"role": "user", "content": filled_prompt}],
    temperature=1,
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

def format_conversation_history(history: List[dict]):
    formatted = []
    for i, exchange in enumerate(history, 1):
        formatted.append(f"Exchange {i}:")
        formatted.append(f"Customer: {exchange['visitor_text']}")
        formatted.append(f"Salesperson: {exchange['salesperson_text']}")
        formatted.append("")
    return "\n".join(formatted)

def evaluate_individual_answer(rag_answer: str, salesperson_answer: str, customer_question: str, persona: dict, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
    """Evaluate salesperson's answer against RAG answer."""
    greeting_instruction = "For the first interaction, check if the salesperson starts with an appropriate greeting" if is_first_exchange else "A greeting is not necessary since this is not the first interaction"
    
    # Format conversation history if available
    conversation_context = ""
    if conversation_history and len(conversation_history) > 0:
        conversation_context = f"""
Previous conversation context:
{format_conversation_history(conversation_history)}

Take into account the conversation flow and whether the salesperson maintains continuity with previous exchanges.
"""
    
    prompt = f"""
You are an experienced sales trainer evaluating a salesperson's performance at a product expo. Compare the salesperson's answer to both the customer's question and the reference answer, focusing on both technical accuracy and sales effectiveness.

Customer Persona:
{json.dumps(persona, indent=2)}

{conversation_context}

Customer's Question:
{customer_question}

Salesperson's Answer:
{salesperson_answer}

Reference Answer (Best Practice):
{rag_answer}

Important Note: {greeting_instruction}

Evaluate the salesperson's performance on:
1. Question Relevance (0-3 points)
   - How well does the answer address the specific question asked?
   - Is the response focused on what the customer wants to know?
   - Does it avoid going off-topic?

2. Technical Accuracy (0-3 points)
   - Is the information provided factually correct?
   - Does it align with the product specifications?
   - Are technical details presented accurately?

3. Sales Effectiveness (0-4 points)
   - Does it proactively present solutions?
   - Is it customer-centric and benefit-focused?
   - Does it demonstrate expertise without being overly technical?
   - Does it engage the customer and encourage further interaction?
   - {"Does it begin with an appropriate greeting?" if is_first_exchange else ""}
   - Does it reference previous exchanges appropriately? (if applicable)
   - Does it appropriately address the customer's:
     * Product Knowledge Level
     * Product Familiarity
     * Technical Expertise
     * Key Challenges
     * Buying Objective
     * Budget Range
     * Decision Authority
     * Exhibition Objective

Give a total score out of 10 and provide specific feedback on how they can improve their pitch and customer interaction.

IMPORTANT INSTRUCTIONS:
- Return ONLY a valid JSON object, and nothing else, only single string and no new lines characters.
- Do NOT include any explanations, markdown, code blocks, or extra text before or after the JSON.
- The JSON object must have exactly two fields: "evaluation" and "rating".
- "evaluation" should be a single string containing all your analysis, feedback, and suggestions.
- "rating" should be an object with the following structure and ONLY numbers as values:

{{
  "evaluation": "Your detailed feedback, analysis, and suggestions here.",
  "rating": {{
    "question_relevance": {{"score": 2, "max": 3}},
    "technical_accuracy": {{"score": 1, "max": 3}},
    "sales_effectiveness": {{"score": 3, "max": 4}},
    "total": {{"score": 6, "max": 10}}
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

def evaluate_mid_conversation(recent_exchanges: List[dict], context: str):
    """
    Evaluate the last 4 exchanges of the conversation to assess progress and direction.
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

Context from product documentation:
{context}

Recent Exchanges:
{exchanges_text}

Evaluate the following aspects:
1. Conversation Direction (0-3 points)
   - Is the conversation moving towards a clear goal?
   - Are key product benefits being effectively communicated?
   - Is there a logical progression in the discussion?

2. Information Consistency (0-3 points)
   - Are the salesperson's responses consistent with previous statements?
   - Is product information accurately maintained throughout?
   - Are customer concerns being tracked and addressed?

3. Customer Engagement (0-4 points)
   - Is the customer showing increasing interest?
   - Are their questions being fully addressed?
   - Is the salesperson building rapport and trust?
   - Is the conversation becoming more specific/detailed?

Provide:
1. Scores for each category
2. Specific examples from the conversation
3. Actionable recommendations for improvement
4. Suggested next steps or topics to address

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

def evaluate_complete_conversation(full_conversation: List[dict], context: str) -> str:
    """
    Evaluate the entire sales conversation for overall effectiveness and outcomes.
    """
    prompt = f"""
You are evaluating a complete sales conversation. Analyze the entire interaction to assess overall 
effectiveness and achievement of sales objectives.

Context from product documentation:
{context}

Complete Conversation:
{format_conversation_history(full_conversation)}

Evaluate the following aspects:
1. Overall Progress (0-3 points)
   - Did the conversation achieve its objectives?
   - Was there clear progression from introduction to closing?
   - Were key decision points effectively handled?

2. Sales Strategy (0-3 points)
   - Was the sales approach appropriate for the customer?
   - Were product benefits effectively communicated?
   - Was objection handling effective?

3. Customer Journey (0-2 points)
   - Did customer understanding/interest increase?
   - Was there clear movement toward a decision?

4. Technical Accuracy (0-2 points)
   - Was product information consistently accurate?
   - Were technical details explained appropriately?

Provide:
1. Overall score and breakdown by category
2. Key successful moments in the conversation
3. Critical missed opportunities
4. Pattern analysis of effective/ineffective techniques used
5. Recommendations for future conversations

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

def evaluate_additional_criteria(conversation: List[dict], criteria: str, context: str):
    """
    Evaluate the conversation based on additional criteria.
    
    Args:
        conversation: List of conversation exchanges
        criteria: The selected criteria to evaluate
        context: Product context from PDF
    
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

def extract_score(evaluation_text: str) -> float:
    try:
        # Look for score in format "Score: X" or "X/100"
        score_match = re.search(r'Score:\s*(\d+)|(\d+)/100', evaluation_text)
        if score_match:
            return float(score_match.group(1) or score_match.group(2))
        
        # Look for standalone numbers that might be scores
        numbers = re.findall(r'\b\d+\b', evaluation_text)
        if numbers:
            return float(numbers[-1])  # Take the last number found
        
        return 0.0
    except:
        return 0.0

def calculate_metrics(history: List[dict], current_conversation_only: bool = True) -> dict:
    total_exchanges = len(history)
    if total_exchanges == 0:
        return {
            "total_exchanges": 0,
            "average_response_length": 0,
            "customer_engagement_score": 0
        }
    
    total_salesperson_length = sum(len(exchange['salesperson_text']) for exchange in history)
    total_customer_length = sum(len(exchange['visitor_text']) for exchange in history)
    
    return {
        "total_exchanges": total_exchanges,
        "average_response_length": total_salesperson_length / total_exchanges,
        "customer_engagement_score": total_customer_length / total_salesperson_length if total_salesperson_length > 0 else 0
    }

def save_conversation(product_id: ObjectId, conversation_data: dict, evaluation_data: dict = None):
    """
    Save conversation and its evaluation data.
    
    Args:
        product_id: ObjectId of the product
        conversation_data: Dictionary containing conversation pairs
        user_id: ID of the user
        evaluation_data: Dictionary containing evaluation data including:
            - current_evaluation: Current exchange evaluation
            - mid_evaluations: List of evaluations for each exchange
            - complete_evaluation: Final complete conversation evaluation
            - metrics: Calculated metrics
            - score: Overall score
            - additional_criteria_evaluation: Optional evaluation against custom criteria
    """
    conversation = {
        "product_id": product_id,
        "conversation_data": conversation_data,
        "evaluation_data": evaluation_data or {},
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    conversation = conversation_collection.insert_one(conversation)
    return conversation

def save_conversation(
    product_id: ObjectId,
    category_id: ObjectId,
    conversation_data: dict,
    user_id: str,
    evaluation_data: dict = None,
    test_name: str = None,
    prod_name: str = None,
    cat_name: str = None
):
    conversation_doc = {
        "product_id": product_id,
        "category_id": category_id,
        "user_id": ObjectId(user_id),
        "conversation_data": conversation_data,
        "evaluation_data": evaluation_data if evaluation_data is not None else {},
        "test_name": test_name,
        "prod_name": prod_name,
        "cat_name": cat_name,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_deleted": False # Add is_deleted field here
    }
    result = conversation_collection.insert_one(conversation_doc)
    return result.inserted_id

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
    conversation_doc = {
        "product_id": product_id,
        "category_id": category_id,
        "user_id": ObjectId(user_id),
        "test_config_id":test_config_id_str,
        "conversation_data": conversation_data,
        "evaluation_data": evaluation_data if evaluation_data is not None else {},
        "test_name": test_name,
        "prod_name": prod_name,
        "cat_name": cat_name,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_deleted": False # Add is_deleted field here
    }
    result = conversation_collection.insert_one(conversation_doc)
    return result.inserted_id


def get_conversations_by_product(product_id: ObjectId, token):
    """Get all conversations for a product with their evaluations."""
    return list(conversation_collection.find(
        {"product_id": product_id, "user_id":ObjectId(token["id"])},
        sort=[("created_at", -1)]
    ))

def get_conversation_by_id(conversation_id: ObjectId):
    """Get a specific conversation with its evaluation data."""
    return conversation_collection.find_one({"_id": conversation_id})

def build_prompt_dict(prompt_list: list[dict]) -> dict:
    """
    Converts list of {'condition', 'prompt'} dicts to a condition: prompt map.
    """
    return {item["condition"]: item["prompt"] for item in prompt_list}
