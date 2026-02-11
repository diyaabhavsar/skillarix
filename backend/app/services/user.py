from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from ..models.user import User
from ..database import db
from datetime import datetime, timezone
from ..schemas.user import UserInDB
from ..schemas.token import TokenData
from ..config import settings
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
user_collection = db["users"]

# Constants for JWT
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = TokenData(username=email)
    except JWTError:
        raise credentials_exception

    user = get_user(email=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_user(email: str):
    print(f"DB lookup by identifier: {email}")
    # Search by email OR username
    user_dict = user_collection.find_one({"$or": [{"email": email}, {"username": email}]})
    
    if user_dict:
        # Map MongoDB _id to Pydantic id and MongoDB 'password' to 'hashed_password'
        # Assuming the hashed password is stored under the key 'password' in MongoDB
        mapped_user_dict = {
            "id": str(user_dict["_id"]), # Map _id to id and convert to string
            "username": user_dict["username"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "hashed_password": user_dict["password"] # Map the stored password field to hashed_password
        }
        # Ensure 'role' is present, although it's in UserBase so should be
        # mapped_user_dict['role'] = user_dict.get('role', 'employee') # Add default if needed

        print("Mapped user dict for Pydantic:", mapped_user_dict) # Add logging to see the dict structure
        return UserInDB(**mapped_user_dict) # Use the mapped dictionary
    print("User not found in DB.") # Add logging
    return None

def register(username: str, email: str, password: str, role: str, active: bool) -> bool:
    print(f"Attempting to register user: {username}, email: {email}, role: {role}, active: {active}")
    if user_collection.find_one({"$or": [{"username": username}, {"email": email}]}):
        return False
    
    hashed_password = pwd_context.hash(password)
    user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": role,
        "sessions": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "active": active,
        "last_login": datetime.now(),
        "is_deleted": False,
        "updated_by": None
    }
    user_collection.insert_one(user)
    return True

def convert_object_ids(obj):
    if isinstance(obj, dict):
        return {k: convert_object_ids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_object_ids(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj