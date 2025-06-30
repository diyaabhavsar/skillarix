from fastapi import APIRouter,UploadFile, File, Form, Depends, HTTPException
from ....services.product import read_pdf, create_product_process, list_products_category_wise
from ....services.auth import verify_bearer_token
from ....services.test_configuration import convert_objectids_to_strings
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from ....database import db
import os


product_collection = db["products"]

router = APIRouter()

@router.get("")
async def get_products_by_user(token = Depends(verify_bearer_token)):
    """
    List all products created by the current logged-in user (irrespective of category).
    """
    try:
        # Find all products where created_by matches the current user's ObjectId
        products_cursor = product_collection.find({"is_deleted": False})
        products = list(products_cursor)
        # Convert ObjectId fields to strings for JSON serialization
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            if "category_id" in prod and isinstance(prod["category_id"], ObjectId):
                prod["category_id"] = str(prod["category_id"])
            if "created_by" in prod and isinstance(prod["created_by"], ObjectId):
                prod["created_by"] = str(prod["created_by"])
            if "updated_by" in prod and isinstance(prod["updated_by"], ObjectId):
                prod["updated_by"] = str(prod["updated_by"])
            if "file_url" in prod:
                prod["file_url"] = os.getenv('BACKEND_URL') + prod["file_url"]
        return products
    except Exception as e:
        print(f"Error fetching products for user {token['id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products for user")

@router.get("/all")
async def get_products_by_user(
    token = Depends(verify_bearer_token)
):
    """
    List all products created by the current logged-in user (irrespective of category).
    """
    try:
        # Find all products where created_by matches the current user's ObjectId
        products_cursor = product_collection.find({})
        products = list(products_cursor)
        # Convert ObjectId fields to strings for JSON serialization
        for prod in products:
            if "_id" in prod:
                prod["_id"] = str(prod["_id"])
            if "category_id" in prod and isinstance(prod["category_id"], ObjectId):
                prod["category_id"] = str(prod["category_id"])
            if "created_by" in prod and isinstance(prod["created_by"], ObjectId):
                prod["created_by"] = str(prod["created_by"])
            if "updated_by" in prod and isinstance(prod["updated_by"], ObjectId):
                prod["updated_by"] = str(prod["updated_by"])
        return products
    except Exception as e:
        print(f"Error fetching products for user {token['id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products for user")
@router.post("")
async def create_product(
    name: str = Form(...),
    category_id: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    file_name: str = Form(...),
    file_url: str = Form(...),
    token = Depends(verify_bearer_token)):
        pdf_content, metadata = read_pdf(file.file)
        created_product = create_product_process(name, category_id, pdf_content, metadata, token, description, file_name, file_url)
        return {"message":"Products Added Successfully", "new_product": created_product}

@router.get("/{category_id}")
async def get_products(category_id: str, _ = Depends(verify_bearer_token)):
    products = list(list_products_category_wise(category_id))
    # Convert ObjectId to string for JSON serialization
    for product in products:
        if "_id" in product:
            product["_id"] = str(product["_id"])
        if "category_id" in product:
            product["category_id"] = str(product["category_id"])
        if 'updated_by' in product and product['updated_by'] is not None:
            product['updated_by'] = str(product['updated_by'])
        if 'created_by' in product and product['created_by'] is not None:
            product['created_by'] = str(product['created_by'])
    return products

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    category_id: str = Form(None),
    name: str = Form(None),
    description: str = Form(None),
    file: UploadFile = File(None),
    file_name: Optional [str] = Form(None),
    file_url: Optional[str] = Form(None),
    token = Depends(verify_bearer_token)
):
    """
    Update product fields: name, description, and file (PDF).
    Does NOT update category_id.
    """
    update_data = {}
    if category_id is not None:
        update_data["category_id"] = ObjectId(category_id)
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if file is not None:
        # Read and process the PDF file as in your create_product endpoint
        pdf_content, metadata = read_pdf(file.file)
        update_data["content"] = pdf_content
        update_data["metadata"] = metadata
    if file_name is not None:
        update_data["file_name"] = file_name
    if file_url is not None:
        update_data["file_url"] = file_url

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    # Always update the updated_at field
    update_data["updated_at"] = datetime.now()
    update_data["updated_by"] = token["id"]

    result = product_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Return the updated product
    updated_product = product_collection.find_one({"_id": ObjectId(product_id)})
    if updated_product:
        updated_product = convert_objectids_to_strings(updated_product)
    return updated_product



@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Delete a product by its ID.
    """
    product = product_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Only allow the creator and admin to delete
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this product.")

    product_collection.update_one({"_id": ObjectId(product_id)},{"$set": {"is_deleted": True}})
    return {"message": "Product deleted successfully."}
