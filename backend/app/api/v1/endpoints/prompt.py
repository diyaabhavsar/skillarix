from fastapi import APIRouter, Depends, HTTPException, Response
from ....services.auth import verify_bearer_token
from ....services.prompt import create_prompt, get_active_prompts, get_prompt_by_id, update_prompt_by_id, soft_detele_prompt, get_logs
from ....schemas.prompts import Prompts

router = APIRouter()

@router.post("")
async def add_prompt(response: Response,prompt:Prompts,  token = Depends(verify_bearer_token)):
    try:
        prompt = create_prompt(prompt, token)
        return {"message":"Prompt created successfully"}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Failed to add prompt")

@router.get("")
async def get_prompts(
    token = Depends(verify_bearer_token)
):
    try:
        prompts = get_active_prompts()
        return prompts
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch Prompt")

@router.get("/{prompt_id}")
async def get_prompt(prompt_id: str, _ = Depends(verify_bearer_token)):
    prompt = get_prompt_by_id(prompt_id)
    if prompt:
        return prompt
    return {"message":"Prompt not found"}

@router.put("/{prompt_id}")
async def update_prompt(prompt_id: str, update_data: Prompts, token=Depends(verify_bearer_token)):
    updated = update_prompt_by_id(prompt_id, update_data, token["id"])
    if updated:
        return {"message": "Prompt updated successfully"}
    raise HTTPException(status_code=404, detail="Prompt not found or already deleted")

@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    token = Depends(verify_bearer_token)
):
    """
    Delete a prompt by its ID.
    """
    prompt = soft_detele_prompt(prompt_id, token["id"])
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found.")
    return {"message": "Prompt deleted successfully."}

@router.get("/logs/{prompt_id}")
async def get_prompt_logs(prompt_id: str, token=Depends(verify_bearer_token)):
    prompt_logs = get_logs(prompt_id)

    return prompt_logs