
import requests
from app.config import settings

API_KEY = settings.ELEVENLABS_API_KEY
print(f"Using API Key: {API_KEY[:4]}...{API_KEY[-4:]}")

url = "https://api.elevenlabs.io/v1/convai/agents"
headers = {
    "xi-api-key": API_KEY
}

try:
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        agents = response.json().get("agents", [])
        print(f"✅ Found {len(agents)} agents:")
        for agent in agents:
            print(f" - {agent.get('agent_id')}: {agent.get('name')}")
    else:
        print(f"❌ Failed to list agents: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
