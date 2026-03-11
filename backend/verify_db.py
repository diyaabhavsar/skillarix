import sys
import os
from pymongo import MongoClient
import json
from bson import ObjectId

# Add current directory to path
sys.path.append(os.getcwd())

from app.config import settings

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return str(o)

try:
    print(f"Connecting to {settings.MONGODB_URL}")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    print(f"Database: {settings.DATABASE_NAME}")
    
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    
    for col_name in collections:
        count = db[col_name].count_documents({})
        print(f"Collection '{col_name}' count: {count}")
        if count > 0:
            doc = db[col_name].find_one()
            print(f"Sample from '{col_name}': {json.dumps(doc, cls=JSONEncoder, indent=2)}")

except Exception as e:
    print(f"Error: {e}")
