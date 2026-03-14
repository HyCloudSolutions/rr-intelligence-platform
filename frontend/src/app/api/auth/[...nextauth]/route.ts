import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import CognitoProvider from "next-auth/providers/cognito";

import crypto from 'crypto';

// In a real application, this would use the CognitoProvider exclusively if Hosted UI is enabled.
// Because Hosted UI is disabled, we execute the `AWSCognitoIdentityProviderService.InitiateAuth` API directly.
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Cognito or Mock Login",
      credentials: {
        username: { label: "Email or Mock Role ('director')", type: "text", placeholder: "Email or Role" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const username = credentials?.username || '';
        const password = credentials?.password || '';
        
        // --- REAL AWS COGNITO LOGIN ---
        // --- REAL AWS COGNITO LOGIN ---
        // Only attempt if we have a real Client ID AND it's not a mock ID
        if (username.includes('@') && process.env.COGNITO_CLIENT_ID && !process.env.COGNITO_CLIENT_ID.startsWith('mock')) {
            try {
                const clientId = process.env.COGNITO_CLIENT_ID;
                const clientSecret = process.env.COGNITO_CLIENT_SECRET || '';
                const region = process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1';
                
                const secretHash = crypto.createHmac('sha256', clientSecret)
                    .update(username + clientId)
                    .digest('base64');
                    
                const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
                    method: 'POST',
                    headers: {
                        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
                        'Content-Type': 'application/x-amz-json-1.1',
                    },
                    body: JSON.stringify({
                        AuthFlow: 'USER_PASSWORD_AUTH',
                        ClientId: clientId,
                        AuthParameters: {
                            USERNAME: username,
                            PASSWORD: password,
                            SECRET_HASH: secretHash
                        }
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Cognito Login Error:", errorData);
                    // Fall back to mock if in local dev
                    if (process.env.COGNITO_USER_POOL_ID === "us-east-1_mockpool") {
                        console.log("Mocking login for email after Cognito failure:", username);
                    } else {
                        throw new Error(errorData.message || 'Cognito authentication failed');
                    }
                } else {
                    const data = await response.json();
                    if (data.AuthenticationResult) {
                        const idTokenPayloadStr = Buffer.from(data.AuthenticationResult.IdToken.split('.')[1], 'base64').toString();
                        const idTokenPayload = JSON.parse(idTokenPayloadStr);
                        const groups = idTokenPayload['cognito:groups'] || [];
                        
                        let role = 'inspector';
                        if (groups.some((g: string) => g.toLowerCase().includes('superadmin'))) role = 'superadmin';
                        else if (groups.some((g: string) => g.toLowerCase().includes('director'))) role = 'director';
                        
                        return {
                            id: idTokenPayload.sub,
                            name: username,
                            email: username,
                            tenant_id: idTokenPayload['custom:tenant_id'],
                            role: role,
                            cognitoAccessToken: data.AuthenticationResult.AccessToken
                        } as any;
                    }
                }
            } catch (err: any) {
                console.error("Auth Exception:", err);
                if (process.env.COGNITO_USER_POOL_ID !== "us-east-1_mockpool") {
                    throw err;
                }
            }
        }
        
        // --- OFFLINE MOCK LOGIN ---
        let role = 'inspector';
        const directorUsernames = ['director', 'seattle', 'chicago'];
        if (directorUsernames.includes(username.toLowerCase()) || username.includes('@')) role = 'director';
        else if (username === 'superadmin') role = 'superadmin';

        let tenant_id = "11111111-1111-1111-1111-111111111111";
        
        // --- BULLETPROOF DEMO MAPPING ---
        const hardcodedMap: any = {
            'seattle@gov.org': 'd9bfd712-e53b-4de4-89d2-d762b49ae507',
            'seattle': 'd9bfd712-e53b-4de4-89d2-d762b49ae507',
            'chicago@gov.org': '11111111-1111-1111-1111-111111111111',
            'chicago': '11111111-1111-1111-1111-111111111111',
            'director': '11111111-1111-1111-1111-111111111111'
        };

        if (hardcodedMap[username.toLowerCase()]) {
            tenant_id = hardcodedMap[username.toLowerCase()];
            console.log(`Mock login: Using hardcoded tenant_id ${tenant_id} for ${username}`);
        } else if (username.includes('@')) {
            // If it's a real onboarded email NOT in the map, try to resolve it from the DB
            try {
                const { execSync } = require('child_process');
                const projectRoot = '/Users/simonadediran/Library/CloudStorage/OneDrive-Personal/aiprojects/rr-intelligence-platform';
                const cmd = `cd ${projectRoot}/backend && source .venv/bin/activate && PYTHONPATH=. python -c "from src.db.database import SessionLocal; from src.models.core import Tenant; db=SessionLocal(); t=db.query(Tenant).filter(Tenant.contact_email=='${username}').first(); print(t.id if t else '')"`;
                const resolvedId = execSync(cmd, { shell: '/bin/zsh', encoding: 'utf8' }).trim();
                
                if (resolvedId) {
                    tenant_id = resolvedId;
                    console.log(`Mock login: Resolved tenant_id ${tenant_id} from DB for ${username}`);
                }
            } catch (e) {
                console.warn(`Mock login: DB lookup failed for ${username}, sticking to Chicago.`, e);
            }
        }

        return {
          id: "1",
          name: username.includes('@') ? username.split('@')[0] : "Local Tester",
          email: username.includes('@') ? username : `${role}@rr-local.test`,
          tenant_id: tenant_id,
          role: role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.tenant_id = user.tenant_id;
        token.role = user.role;
        token.cognitoAccessToken = user.cognitoAccessToken;
      }
      if (account) {
        if (token.cognitoAccessToken) {
          token.accessToken = token.cognitoAccessToken;
        } else {
          // Synthetic mock token
          const syntheticToken = JSON.stringify({ "custom:tenant_id": token.tenant_id, "cognito:groups": [token.role] });
          token.accessToken = `header.${Buffer.from(syntheticToken).toString('base64')}.signature`;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.tenant_id = token.tenant_id;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
