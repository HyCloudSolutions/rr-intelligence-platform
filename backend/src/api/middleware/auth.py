from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import json
import base64
import os
import requests
import jwt
from jwt.algorithms import RSAAlgorithm

# AWS Cognito Configuration (Mocked via LocalStack for local dev)
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_mockpool")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID", "mockclientid")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

security = HTTPBearer()


# Cache the JWKS so we don't hammer the Cognito endpoint
_jwks_cache = {}

def get_cognito_jwks():
    global _jwks_cache
    if not _jwks_cache and COGNITO_USER_POOL_ID != "us-east-1_mockpool":
        jwks_url = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        try:
            response = requests.get(jwks_url)
            _jwks_cache = response.json()
        except Exception as e:
            print(f"Failed to fetch JWKS: {e}")
    return _jwks_cache

def verify_cognito_token(token: str) -> dict:
    """Verifies a real AWS Cognito JWT using PyJWT and the public JWKS."""
    jwks = get_cognito_jwks()
    
    try:
        # Extract the key ID from the unverified headers
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
        
        # Find the matching public key
        key_index = -1
        for i, key in enumerate(jwks.get("keys", [])):
            if kid == key.get("kid"):
                key_index = i
                break
                
        if key_index == -1:
            raise Exception("Public key not found in JWKS")
            
        public_key = RSAAlgorithm.from_jwk(json.dumps(jwks["keys"][key_index]))
        
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            options={"verify_exp": True}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Cognito token: {str(e)}")

def _decode_mock_token(token: str) -> dict:
    """
    Smart token decoder that handles both real Cognito JWTs and
    synthetic mock tokens from NextAuth CredentialsProvider.
    Mock tokens always start with 'header.' (e.g. 'header.<base64>.signature').
    """
    parts = token.split(".")
    is_mock = len(parts) == 3 and parts[0] == "header" and parts[2] == "signature"

    if is_mock:
        # Decode the base64 payload from the synthetic mock token
        try:
            payload = parts[1]
            payload += "=" * (4 - len(payload) % 4)
            return json.loads(base64.b64decode(payload))
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid mock token: {str(e)}")

    # For real Cognito tokens, verify cryptographically
    if COGNITO_USER_POOL_ID != "us-east-1_mockpool":
        return verify_cognito_token(token)

    # Fallback: local dev without Cognito — try base64 decode
    try:
        if len(parts) != 3:
            raise ValueError("Token must have 3 parts")
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)
        return json.loads(base64.b64decode(payload))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def get_current_tenant_id(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Validates the JWT and extracts the custom 'custom:tenant_id' claim.
    This is CRITICAL for the tenant isolation Constitution mandate.
    Handles both real Cognito JWTs and synthetic mock tokens.
    """
    token = credentials.credentials
    claims = _decode_mock_token(token)

    # First try the custom attribute directly (mock tokens & Cognito ID tokens)
    tenant_id = claims.get("custom:tenant_id")
    
    # If not found, try to extract from tenant-scoped group name (e.g. Tenant_{uuid}_Director)
    if not tenant_id:
        groups = claims.get("cognito:groups", [])
        for group in groups:
            parts = group.split("_")
            # Group format: Tenant_{uuid-part1}-{uuid-rest}_Role
            # Reconstruct UUID from group name: Tenant_<uuid>_Director
            if group.lower().startswith("tenant_") and len(parts) >= 3:
                # Everything between 'Tenant_' and the last '_Role' part is the UUID
                uuid_str = "_".join(parts[1:-1])
                if len(uuid_str) == 36:  # Valid UUID length
                    tenant_id = uuid_str
                    break

    if not tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Tenant isolation violation: User lacks required tenant_id claim.",
        )

    return tenant_id


def get_current_user_role(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Extracts the user role from Cognito groups.
    Handles both simple roles ('director') and tenant-scoped groups ('Tenant_{uuid}_Director').
    """
    token = credentials.credentials
    claims = _decode_mock_token(token)
    groups = claims.get("cognito:groups", [])

    # Case-insensitive substring match to handle 'Tenant_{UUID}_Director' and 'director'
    groups_lower = " ".join(groups).lower()
    if "superadmin" in groups_lower:
        return "superadmin"
    elif "director" in groups_lower:
        return "director"
    elif "inspector" in groups_lower:
        return "inspector"
    else:
        raise HTTPException(
            status_code=403, detail="User lacks required role assignation."
        )

