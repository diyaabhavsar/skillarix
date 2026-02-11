
import sys
# Make sure we can import app modules
sys.path.append('.')

from app.services.auth import authenticate_user
from app.database import db

# Force reprint of user from DB to debug
user = db.users.find_one({"email": "admin@skillarix.com"})
print(f"User in DB: {user.get('email')}, Hash: {user.get('password')[:20]}...")

try:
    print("Attempting to authenticate 'admin'...")
    u1 = authenticate_user("admin", "admin123")
    if u1:
        print("✅ SUCCESS: Login with 'admin' worked!")
    else:
        print("❌ FAILED: Login with 'admin' failed.")

    print("Attempting to authenticate 'admin@skillarix.com'...")
    u2 = authenticate_user("admin@skillarix.com", "admin123")
    if u2:
        print("✅ SUCCESS: Login with 'admin@skillarix.com' worked!")
    else:
        print("❌ FAILED: Login with 'admin@skillarix.com' failed.")

except Exception as e:
    print(f"❌ ERROR calling authenticate_user: {e}")
    import traceback
    traceback.print_exc()
