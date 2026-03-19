"""
Cognito User Cache — provides a TTL-cached mapping of Cognito sub → email/name.
Used by dashboard.py and other endpoints to resolve inspector IDs to names.
"""
import boto3
import os
import time
from typing import Dict, Optional

COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_mockpool")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

_cache: Dict[str, str] = {}
_cache_timestamp: float = 0
_CACHE_TTL_SECONDS = 300  # 5 minutes


def _refresh_cache():
    """Fetches all users from Cognito and builds a sub → display_name map."""
    global _cache, _cache_timestamp

    if COGNITO_USER_POOL_ID == "us-east-1_mockpool":
        _cache = {}
        _cache_timestamp = time.time()
        return

    client = boto3.client("cognito-idp", region_name=AWS_REGION)
    user_map: Dict[str, str] = {}

    try:
        paginator = client.get_paginator("list_users")
        for page in paginator.paginate(UserPoolId=COGNITO_USER_POOL_ID):
            for user in page.get("Users", []):
                attrs = {a["Name"]: a["Value"] for a in user.get("Attributes", [])}
                sub = attrs.get("sub", user["Username"])
                # Prefer given_name + family_name, fallback to email, then username
                given = attrs.get("given_name", "")
                family = attrs.get("family_name", "")
                if given and family:
                    display = f"{given} {family}"
                elif attrs.get("email"):
                    display = attrs["email"].split("@")[0].replace(".", " ").title()
                else:
                    display = user["Username"]
                user_map[sub] = display
    except Exception as e:
        print(f"Cognito cache refresh failed: {e}")

    _cache = user_map
    _cache_timestamp = time.time()


def get_user_map() -> Dict[str, str]:
    """Returns {cognito_sub: display_name} with TTL caching."""
    if time.time() - _cache_timestamp > _CACHE_TTL_SECONDS:
        _refresh_cache()
    return _cache


def get_display_name(sub: str) -> Optional[str]:
    """Resolves a single Cognito sub to a display name."""
    user_map = get_user_map()
    return user_map.get(sub)
