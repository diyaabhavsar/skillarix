from ..schemas.test_configuration import TestConfigurationCreate
from ..services.user import convert_object_ids
from bson import ObjectId
from datetime import datetime, timezone
from ..database import db
from typing import List, Dict, Any

test_configurations_collection = db["test_configurations"]

def ensure_object_id(value):
    """Helper function to ensure ObjectId conversion"""
    if isinstance(value, ObjectId):
        return value
    elif isinstance(value, str):
        return ObjectId(value)
    else:
        raise ValueError(f"Invalid type for ObjectId conversion: {type(value)}")

# New method to save test configuration
def save_test_configuration(config_data: TestConfigurationCreate, token):
    test_config = {
        "product_id": ensure_object_id(config_data.product_id), # Always store as ObjectId
        "category_id": ensure_object_id(config_data.category_id), # Always store as ObjectId
        "visitorPersona": config_data.visitorPersona.model_dump(), # Use model_dump() for Pydantic V2
        "additionalCriteria": config_data.additionalCriteria.model_dump(), # Use model_dump() for Pydantic V2
        "name": config_data.name,
        "created_by": ensure_object_id(token["id"]), # Ensure this is also ObjectId
        "created_at": datetime.now(timezone.utc), # Use UTC timezone for consistency
        "is_deleted": False,  # Add this line
        "assessment": False
    }
    result = test_configurations_collection.insert_one(test_config)
    return result.inserted_id

def get_test_configurations_by_product(product_id) -> List[Dict[str, Any]]:
    """
    Retrieves all non-deleted test configurations for a given product.
    """
    # Ensure product_id is ObjectId for consistent querying
    product_object_id = ensure_object_id(product_id)
    
    configs_cursor = test_configurations_collection.find({
        "product_id": product_object_id,
        "is_deleted": False  # Add this line
    })
    configs_list = list(configs_cursor)
    return convert_objectids_to_strings(configs_list)

def convert_objectids_to_strings(data):
    """Recursively converts ObjectId instances in a dictionary or list to strings."""
    if isinstance(data, dict):
        return {key: convert_objectids_to_strings(value) for key, value in data.items()}
    elif isinstance(data, list):
         return [convert_objectids_to_strings(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data