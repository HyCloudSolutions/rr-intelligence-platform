import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { DirectorQueueClient } from "./DirectorQueueClient";
import { getBackendUrl } from "@/lib/backend";

interface QueueItem {
    id: string;
    name: string;
    license_id: string;
    address: string;
    facility_type: string;
    assigned_inspector?: string | null;
    risk_data: {
        id: string;
        score_date: string;
        risk_score: number;
        risk_band: "High" | "Medium" | "Low";
        factor_1_name: string;
        factor_1_weight: number;
        factor_2_name: string;
        factor_2_weight: number;
        factor_3_name: string;
        factor_3_weight: number;
    };
}

async function getDailyQueue(token: string): Promise<QueueItem[]> {
    const apiUrl = getBackendUrl();
    try {
        const res = await fetch(`${apiUrl}/api/v1/queue/daily`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        console.error("Failed to fetch queue", err);
        return [];
    }
}

export default async function DirectorQueuePage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "director") {
        redirect("/login");
    }

    const token = session.accessToken as string;
    const queue = await getDailyQueue(token);

    return <DirectorQueueClient queue={queue} />;
}

