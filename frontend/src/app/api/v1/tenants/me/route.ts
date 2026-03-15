import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });

        if (!token || !token.tenant_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // IMPORTANT: We use the real AWS Cognito JWT token if it exists.
        // It provides the true tenant context and role claims to the backend.
        let authHeader = `Bearer ${token.accessToken}`;
        
        if (!token.cognitoAccessToken) {
            // Local dev fallback using mock token structure
            const payload = Buffer.from(JSON.stringify({
                "custom:tenant_id": token.tenant_id,
                "cognito:groups": [token.role || "inspector"]
            })).toString('base64');
            const mockJwt = `mockheader.${payload}.mocksignature`;
            authHeader = `Bearer ${mockJwt}`;
        }

        // Use INTERNAL_API_URL from environment or fallback
        const backendUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000';
        const tenantUrl = `${backendUrl}/api/v1/tenants/me`;

        const res = await fetch(tenantUrl, {
            headers: {
                'Authorization': authHeader,
            },
            // Disable caching to assure fresh data
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`Backend returned ${res.status} for tenant info`);
            return NextResponse.json(
                { error: 'Failed to fetch tenant info' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Tenant info error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
