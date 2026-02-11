
import datetime
from pymongo import MongoClient
from passlib.context import CryptContext
from bson import ObjectId

# Hardcoded settings or read from env if possible, but hardcoded is safer for this one-off
# Reading from config.py might trigger the same import issues if not careful
# I'll try to read from .env manually or just use standard localhost

MONGODB_URL = "mongodb://localhost:27017/"
DATABASE_NAME = "sales"

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]
users = db["users"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

username = "admin"
email = "admin@skillarix.com"
password = "admin123"
role = "admin"

existing = users.find_one({"email": email})

if existing:
    print(f"User {email} already exists.")
    # Update password just in case
    hashed = pwd_context.hash(password)
    users.update_one({"_id": existing["_id"]}, {"$set": {"password": hashed, "hashed_password": hashed}})
    print("Password updated to: admin123")
else:
    hashed = pwd_context.hash(password)
    new_user = {
        "username": username,
        "email": email,
        "password": hashed, # Some legacy code uses 'password', some 'hashed_password'
        "hashed_password": hashed, 
        "role": role,
        "active": True,
        "is_deleted": False,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    users.insert_one(new_user)
    print(f"User {email} created with password: admin123")
    
print("--- SUCCESS ---")
