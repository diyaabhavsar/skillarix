from pydantic import BaseModel, Field, validator
from typing import Optional, Literal

# Define valid roles
ValidRole = Literal["admin", "salesman", "employee"]

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username for the user")
    email: str = Field(..., description="Email address of the user")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password for the user")
    role: ValidRole = Field(default="salesman", description="Role: admin, salesman, or employee")
    active: bool = Field(default=True, description="Whether the user account is active")
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ["admin", "salesman", "employee"]
        if v not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")

class UserResponse(UserBase):
    id: str
    role: ValidRole
    active: bool = True

    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    hashed_password: str
    
class UserUpdate(BaseModel):
    """Schema for updating user information"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = None
    role: Optional[ValidRole] = None
    active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)
    
    @validator('role')
    def validate_role(cls, v):
        if v is not None:
            valid_roles = ["admin", "salesman", "employee"]
            if v not in valid_roles:
                raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v