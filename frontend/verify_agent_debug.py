
import os
import requests
import json

env_path = ".env"

def check_agent_debug():
    config = {}
    content = ""
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
    except:
        try:
             with open(env_path, "r", encoding="utf-16") as f:
                content = f.read()
        except:
             return

    # Parse simplified
    for line in content.splitlines():
        if "=" in line and not line.strip().startswith("#"):
             k,v = line.split("=", 1)
             config[k.strip()] = v.strip()

    agent_id = config.get("VITE_ELEVENLABS_AGENT_ID")
    api_key = config.get("VITE_ELEVENLABS_API_KEY")

    if not agent_id:
        print("NO AGENT ID")
        return

    print(f"Checking Agent: {agent_id}")
    
    url = f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}"
    headers = {
        "xi-api-key": api_key
    }
    
    # Debug info
    print(f"Request URL: {url}")
    # Mask API key for safety
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if api_key else "None"
    print(f"Using API Key: {masked_key}")

    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_agent_debug()
