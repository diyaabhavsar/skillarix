import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import requests
from dotenv import load_dotenv

load_dotenv(".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY")
AGENT_ID = os.getenv("AGENT_ID")

def verify_elevenlabs():
    print(f"Checking ElevenLabs Connection...", flush=True)
    print(f"Loaded API Key Length: {len(str(API_KEY)) if API_KEY else 0}", flush=True)
    print(f"API Key (masked): {API_KEY[:5]}...{API_KEY[-4:] if API_KEY else 'None'}", flush=True)
    print(f"Agent ID: {AGENT_ID}", flush=True)

    if not API_KEY:
        print("❌ Error: ELEVENLABS_API_KEY is missing in .env", flush=True)
        return

    # 1. Check User Subscription / Account Info
    url = "https://api.elevenlabs.io/v1/user"
    headers = {"xi-api-key": API_KEY}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            sub_info = data.get("subscription", {})
            print("\n✅ API Key is VALID!", flush=True)
            print(f"   User: {data.get('email', 'Unknown')}", flush=True)
            print(f"   Tier: {sub_info.get('tier', 'Unknown')}", flush=True)
            print(f"   Status: {sub_info.get('status', 'Unknown')}", flush=True)
            print(f"   Character Count: {sub_info.get('character_count', 0)}", flush=True)
            print(f"   Character Limit: {sub_info.get('character_limit', 0)}", flush=True)
        else:
            print(f"\n❌ API Key Check Failed: {response.status_code}", flush=True)
            print(f"   Response: {response.text}", flush=True)
            return
    except Exception as e:
        print(f"\n❌ Connection Error: {e}", flush=True)
        return

    # 2. Check Agent Existence (if Agent ID is set)
    if AGENT_ID:
        agent_url = f"https://api.elevenlabs.io/v1/convai/agents/{AGENT_ID}"
        try:
            agent_response = requests.get(agent_url, headers=headers)
            if agent_response.status_code == 200:
                agent_data = agent_response.json()
                print(f"\n✅ Agent ID is VALID!", flush=True)
                print(f"   Agent Name: {agent_data.get('name', 'Unknown')}", flush=True)
                print(f"   Agent ID: {agent_data.get('agent_id')}", flush=True)
            else:
                print(f"\n⚠️ Agent ID Check Failed: {agent_response.status_code}", flush=True)
                print(f"   Response: {agent_response.text}", flush=True)
                print("   (The API Key is valid, but this specific Agent ID might be wrong or belong to another account.)", flush=True)
        except Exception as e:
            print(f"❌ Agent Check Error: {e}", flush=True)

if __name__ == "__main__":
    verify_elevenlabs()
