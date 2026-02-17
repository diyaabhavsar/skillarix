"""
Script to create a Salesman user with specific permissions:
- Taking tests (Start Training)
- Viewing assessment history (Own Sessions)
- Individual Dashboard (Own Analytics)
"""
import sys
import os
# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.database import db
from app.services.auth import get_password_hash
from datetime import datetime

# Salesman User Details
USERNAME = "sales_user"
EMAIL = "sales@skillarix.com"
PASSWORD = "sales123"
ROLE = "salesman"

def create_salesman():
    print(f"-------- CREATING SALESMAN USER --------")
    print(f"Target Role: {ROLE}")
    print(f"Permissions: Taking Tests, History, Personal Dashboard")
    
    users_collection = db["users"]
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": EMAIL})
    
    if existing_user:
        print(f"⚠️ User {EMAIL} already exists.")
        # Update role to salesman if it's not
        if existing_user.get("role") != ROLE:
            users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"role": ROLE}}
            )
            print(f"✅ Updated existing user role to '{ROLE}'")
        else:
            print(f"✅ User already has '{ROLE}' role.")
    else:
        # Create new salesman user
        new_user = {
            "username": USERNAME,
            "email": EMAIL,
            "password": get_password_hash(PASSWORD),
            "role": ROLE,
            "active": True,
            "is_deleted": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "sessions": 0,
            "last_login": None
        }
        
        users_collection.insert_one(new_user)
        print(f"✅ Successfully created new salesman user!")

    print(f"\n-------- LOGIN CREDENTIALS --------")
    print(f"📧 Email:    {EMAIL}")
    print(f"🔑 Password: {PASSWORD}")
    print(f"🎭 Role:     {ROLE}")
    print(f"-----------------------------------")

if __name__ == "__main__":
    try:
        create_salesman()
    except Exception as e:
        print(f"❌ Error: {e}")
