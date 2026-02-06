import sys
import os
import datetime
from bson import ObjectId
from passlib.context import CryptContext

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.config import settings
    from pymongo import MongoClient

    print("Connecting to DB...")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Collections
    users = db["users"]
    categories = db["categories"]
    products = db["products"]
    test_configs = db["test_configurations"]
    prompts = db["prompts"]

    print("--- SEEDING DATA ---")

    # 1. Seed User
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    admin_email = "admin@example.com"
    if not users.find_one({"email": admin_email}):
        print("Creating admin user...")
        hashed_password = pwd_context.hash("admin123")
        user_data = {
            "username": "Admin User",
            "email": admin_email,
            "password": hashed_password,
            "role": "admin",
            "sessions": 0,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now(),
            "active": True,
            "last_login": datetime.datetime.now(),
            "is_deleted": False,
            "updated_by": None
        }
        users.insert_one(user_data)
        print(f"User created: {admin_email} / admin123")
    else:
        print("Admin user already exists.")

    admin_user = users.find_one({"email": admin_email})
    admin_id = str(admin_user["_id"])

    # 2. Seed Category
    cat_name = "Smart Devices"
    if not categories.find_one({"name": cat_name}):
        print(f"Creating category: {cat_name}...")
        cat_data = {
            "name": cat_name,
            "created_by": admin_id,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now(),
            "is_deleted": False,
            "updated_by": None
        }
        res = categories.insert_one(cat_data)
        cat_id = str(res.inserted_id)
        print(f"Category created: {cat_id}")
    else:
        cat = categories.find_one({"name": cat_name})
        cat_id = str(cat["_id"])
        print(f"Category exists: {cat_id}")

    # 3. Seed Product
    prod_name = "AI Home Assistant"
    if not products.find_one({"name": prod_name}):
        print(f"Creating product: {prod_name}...")
        prod_data = {
            "name": prod_name,
            "category_id": ObjectId(cat_id),
            "created_by": admin_id,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now(),
            "metadata": {"version": "1.0"},
            "description": "A smart home assistant that helps you manage your daily tasks using AI.",
            "content": "The AI Home Assistant is a voice-controlled device that integrates with your smart home ecosystem. It features natural language processing to understand complex commands, manages schedules, plays music, and controls lights and thermostats. Key selling points include its privacy-first design, local processing capabilities, and compatibility with over 10,000 devices. Objection handling: If customer asks about privacy, emphasize the physical mute switch and local data processing.",
            "is_deleted": False
        }
        res = products.insert_one(prod_data)
        prod_id = str(res.inserted_id)
        print(f"Product created: {prod_id}")
    else:
        prod = products.find_one({"name": prod_name})
        prod_id = str(prod["_id"])
        print(f"Product exists: {prod_id}")

    # 4. Seed Test Configuration
    config_name = "Default Tech Enthusiast"
    if not test_configs.find_one({"name": config_name}):
        print(f"Creating test config: {config_name}...")
        config_data = {
            "name": config_name,
            "product_id": ObjectId(prod_id),
            "visitorPersona": {
                "background": "Tech-savvy millennial looking for convenience.",
                "pain_points": "Too many apps to manage smart devices.",
                "goals": "Centralize home control.",
                "technical_knowledge": "High",
                "budget_sensitivity": "Medium",
                "decision_authority": "Sole decision maker",
                "previous_experience": "Used various smart plugs."
            },
            "additionalCriteria": {
                "distraction_handling": True,
                "communication_simplicity": True
            },
            "created_by": admin_id,
            "created_at": datetime.datetime.now()
        }
        test_configs.insert_one(config_data)
        print("Test configuration created.")
    else:
        print("Test configuration exists.")
        
    print("Seed complete successfully.")

except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"ERROR: {e}")
