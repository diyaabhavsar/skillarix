import requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGQ3YTZhMTQ1N2U2ZjM5YTc4NzA5MyIsInJvbGUiOiJzYWxlc21hbiJ9.0KJTMpshE7rptLVOUpgiEXu-1NxgcKF8kO6AuEPWgd8"
headers = {"Authorization": f"Bearer {TOKEN}"}

response = requests.get("http://localhost:8070/api/v1/gamification/profile", headers=headers)
print("Status Code:", response.status_code)
try:
    print("JSON:", response.json())
except:
    print("Content:", response.text)
