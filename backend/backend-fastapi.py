from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from bson.errors import InvalidId
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
import asyncio
from fastapi.websockets import WebSocketState
import traceback
from math import ceil

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
    # client = MongoClient("mongodb://localhost:27017/")
    # db = client["sales_evaluation_db"]
    client = MongoClient('mongodb+srv://chinmaypatel2024:chinmay%402024@cluster0.hf0wpbs.mongodb.net/')
    db = client['sales']
    # Access the new collection
    test_configurations_collection = db["test_configurations"]
    return db, gridfs.GridFS(db)

db, fs = setup_mongodb()

# Helper function to convert ObjectIds to strings for API response
def convert_objectids_to_strings(data):
    """Recursively converts ObjectId instances in a dictionary or list to strings."""
    if isinstance(data, dict):
        return {key: convert_objectids_to_strings(value) for key, value in data.items()}
    elif isinstance(data, list):
         return [convert_objectids_to_strings(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data

# Pydantic models for request/response - Ensure they expect string IDs for _id, created_by, etc.
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
    active: bool = True # Add active field to UserCreate model

class User(UserBase):
    id: str # Expect string ID
    role: str
    active: bool = True # Add active field to User model
    sessions: Optional[int] = Field(default=0) # Add sessions field to User model

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str # Expect string ID
    created_by: str # Expect string ID
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    updated_by: Optional[str] = None # Expect string ID

class ProductBase(BaseModel):
    name: str
    category_id: str # Expect string ID
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str # Expect string ID
    category_id: str # Expect string ID
    created_by: str # Expect string ID
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]
    updated_by: Optional[str] = None # Expect string ID

class ConversationPair(BaseModel):
    visitor_text: str
    salesperson_text: str

class ConversationHistory(BaseModel):
    pairs: List[ConversationPair]
    id: str = Field(alias="_id") # Expect string ID

class EvaluationRequest(BaseModel):
    conversation: List[ConversationPair]
    product_id: str # Expect string ID
    is_complete: bool = False
    additional_criteria: Optional[str] = None

class EvaluationResponse(BaseModel):
    evaluation: str
    score: float
    metrics: Dict[str, Any]
    conversation_id: str # Expect string ID

# Add these Pydantic models for user authentication
class UserInDB(User):
    hashed_password: str
    last_login: Optional[datetime] = None # Added last_login field
    active: bool = True # Ensure active field is in UserInDB
    sessions: Optional[int] = Field(default=0) # Ensure sessions field is in UserInDB

# Add Pydantic models for Test Configuration - Ensure they expect string IDs
class VisitorPersona(BaseModel):
    product_knowledge: str  # None, Name-only, Saw ad/brochure, Peer-heard, Very familiar
    product_familiarity: str  # Never seen, Handled briefly, Tried sample, Similar user, Loyal user
    technical_expertise: str  # General, Basic, Moderate, Advanced, Expert
    key_challenges: str  # Cost control, Quality/reliability, Compliance, Simplicity, Trust in vendor, Sustainability
    buying_objective: str  # Save money, Boost quality, Meet standards, Upgrade, Future planning
    budget_range: str  # Very low, Low, Mid, High, Very high
    decision_authority: str  # User, Influencer, Evaluator, Approver, Final sign-off
    exhibition_objective: str  # Info gathering, Spec comparison, Pricing talk, Terms/warranty, Partnership, Demo booking

class AdditionalCriteria(BaseModel):
    distraction_handling: bool
    communication_simplicity: bool

class TestConfigurationCreate(BaseModel):
    product_id: str  # Expect string ID for input
    category_id: str  # Add this line
    visitorPersona: VisitorPersona
    additionalCriteria: AdditionalCriteria
    name: str

class TestConfiguration(BaseModel):
    id: str = Field(alias="_id")  # Expect string ID for output
    product_id: str  # Expect string ID for output
    category_id: str  # Add this line
    visitorPersona: Dict[str, Any]
    additionalCriteria: Dict[str, bool]
    name: str
    created_by: str  # Expect string ID for output
    created_at: datetime
    is_deleted: bool = False  # Add this line
    # Assuming no updated_by for test configs based on current schema, add if needed
    # updated_by: Optional[str] = None


# Helper functions for authentication
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
            "hashed_password": user_dict["password"], # Map the stored password field to hashed_password
            "last_login": user_dict.get("last_login") # Get last_login, defaults to None if not exists
        }
        print("Mapped user dict for Pydantic:", mapped_user_dict)
        return UserInDB(**mapped_user_dict)
    print("User not found in DB.")
    return None

