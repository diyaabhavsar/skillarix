from typing import List
from pydantic import BaseModel

class ConversationPair(BaseModel):
    visitor_text: str
    salesperson_text: str

class Conversation(BaseModel):
    pairs: List[ConversationPair]
