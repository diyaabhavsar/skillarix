import sys
import os
from pymongo import MongoClient
from passlib.context import CryptContext

sys.path.append(os.getcwd())
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_col = db["users"]
    
    target_email = "diyabhavsar30@gmail.com"
    new_password = "password123"
    
    hashed_password = pwd_context.hash(new_password)
    
    result = users_col.update_one(
        {"email": target_email}, 
        {"$set": {"password": hashed_password}}
    )
    
    if result.matched_count > 0:
        print(f"Password for {target_email} has been reset to: {new_password}")
    else:
        print(f"User {target_email} not found.")

except Exception as e:
    print(f"Error: {e}")
