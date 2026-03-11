import sys
import os
import datetime
from bson import ObjectId

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.config import settings
    from pymongo import MongoClient

    print("Connecting to DB...")
    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    # Collections
    products = db["products"]
    test_configs = db["test_configurations"]
    users = db["users"]

    print("--- SEEDING DYNAMIC PERSONAS ---")

    # 1. Get Product (Assuming "AI Home Assistant" exists from seed_data.py)
    # You can change this name if you are using a different product
    product_name = "AI Home Assistant"
    product = products.find_one({"name": product_name})
    
    if not product:
        print(f"Product '{product_name}' not found. Please run seed_data.py first or update the product name.")
        sys.exit(1)
        
    product_id = product["_id"]
    print(f"Found Product: {product_name} ({product_id})")

    # 2. Get Admin User for "created_by" field
    admin_user = users.find_one({"role": "admin"})
    admin_id = str(admin_user["_id"]) if admin_user else None

    # 3. Define Dynamic Personas
    personas_to_seed = [
        {
            "name": "Skeptical CTO (Security Focus)",
            "visitorPersona": {
                "name": "Dr. Sarah Jenkins",
                "visitor_type": "CTO of a FinTech Setup",
                "background": "20 years in software architecture. Highly skeptical of cloud solutions.",
                "pain_points": "Data breaches, compliance (GDPR/SOC2), and messy API integrations.",
                "goals": "Ensure 100% on-premise data control and seamless legacy integration.",
                "technical_knowledge": "High (Expert)",
                "budget_sensitivity": "Low (Quality first)",
                "decision_authority": "Final Decision Maker",
                "behavior": "Ask tough technical questions. Challenge claims about security."
            },
            "additionalCriteria": {
                "distraction_handling": True,
                "communication_simplicity": False
            }
        },
        {
            "name": "Busy Small Business Owner (Speed Focus)",
            "visitorPersona": {
                "name": "Mark Miller",
                "visitor_type": "Restaurant Owner",
                "background": "Non-technical, runs 3 busy locations. Stressed and hurried.",
                "pain_points": "Staff wasting time on administrative tasks. Current tools are too complex.",
                "goals": "Find a 'plug-and-play' solution I can set up in 10 minutes.",
                "technical_knowledge": "Low (Beginner)",
                "budget_sensitivity": "High (Needs clear ROI)",
                "decision_authority": "Sole Owner",
                "behavior": "Impatient. Asks 'how much?' and 'how fast?' repeatedly. Dislikes jargon."
            },
            "additionalCriteria": {
                "distraction_handling": False,
                "communication_simplicity": True
            }
        },
        {
            "name": "Corporate Procurement Manager (feature & support focus)",
            "visitorPersona": {
                "name": "Elena Rodriguez",
                "visitor_type": "Procurement Manager",
                "background": "Buying for a 500-person office. Focuses on support SLAs and bulk pricing.",
                "pain_points": "Vendor lock-in and poor customer support experiences.",
                "goals": "Negotiate a long-term contract with guaranteed 24/7 support.",
                "technical_knowledge": "Medium (knows buzzwords but not implementation)",
                "budget_sensitivity": "Medium (Looking for value/discounts)",
                "decision_authority": "Influencer (Recommends to CEO)",
                "behavior": "Professional, polite, but focused on contract terms and support guarantees."
            }
        }
    ]

    # 4. Insert Personas
    for p in personas_to_seed:
        config_name = p["name"]
        
        # Check if exists to avoid duplicates
        existing = test_configs.find_one({"name": config_name, "product_id": product_id})
        
        config_data = {
            "name": config_name,
            "product_id": product_id,
            "visitorPersona": p["visitorPersona"],
            "additionalCriteria": p.get("additionalCriteria", {}),
            "created_by": admin_id,
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now(),
            "is_deleted": False
        }

        if existing:
            print(f"Updating existing persona: {config_name}")
            test_configs.update_one({"_id": existing["_id"]}, {"$set": config_data})
        else:
            print(f"Creating new persona: {config_name}")
            test_configs.insert_one(config_data)

    print("\n--- SEEDING COMPLETE ---")
    print(f"Successfully seeded {len(personas_to_seed)} dynamic personas.")

except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"ERROR: {e}")