def authenticate_user(db, email: str, password: str):
    print(f"Authenticating user: {email}")
    user = get_user(db, email)
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
        print(f"JWT Error during decode: {e}")
        raise credentials_exception

    # Now look up the user in the database
    print(f"Looking up user '{token_data.username}' in DB...")
    user = get_user(db, token_data.username)
    print(f"DB lookup result: {'Found' if user else 'Not Found'}")

    if user is None:
        print(f"User '{token_data.username}' not found in database.")
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
        self.test_configurations = db.test_configurations

    def create_category(self, name: str, created_by: str) -> ObjectId:
        category_data = {
            "name": name,
            "created_by": ObjectId(created_by), # Store as ObjectId
            "created_at": datetime.now(timezone.utc), # Use timezone-aware datetime
            "updated_at": datetime.now(timezone.utc), # Use timezone-aware datetime
            "is_deleted": False,
            "updated_by": ObjectId(created_by) # Store as ObjectId
        }
        result = self.categories.insert_one(category_data)
        return result.inserted_id

    def update_category(self, category_id: ObjectId, name: str, updated_by: str) -> tuple[bool, str]:
        # Ensure category_id is an ObjectId when querying
        result = self.categories.update_one(
            {"_id": category_id, "is_deleted": False},
            {
                "$set": {
                    "name": name,
                    "updated_at": datetime.now(timezone.utc), # Use timezone-aware datetime
                    "updated_by": ObjectId(updated_by) # Store as ObjectId
                }
            }
        )
        if result.matched_count == 0:
            return False, "Category not found or already deleted"
        return True, "Category updated successfully"

    def soft_delete_category(self, category_id: ObjectId, updated_by: str) -> bool:
         # Ensure category_id is an ObjectId when querying
        result = self.categories.update_one(
            {"_id": category_id, "is_deleted": False},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.now(timezone.utc), # Use timezone-aware datetime
                    "updated_by": ObjectId(updated_by) # Store as ObjectId
                }
            }
        )
        return result.matched_count > 0

    def get_categories(self, user_id: str):
        # When fetching, we return dictionaries. Convert ObjectIds to strings.
        # Querying for non-deleted categories
        categories_cursor = self.categories.find({"is_deleted": False})
        # Convert cursor to list and then process
        categories_list = list(categories_cursor)
        # Convert ObjectIds to strings before returning
        return convert_objectids_to_strings(categories_list)

    def create_product(self, name: str, category_id: ObjectId, pdf_content: str, metadata: dict, created_by: str, description: Optional[str] = None, is_deleted: bool = False) -> ObjectId:
        # Check if a product with the same name already exists
        existing_product = self.products.find_one({
            "name": name,
            "is_deleted": False
        })
        if existing_product:
            raise HTTPException(
                status_code=400,
                detail="A product with this name already exists"
            )
        
        product_data = {
            "name": name,
            "category_id": category_id,
            "content": pdf_content,
            "metadata": metadata,
            "created_by": ObjectId(created_by),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "updated_by": ObjectId(created_by),
            "description": description,
            "is_deleted": is_deleted
        }
        result = self.products.insert_one(product_data)
        return result.inserted_id

    def get_products_by_category(self, category_id: ObjectId):
        """
        Retrieves products for a given category, ensuring ObjectId fields are converted to strings.
        """
        # Ensure category_id is an ObjectId when querying
        products_cursor = self.products.find({"category_id": category_id, "is_deleted": False})
        products_list = list(products_cursor)
        # Convert ObjectIds to strings before returning
        return convert_objectids_to_strings(products_list)

    def get_product_by_id(self, product_id: ObjectId):
        # Ensure product_id is an ObjectId when querying
        product = self.products.find_one({"_id": product_id})
        if product:
            # Convert ObjectIds to strings before returning
            return convert_objectids_to_strings(product)
        return None

    def save_conversation(
        self,
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
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = self.conversations.insert_one(conversation_doc)
        return result.inserted_id

    def get_conversations_by_product(self, product_id: ObjectId, user_id: str):
        """Get all conversations for a product by user_id (string)."""
        # Ensure product_id and user_id are ObjectIds when querying
        conversations_cursor = self.conversations.find({
            "product_id": product_id,
            "user_id": ObjectId(user_id) # Query using ObjectId
        })
        conversations_list = list(conversations_cursor)
        # Convert ObjectIds to strings before returning
        return convert_objectids_to_strings(conversations_list)

    def get_conversation_by_id(self, conversation_id: ObjectId):
        """Get a specific conversation with its evaluation data."""
         # Ensure conversation_id is an ObjectId when querying
        conversation = self.conversations.find_one({"_id": conversation_id})
        if conversation:
            # Convert ObjectIds to strings before returning
            return convert_objectids_to_strings(conversation)
        return None

    def update_conversation_evaluation(self, conversation_id: ObjectId, evaluation_data: dict):
        """Update evaluation data for an existing conversation."""
         # Ensure conversation_id is an ObjectId when querying
        result = self.conversations.update_one(
            {"_id": conversation_id},
            {"$set": {"evaluation_data": evaluation_data, "updated_at": datetime.now(timezone.utc)}} # Use timezone-aware datetime
        )
        return result.matched_count > 0

    # Method to save test configuration
    def save_test_configuration(self, config_data: TestConfigurationCreate, created_by: str) -> ObjectId:
        test_config_doc = {
            "product_id": ObjectId(config_data.product_id),
            "category_id": ObjectId(config_data.category_id),
            "visitorPersona": config_data.visitorPersona.model_dump(),
            "additionalCriteria": config_data.additionalCriteria.model_dump(),
            "name": config_data.name,
            "created_by": ObjectId(created_by),
            "created_at": datetime.now(timezone.utc),
            "is_deleted": False  # Add this line
        }
        result = self.test_configurations.insert_one(test_config_doc)
        return result.inserted_id


    # New method to get test configurations by product ID and by current user
    # def get_test_configurations_by_product(self, product_id: ObjectId, user_id: str) -> List[Dict[str, Any]]:
    #     """
    #     Retrieves test configurations for a given product and user_id (string).
    #     Only fetches configurations created by the current user.
    #     """
    #     # Ensure product_id and user_id are ObjectIds when querying
    #     configs_cursor = self.test_configurations.find({
    #         "product_id": product_id,
    #         "created_by": ObjectId(user_id) # Query using ObjectId
    #     })
    #     configs_list = list(configs_cursor)
    #      # Convert ObjectIds to strings before returning
    #     return convert_objectids_to_strings(configs_list)

    # New method to get test configurations by product ID
    def get_test_configurations_by_product(self, product_id: ObjectId) -> List[Dict[str, Any]]:
        """
        Retrieves all non-deleted test configurations for a given product.
        """
        configs_cursor = self.test_configurations.find({
            "product_id": product_id,
            "is_deleted": False  # Add this line
        })
        configs_list = list(configs_cursor)
        return convert_objectids_to_strings(configs_list)

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
            "created_at": datetime.now(timezone.utc), # Use timezone-aware datetime
            "updated_at": datetime.now(timezone.utc),  # Use timezone-aware datetime
            "last_login": None, # Initialize last_login to None
            "sessions": 0, # Initialize sessions to 0
            "active": True # Initialize active to True
        }
        self.users.insert_one(user)
        return True

    def login(self, email: str, password: str):
        print(f"User manager login attempt for email: {email}")
        user = get_user(self.db, email)
        if not user:
            print("User manager login failed: User not found.")
            return None
        if not pwd_context.verify(password, user.hashed_password):
            print("User manager login failed: Incorrect password.")
            return None
        print("User manager login successful.")
        
        # Update last_login timestamp
        self.db.users.update_one(
            {"_id": ObjectId(user.id)}, # Use ObjectId to query by _id
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )

        # Return dictionary representation, ensuring ObjectId _id is stringified if part of the dict
        user_dict = user.model_dump() # Use model_dump() for Pydantic V2
        user_dict['id'] = str(user_dict['id']) # Ensure id is string
        # Remove hashed_password for security before returning
        user_dict.pop('hashed_password', None)
        # Update last_login in the returned dict to the new timestamp
        user_dict['last_login'] = datetime.now(timezone.utc).isoformat() # Return as ISO format string

        return user_dict


    def get_user_id(self, username: str) -> str:
        user = self.users.find_one({"username": username})
        return str(user["_id"]) if user and "_id" in user else None

    def get_user_by_username(self, username: str):
        print(f"DB lookup by username field: {username}")
        return self.users.find_one({"username": username})

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


