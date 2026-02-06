import sys
import os
from pymongo import MongoClient
import json
from bson import ObjectId

sys.path.append(os.getcwd())
from app.config import settings

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return str(o)

try:
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_col = db["users"]
    
    print("Listing all users:")
    for user in users_col.find({}, {"username": 1, "email": 1, "role": 1}):
        print(f"User: {user.get('username')} | Email: {user.get('email')} | Role: {user.get('role')}")

except Exception as e:
    print(e)
