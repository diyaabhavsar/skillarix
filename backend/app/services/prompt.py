from ..database import db
from datetime import datetime
from bson import ObjectId


prompt_collection = db["prompts"]
prompt_logs_collection = db["prompt_logs"]

def create_prompt(prompt, token):
    data = {
    "title":prompt.title,
    "prompt": [p.dict() for p in prompt.prompt],
    "created_by": ObjectId(token["id"]),
    "updated_by": None,
    "created_at": datetime.now(),
    "updated_at": datetime.now(),
    "is_deleted": False,
    }
    prompt_collection.insert_one(data)
    return True

def get_active_prompts():
    prompts = prompt_collection.find({"is_deleted": False})
    result = []
    for prompt in prompts:
        prompt["_id"] = str(prompt["_id"])
        prompt["created_by"] = str(prompt["created_by"])
        if prompt["updated_by"]:
            prompt["updated_by"] = str(prompt["updated_by"])
        result.append(prompt)
    return result

def get_prompt_by_id(obj_id):
    prompt = prompt_collection.find_one({"_id": ObjectId(obj_id),"is_deleted": False})
    if prompt:
        prompt["_id"] = str(prompt["_id"])
        prompt["created_by"] = str(prompt["created_by"])
        if prompt["updated_by"]:
            prompt["updated_by"] = str(prompt["updated_by"])
        return prompt
    return False


def update_prompt_by_id(prompt_id, new_prompt, user_id):
    existing_prompt = prompt_collection.find_one(
        {"_id": ObjectId(prompt_id), "is_deleted": False}
    )
    if not existing_prompt:
        return False
    existing_prompt.pop("_id")
    # Log the current state before updating
    log_entry = {
        "user_id": ObjectId(user_id),
        "prompt_id": ObjectId(prompt_id),
        "created_at": datetime.now(),
        "previous_value": existing_prompt
    }
    prompt_logs_collection.insert_one(log_entry)
    data_dict = new_prompt.model_dump()
    update_result = prompt_collection.update_one(
        {"_id": ObjectId(prompt_id)},
        {
            "$set": {
                "title": new_prompt.title,
                "prompt": data_dict["prompt"],
                "updated_by": ObjectId(user_id),
                "updated_at": datetime.now()
            }
        }
    )

    return update_result.modified_count > 0

def soft_detele_prompt(prompt_id, user_id):
    prompt = prompt_collection.update_one(
        {"_id": ObjectId(prompt_id)},
        {
            "$set": {
                "is_deleted": True,
                "updated_by":ObjectId(user_id),
                "updated_at": datetime.now()
            }
        }
    )
    return prompt

def get_logs(prompt_id):
    logs = prompt_logs_collection.find({"prompt_id": ObjectId(prompt_id)})
    result = []
    for log in logs:
        log["_id"] = str(log["_id"])
        log["user_id"] = str(log["user_id"])
        log["prompt_id"] = str(log["prompt_id"])
        log["previous_value"]["created_by"] = str(log["previous_value"]["created_by"])
        log["previous_value"]["updated_by"] = str(log["previous_value"]["updated_by"])
        result.append(log)
    return result