def generate_customer_question(product_context: str, conversation_history: List[dict], persona: dict) -> str:
    """
    Generate a customer question based on the product context, persona, and conversation history.
    Can generate both initial questions and follow-up questions based on the salesperson's response.
    
    Args:
        product_context: The product documentation context
        conversation_history: List of previous conversation exchanges
        persona: Customer persona details
    
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
        is_follow_up = len(conversation_history) > 0
        
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


Generate a realistic follow-up question that this customer would ask based on the conversation and salesperson's last response. The question should:
1. Be relevant to the previous exchange and salesperson's last response
2. Move the conversation forward
3. Reflect the customer's stage in the buying process
4. Be natural and conversational
5. Not be too specific or technical unless the persona suggests it
6. Show engagement with the salesperson's points

IMPORTANT INSTRUCTIONS:
- Just return the question only, no other text at all.
- Be relevant to the salesperson's last response

Your follow-up question:
"""
        else:
            prompt = f"""{base_prompt}
Generate a realistic initial question that this customer would ask about the product. The question should:
1. Be relevant to the customer's persona and needs
2. Reflect the customer's stage in the buying process
3. Be natural and conversational
4. Not be too specific or technical unless the persona suggests it
5. Set a good foundation for the conversation

IMPORTANT INSTRUCTIONS:
- Just return visitor response, no other text at all. 

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

Just return the question, no other text. Your follow-up question:
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
        "username": user["username"],
        "last_login": user.get("last_login") # Include last_login here
    }

@app.post("/register")
async def register_user(user: UserCreate):
    if user_manager.register(user.username, user.email, user.password, user.role):
        return {"message": "User registered successfully"}
    raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/categories")
async def create_category(category: CategoryCreate, current_user: User = Depends(get_current_user)):
    # Check if a category with the same name already exists and is not deleted
    # Use the db object directly or add a method to DatabaseOperations
    existing_category = db.categories.find_one({"name": category.name, "is_deleted": False})
    if existing_category:
        # If a category with this name exists and is not deleted, return a 400 error
        raise HTTPException(status_code=400, detail="This Category name already exists")

    # If no existing active category with the same name, proceed with creation
    # The db_ops.create_category method should handle the database insertion
    category_id = db_ops.create_category(category.name, current_user.id)

    # You might want to fetch the newly created category to return its details
    # For now, let's keep the original return structure
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
async def soft_delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a category by its ID (set is_deleted=True).
    Only the creator or an admin can delete the category.
    """
    category = db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")

    # Only allow the creator or admin to delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this category.")

    db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {"is_deleted": True}}
    )
    return {"message": "Category soft deleted successfully."}

