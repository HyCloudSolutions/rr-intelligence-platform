import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getBackendUrl } from '@/lib/backend';

export async function GET(request: NextRequest) {
    console.log("HISTORY PROXY HIT");
    try {
        const token = await getToken({ req: request });
        console.log("TOKEN RETRIEVED:", token);

        if (!token || !token.tenant_id) {
            console.log("HISTORY PROXY Unauthorized: Missing token or tenant_id");
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
        const historyUrl = `${backendUrl}/api/v1/inspections/history`;
        console.log("HISTORY PROXY Fetching URL:", historyUrl);

        const res = await fetch(historyUrl, {
            headers: {
                'Authorization': authHeader,
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`Backend returned ${res.status} for history`);
            return NextResponse.json(
                { error: 'Failed to fetch history' },
                { status: res.status }
            );
        }

        const data = await res.json();
        console.log("HISTORY PROXY Success, records:", data?.inspections?.length);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Inspection history fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
