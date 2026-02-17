from app.database import db
from bson import ObjectId
import asyncio
import datetime

async def verify_leaderboard():
    print("--- VERIFYING LEADERBOARD ---")
    
    # Logic from services/gamification.py
    admin_users_cursor = db["users"].find({"role": "admin"}, {"_id": 1})
    admin_ids = []
    for admin in admin_users_cursor:
        admin_id = admin["_id"]
        admin_ids.append(admin_id) # ObjectId
        if isinstance(admin_id, ObjectId):
            admin_ids.append(str(admin_id)) # String
        else:
             try:
                 admin_ids.append(ObjectId(admin_id)) 
             except:
                 pass
    
    print(f"Exclude Admins: {len(admin_ids)}")
    
    query = {"user_id": {"$nin": admin_ids}}
    cursor = db["user_points"].find(query).sort("total_xp", -1).limit(10)
    results = list(cursor)
    
    print(f"Found {len(results)} entries in leaderboard:")
    for r in results:
        print(f"User: {r['user_id']} | XP: {r['total_xp']}")

if __name__ == "__main__":
    asyncio.run(verify_leaderboard())
