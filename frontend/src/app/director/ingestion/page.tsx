'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

export default function IngestionPage() {
    const { data: session } = useSession();
    
    const apiUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '/api/backend') : (process.env.INTERNAL_API_URL || 'http://localhost:8000');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<boolean | string>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [statusData, setStatusData] = useState<any>(null);

    const [polling, setPolling] = useState(false);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !session) return;

        setUploading(true);
        setSuccess(false);
        setErrorMsg(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/v1/ingestion`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "Upload failed");
            }
            const data = await res.json();
            setJobId(data.job_id);
            setSuccess(data.message || "Upload successful. Records queued for processing.");
            setFile(null);
        } catch (err: any) {
            console.error("Ingestion error:", err);
            setErrorMsg(err.message || "An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    // Polling useEffect
    useEffect(() => {
        if (!jobId || !session?.accessToken) return;

        setStatusData({ status: "processing", processed: 0, rows_total: 0, errors: 0 });

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/v1/ingestion/status/${jobId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                if (res.ok) {
                    const status = await res.json();
                    setStatusData(status);
                    if (status.status === 'completed' || status.status === 'failed') {
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, session?.accessToken]);

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-neutral-900 mb-6">Data Ingestion Portal</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Historical CSV Upload</CardTitle>
                        <CardDescription>
                            Upload bulk historical licensing or inspection records to prime the ML engine.
                            Only standard City/County formatted CSVs are supported.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-10 text-center hover:bg-neutral-50 transition-colors">
                                <Label htmlFor="csv-upload" className="cursor-pointer block">
                                    <div className="mx-auto h-12 w-12 text-neutral-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                    </div>
                                    <span className="mt-2 block text-sm font-semibold text-neutral-900">
                                        {file ? file.name : "Select a CSV file to upload"}
                                    </span>
                                </Label>
                                <Input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            {success && (
                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-md text-sm font-medium border border-emerald-200">
                                    {typeof success === 'string' ? success : "Upload successful."}
                                </div>
                            )}

                            {statusData && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">Processing Job: <code className="bg-slate-100 px-1 rounded">{jobId?.slice(0,8)}...</code></span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusData.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : statusData.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800 animate-pulse'}`}>
                                            {statusData.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className={`h-2 rounded-full bg-blue-600 transition-all duration-500`} style={{ width: `${statusData.rows_total > 0 ? (statusData.processed / statusData.rows_total) * 100 : 0}%` }} />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Processed: {statusData.processed} / {statusData.rows_total}</span>
                                        {statusData.errors > 0 && <span className="text-red-500">Errors: {statusData.errors}</span>}
                                    </div>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm font-medium border border-red-200">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={!file || uploading} className="min-w-32">
                                    {uploading ? "Uploading..." : "Start Ingestion"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
