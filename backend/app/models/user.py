from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    email: Optional[EmailStr]
    username: Optional[str]
    password: Optional[str]
    role: Optional[str]