from fastapi import HTTPException
from datetime import datetime
from ..database import db
from bson import ObjectId

category_collection = db["categories"]

def category_register(name: str, token: str):
    if category_collection.find_one({"name": name}):
        # If a category with this name exists and is not deleted, return a 400 error
        raise HTTPException(status_code=409, detail="This Category name already exists")
    category = {
        "name": name,
        "created_by": ObjectId(token["id"]),
        "updated_by": ObjectId(token["id"]),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "is_deleted": False
    }
    category_collection.insert_one(category)
    return True

def list_categories():
    data = category_collection.find({"is_deleted": False})
    return data

def update_category_process(category_id, category, token):
    updated_category = category_collection.update_one(
                {"_id": category_id, "is_deleted": False},
                {
                    "$set": {
                        "name": category.name,
                        "updated_at": datetime.now(),
                        "updated_by": ObjectId(token["id"])
                    }
                })
    return updated_category

def delete_category_process(category_id, token):
    deleted_category = category_collection.update_one(
            {"_id": category_id},
            {
                "$set": {
                    "is_deleted": True,
                    "updated_at": datetime.now(),
                    "updated_by": ObjectId(token["id"])
                }
            })
    return deleted_category