@app.post("/products")
async def create_product(
    name: str = Form(...),
    category_id: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        pdf_content, metadata = read_pdf(file.file)
        
        # Ensure category_id is ObjectId for storage
        category_obj_id = ObjectId(category_id)

        # Call create_product, passing string user ID (db_ops converts it to ObjectId)
        product_id = db_ops.create_product(
            name=name,
            category_id=category_obj_id,
            pdf_content=pdf_content,
            metadata=metadata,
                created_by=current_user.id,
                description=description,
                is_deleted=False 
        )

    # Fetch the newly created product
        created_product_dict = db.products.find_one({"_id": product_id})
        if created_product_dict:
            return convert_objectids_to_strings(created_product_dict)
        raise HTTPException(status_code=500, detail="Failed to create product")
        
    except HTTPException as e:
        # Re-raise HTTP exceptions (like the duplicate name error)
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")

@app.get("/products/{category_id}")
async def get_products(category_id: str, current_user: User = Depends(get_current_user)):
    """
    Retrieves products for a category, authenticated.
    db_ops.get_products_by_category now handles ObjectId conversion.
    """
    try:
        # Call the updated db_ops method
        products = db_ops.get_products_by_category(ObjectId(category_id))
        # The list 'products' returned by db_ops should now contain only dictionaries
        # with string representations of ObjectIds, which FastAPI can serialize.
        return products
    except Exception as e:
        print(f"Error fetching products for category {category_id}: {e}")
        traceback.print_exc() # Print full traceback for debugging
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@app.websocket("/ws/chat")
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
            product = db_ops.get_product_by_id(product_id)
            if not product:
                await websocket.send_json({"error": "Product not found"})
                await websocket.close()
                return

            # Load test configuration if provided
            persona = {} # Default empty persona
            # additional_criteria_config = None # Default no additional criteria config

            if test_config_id_str:
                 test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id_str)})
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

                product = db_ops.get_product_by_id(ObjectId(product_id_str))
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
                     test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id_str_current)})
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
                 product = db_ops.get_product_by_id(product_id)
                 if not product:
                      await websocket.send_json({"error": "Product not found for final evaluation"})
                      await websocket.close()
                      return

                 # Load test configuration for final evaluation
                 current_persona = {}
                 final_additional_criteria_config = None
                 if test_config_id_str:
                      test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id_str)})
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
                      product = db.products.find_one({"_id": ObjectId(product_id_str)})
                      category = db.categories.find_one({"_id": product["category_id"]})
                      test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id_str)}) if test_config_id_str else None

                      prod_name = product["name"] if product else None
                      cat_name = category["name"] if category else None
                      test_name = test_config["name"] if test_config else None

                      saved_conversation_result = db_ops.save_conversation(
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

    # Manually convert ObjectId fields to string before returning
    if "_id" in conversation:
        conversation["_id"] = str(conversation["_id"])
    if "product_id" in conversation:
        conversation["product_id"] = str(conversation["product_id"])
    if "user_id" in conversation:
        conversation["user_id"] = str(conversation["user_id"])
    # Handle potential ObjectId in evaluation_data
    if "evaluation_data" in conversation and conversation["evaluation_data"] and "test_configuration_id" in conversation["evaluation_data"]:
         if isinstance(conversation["evaluation_data"]["test_configuration_id"], ObjectId):
              conversation["evaluation_data"]["test_configuration_id"] = str(conversation["evaluation_data"]["test_configuration_id"])


    return conversation

# Endpoint to save test configurations
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

@app.get("/test-configurations/{product_id}")
async def get_test_configurations(
    product_id: str,
) -> List[TestConfiguration]:
    """
    Retrieves test configurations for a given product.
    """
    try:
        configs = db_ops.get_test_configurations_by_product(ObjectId(product_id))
        return [TestConfiguration(**config) for config in configs]
    except Exception as e:
        print(f"Error fetching test configurations for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch test configurations")


@app.get("/conversations")
async def get_all_conversations_for_user(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max number of items to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated conversations for the current user (admin gets all).
    Returns total pages as well.
    """
    if current_user.role == "admin":
        base_query = {}
    else:
        base_query = {"user_id": ObjectId(current_user.id)}

    total_count = db.conversations.count_documents(base_query)
    total_pages = ceil(total_count / limit) if total_count > 0 else 1

    conversations_cursor = db.conversations.find(base_query).skip(skip).limit(limit)
    conversations = list(conversations_cursor)
    conversations = convert_objectids_to_strings(conversations)
    return {
        "data": conversations,
        "skip": skip,
        "limit": limit,
        "count": len(conversations),
        "total_count": total_count,
        "total_pages": total_pages
    }

@app.get("/conversation/{conversation_id}")
async def get_conversation_by_id(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific conversation by its ID.
    Returns the conversation data including evaluation results.
    """
    try:
        # Convert string ID to ObjectId
        conversation_obj_id = ObjectId(conversation_id)
        
        # Get conversation from database
        conversation = db_ops.get_conversation_by_id(conversation_obj_id)
        
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
            
        # Check if user has permission to access this conversation
        # Admin can access all conversations, regular users can only access their own
        if current_user.role != "admin" and str(conversation["user_id"]) != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this conversation"
            )
        
        # Convert ObjectId fields to strings for JSON serialization
        if "_id" in conversation:
            conversation["_id"] = str(conversation["_id"])
        if "product_id" in conversation:
            conversation["product_id"] = str(conversation["product_id"])
        if "user_id" in conversation:
            conversation["user_id"] = str(conversation["user_id"])
            
        # Handle potential ObjectId in evaluation_data
        if "evaluation_data" in conversation and conversation["evaluation_data"]:
            if "test_configuration_id" in conversation["evaluation_data"]:
                test_config_id = conversation["evaluation_data"]["test_configuration_id"]
                if isinstance(test_config_id, ObjectId):
                    conversation["evaluation_data"]["test_configuration_id"] = str(test_config_id)
        
        return conversation
        
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID format"
        )
    except Exception as e:
        print(f"Error fetching conversation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching conversation"
        )



