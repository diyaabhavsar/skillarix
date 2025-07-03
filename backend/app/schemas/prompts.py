from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PromptConditions(BaseModel):
    condition: str
    prompt: str

class Prompts(BaseModel):
    title: str
    prompt: List[PromptConditions]

class UpdatePrompt(BaseModel):
    prompt: List[PromptConditions]