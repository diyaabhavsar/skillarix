from fastapi import APIRouter, Depends, HTTPException, Response
from ....services.auth import verify_bearer_token
from ....services.prompt import (
    create_prompt,
    get_active_prompts,
    get_prompt_by_id,
    get_prompt_by_title,
    search_prompts_by_title,
    update_prompt_by_id,
    soft_detele_prompt,
    get_logs,
)
from ....schemas.prompts import Prompts
from ....utils import constants

router = APIRouter()


@router.post("")
async def add_prompt(
    response: Response, prompt: Prompts, token=Depends(verify_bearer_token)
):
    """Create a new prompt."""
    try:
        prompt = create_prompt(prompt, token)
        return {"message": constants.PROMPT_CREATED}
    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("")
async def get_prompts(
    response: Response, 
    title: str = None,
    search: str = None,
    token=Depends(verify_bearer_token)
):
    """Retrieve prompts with optional filtering by title or search query."""
    try:
        if title:
            prompt = get_prompt_by_title(title)
            if prompt:
                return prompt
            response.status_code = 404
            return {"message": constants.PROMPT_NOT_FOUND}
        
        if search:
            return search_prompts_by_title(search)
            
        return get_active_prompts()
    except Exception as e:
        response.status_code = 500
        print(f"Error fetching prompts: {str(e)}")
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("/{prompt_id}")
async def get_prompt(
    response: Response, prompt_id: str, _=Depends(verify_bearer_token)
):
    """Retrieve a prompt by its ID."""
    try:
        prompt = get_prompt_by_id(prompt_id)
        if prompt:
            return prompt
        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}
    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.put("/{prompt_id}")
async def update_prompt(
    response: Response,
    prompt_id: str,
    update_data: Prompts,
    token=Depends(verify_bearer_token),
):
    """Update an existing prompt by its ID."""
    try:
        updated = update_prompt_by_id(prompt_id, update_data, token["id"])
        if updated:
            return {"message": constants.PROMPT_UPDATED}
        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}
    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.delete("/{prompt_id}")
async def delete_prompt(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    """Delete a prompt by its ID."""
    try:
        prompt = soft_detele_prompt(prompt_id, token["id"])
        if not prompt:
            response.status_code = 404
            return {"message": constants.PROMPT_NOT_FOUND}
        return {"message": constants.PROMPT_DELETED}
    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("/logs/{prompt_id}")
async def get_prompt_logs(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    """Retrieve logs for a specific prompt by its ID."""
    try:
        return get_logs(prompt_id)
    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}






