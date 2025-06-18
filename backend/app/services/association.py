from bson import ObjectId

def check_associations(tag: str, entity_id: ObjectId, db) -> str:
    """
    Checks for associations of a category, product, or test_configuration.
    """
    message = ""
    count = 0
    associated_tag_name = ""

    products = db["products"]
    test_configurations = db["test_configurations"]
    conversations = db["conversations"]

    if tag == "category":
        associated_tag_name = "products"
        count = products.count_documents({"category_id": entity_id, "is_deleted": False})
    elif tag == "product":
        associated_tag_name = "test configurations"
        count = test_configurations.count_documents({"product_id": entity_id, "is_deleted": False})
    elif tag == "test_configuration":
        associated_tag_name = "conversations"
        count = conversations.count_documents({"evaluation_data.test_configuration_id": entity_id, "is_deleted": False})
    else:
        return "Invalid tag provided. Supported tags are 'category', 'product', 'test_configuration'."

    if count > 0:
        message = f"For the current {tag} associated {associated_tag_name} are there: {count} {associated_tag_name} found."
    else:
        message = f"No associated {associated_tag_name} found for the current {tag}."
    
    data = {
        "message":message,
        "count": count
    }
    
    return data