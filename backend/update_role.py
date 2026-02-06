import sys
import os
from pymongo import MongoClient

sys.path.append(os.getcwd())
from app.config import settings

try:
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_col = db["users"]
    
    target_email = "diyabhavsar30@gmail.com"
    
    user = users_col.find_one({"email": target_email})
    if user:
        print(f"Found user: {user.get('username')} with role: {user.get('role')}")
        users_col.update_one({"email": target_email}, {"$set": {"role": "admin"}})
        print(f"Updated {target_email} to role: admin")
    else:
        print(f"User {target_email} not found.")

except Exception as e:
    print(e)
