import sys
import os
from passlib.context import CryptContext
from pymongo import MongoClient

sys.path.append(os.getcwd())
from app.config import settings

def test_login(email, plain_password):
    print(f"Testing login for: {email} with password: {plain_password}")
    
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users = db["users"]
    
    user = users.find_one({"email": email})
    if not user:
        print("User NOT found in DB.")
        return
        
    print(f"User found: {user.get('username')}")
    stored_hash = user.get("password")
    print(f"Stored hash prefix: {stored_hash[:10] if stored_hash else 'None'}")
    
    if not stored_hash:
        print("No password hash stored for user.")
        return

    if pwd_context.verify(plain_password, stored_hash):
        print("SUCCESS: Password verified!")
    else:
        print("FAILURE: Password verification failed.")

if __name__ == "__main__":
    test_login("diyabhavsar30@gmail.com", "password123")
