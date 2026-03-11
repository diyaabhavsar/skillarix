
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load .env
load_dotenv('backend/.env')

url = os.getenv("MONGODB_URL")
db_name = os.getenv("DATABASE_NAME")

print(f"Testing connection to: {url}")

try:
    client = MongoClient(url, serverSelectionTimeoutMS=2000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("Connection Successful!")
    
    # Check if database exists
    dbs = client.list_database_names()
    if db_name in dbs:
        print(f"Database '{db_name}' found.")
    else:
        print(f"Database '{db_name}' not found (it will be created when you write data).")
        
except Exception as e:
    print(f"Connection Failed: {e}")
