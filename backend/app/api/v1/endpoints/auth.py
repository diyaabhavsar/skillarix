from fastapi import APIRouter, HTTPException, Form
from ....services.auth import authenticate_user, create_access_token
from ....schemas.user import  UserLogin
from datetime import timedelta
from ....config import settings

router = APIRouter()

@router.post("/login")
async def login_for_access_token(username: str = Form(...), password: str = Form(...)):
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"username":user.username,"email": user.email, "id":user.id, "role":user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role,
        "username": user.username
    }