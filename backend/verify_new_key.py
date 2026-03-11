import requests

# Test the new API key
new_key = "sk_97c8c1b475f42efa101442d7177e1fd8048f5a22816d7b33"
agent_id = "agent_0401kc8j8c2qes5ajarwtg0jm8y3"

# Test PATCH permission
url = f'https://api.elevenlabs.io/v1/convai/agents/{agent_id}'
headers = {
    'xi-api-key': new_key,
    'Content-Type': 'application/json'
}
payload = {
    'conversation_config': {
        'agent': {
            'prompt': {
                'prompt': 'Test prompt - verifying write access'
            }
        }
    }
}

print(f"Testing new API key on agent: {agent_id}")
r = requests.patch(url, json=payload, headers=headers)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    print("✅ SUCCESS! New API key has write permissions!")
else:
    print(f"❌ Error: {r.text[:500]}")
