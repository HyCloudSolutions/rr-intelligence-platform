import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Card, Title, BarChart, Text, Grid } from "@tremor/react";
import { getBackendUrl } from "@/lib/backend";

interface ForecastItem {
    zip_code: string;
    month: string;
    avg_score: number;
}

async function getForecasts(token: string): Promise<ForecastItem[]> {
    const apiUrl = getBackendUrl();
    try {
        const res = await fetch(`${apiUrl}/api/v1/analytics/forecast`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        console.error("Failed to fetch forecasts", err);
        return [];
    }
}

export default async function DirectorForecastPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'director') {
        redirect("/login");
    }

    const forecasts = await getForecasts(session.accessToken as string);

    // Grouping by ZIP code for the chart
    const zipDataMap: { [key: string]: { [key: string]: number } } = {};
    const monthsSet = new Set<string>();

    forecasts.forEach(item => {
        const monthStr = new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthsSet.add(monthStr);

        if (!zipDataMap[item.zip_code]) {
            zipDataMap[item.zip_code] = { zip_code: item.zip_code as any };
        }
        zipDataMap[item.zip_code][monthStr] = item.avg_score;
    });

    const chartData = Object.values(zipDataMap);
    const months = Array.from(monthsSet);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Predictive Load Balancing</h1>
                    <p className="text-slate-500 text-sm">Aggregated risk distributions forecasting workload hotspots.</p>
                </div>
            </header>

            <Grid numItemsLg={3} className="gap-6">
                <Card className="p-6 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <Text className="text-slate-400 font-medium">Forecasted Hotspot</Text>
                    <Title className="text-2xl font-bold text-slate-800 mt-1">
                        {forecasts.length > 0 ? forecasts[0].zip_code : "N/A"}
                    </Title>
                    <Text className="text-xs text-red-500 mt-0.5">Highest average risk score</Text>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <Text className="text-slate-400 font-medium">Spatial Nodes</Text>
                    <Title className="text-2xl font-bold text-slate-800 mt-1">
                        {chartData.length} ZIPs
                    </Title>
                    <Text className="text-xs text-slate-400 mt-0.5">Covering active score distributions</Text>
                </Card>
                <Card className="p-6 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <Text className="text-slate-400 font-medium">Risk Margin</Text>
                    <Title className="text-2xl font-bold text-slate-800 mt-1">
                        {forecasts.length > 0 ? Math.max(...forecasts.map(f => f.avg_score)).toFixed(1) : "0.0"}
                    </Title>
                    <Text className="text-xs text-slate-400 mt-0.5">Peak prediction threshold</Text>
                </Card>
            </Grid>

            {forecasts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <h3 className="text-slate-600 font-semibold">No Forecasting Data</h3>
                    <p className="text-sm text-slate-400 mt-1">Historical score aggregations will appear once nightly batches run successfully.</p>
                </div>
            ) : (
                <Card className="p-6 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <Title className="text-slate-800 font-semibold">Average Risk Scores by ZIP Code</Title>
                    <Text className="text-slate-400 text-xs mb-4">Historical trends based on nightly aggregated averages.</Text>
                    <BarChart
                        className="h-72 mt-4"
                        data={chartData}
                        index="zip_code"
                        categories={months}
                        colors={["blue", "cyan", "sky", "indigo", "violet"]}
                        valueFormatter={(number: number) => `${number.toFixed(1)}`}
                        yAxisWidth={48}
                    />
                </Card>
            )}
        </div>
    );
}
