from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ConversationPair(BaseModel):
    visitor_text: str
    salesperson_text: str

class ConversationHistory(BaseModel):
    pairs: List[ConversationPair]

class EvaluationRequest(BaseModel):
    conversation: List[ConversationPair]
    product_id: str
    is_complete: bool = False
    additional_criteria: Optional[str] = None

class EvaluationResponse(BaseModel):
    evaluation: str
    score: float
    metrics: Dict[str, Any]
    conversation_id: str