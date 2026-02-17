
"""
Helper script to create a new test user for testing leaderboard and gamification.
"""
import sys
import os
from passlib.context import CryptContext
from datetime import datetime

# Add parent directory to path
sys.path.append(os.getcwd())

from app.database import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user():
    users_collection = db["users"]
    
    email = "new_sales@skillarix.com"
    password = "password123"
    username = "New Sales Person"
    role = "salesman"
    
    # Check if exists
    if users_collection.find_one({"email": email}):
        print(f"❌ User {email} already exists!")
        return

    hashed_password = pwd_context.hash(password)
    
    new_user = {
        "email": email,
        "hashed_password": hashed_password,
        "username": username,
        "full_name": username,
        "role": role,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(new_user)
    print(f"✅ Created user: {email}")
    print(f"🆔 ID: {result.inserted_id}")
    print(f"🔑 Password: {password}")
    print("\nYou can now login with these credentials to test the leaderboard!")

if __name__ == "__main__":
    create_user()
