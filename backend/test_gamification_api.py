"""
Quick test script to verify gamification API endpoints are working.
"""

import sys
import os
import requests
import json

# Set up path to import app modules
sys.path.append(os.getcwd())
from app.services.auth import create_access_token

BASE_URL = "http://localhost:8070/api/v1"

# Mimic a user
user_id = "698c619cb08f6a0985c46cba"
user_role = "salesman"

# Generate tokens
print("Generating tokens...")
TOKEN = create_access_token({"id": user_id, "role": user_role})
ADMIN_TOKEN = create_access_token({"id": user_id, "role": "admin"})

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

admin_headers = {
    "Authorization": f"Bearer {ADMIN_TOKEN}",
    "Content-Type": "application/json"
}

def test_endpoint(name, url, method="GET", data=None, use_admin=False):
    """Test a single endpoint."""
    current_headers = admin_headers if use_admin else headers
    
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=current_headers)
        elif method == "POST":
            response = requests.post(url, headers=current_headers, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS")
            try:
                data = response.json()
                # print(json.dumps(data, indent=2)) 
                # Truncate output for conciseness
                print(str(data)[:500] + "..." if len(str(data)) > 500 else str(data))
            except:
                print("Response not JSON")
        else:
            print(f"❌ FAILED")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERROR: {e}")


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🎮 GAMIFICATION API TESTS")
    print("="*60)
    
    # Test 1: Get Profile
    test_endpoint(
        "Get User Profile",
        f"{BASE_URL}/gamification/profile"
    )
    
    # Test 2: Get Leaderboard
    test_endpoint(
        "Get Leaderboard (All Time)",
        f"{BASE_URL}/gamification/leaderboard?period=all_time&limit=10"
    )
    
    # Test 3: Get Badges
    test_endpoint(
        "Get User Badges",
        f"{BASE_URL}/gamification/badges"
    )
    
    # Test 4: Get Points
    test_endpoint(
        "Get User Points",
        f"{BASE_URL}/gamification/points"
    )
    
    # Test 5: Get Milestones
    test_endpoint(
        "Get User Milestones",
        f"{BASE_URL}/gamification/milestones"
    )
    
    # Test 6: Get Streak
    test_endpoint(
        "Get User Streak",
        f"{BASE_URL}/gamification/streak"
    )
    
    # Test 7: Get Rank
    test_endpoint(
        "Get User Rank",
        f"{BASE_URL}/gamification/rank"
    )
    
    # Test 8: Get Stats (Admin only)
    test_endpoint(
        "Get Gamification Stats (Admin)",
        f"{BASE_URL}/gamification/stats",
        use_admin=True
    )
    
    print("\n" + "="*60)
    print("✅ ALL TESTS COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()