@app.get("/test-configurations")
async def get_all_test_configurations(
    current_user: User = Depends(get_current_user)
) -> List[TestConfiguration]:
    """
    Retrieves all non-deleted test configurations created by the current admin user.
    Only admin users are authorized to access this endpoint.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized. Only admin users can access their test configurations."
        )
    
    try:
        configs_cursor = db.test_configurations.find({
            "is_deleted": False  # Add this line
        })
        configs_list = list(configs_cursor)
        configs_list = convert_objectids_to_strings(configs_list)
        return [TestConfiguration(**config) for config in configs_list]
    except Exception as e:
        print(f"Error fetching test configurations for admin {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch test configurations")

@app.put("/products/{product_id}")
async def update_product(
    product_id: str,
    name: str = Form(None),
    description: str = Form(None),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    """
    Update product fields: name, description, and file (PDF).
    Does NOT update category_id.
    """
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if file is not None:
        # Read and process the PDF file as in your create_product endpoint
        pdf_content, metadata = read_pdf(file.file)
        update_data["content"] = pdf_content
        update_data["metadata"] = metadata

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    # Always update the updated_at field
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Return the updated product
    updated_product = db.products.find_one({"_id": ObjectId(product_id)})
    if updated_product:
        updated_product = convert_objectids_to_strings(updated_product)
    return updated_product

@app.put("/test-configurations/{test_config_id}")
async def update_test_configuration(
    test_config_id: str,
    name: str = Body(None),
    visitorPersona: dict = Body(None),
    additionalCriteria: dict = Body(None),
    current_user: User = Depends(get_current_user)
):
    """
    Update name, visitorPersona, and additionalCriteria for a test configuration.
    Only the creator (or admin) can update.
    """
    # Fetch the test config
    test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id)})
    if not test_config:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    # Only allow the creator or admin to update
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this test configuration.")

    update_data = {}
    if name is not None:
        update_data["name"] = name
    if visitorPersona is not None:
        update_data["visitorPersona"] = visitorPersona
    if additionalCriteria is not None:
        update_data["additionalCriteria"] = additionalCriteria

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    update_data["updated_at"] = datetime.now(timezone.utc)

    result = db.test_configurations.update_one(
        {"_id": ObjectId(test_config_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    # Return the updated test configuration
    updated_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id)})
    updated_config = convert_objectids_to_strings(updated_config)
    return updated_config

@app.get("/products")
async def get_products_by_user():
    """
    List all products created by the current logged-in user (irrespective of category).
    """
    try:
        # Find all products where created_by matches the current user's ObjectId
        products_cursor = db.products.find({"is_deleted": False})
        products = list(products_cursor)
        # Convert ObjectId fields to strings for JSON serialization
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            if "category_id" in prod and isinstance(prod["category_id"], ObjectId):
                prod["category_id"] = str(prod["category_id"])
            if "created_by" in prod and isinstance(prod["created_by"], ObjectId):
                prod["created_by"] = str(prod["created_by"])
            if "updated_by" in prod and isinstance(prod["updated_by"], ObjectId):
                prod["updated_by"] = str(prod["updated_by"])
        return products
    except Exception as e:
        print(f"Error fetching products for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products for user")

@app.get("/all-products")
async def get_products_by_user(
    current_user: User = Depends(get_current_user)
):
    """
    List all products created by the current logged-in user (irrespective of category).
    """
    try:
        # Find all products where created_by matches the current user's ObjectId
        products_cursor = db.products.find({})
        products = list(products_cursor)
        # Convert ObjectId fields to strings for JSON serialization
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            if "category_id" in prod and isinstance(prod["category_id"], ObjectId):
                prod["category_id"] = str(prod["category_id"])
            if "created_by" in prod and isinstance(prod["created_by"], ObjectId):
                prod["created_by"] = str(prod["created_by"])
            if "updated_by" in prod and isinstance(prod["updated_by"], ObjectId):
                prod["updated_by"] = str(prod["updated_by"])
        return products
    except Exception as e:
        print(f"Error fetching products for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products for user")

@app.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a product by its ID.
    """
    product = db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Only allow the creator and admin to delete
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this product.")

    db.products.update_one({"_id": ObjectId(product_id)},{"$set": {"is_deleted": True}})
    return {"message": "Product deleted successfully."}

