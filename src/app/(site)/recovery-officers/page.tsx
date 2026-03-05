'use client';

import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Loader from '@/components/common/Loader';
import { SearchIcon } from '@/assets/icons';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface Location {
    latitude: number;
    longitude: number;
    timestamp?: string;
}

interface Officer {
    id: number;
    full_name: string;
    username: string;
    phone: string;
    account_status: string;
    is_online: boolean;
    current_location: Location | null;
    last_known_location: Location | null;
    bike_km_range: number | null;
    working_hours: string | null;
    current_assignment: {
        id: number;
        status: string;
        order: { order_ref: string; customer_name: string };
    } | null;
    monthly_online_hours: string;
}

interface DailyStat {
    date: string;
    online_hours: string;
    worked_hours: string;
    offline_during_work_hours: string;
}

interface MonthlyStats {
    officer_id: number;
    month: string;
    daily_stats: DailyStat[];
    expected_daily_hours: string;
}

export default function RecoveryOfficersPage() {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
    const [officerStats, setOfficerStats] = useState<MonthlyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const socketRef = useRef<any>(null);
    const selectedOfficerIdRef = useRef<number | null>(null);

    useEffect(() => {
        selectedOfficerIdRef.current = selectedOfficer?.id || null;
    }, [selectedOfficer]);

    useEffect(() => {
        fetchOfficers();

        const token = Cookies.get('auth_token');
        if (!token) return;

        socketRef.current = io(BACKEND_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join_admin_notifications', token);
        });

        socketRef.current.on('officer_status_update', (data: { officerId: number; is_online: boolean; timestamp?: string }) => {
            setOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, is_online: data.is_online } : o))
            );
            if (selectedOfficerIdRef.current === data.officerId) {
                setSelectedOfficer((prev) => prev && {
                    ...prev,
                    is_online: data.is_online,
                    last_known_location: data.is_online ? prev.last_known_location : {
                        ...(prev.last_known_location || { latitude: 0, longitude: 0 }),
                        timestamp: data.timestamp || new Date().toISOString()
                    }
                });
            }
        });

        socketRef.current.on('officer_location_update', (data: any) => {
            const newLoc = {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp,
            };
            setOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, current_location: newLoc } : o))
            );
            if (selectedOfficerIdRef.current === data.officerId) {
                setSelectedOfficer((prev) => prev && { ...prev, current_location: newLoc });
            }
        });

        socketRef.current.on('officer_monthly_update', (data: {
            officerId: number;
            monthly_online_hours: string;
            month: string;
        }) => {
            setOfficers((prev) =>
                prev.map((o) =>
                    o.id === data.officerId ? { ...o, monthly_online_hours: data.monthly_online_hours } : o
                )
            );
            if (selectedOfficerIdRef.current === data.officerId) {
                setSelectedOfficer((prev) =>
                    prev ? { ...prev, monthly_online_hours: data.monthly_online_hours } : null
                );
            }
        });

        socketRef.current.on('officer_daily_update', (data: {
            officerId: number;
            date: string;
            online_hours: string;
        }) => {
            if (selectedOfficerIdRef.current !== data.officerId) return;

            setOfficerStats((prev) => {
                if (!prev) return prev;
                const updatedDaily = prev.daily_stats.map((day) => {
                    if (day.date === data.date) {
                        const newOnline = data.online_hours;
                        const expected = Number(prev.expected_daily_hours);
                        const newOffline = Math.max(0, expected - Number(newOnline)).toFixed(2);
                        return {
                            ...day,
                            online_hours: newOnline,
                            worked_hours: newOnline,
                            offline_during_work_hours: newOffline,
                        };
                    }
                    return day;
                });
                return { ...prev, daily_stats: updatedDaily };
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        let result = [...officers];
        if (searchQuery.trim() !== '') {
            const lower = searchQuery.toLowerCase();
            result = result.filter(
                (o) =>
                    o.full_name.toLowerCase().includes(lower) ||
                    o.username.toLowerCase().includes(lower)
            );
        }
        result.sort((a, b) => (a.is_online === b.is_online ? a.full_name.localeCompare(b.full_name) : a.is_online ? -1 : 1));
        setFilteredOfficers(result);
    }, [searchQuery, officers]);

    useEffect(() => {
        if (selectedOfficer) {
            fetchStats(selectedOfficer.id);
        } else {
            setOfficerStats(null);
        }
    }, [selectedOfficer]);

    const fetchOfficers = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token');
            const response = await fetch(`${BACKEND_URL}/api/recovery/officers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json();
            if (result.success) {
                setOfficers(result.data.officers);
                setFilteredOfficers(result.data.officers);
            }
        } catch (error) {
            toast.error('Failed to load recovery officers');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async (id: number) => {
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/recovery/officers/${id}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await res.json();
            if (result.success) setOfficerStats(result.data);
        } catch (err) {
            console.error(err);
        }
    };

    const kpi = {
        total: officers.length,
        online: officers.filter(o => o.is_online).length,
        offline: officers.filter(o => !o.is_online).length,
        activeJobs: officers.filter(o => o.current_assignment).length,
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-8">
                <h2 className="text-title-md2 font-bold text-black dark:text-white text-dark">
                    Recovery Officer Management
                </h2>
                <p className="font-medium text-gray-500">
                    Real-time monitoring of recovery status, location, attendance, and assignments.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6 xl:gap-7.5 mb-8 text-black">
                <StatCard title="Total Recovery Officers" value={kpi.total} color="blue" />
                <StatCard title="Online Now" value={kpi.online} color="green" isPulse />
                <StatCard title="Offline" value={kpi.offline} color="gray" />
                <StatCard title="Active Jobs" value={kpi.activeJobs} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* List */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
                        <div className="p-4 border-b border-stroke dark:border-strokedark">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <SearchIcon className="h-5 w-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search officer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-11 pr-5 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col max-h-[600px] overflow-y-auto">
                            {isLoading ? <Loader text="Loading..." /> : filteredOfficers.map((officer) => (
                                <div
                                    key={officer.id}
                                    onClick={() => setSelectedOfficer(officer)}
                                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4 ${selectedOfficer?.id === officer.id ? 'bg-gray-50 dark:bg-meta-4/30 border-primary' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className="relative h-12 w-12 flex-shrink-0">
                                        <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
                                            {officer.full_name.charAt(0)}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${officer.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-black dark:text-white truncate">{officer.full_name}</h4>
                                        <p className="text-xs text-gray-400">@{officer.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedOfficer ? (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold border-4 border-gray-50">
                                        {selectedOfficer.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-bold text-black dark:text-white">{selectedOfficer.full_name}</h3>
                                            <span className={`rounded-full py-1 px-3 text-xs font-bold uppercase ${selectedOfficer.is_online ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {selectedOfficer.is_online ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <p className="text-gray-400">@{selectedOfficer.username} • {selectedOfficer.phone}</p>
                                        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-5">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                                                <p className="font-semibold text-black dark:text-white">{selectedOfficer.account_status}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Bike Range</p>
                                                <p className="font-semibold text-black dark:text-white">{selectedOfficer.bike_km_range ?? '—'} km</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Working Hours</p>
                                                <p className="font-semibold text-black dark:text-white">{selectedOfficer.working_hours ?? 'Not set'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Monthly Online</p>
                                                <p className="font-semibold text-green-600">{selectedOfficer.monthly_online_hours} hrs</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4">Current Position</h4>
                                    {(selectedOfficer.current_location || selectedOfficer.last_known_location) ? (
                                        <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-lg font-mono">
                                            <p className="text-xs text-gray-500 uppercase mb-1">{selectedOfficer.is_online ? 'Live' : 'Last known'}</p>
                                            <p className="text-lg font-bold text-primary">
                                                {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.latitude.toFixed(6)},
                                                {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.longitude.toFixed(6)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {selectedOfficer.is_online ? 'Tracking active' : `Last seen: ${new Date(selectedOfficer.last_known_location?.timestamp || '').toLocaleString()}`}
                                            </p>
                                        </div>
                                    ) : <p className="text-gray-500 text-center py-10">No location data available</p>}
                                </div>

                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4">Current Assignment</h4>
                                    {selectedOfficer.current_assignment ? (
                                        <div className="p-4 border border-stroke rounded-lg">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-sm font-bold text-primary">#{selectedOfficer.current_assignment.order.order_ref}</span>
                                                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded uppercase">{selectedOfficer.current_assignment.status}</span>
                                            </div>
                                            <h5 className="font-bold">{selectedOfficer.current_assignment.order.customer_name}</h5>
                                            <p className="text-xs text-gray-500 mt-1">Payment/Installment Recovery</p>
                                        </div>
                                    ) : <div className="text-center py-10 text-gray-500 italic">No active task</div>}
                                </div>
                            </div>

                            {officerStats && (
                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4 text-black dark:text-white">Monthly Attendance ({officerStats.month})</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-stroke">
                                            <thead>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Online Hours</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worked Hours</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offline (Duty)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stroke text-black dark:text-white">
                                                {officerStats.daily_stats.map((day) => (
                                                    <tr key={day.date} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm">{day.date}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-green-600">{day.online_hours}</td>
                                                        <td className="px-6 py-4 text-sm font-medium">{day.worked_hours}</td>
                                                        <td className="px-6 py-4 text-sm text-red-600 font-medium">{day.offline_during_work_hours}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-4 text-sm text-gray-500">Expected daily: <strong>{officerStats.expected_daily_hours}</strong> hrs</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] border border-dashed border-stroke bg-gray-50 rounded-xl">
                            <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Select a Recovery Officer</h3>
                            <p className="text-gray-500 text-center max-w-sm">Choose an officer to view live status, location, current task, and attendance.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, color, isPulse = false }: { title: string; value: number; color: string; isPulse?: boolean }) {
    const colorClasses = {
        blue: 'bg-blue-600/10 text-blue-600',
        green: 'bg-green-600/10 text-green-600',
        gray: 'bg-gray-100 text-gray-500',
        yellow: 'bg-yellow-600/10 text-yellow-600',
    };
    return (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark group hover:border-primary transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-title-md font-bold text-black dark:text-white">{value}</h4>
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2 mt-1">
                        {isPulse && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                        {title}
                    </span>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>
            </div>
        </div>
    );
}
