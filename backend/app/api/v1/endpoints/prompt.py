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


# ============================================================
# NEW FUNCTION → Converts any prompt into a TEXT + SPEECH agent
# ============================================================
def apply_speech_text_agent_rules(prompt: Prompts):
    """
    Enhances the prompt content so the agent:
    - Always outputs clean text that can be converted to speech
    - Always asks one short question
    - Works for text UI + TTS speech output
    """
    
    prompt.content = prompt.content + """

=====================================
VOICE + TEXT CUSTOMER AGENT RULES
=====================================
• You are a customer speaking to a salesman.
• The salesman responds using voice; you respond using text that will also be converted to speech.

OUTPUT RULES:
1. ALWAYS output ONLY ONE short question (5–15 words).
2. Your response MUST be plain text ONLY — no formatting, no explanations.
3. DO NOT include anything except the question.
4. DO NOT output multiple sentences.
5. DO NOT describe actions like "I ask" or "I say".
6. The output will be displayed as text AND converted to speech using TTS.
7. Keep questions simple, clear, and conversational.
8. Never output anything other than the customer’s question.

FIRST QUESTION (when starting conversation):
"Hi, could you give me a simple overview of this product?"
"""
    return prompt


# ============================================================
# CREATE PROMPT
# ============================================================
@router.post("")
async def add_prompt(
    response: Response, prompt: Prompts, token=Depends(verify_bearer_token)
):
    """
    Creates a prompt with built-in speech + text rules.
    """
    try:
        print("Creating speech-enabled prompt...")

        # Apply text + speech agent formatting
        prompt = apply_speech_text_agent_rules(prompt)

        create_prompt(prompt, token)
        return {"message": constants.PROMPT_CREATED}

    except Exception as e:
        print("Error creating prompt:", e)
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


# ============================================================
# GET PROMPTS
# ============================================================
@router.get("")
async def get_prompts(
    response: Response,
    title: str = None,
    search: str = None,
    token=Depends(verify_bearer_token)
):
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
        print("Error fetching prompts:", e)
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


# ============================================================
# GET PROMPT BY ID
# ============================================================
@router.get("/{prompt_id}")
async def get_prompt(
    response: Response, prompt_id: str, _=Depends(verify_bearer_token)
):
    try:
        prompt = get_prompt_by_id(prompt_id)
        if prompt:
            return prompt

        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}

    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


# ============================================================
# UPDATE PROMPT
# ============================================================
@router.put("/{prompt_id}")
async def update_prompt(
    response: Response,
    prompt_id: str,
    update_data: Prompts,
    token=Depends(verify_bearer_token),
):
    """
    Updates a prompt AND ensures speech/text rules remain included.
    """
    try:
        update_data = apply_speech_text_agent_rules(update_data)

        updated = update_prompt_by_id(prompt_id, update_data, token["id"])
        if updated:
            return {"message": constants.PROMPT_UPDATED}

        response.status_code = 404
        return {"message": constants.PROMPT_NOT_FOUND}

    except Exception as e:
        print("Error updating prompt:", e)
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


# ============================================================
# DELETE PROMPT
# ============================================================
@router.delete("/{prompt_id}")
async def delete_prompt(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    try:
        prompt = soft_detele_prompt(prompt_id, token["id"])
        if not prompt:
            response.status_code = 404
            return {"message": constants.PROMPT_NOT_FOUND}

        return {"message": constants.PROMPT_DELETED}

    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}


# ============================================================
# PROMPT LOGS
# ============================================================
@router.get("/logs/{prompt_id}")
async def get_prompt_logs(
    response: Response, prompt_id: str, token=Depends(verify_bearer_token)
):
    try:
        return get_logs(prompt_id)

    except Exception as e:
        response.status_code = 500
        return {"message": constants.INTERNAL_SERVER_ERROR}
