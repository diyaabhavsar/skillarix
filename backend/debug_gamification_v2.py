from app.database import db
from bson import ObjectId
import asyncio
import json
from datetime import datetime

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

async def debug_gamification():
    output = []
    output.append("--- DEBUGGING GAMIFICATION ---")
    
    # 1. List all users and their roles
    output.append("\n1. USERS:")
    users = list(db["users"].find())
    for u in users:
        output.append(f"ID: {u['_id']} (Type: {type(u['_id'])}) | Username: {u.get('username')} | Role: {u.get('role')}")

    # 2. List all points
    output.append("\n2. USER POINTS:")
    points = list(db["user_points"].find())
    for p in points:
        output.append(f"User ID: {p['user_id']} (Type: {type(p['user_id'])}) | Total XP: {p['total_xp']}")

    # 2.5 Badges and Transactions
    output.append("\n2.5 BADGES & TRANSACTIONS:")
    badges = list(db["user_badges"].find())
    for b in badges:
        output.append(f"Badge: User {b['user_id']} got badge {b['badge_id']}")
        
    txs = list(db["points_transactions"].find())
    for tx in txs:
         output.append(f"TX: User {tx['user_id']} +{tx['amount']} XP for {tx.get('reason')}")

    # 2.6 Conversations
    output.append("\n2.6 CONVERSATIONS:")
    sales_user_id = "698c619cb08f6a0985c46cba"
    conv_count = db["conversations"].count_documents({"user_id": ObjectId(sales_user_id)})
    del_count = db["conversations"].count_documents({"user_id": ObjectId(sales_user_id), "is_deleted": True})
    output.append(f"Conversations for sales_user ({sales_user_id}): {conv_count} (Deleted: {del_count})")

    # 2.7 Milestones
    output.append("\n2.7 MILESTONES:")
    milestones = list(db["milestones"].find({"is_active": True}))
    for m in milestones:
        output.append(f"Milestone: {m['name']} (Cat: {m['category']}, Target: {m['target_value']}, XP: {m['reward_xp']})")

    # 2.8 User Milestones
    output.append("\n2.8 USER MILESTONES:")
    ums = list(db["user_milestones"].find({"user_id": sales_user_id}))
    for um in ums:
        output.append(str(um))

    # 4. Attempt SYNC
    output.append("\n4. SYNC ATTEMPT:")
    
    # RESET MILESTONE AGAIN (Just in case it was set to True in previous failed run)
    output.append("Resetting completion status of 'Beginner Trainer' AGAIN...")
    beginner_ms = db["milestones"].find_one({"name": "Beginner Trainer"})
    if beginner_ms:
        ms_id = str(beginner_ms["_id"])
        # Reset completed AND current value to force update
        db["user_milestones"].update_one(
            {"user_id": sales_user_id, "milestone_id": ms_id},
            {"$set": {"is_completed": False, "current_value": 0}}
        )
        output.append(f"Reset milestone {ms_id} for user (is_completed=False, current_value=0).")

    # Convert print to append to output
    import sys
    from io import StringIO
    old_stdout = sys.stdout
    sys.stdout = mystdout = StringIO()

    output.append("\n4. SYNC ATTEMPT:")
    from app.services.gamification import sync_user_gamification
    try:
        await sync_user_gamification(sales_user_id)
        output.append("Sync completed successfully.")
        
        # Capture stdout
        sys.stdout = old_stdout
        output.append("--- STDOUT CAPTURE ---")
        output.append(mystdout.getvalue())
        output.append("----------------------")
        
        # Check points again
        p = db["user_points"].find_one({"user_id": sales_user_id})
        output.append(f"Post-Sync Total XP: {p['total_xp']}")
        
        # Check transactions
        last_tx = db["points_transactions"].find_one({"user_id": sales_user_id}, sort=[("_id", -1)])
        output.append(f"Last Transaction: {last_tx}")

    except Exception as e:
        output.append(f"Sync failed: {e}")
        import traceback
        output.append(traceback.format_exc())

    with open("debug_results.log", "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    print("Debug results written to debug_results.log")

if __name__ == "__main__":
    asyncio.run(debug_gamification())
