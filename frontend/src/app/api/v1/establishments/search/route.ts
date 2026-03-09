import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request });

        if (!token || !token.tenant_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // The FastAPI backend's `_decode_mock_token` expects:
        // header.{base64_payload}.signature
        // We construct a compliant mock token with the next-auth token payload
        const payload = Buffer.from(JSON.stringify({
            "custom:tenant_id": token.tenant_id,
            "cognito:groups": [token.role || "inspector"]
        })).toString('base64');
        const mockJwt = `mockheader.${payload}.mocksignature`;
        const authHeader = `Bearer ${mockJwt}`;

        // Get the search query from the incoming request URL
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        // Override NEXT_PUBLIC_API_URL which points to localhost, because from inside this
        // Next.js server-side route running in Docker, the backend is only reachable at 'backend'
        const backendUrl = 'http://backend:8000';
        const searchUrl = `${backendUrl}/api/v1/establishments/search${query ? `?query=${encodeURIComponent(query)}` : ''}`;

        const res = await fetch(searchUrl, {
            headers: {
                'Authorization': authHeader,
            },
            // Disable caching to assure fresh data
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`Backend returned ${res.status} for search`);
            return NextResponse.json(
                { error: 'Failed to fetch establishments' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Establishment search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
