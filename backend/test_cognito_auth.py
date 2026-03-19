import boto3
import hmac
import hashlib
import base64
import os

client_id = "2bgv6ufor604cjp65l5vefo9v9"
client_secret = "15k5uofb0cc8l3c5ledaena3jfqsnkptsba91t41tureia4t1num"
username = "sf_director@example.com"
password = "TempPass123!"

msg = username + client_id
secret_hash = base64.b64encode(hmac.new(client_secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()).decode('utf-8')

import requests
response = requests.post(
    "https://cognito-idp.us-east-1.amazonaws.com/",
    headers={"X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth", "Content-Type": "application/x-amz-json-1.1"},
    json={
        "AuthFlow": "USER_PASSWORD_AUTH",
        "ClientId": client_id,
        "AuthParameters": {
            "USERNAME": username,
            "PASSWORD": password,
            "SECRET_HASH": secret_hash
        }
    }
)
print(response.json())
