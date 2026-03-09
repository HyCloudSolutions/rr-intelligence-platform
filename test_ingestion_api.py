import requests
import json
import base64
import sys

# The synthetic NextAuth token to simulate a logged-in Director for the local test tenant
tenant_id = "11111111-1111-1111-1111-111111111111"
synthetic_token = json.dumps({"custom:tenant_id": tenant_id, "cognito:groups": ["director"]})
mock_jwt = f"header.{base64.b64encode(synthetic_token.encode()).decode()}.signature"

url = "http://localhost:8000/api/v1/ingestion"
headers = {
    "Authorization": f"Bearer {mock_jwt}"
}

# The CSV file created by Antigravity in the host workspace is mounted into /app in the backend
files = {
    "file": ("test_ingestion.csv", open("/app/test_ingestion.csv", "rb"), "text/csv")
}

try:
    print(f"POSTing /api/v1/ingestion as Tenant: {tenant_id}")
    response = requests.post(url, headers=headers, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
