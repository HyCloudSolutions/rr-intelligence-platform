'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";

export default function SuperAdminPortal() {
    const { data: session } = useSession();
    const [name, setName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ id?: string, msg?: string, error?: boolean } | null>(null);

    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !session) return;

        setLoading(true);
        setResult(null);

        try {
            const mockJwt = session.accessToken as string;
            const apiUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:8000';

            const res = await fetch(`${apiUrl}/api/v1/tenants`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${mockJwt}`
                },
                body: JSON.stringify({ name, contact_email: contactEmail || "admin@example.com", license_tier: "enterprise" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Provisioning failed");
            }

            setResult({ id: data.id, msg: `Successfully provisioned tenant: ${data.name}` });
            setName("");
            setContactEmail("");
        } catch (err: any) {
            setResult({ error: true, msg: err.message || "An error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center">

            <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-600 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83m0 0l2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    </span>
                    B2B SuperAdmin Control Plane
                </h1>

                <Button variant="outline" className="text-slate-900" onClick={() => signOut({ callbackUrl: '/login' })}>
                    Sign Out
                </Button>
            </div>

            <Card className="w-full max-w-4xl bg-slate-800 border-slate-700 text-white">
                <CardHeader>
                    <CardTitle className="text-xl">Tenant Provisioning</CardTitle>
                    <CardDescription className="text-slate-400">
                        Register a new SaaS municipality. This creates an isolated database schema, dedicated S3 bucket paths, and standard machine learning orchestration pipelines.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProvision} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-300">Municipality / Tenant Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    placeholder="e.g. City of Chicago"
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Admin Contact Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder="health@chicago.gov"
                                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {result && (
                            <div className={`p-4 rounded-md text-sm font-medium border ${result.error ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-emerald-900/50 text-emerald-200 border-emerald-800'}`}>
                                {result.msg}
                                {result.id && <div className="mt-2 font-mono text-xs opacity-70">Tenant ID: {result.id}</div>}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={!name || loading} className="min-w-32 bg-indigo-600 hover:bg-indigo-700 text-white">
                                {loading ? "Provisioning Engine..." : "Provision SaaS Tenant"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
