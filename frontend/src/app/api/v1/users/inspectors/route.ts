import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBackendUrl } from '@/lib/backend';

export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });

        if (!token || !token.tenant_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let authHeader = `Bearer ${token.accessToken}`;
        
        if (!token.cognitoAccessToken) {
            const payload = Buffer.from(JSON.stringify({
                "custom:tenant_id": token.tenant_id,
                "cognito:groups": [token.role || "inspector"]
            })).toString('base64');
            const mockJwt = `mockheader.${payload}.mocksignature`;
            authHeader = `Bearer ${mockJwt}`;
        }

        const backendUrl = getBackendUrl();
        const url = `${backendUrl}/api/v1/users/inspectors`;

        const res = await fetch(url, {
            headers: { 'Authorization': authHeader },
            cache: 'no-store'
        });

        const data = await res.json();
        if (!res.ok) return NextResponse.json(data, { status: res.status });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Inspector fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request });

        if (!token || !token.tenant_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let authHeader = `Bearer ${token.accessToken}`;
        
        if (!token.cognitoAccessToken) {
            const payload = Buffer.from(JSON.stringify({
                "custom:tenant_id": token.tenant_id,
                "cognito:groups": [token.role || "inspector"]
            })).toString('base64');
            const mockJwt = `mockheader.${payload}.mocksignature`;
            authHeader = `Bearer ${mockJwt}`;
        }

        const body = await request.json();
        const backendUrl = getBackendUrl();
        const url = `${backendUrl}/api/v1/users/inspectors`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) return NextResponse.json(data, { status: res.status });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Inspector creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
