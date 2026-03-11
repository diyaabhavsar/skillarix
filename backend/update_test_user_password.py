
"""
Helper script to update test user password and verify hashing scheme.
"""
import sys
import os
from passlib.context import CryptContext
from datetime import datetime

# Add parent directory to path
sys.path.append(os.getcwd())

from app.database import db

# Ensure consistent scheme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_password():
    users_collection = db["users"]
    email = "new_sales@skillarix.com"
    password = "password123"
    
    user = users_collection.find_one({"email": email})
    if not user:
        print(f"❌ User {email} not found!")
        return

    hashed_password = pwd_context.hash(password)
    
    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}, "$unset": {"hashed_password": ""}}
    )

    print(f"✅ Updated password for {email} (stored in 'password' field)")
    print(f"🔑 New Password: {password}")
    
    # Verify immediately
    updated_user = users_collection.find_one({"email": email})
    is_valid = pwd_context.verify(password, updated_user["password"])
    print(f"🕵️ Verification check: {'SUCCESS' if is_valid else 'FAILED'}")

if __name__ == "__main__":
    update_password()
