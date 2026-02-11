
import bcrypt
import datetime
from pymongo import MongoClient

# CONNECT
MONGODB_URL = "mongodb://localhost:27017/"
DATABASE_NAME = "sales"
client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]
users = db["users"]

# CREDENTIALS
email = "admin@skillarix.com"
password_raw = "admin123"

# HASHING
# passlib's BCrypt context basically does this:
salt = bcrypt.gensalt(rounds=12)
hashed_bytes = bcrypt.hashpw(password_raw.encode('utf-8'), salt)
hashed_str = hashed_bytes.decode('utf-8')

# UPSERT
existing = users.find_one({"email": email})
if existing:
    users.update_one(
        {"_id": existing["_id"]}, 
        {"$set": {
            "password": hashed_str, 
            "hashed_password": hashed_str,
            "role": "admin",
            "active": True
        }}
    )
    print(f"Updated user {email}")
else:
    new_user = {
        "username": "admin",
        "email": email,
        "password": hashed_str,
        "hashed_password": hashed_str,
        "role": "admin",
        "active": True,
        "is_deleted": False,
        "created_at": datetime.datetime.utcnow(),
        "updated_at": datetime.datetime.utcnow()
    }
    users.insert_one(new_user)
    print(f"Created user {email}")

print(f"Password set to: {password_raw}")
