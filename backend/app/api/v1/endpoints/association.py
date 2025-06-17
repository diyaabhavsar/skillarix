from fastapi import APIRouter, HTTPException, Depends
from ....database import db
from ....services.auth import verify_bearer_token
from ....services.association import check_associations
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

user_collection = db["users"]
conversation_collection = db["conversations"]
product_collection = db["products"]


@router.get("/{type}/{type_id}")
async def get_associations(
    type: str,
    type_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Check associations for a category, product, or test_configuration by ID.
    """
    try:
        obj_id = ObjectId(type_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format.")

    # Check if the entity exists
    collection_map = {
        "category": db["categories"],
        "product": db["products"],
        "test_configuration": db["test_configurations"]
    }
    collection = collection_map.get(type.lower())
    if collection is None:
        raise HTTPException(status_code=400, detail="Invalid type provided. Supported types: category, product, test_configuration.")

    entity = collection.find_one({"_id": obj_id, "is_deleted": False})
    if not entity:
        return {"message": f"The {type} does not exist with id {type_id}"}

    association_message = check_associations(type.lower(), obj_id, db)
    return association_message