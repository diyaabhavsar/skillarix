import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

try:
    from app.config import settings
    from pymongo import MongoClient
    
    print(f"--- DIAGNOSTICS ---")
    print(f"DB Name: {settings.DATABASE_NAME}")
    
    # Simple masking
    url = settings.MONGODB_URL
    if "@" in url:
        masked_url = url.split("@")[1]
    else:
        masked_url = url
    print(f"Connecting to: ...@{masked_url}")

    client = MongoClient(url, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]
    
    print("Attempting to list collections...")
    collections = db.list_collection_names()
    print(f"Collections found: {collections}")
    
    if "products" in collections:
        count = db.products.count_documents({})
        print(f"Products count: {count}")
    else:
        print("Products collection NOT found.")
        
except Exception as e:
    print(f"ERROR: {e}")