@app.delete("/test-configurations/{test_config_id}")
async def delete_test_configuration(
    test_config_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a test configuration by its ID (set is_deleted=True).
    """
    test_config = db.test_configurations.find_one({"_id": ObjectId(test_config_id)})
    if not test_config:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this test configuration.")

    db.test_configurations.update_one(
        {"_id": ObjectId(test_config_id)},
        {"$set": {"is_deleted": True}}
    )
    return {"message": "Test configuration soft deleted successfully."}

# Get a list of all users (admin only)
@app.get("/api/users")
async def get_users_list(current_user: User = Depends(get_current_user)):
    """
    Get a list of all users (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access the users list")
    users = list(db.users.find({}).sort("created_at", -1))
    # Convert ObjectId fields to strings and remove sensitive info
    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        user.pop("hashed_password", None)
    return users

# Get a specific user (admin only)
@app.get("/api/users/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific user (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access this user")
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    user.pop("hashed_password", None)
    return user

# Create a new user (admin only)
@app.post("/api/users")
async def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new user (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to create users")
    if db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]}):
        raise HTTPException(status_code=400, detail="Username or email already exists")
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_login": datetime.now(timezone.utc),
        "sessions": 0,
        "active": user.active,
    }
    result = db.users.insert_one(user_doc)
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "email": user.email,
        "role": user.role
    }

