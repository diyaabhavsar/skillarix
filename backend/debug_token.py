import asyncio
import os
from app.services.auth import create_access_token

def main():
    user_id = '698d7a6a1457e6f39a787093' # new_sales@skillarix.com
    access_token = create_access_token(data={"id": user_id, "role": "salesman"})
    print(access_token)
    
if __name__ == "__main__":
    main()
