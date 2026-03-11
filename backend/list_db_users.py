from app.database import db
def list_users():
    users = list(db["users"].find({"is_deleted": {"$ne": True}}))
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u['_id']}, Username: {u.get('username')}, Email: {u.get('email')}, Role: {u.get('role')}")

if __name__ == "__main__":
    list_users()
