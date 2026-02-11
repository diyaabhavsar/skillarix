from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Transcript(BaseModel):
    source: str
    text: str

class ElevenLabsSchema(BaseModel):
    test_config_id_str: Optional[str] = None
    product_id_str: str
    transcript: List[Transcript]

class ElevenLabsAgentUpdateSchema(BaseModel):
    test_config_id: str
    agent_id: Optional[str] = None