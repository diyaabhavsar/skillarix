from fastapi import APIRouter, HTTPException, Depends, Body, Query
from typing import List, Optional
from ....schemas.test_configuration import TestConfigurationCreate, TestConfiguration
from ....services.test_configuration import (
    save_test_configuration,
    get_test_configurations_by_product,
    convert_objectids_to_strings,
    ensure_object_id,
)
from ....services.auth import verify_bearer_token
from ....services.user import convert_object_ids
from bson import ObjectId
from ....database import db
from datetime import datetime, timezone

test_configurations_collection = db["test_configurations"]

router = APIRouter()


@router.post("")
async def create_test_configuration(
    config_data: TestConfigurationCreate, token=Depends(verify_bearer_token)
):
    """
    Saves a new test configuration to the database.
    """
    try:
        inserted_id = save_test_configuration(config_data, token)
        return {
            "id": str(inserted_id),
            "message": "Test configuration saved successfully",
        }
    except Exception as e:
        # Log the error for debugging
        print(f"Error saving test configuration: {e}")
        raise HTTPException(status_code=500, detail="Failed to save test configuration")


@router.get("/{product_id}")
async def get_test_configurations(
    product_id: str, token=Depends(verify_bearer_token)
) -> List[TestConfiguration]:
    """
    Retrieves test configurations for a given product.
    """
    try:
        configs = get_test_configurations_by_product(
            product_id
        )  # Let the service handle ObjectId conversion
        return [TestConfiguration(**config) for config in configs]
    except Exception as e:
        print(f"Error fetching test configurations for product {product_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch test configurations"
        )


@router.get("")
async def get_all_test_configurations(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    limit: Optional[int] = Query(
        None,
        ge=1,
        le=1000,
        description="Max number of items to return. If not provided, returns all records",
    ),
    token=Depends(verify_bearer_token),
):
    """
    Retrieves all non-deleted test configurations created by the current admin user.
    Only admin users are authorized to access this endpoint.
    When limit is not provided, returns all records.
    """
    if token["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized. Only admin users can access their test configurations.",
        )
    try:
        base_query = {"is_deleted": False}
        total_count = test_configurations_collection.count_documents(base_query)

        # If limit is not provided, set it to total count to return all records
        if limit is None:
            limit = total_count

        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        configs_cursor = (
            test_configurations_collection.find(base_query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        configs_list = list(configs_cursor)
        configs_list = convert_objectids_to_strings(configs_list)
        return {
            "data": configs_list,
            "page": page,
            "limit": limit,
            "count": len(configs_list),
            "total_count": total_count,
            "total_pages": total_pages,
        }
    except Exception as e:
        print(f"Error fetching test configurations for admin {token['id']}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch test configurations"
        )


@router.put("/{test_config_id}")
async def update_test_configuration(
    test_config_id: str,
    product_id: str = Body(None),
    category_id: str = Body(None),
    name: str = Body(None),
    visitorPersona: dict = Body(None),
    additionalCriteria: dict = Body(None),
    token=Depends(verify_bearer_token),
):
    """
    Update name, visitorPersona, and additionalCriteria for a test configuration.
    Only the creator (or admin) can update.
    """
    # Fetch the test config
    test_config = test_configurations_collection.find_one(
        {"_id": ensure_object_id(test_config_id)}
    )
    if not test_config:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    # Only allow the creator or admin to update
    if token["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to update this test configuration."
        )

    update_data = {}
    if name is not None:
        update_data["name"] = name
    if visitorPersona is not None:
        update_data["visitorPersona"] = visitorPersona
    if additionalCriteria is not None:
        update_data["additionalCriteria"] = additionalCriteria
    if product_id is not None:
        update_data["product_id"] = ensure_object_id(product_id)
    if category_id is not None:
        update_data["category_id"] = ensure_object_id(category_id)
    if product_id is not None:
        update_data["product_id"] = ensure_object_id(product_id)
    if category_id is not None:
        update_data["category_id"] = ensure_object_id(category_id)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = ensure_object_id(token["id"])

    result = test_configurations_collection.update_one(
        {"_id": ensure_object_id(test_config_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    # Return the updated test configuration
    updated_config = test_configurations_collection.find_one(
        {"_id": ensure_object_id(test_config_id)}
    )
    updated_config = convert_objectids_to_strings(updated_config)
    return updated_config


@router.delete("/{test_config_id}")
async def delete_test_configuration(
    test_config_id: str, token=Depends(verify_bearer_token)
):
    """
    Soft delete a test configuration by its ID (set is_deleted=True).
    """
    test_config = test_configurations_collection.find_one(
        {"_id": ensure_object_id(test_config_id)}
    )
    if not test_config:
        raise HTTPException(status_code=404, detail="Test configuration not found.")

    if token["role"] != "admin":
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this test configuration."
        )

    test_configurations_collection.update_one(
        {"_id": ensure_object_id(test_config_id)}, {"$set": {"is_deleted": True}}
    )
    return {"message": "Test configuration soft deleted successfully."}


@router.get("/config/{test_config_id}")
async def get_test_configuration(
    test_config_id: str, token=Depends(verify_bearer_token)
):
    """
    Get a specific test configuration by its ID.
    """
    # Fetch the test config
    test_config = test_configurations_collection.find_one(
        {"_id": ensure_object_id(test_config_id)}
    )
    configs = convert_object_ids(test_config)
    return configs
