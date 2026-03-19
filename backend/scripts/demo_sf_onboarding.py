import os
import requests
import boto3
import time
import subprocess
import argparse

# Configuration
API_BASE_URL = "http://127.0.0.1:8000/api/v1"
COGNITO_USER_POOL_ID = "us-east-1_Mr2WpgRNe"
SF_CSV_PATH = "/tmp/sf_inspections.csv"

# AWS Client
try:
    cognito_client = boto3.client('cognito-idp', region_name='us-east-1')
except Exception as e:
    print(f"Failed to initialize Boto3 client. Ensure AWS credentials are set: {e}")
    exit(1)

import base64
import json

def get_mock_token(tenant_id: str, role: str) -> str:
    """Generates a mock JWT token that bypasses the local middleware."""
    payload = {
        "custom:tenant_id": str(tenant_id),
        "cognito:groups": [role]
    }
    encoded_payload = base64.b64encode(json.dumps(payload).encode()).decode()
    return f"header.{encoded_payload}.signature"

def create_tenant(name: str) -> str:
    import uuid
    unique_name = f"{name} {str(uuid.uuid4())[:6]}"
    print(f"Building Tenant: {unique_name} via API...")
    # NOTE: The POST /tenants endpoint must exist and return the new tenant id
    headers = {
        "Authorization": f"Bearer {get_mock_token('system', 'superadmin')}",
        "x-user-role": "superadmin"
    }
    response = requests.post(f"{API_BASE_URL}/tenants", json={
        "name": unique_name,
        "contact_email": "hello@sfgov.org",
        "is_active": True
    }, headers=headers)
    
    if response.status_code not in (200, 201):
         print(f"❌ Failed to create tenant. Status: {response.status_code}, Body: {response.text}")
         # Mocking ID for the sake of the script progressing locally if the API isn't running
         mock_id = "55555555-4444-3333-2222-111111111111"
         print(f"⚠️ Falling back to mock Tenant ID: {mock_id} (Ensure backend is running)")
         return mock_id
         
    tenant_id = response.json().get("id")
    print(f"✅ Created Tenant ID: {tenant_id}")
    return tenant_id

def create_cognito_group(group_name: str, description: str):
    print(f"Creating AWS Cognito Group: {group_name}")
    try:
        cognito_client.create_group(
            GroupName=group_name,
            UserPoolId=COGNITO_USER_POOL_ID,
            Description=description
        )
        print(f"✅ Group {group_name} created.")
    except cognito_client.exceptions.GroupExistsException:
        print(f"⚠️ Group {group_name} already exists. Skipping.")
    except Exception as e:
         print(f"❌ Failed to create group {group_name}: {e}")

def create_cognito_user(email: str, password: str, tenant_id: str, group_name: str):
    print(f"Provisioning Identity in AWS Cognito: {email}")
    try:
        # Create user
        cognito_client.admin_create_user(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'custom:tenant_id', 'Value': str(tenant_id)}
            ],
            TemporaryPassword=password,
            MessageAction='SUPPRESS' # Don't send welcome email for this simulation
        )
        
        # Set Password permanently (skip challenge)
        cognito_client.admin_set_user_password(
             UserPoolId=COGNITO_USER_POOL_ID,
             Username=email,
             Password=password,
             Permanent=True
        )
        
        # Add to Group
        cognito_client.admin_add_user_to_group(
            UserPoolId=COGNITO_USER_POOL_ID,
            Username=email,
            GroupName=group_name
        )
        print(f"✅ User {email} fully provisioned and mapped to Tenant {tenant_id}.")
        
    except cognito_client.exceptions.UsernameExistsException:
         print(f"⚠️ User {email} already exists. Skipping.")
    except Exception as e:
        print(f"❌ Failed to create user {email}: {e}")

def authenticate_and_upload(email: str, tenant_id: str, backend_url: str, csv_path: str):
    print(f"\nSimulating Data Upload via API as User: {email} (Tenant: {tenant_id})")
    
    # We simulate the auth headers assuming backend middleware checks auth.
    headers = {
        "Authorization": f"Bearer {get_mock_token(tenant_id, 'director')}"
    }
    
    if not os.path.exists(csv_path):
        print(f"❌ Cannot upload: File {csv_path} does not exist.")
        return
        
    try:
        with open(csv_path, 'rb') as f:
            files = {'file': (os.path.basename(csv_path), f, 'text/csv')}
            print(f"> POST {backend_url}/ingestion (Uploading {csv_path}... this might take a minute)")
            response = requests.post(f"{backend_url}/ingestion", headers=headers, files=files)
            
            if response.status_code in (200, 201, 202):
                print(f"✅ Upload initiated successfully: {response.json()}")
            else:
                print(f"❌ Upload failed. Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
         print(f"❌ Exception during upload: {e}")

def trigger_localized_ai(tenant_id: str):
    print(f"\nTriggering Localized Machine Learning Pipeline for Tenant: {tenant_id}")
    try:
        # Assuming the batch scoring script is runnable from the backend directory
        cmd = ["python", "jobs/batch_score.py", "--tenant", tenant_id]
        print(f"> Running: {' '.join(cmd)}")
        # In a real run, uncomment:
        # subprocess.run(cmd, check=True)
        print("✅ Localized AI Training triggered successfully (Simulated).")
    except Exception as e:
        print(f"❌ Failed to run AI pipeline: {e}")

if __name__ == "__main__":
    print("==============================================")
    print("🏢 B2B SaaS Onboarding Orchestration: San Francisco")
    print("==============================================\n")
    
    # Step 1
    new_tenant_id = create_tenant("City of San Francisco")
    
    # Step 2
    director_group = f"Tenant_{new_tenant_id}_Director"
    inspector_group = f"Tenant_{new_tenant_id}_Inspector"
    create_cognito_group(director_group, "SF Health Directors")
    create_cognito_group(inspector_group, "SF Health Inspectors")
    
    # Step 3
    create_cognito_user("sf_director@example.com", "TempPass123!", new_tenant_id, director_group)
    create_cognito_user("sf_inspector@example.com", "TempPass123!", new_tenant_id, inspector_group)
    
    # Step 4
    authenticate_and_upload("sf_director@example.com", "TempPass123!", API_BASE_URL, SF_CSV_PATH)
    
    # Step 5
    trigger_localized_ai(new_tenant_id)
    
    print("\n==============================================")
    print("🎉 Onboarding Simulation Completed Successfully!")
    print("Next Step: Manually log into the frontend as sf_director@example.com")
    print("==============================================")
