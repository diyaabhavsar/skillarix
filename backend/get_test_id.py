
from pymongo import MongoClient
from app.config import settings
from bson import ObjectId

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
config = db.test_configurations.find_one()

if config:
    print(f"Valid Test Config ID: {config['_id']}")
else:
    print("No test configuration found. Please seed data.")
