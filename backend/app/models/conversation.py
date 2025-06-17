from typing import List
from pydantic import BaseModel


class ConversationPair(BaseModel):
    visitor_text: str
    salesperson_text: str

class ConversationPair:
    def __init__(self, visitor_text: str, salesperson_text: str):
        self.visitor_text = visitor_text
        self.salesperson_text = salesperson_text

class Conversation:
    def __init__(self, pairs: List[ConversationPair]):
        self.pairs = pairs