from fastapi import APIRouter, Depends, HTTPException, Response
from ....services.auth import verify_bearer_token
from ....services.prompt import (
    create_prompt,
    get_active_prompts,
    get_prompt_by_id,
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
    """
    Create a new prompt.

    Args:
        response (Response): FastAPI response object.
        prompt (Prompts): Prompt data to be created, validated by Prompts schema.
        token: User authentication token, injected by dependency.

    Returns:
        dict: Success message if prompt is created.

    Raises:
        HTTPException: If prompt creation fails, returns 500 error.
    """
    try:
        # Call the service to create a new prompt with the provided data and user token
        prompt = create_prompt(prompt, token)
        # Return a success message if creation is successful
        return {"message": constants.PROMPT_CREATED}
    except Exception as e:
        response.status_code = 500
        # Raise an HTTP 500 error if something goes wrong
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("")
async def get_prompts(response: Response, token=Depends(verify_bearer_token)):
    """
    Retrieve all active prompts.

    Args:
        response (Response): FastAPI response object.
        token: User authentication token, injected by dependency.

    Returns:
        list: List of active prompts.

    Raises:
        HTTPException: If retrieval fails, returns 500 error.
    """
    try:
        # Fetch all active prompts from the service layer
        prompts = get_active_prompts()
        # Return the list of prompts
        return prompts
    except Exception as e:
        response.status_code = 500
        # Raise an HTTP 500 error if something goes wrong
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("/{prompt_id}")
async def get_prompt(
    response: Response, prompt_id: str, _=Depends(verify_bearer_token)
):
    """
    Retrieve a prompt by its ID.

    Args:
        response (Response): FastAPI response object.
        prompt_id (str): The unique identifier of the prompt to retrieve.
        _ : User authentication token, injected by dependency (unused).

    Returns:
        dict or object: The prompt object if found, otherwise a not found message.

    Raises:
        HTTPException: If retrieval fails, returns 500 error.
    """
    try:
        # Attempt to fetch the prompt by its ID from the service layer
        prompt = get_prompt_by_id(prompt_id)
        if prompt:
            # Return the prompt if found
            return prompt
        # Set response status to 404 if prompt is not found
        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}
    except Exception as e:
        response.status_code = 500
        # Raise an HTTP 500 error if something goes wrong
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.put("/{prompt_id}")
async def update_prompt(
    response: Response,
    prompt_id: str,
    update_data: Prompts,
    token=Depends(verify_bearer_token),
):
    """
    Update an existing prompt by its ID.

    Args:
        response (Response): FastAPI response object.
        prompt_id (str): The unique identifier of the prompt to update.
        update_data (Prompts): The updated prompt data, validated by Prompts schema.
        token: User authentication token, injected by dependency.

    Returns:
        dict: Success message if prompt is updated, not found message otherwise.

    Raises:
        HTTPException: If update fails, returns 500 error.
    """
    try:
        # Attempt to update the prompt by its ID using the provided data and user ID from token
        updated = update_prompt_by_id(prompt_id, update_data, token["id"])
        if updated:
            # Return a success message if update is successful
            return {"message": constants.PROMPT_UPDATED}
        # Set response status to 404 if prompt is not found
        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}
    except Exception as e:
        response.status_code = 500
        # Raise an HTTP 500 error if something goes wrong
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.delete("/{prompt_id}")
async def delete_prompt(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    """
    Delete a prompt by its ID.

    Args:
        response (Response): FastAPI response object.
        prompt_id (str): The unique identifier of the prompt to delete.
        token: User authentication token, injected by dependency.

    Returns:
        dict: Success message if prompt is deleted, not found message otherwise.

    Raises:
        HTTPException: If deletion fails, returns 500 error.
    """
    try:
        # Attempt to soft delete the prompt using its ID and the user's ID from the token
        prompt = soft_detele_prompt(prompt_id, token["id"])
        if not prompt:
            # Set response status to 404 if prompt is not found
            response.status_code = 404
            return {"message": constants.PROMPT_NOT_FOUND}
        # Return a success message if deletion is successful
        return {"message": constants.PROMPT_DELETED}
    except Exception as e:
        response.status_code = 500
        # Raise an HTTP 500 error if something goes wrong
        return {"message": constants.INTERNAL_SERVER_ERROR}


@router.get("/logs/{prompt_id}")
async def get_prompt_logs(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    """
    Retrieve logs for a specific prompt by its ID.

    Args:
        response (Response): FastAPI response object.
        prompt_id (str): The unique identifier of the prompt whose logs are to be retrieved.
        token: User authentication token, injected by dependency.

    Returns:
        list or dict: List of logs for the prompt if found, otherwise an error message.

    Raises:
        HTTPException: If retrieval fails, returns 500 error.
    """
    try:
        # Fetch logs for the given prompt ID from the service layer
        prompt_logs = get_logs(prompt_id)
        # Return the logs if retrieval is successful
        return prompt_logs
    except Exception as e:
        # Set response status to 500 in case of error
        response.status_code = 500
        # Return a generic internal server error message
        return {"message": constants.INTERNAL_SERVER_ERROR}
