from fastapi import APIRouter, HTTPException, Depends
from ....schemas.category import CategoryCreate
from ....services.categories import category_register, list_categories, update_category_process, delete_category_process
from bson import ObjectId
from ....services.auth import verify_bearer_token

router = APIRouter()

@router.post("")
async def create_category(category: CategoryCreate, token = Depends(verify_bearer_token)):
    if category_register(category.name, token):
        return {"message": "Category registered successfully"}
    raise HTTPException(status_code=409, detail="Category already exists")

@router.get("")
async def get_categories( _ = Depends(verify_bearer_token)):
    categories = list(list_categories())
    # Convert ObjectId to string for JSON serialization
    for cat in categories:
        cat["_id"] = str(cat["_id"])
        if 'updated_by' in cat and cat['updated_by'] is not None:
            cat['updated_by'] = str(cat['updated_by'])
        if 'created_by' in cat and cat['created_by'] is not None:
            cat['created_by'] = str(cat['created_by'])
    return categories

@router.put("/{category_id}")
async def update_category(
    category_id: str,
    category: CategoryCreate,
    token = Depends(verify_bearer_token)
):
    updated_category = update_category_process(ObjectId(category_id), category, token)
    if updated_category:
        return {"message":"Category Updated Successfully"}
    raise HTTPException(status_code=404, detail="Caetgory not found or deleted")

@router.delete("/{category_id}")
async def delete_category(category_id: str, token = Depends(verify_bearer_token)):
    deleted_category = delete_category_process(ObjectId(category_id), token)
    if deleted_category:
        return {"message": "Category deleted successfully"}
    raise HTTPException(status_code=404, detail="Category not found")