class Body:
    def __init__(self, *args, **kwargs):
        pass

# Update a user (admin only)
@app.put("/api/users/{user_id}")
async def edit_user(
    user_id: str,
    user_update: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Edit an existing user (admin only).
    Accepts any subset of username, email, password, role.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to edit users")
    update_fields = {}
    if "username" in user_update:
        update_fields["username"] = user_update["username"]
    if "email" in user_update:
        update_fields["email"] = user_update["email"]
    if "role" in user_update:
        update_fields["role"] = user_update["role"]
    if "password" in user_update and user_update["password"]:
        update_fields["password"] = get_password_hash(user_update["password"])
    if "active" in user_update:
        update_fields["active"] = user_update["active"]
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = db.users.find_one({"_id": ObjectId(user_id)})
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    user.pop("hashed_password", None)
    return user

# Delete a user (admin only)
@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to delete users")
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}

# Admin dashboard stats endpoint
@app.get("/api/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    """
    Get admin dashboard stats: total users, active users, sessions completed, average score, products.
    Admin only.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    total_users = db.users.count_documents({})
    active_users = db.users.count_documents({"active": True})
    total_sessions = db.conversations.count_documents({"evaluation_data.is_complete": True})
    # Calculate average score from all conversations (if available)
    scores = []
    for conv in db.conversations.find({}):
        eval_data = conv.get("evaluation_data", {})
        # Try to get score from complete_rating or similar
        complete_rating = eval_data.get("complete_rating", {})
        if isinstance(complete_rating, dict):
            total = complete_rating.get("total", {})
            if isinstance(total, dict) and "score" in total:
                scores.append(total["score"])
    average_score = round(sum(scores) / len(scores), 2) if scores else 0
    total_products = db.products.count_documents({})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "sessions_completed": total_sessions,
        "average_score": average_score,
        "products": total_products,
    }

# Endpoint to get the latest 5 registered users (admin only)
@app.get("/api/admin/latest-users")
async def get_latest_users(current_user: User = Depends(get_current_user)):
    """
    Get the latest 5 registered users (admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = list(db.users.find({}).sort("created_at", -1).limit(5))
    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
        user.pop("hashed_password", None)
    return users

# Endpoint to get the latest 5 completed sessions (admin only)
def convert_object_ids(obj):
    if isinstance(obj, dict):
        return {k: convert_object_ids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_object_ids(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

# Endpoint to get the latest 5 completed sessions with user and product info (admin only)
@app.get("/api/admin/latest-sessions")
async def get_latest_sessions(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    sessions = list(db.conversations.find({"evaluation_data.is_complete": True}).sort("created_at", -1).limit(5))

    for session in sessions:
        # Add user info
        user = db.users.find_one({"_id": session.get("user_id")})
        session["user_name"] = user["username"] if user else "Unknown"

        # Add product info
        product = db.products.find_one({"_id": session.get("product_id")})
        session["product_name"] = product["name"] if product else "Unknown"

        # Add score
        eval_data = session.get("evaluation_data", {})
        complete_rating = eval_data.get("complete_rating", {})
        total = complete_rating.get("total", {})
        session["score"] = total.get("score", None) if isinstance(total, dict) else None

    # Sanitize all ObjectId fields
    return convert_object_ids(sessions)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend-fastapi:app", host="0.0.0.0", port=7070, reload=True) 