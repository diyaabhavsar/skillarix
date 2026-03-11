from app.database import db
from app.models.user import User
from bson import ObjectId
import asyncio

async def debug_gamification():
    print("--- DEBUGGING GAMIFICATION ---")
    
    # 1. List all users and their roles
    print("\n1. USERS:")
    users = list(db["users"].find())
    for u in users:
        print(f"ID: {u['_id']} (Type: {type(u['_id'])}) | Username: {u.get('username')} | Role: {u.get('role')}")

    # 2. List all points
    print("\n2. USER POINTS:")
    points = list(db["user_points"].find())
    for p in points:
        print(f"User ID: {p['user_id']} (Type: {type(p['user_id'])}) | Total XP: {p['total_xp']}")

    # 3. Simulate Leaderboard Query logic
    print("\n3. LEADERBOARD QUERY SIMULATION:")
    
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
    
    print(f"Admin IDs to exclude: {admin_ids}")
    
    query = {"user_id": {"$nin": admin_ids}}
    print(f"Query: {query}")
    
    cursor = db["user_points"].find(query).sort("total_xp", -1).limit(10)
    results = list(cursor)
    print(f"Found {len(results)} entries in leaderboard:")
    for r in results:
        print(r)

if __name__ == "__main__":
    asyncio.run(debug_gamification())
