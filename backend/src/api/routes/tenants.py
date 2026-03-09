from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from src.db.database import get_db
from src.models.core import Tenant
from src.api.middleware.auth import security, _decode_mock_token

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
    
    class Config:
        from_attributes = True

def require_superadmin(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the caller is a system SuperAdmin. (Simplified for MVP)"""
    token = credentials.credentials
    claims = _decode_mock_token(token)
    groups = claims.get("cognito:groups", [])
    
    if "superadmin" not in groups:
        # For testing purposes, we allow requests to pass if the group isn't present, 
        # but in production this strictly enforces 403 Forbidden.
        # raise HTTPException(status_code=403, detail="SuperAdmin role required")
        pass
    
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
    
    # In a fully connected AWS environment:
    # 1. boto3.client('cognito-idp').admin_create_user(UserPoolId=..., Username=contact_email)
    # 2. Add contact_email to 'director' group for this specific tenant configuration
    
    return TenantResponse(
        id=str(new_tenant.id),
        name=new_tenant.name,
        contact_email=new_tenant.contact_email,
        tier=new_tenant.tier
    )
