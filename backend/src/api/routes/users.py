from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import boto3
import os

from src.db.database import get_db
from src.api.middleware.auth import security, _decode_mock_token, get_current_tenant_id, COGNITO_USER_POOL_ID

cognito_client = boto3.client('cognito-idp', region_name=os.getenv("AWS_REGION", "us-east-1"))

router = APIRouter(prefix="/api/v1/users", tags=["User Management"])

class InspectorCreate(BaseModel):
    email: EmailStr
    password: str

class InspectorResponse(BaseModel):
    id: str
    email: str
    status: str
    created_at: str

def require_director(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the caller is a Director."""
    token = credentials.credentials
    claims = _decode_mock_token(token)
    groups = claims.get("cognito:groups", [])
    
    # Accept either "director" (mock) or "Tenant_XXX_Director" (real)
    is_director = any(g.lower() == "director" or g.endswith("_Director") for g in groups)
    if not is_director:
        raise HTTPException(status_code=403, detail="Director role required")
    return True

@router.get("/inspectors", response_model=list[InspectorResponse])
def list_inspectors(
    tenant_id: str = Depends(get_current_tenant_id),
    is_director: bool = Depends(require_director)
):
    """
    Returns a list of Inspector users for the active tenant.
    """
    if COGNITO_USER_POOL_ID == "us-east-1_mockpool":
        return [
            InspectorResponse(id="mock-1", email="inspector1@mock.gov", status="CONFIRMED", created_at="2024-01-01T00:00:00Z"),
            InspectorResponse(id="mock-2", email="inspector2@mock.gov", status="CONFIRMED", created_at="2024-01-02T00:00:00Z")
        ]
        
    try:
        inspector_group = f"Tenant_{tenant_id}_Inspector"
        response = cognito_client.list_users_in_group(
            UserPoolId=COGNITO_USER_POOL_ID,
            GroupName=inspector_group
        )
        
        users = []
        for user in response.get('Users', []):
            email = next((attr['Value'] for attr in user['Attributes'] if attr['Name'] == 'email'), user['Username'])
            users.append({
                "id": next((attr['Value'] for attr in user['Attributes'] if attr['Name'] == 'sub'), user['Username']),
                "email": email,
                "status": user.get('UserStatus', 'UNKNOWN'),
                "created_at": str(user.get('UserCreateDate', ''))
            })
            
        return users
    except Exception as e:
        print(f"Error fetching inspectors: {e}")
        raise HTTPException(status_code=500, detail="Could not list inspectors")

@router.post("/inspectors", response_model=InspectorResponse)
def create_inspector(
    inspector: InspectorCreate,
    tenant_id: str = Depends(get_current_tenant_id),
    is_director: bool = Depends(require_director)
):
    """
    Creates a new Inspector user constrainted to a maximum of 50 per tenant.
    """
    if COGNITO_USER_POOL_ID == "us-east-1_mockpool":
        return InspectorResponse(
            id="mock-new", 
            email=inspector.email, 
            status="CONFIRMED", 
            created_at="2024-01-01T00:00:00Z"
        )
        
    try:
        inspector_group = f"Tenant_{tenant_id}_Inspector"
        
        # 1. Check Limits
        try:
            response = cognito_client.list_users_in_group(
                UserPoolId=COGNITO_USER_POOL_ID,
                GroupName=inspector_group,
                Limit=60
            )
            if len(response.get('Users', [])) >= 50:
                raise HTTPException(status_code=400, detail="Maximum inspector limit (50) reached for this tenant.")
        except cognito_client.exceptions.ResourceNotFoundException:
            # Group doesn't exist yet, we'll create it
            cognito_client.create_group(
                GroupName=inspector_group,
                UserPoolId=COGNITO_USER_POOL_ID,
                Description=f"Inspectors for Tenant: {tenant_id}"
            )
            
        # 2. Create User
        try:
            create_response = cognito_client.admin_create_user(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=inspector.email,
                UserAttributes=[
                    {'Name': 'email', 'Value': inspector.email},
                    {'Name': 'email_verified', 'Value': 'true'},
                    {'Name': 'custom:tenant_id', 'Value': str(tenant_id)}
                ],
                MessageAction='SUPPRESS'
            )
            
            # 3. Set Permanent Password
            cognito_client.admin_set_user_password(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=inspector.email,
                Password=inspector.password,
                Permanent=True
            )
            
            # 4. Add to Role Group
            cognito_client.admin_add_user_to_group(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=inspector.email,
                GroupName=inspector_group
            )
            
            user_sub = next((attr['Value'] for attr in create_response['User']['Attributes'] if attr['Name'] == 'sub'), inspector.email)
            date = str(create_response['User']['UserCreateDate'])
            
            return InspectorResponse(
                id=user_sub,
                email=inspector.email,
                status="FORCE_CHANGE_PASSWORD" if False else "CONFIRMED", # Simplified
                created_at=date
            )
            
        except cognito_client.exceptions.UsernameExistsException:
            raise HTTPException(status_code=400, detail="A user with this email already exists.")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating inspector: {e}")
        raise HTTPException(status_code=500, detail=str(e))
