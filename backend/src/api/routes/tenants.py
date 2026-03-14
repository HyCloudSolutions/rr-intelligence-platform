from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from src.db.database import get_db
from src.models.core import Tenant, Establishment, InspectionResult
from src.api.middleware.auth import security, _decode_mock_token, get_current_tenant_id, COGNITO_USER_POOL_ID
import boto3
import os
import uuid

cognito_client = boto3.client('cognito-idp', region_name=os.getenv("AWS_REGION", "us-east-1"))

router = APIRouter(prefix="/api/v1/tenants", tags=["SuperAdmin Tenants"])

class TenantCreate(BaseModel):
    name: str # e.g. "Seattle Public Health"
    contact_email: EmailStr
    tier: str = "Standard"

class TenantResponse(BaseModel):
    id: str
    name: str
    contact_email: str
    tier: str
    
class TenantStats(BaseModel):
    establishment_count: int
    inspection_count: int
    user_count: int # From Cognito or Mock
    created_at: str
    
    class Config:
        from_attributes = True
    
    class Config:
        from_attributes = True

def require_superadmin(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the caller is a system SuperAdmin. (Simplified for MVP)"""
    token = credentials.credentials
    claims = _decode_mock_token(token)
    groups = claims.get("cognito:groups", [])
    
    if "superadmin" not in groups:
        # Strictly enforce role-based access for the SuperAdmin Dashboard
        raise HTTPException(status_code=403, detail="SuperAdmin role required")
    
    return True

@router.post("", response_model=TenantResponse)
def provision_tenant(
    tenant_in: TenantCreate,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(require_superadmin)
):
    """
    SuperAdmin Endpoint: Registers a new municipality / tenant.
    This creates the database root record and in a true deployment, would simultaneously 
    invoke AWS Boto3 to provision their dedicated Cognito User Group & admin account.
    """
    existing = db.query(Tenant).filter(Tenant.name == tenant_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant name already registered.")
        
    new_tenant = Tenant(
        name=tenant_in.name,
        contact_email=tenant_in.contact_email,
        tier=tenant_in.tier
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    tenant_id_str = str(new_tenant.id)
    
    # --- AWS COGNITO ORCHESTRATION ---
    if COGNITO_USER_POOL_ID != "us-east-1_mockpool":
        try:
            director_group = f"Tenant_{tenant_id_str}_Director"
            inspector_group = f"Tenant_{tenant_id_str}_Inspector"
            
            # 1. Create Tenant Groups
            for group in [director_group, inspector_group]:
                try:
                    cognito_client.create_group(
                        GroupName=group,
                        UserPoolId=COGNITO_USER_POOL_ID,
                        Description=f"SaaS Group for Tenant: {new_tenant.name}"
                    )
                except cognito_client.exceptions.GroupExistsException:
                    pass
            
            # 2. Provision Initial Director User
            cognito_client.admin_create_user(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=tenant_in.contact_email,
                UserAttributes=[
                    {'Name': 'email', 'Value': tenant_in.contact_email},
                    {'Name': 'email_verified', 'Value': 'true'},
                    {'Name': 'custom:tenant_id', 'Value': tenant_id_str}
                ],
                TemporaryPassword="TempPass123!",
                MessageAction='SUPPRESS'
            )
            
            # Assign to Director Group
            cognito_client.admin_add_user_to_group(
                UserPoolId=COGNITO_USER_POOL_ID,
                Username=tenant_in.contact_email,
                GroupName=director_group
            )
            
            print(f"DEBUG: Successfully provisioned Cognito identity for {tenant_in.contact_email}")
        except Exception as e:
            print(f"WARNING: Database entry created, but Cognito provisioning failed: {str(e)}")
            # We don't fail the whole request here for 400s/etc unless it's critical
    else:
        print(f"DEBUG: Mocking Cognito provisioning for {tenant_id_str} (Local Dev Mode)")

    return TenantResponse(
        id=tenant_id_str,
        name=new_tenant.name,
        contact_email=new_tenant.contact_email,
        tier=new_tenant.tier
    )
@router.get("", response_model=list[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    is_admin: bool = Depends(require_superadmin)
):
    """
    SuperAdmin Endpoint: Lists all registered tenants.
    """
    try:
        tenants = db.query(Tenant).all()
        responses = []
        
        # Manual mapping to avoid validation/ORM issues
        for t in tenants:
            responses.append(TenantResponse(
                id=str(t.id),
                name=t.name,
                contact_email=t.contact_email,
                tier=t.tier
            ))
        
        # Add mock Chicago if not present
        if not any(t.id == "11111111-1111-1111-1111-111111111111" for t in responses):
            responses.append(TenantResponse(
                id="11111111-1111-1111-1111-111111111111",
                name="City of Chicago (Mock)",
                contact_email="admin@chicago.gov",
                tier="Enterprise"
            ))
            
        return responses
    except Exception as e:
        import traceback
        print(f"ERROR IN LIST_TENANTS: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me", response_model=TenantResponse)
def get_my_tenant(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id)
):
    """
    Returns the current tenant details for the authenticated user.
    """
    import uuid
    try:
        # Convert string tenant_id to UUID if necessary
        try:
            t_uuid = uuid.UUID(tenant_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid tenant ID format")

        tenant = db.query(Tenant).filter(Tenant.id == t_uuid).first()
        
        if not tenant:
            # Local Mock Fallback
            if str(tenant_id) == "11111111-1111-1111-1111-111111111111":
                return TenantResponse(
                    id=str(tenant_id),
                    name="City of Chicago (Mock)",
                    contact_email="admin@chicago.gov",
                    tier="Enterprise"
                )
            raise HTTPException(status_code=404, detail="Tenant not found")
            
        return TenantResponse(
            id=str(tenant.id),
            name=tenant.name,
            contact_email=tenant.contact_email,
            tier=tenant.tier
        )
    except Exception as e:
        import traceback
        print(f"ERROR IN GET_MY_TENANT: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{tenant_id}/stats", response_model=TenantStats)
def get_tenant_stats(
    tenant_id: str,
    db: Session = Depends(get_db),
    is_admin: bool = Depends(require_superadmin)
):
    """
    SuperAdmin Endpoint: Returns high-level statistics for a specific tenant.
    """
    import uuid
    # Imports moved to top
    
    try:
        t_uuid = uuid.UUID(tenant_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    tenant = db.query(Tenant).filter(Tenant.id == t_uuid).first()
    
    # Check if mock Chicago
    if not tenant and tenant_id == "11111111-1111-1111-1111-111111111111":
        return TenantStats(
            establishment_count=450,
            inspection_count=1200,
            user_count=5,
            created_at="2024-01-01T00:00:00Z"
        )

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    est_count = db.query(Establishment).filter(Establishment.tenant_id == t_uuid).count()
    insp_count = db.query(InspectionResult).filter(InspectionResult.tenant_id == t_uuid).count()
    
    # User count logic
    user_count = 0
    if COGNITO_USER_POOL_ID != "us-east-1_mockpool":
        try:
            # Approximate by checking director and inspector groups
            # This is a bit heavy for the MVP but works
            director_group = f"Tenant_{tenant_id}_Director"
            inspector_group = f"Tenant_{tenant_id}_Inspector"
            
            for group in [director_group, inspector_group]:
                try:
                    response = cognito_client.list_users_in_group(
                        UserPoolId=COGNITO_USER_POOL_ID,
                        GroupName=group
                    )
                    users = response.get('Users', [])
                    user_count = int(user_count) + int(len(users))
                except Exception:
                    pass
        except Exception:
            user_count = 1 # Fallback to initial director
    else:
        user_count = 2 # Mock value for local dev

    return TenantStats(
        establishment_count=est_count,
        inspection_count=insp_count,
        user_count=user_count,
        created_at=tenant.created_at.isoformat()
    )
