from app.database import db
import json
from bson import ObjectId

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

def list_users():
    users = list(db["users"].find({"is_deleted": {"$ne": True}}))
    cleaned_users = []
    for u in users:
        cleaned_users.append({
            "id": str(u["_id"]),
            "username": u.get("username"),
            "email": u.get("email"),
            "role": u.get("role")
        })
    print(json.dumps(cleaned_users, indent=2))

if __name__ == "__main__":
    list_users()
