from fastapi import APIRouter, Depends, HTTPException, Body
from ....services.auth import verify_bearer_token, get_password_hash
from ....schemas.user import UserCreate
from ....services.user import register, convert_object_ids
from ....database import db
from bson import ObjectId
from datetime import timezone, datetime

user_collection = db["users"]
conversation_collection = db["conversations"]
product_collection = db["products"]


router = APIRouter()

@router.post("")
async def register_user(user: UserCreate):
    if register(user.username, user.email, user.password, user.role, user.active):
        return {"message": "User registered successfully"}
    raise HTTPException(status_code=409, detail="Username or email already exists")

@router.get("")
async def get_users_list(token = Depends(verify_bearer_token)):
    """
    Get a list of all users (admin only).
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access the users list")
    users = list(user_collection.find({"is_deleted": False}).sort("created_at", -1))
    # Convert ObjectId fields to strings and remove sensitive info
    for user in users:
        user["_id"] = str(user["_id"])
        if 'updated_by' in user and user['updated_by'] is not None:
                user['updated_by'] = str(user['updated_by'])
        user.pop("password", None)
        user.pop("hashed_password", None)
    return users

@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Get a specific user (admin only).
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to access this user")
    user = user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    user.pop("hashed_password", None)
    return user

@router.put("/{user_id}")
async def edit_user(
    user_id: str,
    user_update: dict = Body(...),
    token = Depends(verify_bearer_token)
):
    """
    Edit an existing user (admin only).
    Accepts any subset of username, email, password, role.
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to edit users")
    update_fields = {}
    if "username" in user_update:
        update_fields["username"] = user_update["username"]
    if "email" in user_update:
        update_fields["email"] = user_update["email"]
    if "role" in user_update:
        update_fields["role"] = user_update["role"]
    if "password" in user_update and user_update["password"]:
        update_fields["password"] = get_password_hash(user_update["password"])
    if "active" in user_update:
        update_fields["active"] = user_update["active"]
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    update_fields["updated_at"] = datetime.now()
    result = user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_collection.find_one({"_id": ObjectId(user_id)})
    print(user)
    user["_id"] = str(user["_id"])
    if 'updated_by' in user and user['updated_by'] is not None:
        user['updated_by'] = str(user['updated_by'])
    user.pop("password", None)
    user.pop("hashed_password", None)
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Delete a user (admin only).
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="You don't have permission to delete users")
    result = user_collection.update_one({"_id": ObjectId(user_id)},{"$set": {"is_deleted": True}})
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted"}

@router.get("/admin/stats")
async def get_admin_stats(token = Depends(verify_bearer_token)):
    """
    Get admin dashboard stats: total users, active users, sessions completed, average score, products.
    Admin only.
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    total_users = user_collection.count_documents({})
    active_users = user_collection.count_documents({"active": True})
    total_sessions = conversation_collection.count_documents({"evaluation_data.is_complete": True})
    # Calculate average score from all conversations (if available)
    scores = []
    for conv in conversation_collection.find({}):
        eval_data = conv.get("evaluation_data", {})
        # Try to get score from complete_rating or similar
        complete_rating = eval_data.get("complete_rating", {})
        if isinstance(complete_rating, dict):
            total = complete_rating.get("total", {})
            if isinstance(total, dict) and "score" in total:
                scores.append(total["score"])
    average_score = round(sum(scores) / len(scores), 2) if scores else 0
    total_products = product_collection.count_documents({})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "sessions_completed": total_sessions,
        "average_score": average_score,
        "products": total_products,
    }

@router.get("/admin/latest-users")
async def get_latest_users(token = Depends(verify_bearer_token)):
    """
    Get the latest 5 registered users (admin only).
    """
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = list(user_collection.find({}).sort("created_at", -1).limit(5))
    for user in users:
        user["_id"] = str(user["_id"])
        if 'updated_by' in user and user['updated_by'] is not None:
            user['updated_by'] = str(user['updated_by'])
        user.pop("password", None)
        user.pop("hashed_password", None)
    return users

@router.get("/admin/latest-sessions")
async def get_latest_sessions(token = Depends(verify_bearer_token)):
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    sessions = list(conversation_collection.find({"evaluation_data.is_complete": True}).sort("created_at", -1).limit(5))

    for session in sessions:
        # Add user info
        user = user_collection.find_one({"_id": session.get("user_id")})
        session["user_name"] = user["username"] if user else "Unknown"

        # Add product info
        product = product_collection.find_one({"_id": session.get("product_id")})
        session["product_name"] = product["name"] if product else "Unknown"

        # Add score
        eval_data = session.get("evaluation_data", {})
        complete_rating = eval_data.get("complete_rating", {})
        total = complete_rating.get("total", {})
        session["score"] = total.get("score", None) if isinstance(total, dict) else None

    # Sanitize all ObjectId fields
    return convert_object_ids(sessions)
