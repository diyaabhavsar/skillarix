from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True