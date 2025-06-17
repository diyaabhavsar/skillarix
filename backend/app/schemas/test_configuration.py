from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime

# Add Pydantic models for Test Configuration
class VisitorPersona(BaseModel):
    background: str
    pain_points: str
    goals: str
    technical_knowledge: str
    budget_sensitivity: str
    decision_authority: str
    previous_experience: str

class AdditionalCriteria(BaseModel):
    distraction_handling: bool
    communication_simplicity: bool

class TestConfigurationCreate(BaseModel):
    product_id: str
    visitorPersona: VisitorPersona
    additionalCriteria: AdditionalCriteria
    name: str
    category_id: str

class TestConfiguration(BaseModel):
    id: str = Field(alias="_id")  # Expect string ID for output
    product_id: str  # Expect string ID for output
    category_id: str  # Add this line
    visitorPersona: Dict[str, Any]
    additionalCriteria: Dict[str, bool]
    name: str
    created_by: str  # Expect string ID for output
    created_at: datetime
    is_deleted: bool = False  # Add this line
