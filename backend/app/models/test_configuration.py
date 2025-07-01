from pydantic import BaseModel, Field
from datetime import datetime

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

class TestConfiguration(TestConfigurationCreate):
    id: str = Field(alias="_id")
    created_by: str
    created_at: datetime