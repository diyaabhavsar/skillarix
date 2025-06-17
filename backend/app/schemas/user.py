from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    role: str  # "employee" or "admin"
    active: bool = True # Add active field to UserCreate model

class UserLogin(BaseModel):
    username: str  # "employee" or "admin"
    password: str

class UserResponse(UserBase):
    id: str
    role: str

    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    hashed_password: str