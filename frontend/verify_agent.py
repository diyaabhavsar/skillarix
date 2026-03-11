
import os
import requests
import json

env_path = ".env"

def check_agent():
    print("Reading .env file...")
    if not os.path.exists(env_path):
        print("❌ .env file not found!")
        return

    config = {}
    content = ""
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(env_path, "r", encoding="utf-16") as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading .env: {e}")
            return
            
    for line in content.splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    config[key.strip()] = val.strip()


    agent_id = config.get("VITE_ELEVENLABS_AGENT_ID")
    api_key = config.get("VITE_ELEVENLABS_API_KEY")

    if not agent_id:
        print("❌ Missing VITE_ELEVENLABS_AGENT_ID in .env")
    else:
        print(f"🔹 Found Agent ID: {agent_id[:4]}...{agent_id[-4:] if len(agent_id)>8 else agent_id}")

    if not api_key:
        print("❌ Missing VITE_ELEVENLABS_API_KEY in .env")
    else:
        print(f"🔹 Found API Key: {api_key[:4]}...{api_key[-4:] if len(api_key)>8 else api_key}")

    if not agent_id or not api_key:
        return

    print("\nConnecting to ElevenLabs API...")
    url = f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}"
    headers = {
        "xi-api-key": api_key
    }

    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Agent found: {data.get('name', 'Unknown Name')}")
            print(f"   Agent ID verified: {data.get('agent_id')}")
        elif response.status_code == 401:
            print("❌ ERROR 401: Unauthorized. Your API Key is likely invalid.")
        elif response.status_code == 404:
            print("❌ ERROR 404: Agent not found. The Agent ID is incorrect.")
            print("   Please check the Agent ID on your ElevenLabs dashboard.")
        else:
            print(f"❌ ERROR {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Network Error: {e}")

if __name__ == "__main__":
    check_agent()
