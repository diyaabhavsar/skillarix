from pydantic import BaseModel, Field
from typing import Optional

class PointsTransaction(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    amount: int
    reason: str
    
    class Config:
        populate_by_name = True

tx = PointsTransaction(user_id="123", amount=10, reason="test")
dump_alias = tx.model_dump(by_alias=True, exclude={"id"})
print(f"Dump Alias: {dump_alias}")

dump_alias_none = tx.model_dump(by_alias=True)
print(f"Dump Alias (Include None): {dump_alias_none}")
