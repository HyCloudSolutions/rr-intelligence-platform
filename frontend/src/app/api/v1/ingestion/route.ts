import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader) {
             return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/v1/ingestion`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            },
            body: formData,
            // Disable NEXT caching for this request
            cache: 'no-store'
        });

        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Ingestion proxy error:", error);
        return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
}
