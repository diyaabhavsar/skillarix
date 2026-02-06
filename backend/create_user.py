"""
Quick script to create a test user in MongoDB
"""
import sys
sys.path.append('.')

from app.database import db
from app.services.auth import get_password_hash
from datetime import datetime

# User details
username = "admin"
email = "admin@skillarix.com"
password = "admin123"
role = "admin"

# Check if user exists
user_collection = db["users"]
existing_user = user_collection.find_one({"$or": [{"username": username}, {"email": email}]})

if existing_user:
    print(f"✅ User already exists!")
    print(f"   Username: {existing_user.get('username')}")
    print(f"   Email: {existing_user.get('email')}")
    print(f"   Role: {existing_user.get('role')}")
else:
    # Create new user
    hashed_password = get_password_hash(password)
    
    new_user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role,
        "active": True,
        "is_deleted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = user_collection.insert_one(new_user)
    print(f"✅ User created successfully!")
    print(f"   Username: {username}")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"   Role: {role}")

print("\n📋 Login Credentials:")
print(f"   Username: {username}")
print(f"   Password: {password}")
