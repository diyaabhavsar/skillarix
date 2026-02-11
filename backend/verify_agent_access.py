
import requests
from app.config import settings

API_KEY = settings.ELEVENLABS_API_KEY
AGENT_ID = settings.AGENT_ID

print(f"Checking access for Agent: {AGENT_ID}")
print(f"Using API Key: {API_KEY[:4]}...{API_KEY[-4:]}")

url = f"https://api.elevenlabs.io/v1/convai/agents/{AGENT_ID}"
headers = {
    "xi-api-key": API_KEY,
    "Content-Type": "application/json"
}

try:
    print(f"GET {url}")
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ SUCCESS: Agent details accessible!")
        print(response.json().get('name'))
    else:
        print(f"❌ FAILED: {response.text}")

except Exception as e:
    print(f"❌ ERROR: {e}")
