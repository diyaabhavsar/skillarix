import requests
from app.config import settings

# Test PATCH permission on agent_180...
agent_id = "agent_1801kcez4jh8ftd84f66aynagekd"  # mcp vapi
url = f'https://api.elevenlabs.io/v1/convai/agents/{agent_id}'
headers = {
    'xi-api-key': settings.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
}
payload = {
    'conversation_config': {
        'agent': {
            'prompt': {
                'prompt': 'Test prompt update'
            }
        }
    }
}

print(f"Testing PATCH on agent: {agent_id}")
r = requests.patch(url, json=payload, headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")
