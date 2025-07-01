from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime

# Add Pydantic models for Test Configuration
class VisitorPersona(BaseModel):
    product_knowledge: str  # None, Name-only, Saw ad/brochure, Peer-heard, Very familiar
    product_familiarity: str  # Never seen, Handled briefly, Tried sample, Similar user, Loyal user
    technical_expertise: str  # General, Basic, Moderate, Advanced, Expert
    key_challenges: str  # Cost control, Quality/reliability, Compliance, Simplicity, Trust in vendor, Sustainability
    buying_objective: str  # Save money, Boost quality, Meet standards, Upgrade, Future planning
    budget_range: str  # Very low, Low, Mid, High, Very high
    decision_authority: str  # User, Influencer, Evaluator, Approver, Final sign-off
    exhibition_objective: str  # Info gathering, Spec comparison, Pricing talk, Terms/warranty, Partnership, Demo booking

class AdditionalCriteria(BaseModel):
    distraction_handling: bool
    communication_simplicity: bool

class TestConfigurationCreate(BaseModel):
    product_id: str
    visitorPersona: VisitorPersona
    additionalCriteria: AdditionalCriteria
    name: str
    category_id: str
    assessment: bool

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
    assessment: bool
