"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Navigation, MapPin, CheckCircle2 } from 'lucide-react';

interface EstablishmentQueueItem {
    id: string;
    name: string;
    address: string;
    facility_type: string;
    latitude?: number;
    longitude?: number;
    risk_data: {
        risk_score: number;
        risk_band: string;
    }
}

interface SmartRouteListProps {
    items: EstablishmentQueueItem[];
}

export default function SmartRouteList({ items }: SmartRouteListProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [optimizedItems, setOptimizedItems] = useState<EstablishmentQueueItem[]>(items);

    const handleOptimize = () => {
        if (!navigator.geolocation) {
             alert("Geolocation is not supported by your browser.");
             return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { longitude, latitude } = position.coords;

                try {
                     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/queue/route`, {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${localStorage.getItem('token')}` 
                         },
                         body: JSON.stringify({
                             start_lng: longitude,
                             start_lat: latitude,
                             items: items
                         })
                     });

                     if (response.ok) {
                          const data = await response.json();
                          setOptimizedItems(data);
                     } else {
                          console.error("Failed to fetch optimized route");
                     }
                } catch (error) {
                     console.error("Error optimizing route:", error);
                } finally {
                     setLoading(false);
                }
            },
            (error) => {
                 console.error("Error getting location:", error);
                 setLoading(false);
                 alert("Could not acquire your location for routing.");
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    View Optimized Schedule
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[70vh] flex flex-col p-0 bg-slate-50">
                <DialogHeader className="p-4 border-b bg-white">
                    <DialogTitle className="flex justify-between items-center text-slate-800">
                        <span>Inspection Route Sequence</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <p className="text-xs text-slate-500">Starting from your current coordinates.</p>
                    <Button 
                        onClick={handleOptimize} 
                        disabled={loading}
                        size="sm"
                        className="bg-brand-primary hover:bg-brand-accent text-white"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Optimize Sequence
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {optimizedItems.map((item, index) => (
                        <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-3 relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 ${
                                item.risk_data.risk_band === 'High' ? 'bg-red-500' : 
                                item.risk_data.risk_band === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                            } shadow-sm border border-white`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-slate-800 truncate">{item.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5 text-slate-400">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="text-xs truncate">{item.address}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md ${
                                        item.risk_data.risk_band === 'High' ? 'bg-red-50 text-red-600' : 
                                        item.risk_data.risk_band === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                        {item.risk_data.risk_band} Risk
                                    </span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                        {item.facility_type}
                                    </span>
                                </div>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-slate-300 absolute right-3 top-3" />
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t text-center">
                    <Button variant="outline" className="w-full text-xs text-slate-600 h-9" onClick={() => setOpen(false)}>
                        Dismiss
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
