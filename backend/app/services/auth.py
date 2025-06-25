from fastapi import HTTPException, Header
from typing import Optional
from datetime import datetime, timedelta, timezone
from .user import get_user
from ..database import db
from passlib.context import CryptContext
from jose import JWTError, jwt
from ..config import settings
from jose.exceptions import ExpiredSignatureError, JWTError
from bson import ObjectId

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

user_collection = db["users"]



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_bearer_token(authorization: str = Header(...)):
    """
    Verify and decode a bearer token.

    Args:
        authorization (str): The authorization header containing the bearer token.

    Returns:
        dict: The decoded token payload if valid.
        dict: An error message if the token is invalid or expired.

    """
    try:
        token_type, token = authorization.split()
        if token_type.lower() != "bearer":
            return {"error": "Invalid token type"}
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_signature": True},
        )

        if "exp" in payload:
            expiration = datetime.utcfromtimestamp(payload["exp"])
            if expiration < datetime.now():
                return {"error": "Token is expired"}
        return payload
    except (ExpiredSignatureError, JWTError, ValueError):
        return {"error": "Invalid token"}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def authenticate_user(email: str, password: str):
    print(f"Authenticating user: {email}") # Add logging
    user = get_user(email) # <-- Pass email to get_user
    if not user:
        print("Authentication failed: User not found.")
        return False
    if not verify_password(password, user.hashed_password):
        print("Authentication failed: Incorrect password.")
        return False
    user_collection.update_one(
            {"_id": ObjectId(user.id)}, # Use ObjectId to query by _id
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
    print("Authentication successful.")
    return user

