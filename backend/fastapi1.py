from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
import json
import os
from pathlib import Path
import hashlib
import re
import numpy as np
from pymongo import MongoClient
import gridfs
from groq import Groq
from PyPDF2 import PdfReader
from transformers import pipeline
import pickle
from fastapi.websockets import WebSocketState

# Initialize FastAPI app
app = FastAPI(title="Sales Evaluation System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configurations
SECRET_KEY = "556227afb81a8b6e8b8d15355b4eb04fdbd23e0d8ab770dd09585a4c7bf027a2"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize Groq Client
client = Groq(api_key="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")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# MongoDB setup
def setup_mongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["sales_evaluation_db"]
    # Access the new collection
    test_configurations_collection = db["test_configurations"]
    return db, gridfs.GridFS(db)

db, fs = setup_mongodb()

# Pydantic models for request/response
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    role: str  # "employee" or "admin"

class User(UserBase):
    id: str
    role: str

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    updated_by: Optional[str] = None

class ProductBase(BaseModel):
    name: str
    category_id: str
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

class ConversationPair(BaseModel):
    visitor_text: str
    salesperson_text: str

class ConversationHistory(BaseModel):
    pairs: List[ConversationPair]

class EvaluationRequest(BaseModel):
    conversation: List[ConversationPair]
    product_id: str
    is_complete: bool = False
    additional_criteria: Optional[str] = None

class EvaluationResponse(BaseModel):
    evaluation: str
    score: float
    metrics: Dict[str, Any]
    conversation_id: str

# Add these Pydantic models for user authentication
class UserInDB(User):
    hashed_password: str

# Add Pydantic models for Test Configuration
class VisitorPersona(BaseModel):
    background: str
    pain_points: str
    goals: str
    technical_knowledge: str
    budget_sensitivity: str
    decision_authority: str
    previous_experience: str

class AdditionalCriteria(BaseModel):
    distraction_handling: bool
    communication_simplicity: bool

class TestConfigurationCreate(BaseModel):
    product_id: str
    visitorPersona: VisitorPersona
    additionalCriteria: AdditionalCriteria

class TestConfiguration(TestConfigurationCreate):
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime

# Add these helper functions for authentication
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db, email: str):
    print(f"DB lookup by email: {email}")
    user_dict = db.users.find_one({"email": email})
    if user_dict:
        # Map MongoDB _id to Pydantic id and MongoDB 'password' to 'hashed_password'
        # Assuming the hashed password is stored under the key 'password' in MongoDB
        mapped_user_dict = {
            "id": str(user_dict["_id"]), # Map _id to id and convert to string
            "username": user_dict["username"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "hashed_password": user_dict["password"] # Map the stored password field to hashed_password
        }
        # Ensure 'role' is present, although it's in UserBase so should be
        # mapped_user_dict['role'] = user_dict.get('role', 'employee') # Add default if needed

        print("Mapped user dict for Pydantic:", mapped_user_dict) # Add logging to see the dict structure
        return UserInDB(**mapped_user_dict) # Use the mapped dictionary
    print("User not found in DB.") # Add logging
    return None

def authenticate_user(db, email: str, password: str):
    print(f"Authenticating user: {email}") # Add logging
    user = get_user(db, email) # <-- Pass email to get_user
    if not user:
        print("Authentication failed: User not found.")
        return False
    if not verify_password(password, user.hashed_password):
        print("Authentication failed: Incorrect password.")
        return False
    print("Authentication successful.")
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print("Attempting to decode token...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("Token decoded successfully.")
        username: str = payload.get("sub")
        print(f"Extracted username (sub): {username}")

        if username is None:
            print("Username (sub) is None in token payload.")
            raise credentials_exception
        token_data = TokenData(username=username)

    except JWTError as e:
        print(f"JWT Error during decode: {e}") # <-- THIS WILL SHOW IF IT'S EXPIRATION
        raise credentials_exception

    # Now look up the user in the database
    print(f"Looking up user '{token_data.username}' in DB...")
    user = get_user(db, token_data.username) # Assuming get_user returns UserInDB object or None
    print(f"DB lookup result: {'Found' if user else 'Not Found'}")

    if user is None:
        print(f"User '{token_data.username}' not found in database.") # <-- THIS WILL SHOW IF USER NOT FOUND
        raise credentials_exception

    print(f"User '{user.username}' validated.")
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Database Operations Class
class DatabaseOperations:
    def __init__(self, db):
        self.db = db
        self.categories = db.categories
        self.products = db.products
        self.conversations = db.conversations
        self.users = db.users
        self.test_configurations = db.test_configurations # Access the new collection

    def create_category(self, name: str, created_by: str) -> ObjectId:
        category = {
            "name": name,
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_deleted": False,
            "updated_by": created_by
        }
        result = self.categories.insert_one(category)
        return result.inserted_id

    def update_category(self, category_id: ObjectId, name: str, updated_by: str) -> tuple[bool, str]:
        try:
            result = self.categories.update_one(
                {"_id": category_id, "is_deleted": False},
                {
                    "$set": {
                        "name": name,
                        "updated_at": datetime.utcnow(),
                        "updated_by": updated_by
                    }
                }
            )
            return result.modified_count > 0, "Category updated successfully"
        except Exception as e:
            return False, str(e)

    def soft_delete_category(self, category_id: ObjectId, updated_by: str) -> bool:
        result = self.categories.update_one(
            {"_id": category_id},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.utcnow(),
                    "updated_by": updated_by
                }
            }
        )
        return result.modified_count > 0

    def get_categories(self, user_id: str):
        return list(self.categories.find(
            {"is_deleted": False},
            {"_id": 1, "name": 1, "created_at": 1, "updated_at": 1, "updated_by": 1 }
        ))

    def create_product(self, name: str, category_id: ObjectId, pdf_content: str, metadata: dict, created_by: str, description: Optional[str] = None) -> ObjectId:
        product = {
            "name": name,
            "category_id": category_id,
            "content": pdf_content,
            "metadata": metadata,
            "created_by": created_by,
            "description": description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = self.products.insert_one(product)
        return result.inserted_id

    def get_products_by_category(self, category_id: ObjectId):
        return list(self.products.find({"category_id": category_id}))

    def get_product_by_id(self, product_id: ObjectId):
        return self.products.find_one({"_id": product_id})

    def save_conversation(self, product_id: ObjectId, conversation_data: dict, user_id: str, evaluation_data: dict = None):
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
            "user_id": user_id,
            "conversation_data": conversation_data,
            "evaluation_data": evaluation_data or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        return self.conversations.insert_one(conversation)

    def get_conversations_by_product(self, product_id: ObjectId, user_id: str):
        """Get all conversations for a product with their evaluations."""
        return list(self.conversations.find(
            {"product_id": product_id, "user_id": user_id},
            sort=[("created_at", -1)]
        ))

    def get_conversation_by_id(self, conversation_id: ObjectId):
        """Get a specific conversation with its evaluation data."""
        return self.conversations.find_one({"_id": conversation_id})

    def update_conversation_evaluation(self, conversation_id: ObjectId, evaluation_data: dict):
        """Update evaluation data for an existing conversation."""
        return self.conversations.update_one(
            {"_id": conversation_id},
            {
                "$set": {
                    "evaluation_data": evaluation_data,
                    "updated_at": datetime.utcnow()
                }
            }
        )

    # New method to save test configuration
    def save_test_configuration(self, config_data: TestConfigurationCreate, created_by: str) -> ObjectId:
        test_config = {
            "product_id": ObjectId(config_data.product_id), # Store product_id as ObjectId
            "visitorPersona": config_data.visitorPersona.model_dump(), # Use model_dump() for Pydantic V2
            "additionalCriteria": config_data.additionalCriteria.model_dump(), # Use model_dump() for Pydantic V2
            "created_by": created_by,
            "created_at": datetime.utcnow(),
        }
        result = self.test_configurations.insert_one(test_config)
        return result.inserted_id

# User Management Class
class User:
    def __init__(self, db):
        self.db = db
        self.users = db.users

    def register(self, username: str, email: str, password: str, role: str) -> bool:
        if self.users.find_one({"$or": [{"username": username}, {"email": email}]}):
            return False
        
        hashed_password = pwd_context.hash(password)
        user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "role": role,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        self.users.insert_one(user)
        return True

    def login(self, email: str, password: str):
        print(f"User manager login attempt for email: {email}") # Add logging
        user = get_user(self.db, email) # <-- Use get_user which now looks up by email
        if not user:
            print("User manager login failed: User not found.")
            return None
        if not pwd_context.verify(password, user.hashed_password):
            print("User manager login failed: Incorrect password.")
            return None
        print("User manager login successful.")
        # Return dictionary representation, ensuring ObjectId _id is stringified if part of the dict
        user_dict = user.model_dump() # Use model_dump() for Pydantic V2
        user_dict['id'] = str(user_dict['id']) # Ensure id is string
        # Remove hashed_password for security before returning
        user_dict.pop('hashed_password', None)
        return user_dict

    def get_user_id(self, username: str) -> str:
        user = self.users.find_one({"username": username})
        return str(user["_id"]) if user else None

    def get_user_by_username(self, username: str):
        print(f"DB lookup by username field: {username}") # Add logging
        return self.users.find_one({"username": username}) # <-- Looks up by username field

# Initialize database operations
db_ops = DatabaseOperations(db)
user_manager = User(db)

# Helper functions from original Streamlit code
def parse_transcript(transcript_text: str) -> List[dict]:
    lines = transcript_text.strip().split('\n')
    conversation_pairs = []
    current_pair = {'visitor_text': '', 'salesperson_text': ''}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.lower().startswith('visitor:'):
            if current_pair['visitor_text'] and current_pair['salesperson_text']:
                conversation_pairs.append(current_pair)
                current_pair = {'visitor_text': '', 'salesperson_text': ''}
            current_pair['visitor_text'] = line[8:].strip()
            
        elif line.lower().startswith('salesperson:'):
            current_pair['salesperson_text'] = line[12:].strip()
    
    if current_pair['visitor_text'] and current_pair['salesperson_text']:
        conversation_pairs.append(current_pair)
    
    return conversation_pairs

def read_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    text = ""
    
    metadata = {
        'title': reader.metadata.get('/Title', 'Untitled'),
        'author': reader.metadata.get('/Author', 'Unknown'),
        'creation_date': reader.metadata.get('/CreationDate', ''),
        'total_pages': len(reader.pages)
    }
    
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    return text.strip(), metadata

def generate_answer_rag(context: str, question: str, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
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
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

def evaluate_individual_answer(rag_answer: str, salesperson_answer: str, customer_question: str, is_first_exchange: bool = False, conversation_history: List[dict] = None) -> str:
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

Give a total score out of 10 and provide specific feedback on how they can improve their pitch and customer interaction.

Your evaluation:
"""

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

def evaluate_mid_conversation(recent_exchanges: List[dict], context: str) -> str:
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

def generate_customer_persona(product_context: str) -> dict:
    """Generate a customer persona based on the product context."""
    try:
        prompt = f"""
Based on the following product documentation, generate a realistic customer persona who would be interested in this product.

Product Documentation:
{product_context}

Please provide a detailed persona including:
1. Demographics (age, occupation, industry, etc.)
2. Pain points and challenges
3. Goals and objectives
4. Technical expertise level
5. Decision-making factors
6. Budget considerations
7. Timeline for purchase
8. Key questions they might ask

Format the response as a JSON object with these fields.
"""
        
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
        
        # Parse the JSON response
        try:
            persona = json.loads(full_response)
            return persona
        except json.JSONDecodeError:
            # If JSON parsing fails, return a structured dict
            return {
                "demographics": {},
                "pain_points": [],
                "goals": [],
                "technical_expertise": "intermediate",
                "decision_factors": [],
                "budget": "medium",
                "timeline": "1-3 months",
                "key_questions": []
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating customer persona: {str(e)}")

def generate_customer_question(product_context: str, conversation_history: List[dict], persona: dict, salesperson_last_response: str = None) -> str:
    """
    Generate a customer question based on the product context, persona, and conversation history.
    Can generate both initial questions and follow-up questions based on the salesperson's response.
    
    Args:
        product_context: The product documentation context
        conversation_history: List of previous conversation exchanges
        persona: Customer persona details
        salesperson_last_response: The salesperson's last response (optional, for follow-up questions)
    
    Returns:
        str: Generated customer question
    """
    try:
        conversation_context = ""
        if conversation_history:
            conversation_context = f"""
Previous conversation:
{format_conversation_history(conversation_history)}
"""
        
        # Determine if this is a follow-up question
        is_follow_up = salesperson_last_response is not None
        
        # Base prompt for customer persona and context
        base_prompt = f"""
You are a customer with the following persona:
{json.dumps(persona, indent=2)}

Product Documentation:
{product_context}

{conversation_context}
"""
        
        # Add specific instructions based on whether it's a follow-up question
        if is_follow_up:
            prompt = f"""{base_prompt}
Salesperson's last response:
{salesperson_last_response}

Generate a realistic follow-up question that this customer would ask based on the salesperson's response. The question should:
1. Be relevant to the previous exchange and salesperson's response
2. Show appropriate level of technical understanding
3. Reflect the customer's stage in the buying process
4. Be natural and conversational
5. Not be too specific or technical unless the persona suggests it
6. Show engagement with the salesperson's points
7. Move the conversation forward

Your follow-up question:
"""
        else:
            prompt = f"""{base_prompt}
Generate a realistic initial question that this customer would ask about the product. The question should:
1. Be relevant to the customer's persona and needs
2. Show appropriate level of technical understanding
3. Reflect the customer's stage in the buying process
4. Be natural and conversational
5. Not be too specific or technical unless the persona suggests it
6. Set a good foundation for the conversation

Your question:
"""
        
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating customer question: {str(e)}")

def generate_customer_follow_up(product_context: str, conversation_history: List[dict], persona: dict, salesperson_last_response: str) -> str:
    """Generate a follow-up question based on the salesperson's response."""
    try:
        prompt = f"""
You are a customer with the following persona:
{json.dumps(persona, indent=2)}

Product Documentation:
{product_context}

Previous conversation:
{format_conversation_history(conversation_history)}

Salesperson's last response:
{salesperson_last_response}

Generate a realistic follow-up question that this customer would ask based on the salesperson's response. The question should:
1. Be relevant to the previous exchange
2. Show appropriate level of technical understanding
3. Reflect the customer's stage in the buying process
4. Be natural and conversational
5. Not be too specific or technical unless the persona suggests it
6. Show engagement with the salesperson's points
7. Move the conversation forward

Your follow-up question:
"""
        
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating follow-up question: {str(e)}")

def evaluate_additional_criteria(conversation: List[dict], criteria: str, context: str) -> str:
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

def export_evaluation_report(
    conversation: List[dict],
    current_eval: str,
    mid_evals: List[str],
    complete_eval: str
) -> str:
    """Generate a comprehensive evaluation report."""
    try:
        report = f"""
# Sales Conversation Evaluation Report

## Conversation Transcript
{format_conversation_history(conversation)}

## Real-time Evaluations
{chr(10).join(f"Exchange {i+1}:{chr(10)}{eval}" for i, eval in enumerate(mid_evals))}

## Current Evaluation
{current_eval}

## Complete Conversation Evaluation
{complete_eval}

## Metrics
{json.dumps(calculate_metrics(conversation), indent=2)}
"""
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating evaluation report: {str(e)}")

# FastAPI endpoints
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_manager.login(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "username": user["username"]
    }

@app.post("/register")
async def register_user(user: UserCreate):
    if user_manager.register(user.username, user.email, user.password, user.role):
        return {"message": "User registered successfully"}
    raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/categories")
async def create_category(category: CategoryCreate, current_user: User = Depends(get_current_user)):
    category_id = db_ops.create_category(category.name, current_user.id)
    return {"id": str(category_id), "name": category.name}

@app.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    categories = db_ops.get_categories(current_user.id)
    
    # Convert ObjectId to string for each category before returning
    # This resolves the TypeError during JSON serialization
    for category in categories:
        category['_id'] = str(category['_id'])
        # Ensure updated_by is also a string if it exists
        if 'updated_by' in category and category['updated_by'] is not None:
            category['updated_by'] = str(category['updated_by']) # It should already be a string user ID, but this adds robustness

    return categories # Return the list with _id converted to string

@app.put("/categories/{category_id}")
async def update_category(
    category_id: str,
    category: CategoryCreate,
    current_user: User = Depends(get_current_user)
):
    success, message = db_ops.update_category(ObjectId(category_id), category.name, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": "Category updated successfully"}

@app.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    if db_ops.soft_delete_category(ObjectId(category_id), current_user.id):
        return {"message": "Category deleted successfully"}
    raise HTTPException(status_code=404, detail="Category not found")

@app.post("/products")
async def create_product(
    name: str = Form(...),
    category_id: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    pdf_content, metadata = read_pdf(file.file)
    product_id = db_ops.create_product(
        name=name,
        category_id=ObjectId(category_id),
        pdf_content=pdf_content,
        metadata=metadata,
        created_by=current_user.id,
        description=description
    )
    created_product = db_ops.get_product_by_id(product_id)
    created_product['_id'] = str(created_product['_id'])
    created_product['category_id'] = str(created_product['category_id'])
    return created_product

@app.get("/products/{category_id}")
async def get_products(category_id: str, current_user: User = Depends(get_current_user)):
    products = db_ops.get_products_by_category(ObjectId(category_id))
    for product in products:
        product['_id'] = str(product['_id'])
        product['category_id'] = str(product['category_id'])
    return products

@app.post("/evaluate")
async def evaluate_conversation(
    evaluation_request: EvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    product = db_ops.get_product_by_id(ObjectId(evaluation_request.product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    context = product["content"]
    conversation = evaluation_request.conversation
    
    # Get the last exchange for individual evaluation
    last_exchange = conversation[-1]
    rag_answer = generate_answer_rag(
        context,
        last_exchange['visitor_text'],
        len(conversation) == 1,
        conversation[:-1]
    )
    
    # Evaluate individual answer
    individual_evaluation = evaluate_individual_answer(
        rag_answer,
        last_exchange['salesperson_text'],
        last_exchange['visitor_text'],
        len(conversation) == 1,
        conversation[:-1]
    )
    
    # Check if we need a mid-conversation evaluation (every 4 pairs)
    mid_evaluation = None
    if len(conversation) % 4 == 0:
        mid_evaluation = evaluate_mid_conversation(conversation, context)
    
    # Get complete evaluation and additional criteria evaluation if conversation is complete
    complete_evaluation = None
    additional_criteria_evaluation = None
    if evaluation_request.is_complete:
        # Perform complete evaluation
        complete_evaluation = evaluate_complete_conversation(conversation, context)
        
        # Perform additional criteria evaluation if criteria are provided
        if hasattr(evaluation_request, 'additional_criteria') and evaluation_request.additional_criteria:
            additional_criteria_evaluation = evaluate_additional_criteria(
                conversation,
                evaluation_request.additional_criteria,
                context
            )
        else:
            additional_criteria_evaluation = "No additional criteria selected"
    
    # Calculate metrics
    score = extract_score(individual_evaluation)
    metrics = calculate_metrics(conversation)
    
    # Save all evaluation data
    evaluation_data = {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "is_complete": evaluation_request.is_complete
    }
    
    conversation_id = db_ops.save_conversation(
        ObjectId(evaluation_request.product_id),
        conversation,
        current_user.id,
        evaluation_data
    )
    
    return {
        "individual_evaluation": individual_evaluation,
        "mid_evaluation": mid_evaluation,
        "complete_evaluation": complete_evaluation,
        "additional_criteria_evaluation": additional_criteria_evaluation,
        "score": score,
        "metrics": metrics,
        "conversation_id": str(conversation_id.inserted_id)
    }

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "start":
                # Initialize new conversation
                product_id = ObjectId(data["product_id"])
                product = db_ops.get_product_by_id(product_id)
                if not product:
                    await websocket.send_json({"error": "Product not found"})
                    continue
                
                # Generate initial customer question
                question = generate_customer_question(product["content"], [], {}, None)
                await websocket.send_json({
                    "type": "question",
                    "content": question
                })
                
            elif data["type"] == "answer":
                # Process salesperson's answer
                product_id = ObjectId(data["product_id"])
                product = db_ops.get_product_by_id(product_id)
                conversation_history = data.get("history", [])
                
                # Generate AI response
                rag_answer = generate_answer_rag(
                    product["content"],
                    data["last_question"],
                    len(conversation_history) == 0,
                    conversation_history
                )
                
                # Evaluate salesperson's answer
                evaluation = evaluate_individual_answer(
                    rag_answer,
                    data["answer"],
                    data["last_question"],
                    len(conversation_history) == 0,
                    conversation_history
                )
                
                # Generate next question
                next_question = generate_customer_question(
                    product["content"],
                    conversation_history + [{
                        "visitor_text": data["last_question"],
                        "salesperson_text": data["answer"]
                    }],
                    {},
                    data["answer"]
                )
                
                await websocket.send_json({
                    "type": "evaluation",
                    "evaluation": evaluation,
                    "next_question": next_question
                })
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})

# Helper functions for authentication
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def format_conversation_history(history: List[dict]) -> str:
    formatted = []
    for i, exchange in enumerate(history, 1):
        formatted.append(f"Exchange {i}:")
        formatted.append(f"Customer: {exchange['visitor_text']}")
        formatted.append(f"Salesperson: {exchange['salesperson_text']}")
        formatted.append("")
    return "\n".join(formatted)

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

# Add new endpoints for the additional functionality
@app.post("/evaluate/additional-criteria")
async def evaluate_with_criteria(
    conversation: List[ConversationPair],
    criteria: str,
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    product = db_ops.get_product_by_id(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    evaluation = evaluate_additional_criteria(conversation, criteria, product["content"])
    
    # Save the additional criteria evaluation
    evaluation_data = {
        "additional_criteria_evaluation": evaluation,
        "criteria": criteria
    }
    
    conversation_id = db_ops.save_conversation(
        ObjectId(product_id),
        conversation,
        current_user.id,
        evaluation_data
    )
    
    return {
        "evaluation": evaluation,
        "conversation_id": str(conversation_id.inserted_id)
    }

@app.post("/evaluate/complete")
async def evaluate_full_conversation(
    conversation: List[ConversationPair],
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    product = db_ops.get_product_by_id(ObjectId(product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get all mid-conversation evaluations
    mid_evaluations = []
    for i in range(len(conversation)):
        mid_eval = evaluate_mid_conversation(conversation[:i+1], product["content"])
        mid_evaluations.append(mid_eval)
    
    # Get complete evaluation
    complete_evaluation = evaluate_complete_conversation(conversation, product["content"])
    score = extract_score(complete_evaluation)
    metrics = calculate_metrics(conversation)
    
    # Save the complete evaluation data
    evaluation_data = {
        "mid_evaluations": mid_evaluations,
        "complete_evaluation": complete_evaluation,
        "score": score,
        "metrics": metrics,
        "is_complete": True
    }
    
    conversation_id = db_ops.save_conversation(
        ObjectId(product_id),
        conversation,
        current_user.id,
        evaluation_data
    )
    
    return EvaluationResponse(
        evaluation=complete_evaluation,
        score=score,
        metrics=metrics,
        conversation_id=str(conversation_id.inserted_id)
    )

@app.post("/export-report")
async def export_report(
    conversation: List[ConversationPair],
    current_eval: str,
    mid_evals: List[str],
    complete_eval: str,
    current_user: User = Depends(get_current_user)
):
    report = export_evaluation_report(conversation, current_eval, mid_evals, complete_eval)
    return {"report": report}

# Add new endpoint to get conversation history with evaluations
@app.get("/conversations/{product_id}")
async def get_conversation_history(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    conversations = db_ops.get_conversations_by_product(ObjectId(product_id), current_user.id)
    return conversations

@app.get("/conversations/{product_id}/{conversation_id}")
async def get_conversation_details(
    product_id: str,
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    conversation = db_ops.get_conversation_by_id(ObjectId(conversation_id))
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

# New endpoint to save test configurations
@app.post("/test-configurations")
async def create_test_configuration(
    config_data: TestConfigurationCreate,
    current_user: User = Depends(get_current_user) # Requires authentication
):
    """
    Saves a new test configuration to the database.
    """
    try:
        inserted_id = db_ops.save_test_configuration(config_data, current_user.id)
        return {"id": str(inserted_id), "message": "Test configuration saved successfully"}
    except Exception as e:
        # Log the error for debugging
        print(f"Error saving test configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to save test configuration")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 