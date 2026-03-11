import requests

new_key = "sk_97c8c1b475f42efa101442d7177e1fd8048f5a22816d7b33"

# List all agents available to this key
url = 'https://api.elevenlabs.io/v1/convai/agents'
headers = {'xi-api-key': new_key}

print("Fetching agents for new API key...")
r = requests.get(url, headers=headers)
print(f"Status: {r.status_code}")

if r.status_code == 200:
    agents = r.json().get('agents', [])
    print(f"\n✅ Found {len(agents)} agents:")
    for agent in agents:
        print(f"  - ID: {agent['agent_id']}")
        print(f"    Name: {agent['name']}")
        print()
else:
    print(f"❌ Error: {r.text}")
