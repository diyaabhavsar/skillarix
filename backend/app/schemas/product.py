from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional

class ProductBase(BaseModel):
    name: str
    category_id: str
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

    class Config:
        from_attributes = True