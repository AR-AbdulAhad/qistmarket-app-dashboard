"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

type Officer = {
    id: number;
    full_name: string;
    username: string;
    phone: string;
    is_online: boolean;
    image: string | null;
};

export default function OutletDeliveryPage() {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOfficers();
    }, []);

    const fetchOfficers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/orders/outlet/officers`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setOfficers(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Delivery Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Select a delivery officer to initiate stock handovers</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : officers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-600">
                    <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No delivery officers assigned</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">There are currently no delivery officers assigned to this outlet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {officers.map((officer) => (
                        <Link 
                            key={officer.id} 
                            href={`/outlet/delivery/${officer.id}`}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md hover:border-primary/20 group relative overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 ${officer.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-700 overflow-hidden border border-gray-100 dark:border-gray-600">
                                        {officer.image ? (
                                            <Image 
                                                src={officer.image.startsWith('http') ? officer.image : `${API_BASE}${officer.image}`} 
                                                alt={officer.full_name} 
                                                width={80} 
                                                height={80} 
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300 dark:text-gray-500">
                                                {officer.full_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{officer.full_name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">@{officer.username}</p>
                                
                                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {officer.phone}
                                </div>
                            </div>
                            
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
