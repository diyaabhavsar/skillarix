from pydantic import BaseModel
from typing import List

class Transcript(BaseModel):
    source: str
    text: str

class ElevenLabsSchema(BaseModel):
    test_config_id_str: str
    product_id_str: str
    transcript: List[Transcript]