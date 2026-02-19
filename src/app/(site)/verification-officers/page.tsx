'use client';

import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
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
    current_verification: {
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

export default function VerificationOfficersPage() {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
    const [officerStats, setOfficerStats] = useState<MonthlyStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const socketRef = useRef<any>(null);

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
            console.log('Socket connected – joined admins room');
        });

        // Real-time officer status (online/offline)
        socketRef.current.on('officer_status_update', (data: { officerId: number; is_online: boolean }) => {
            setOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, is_online: data.is_online } : o))
            );
            setFilteredOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, is_online: data.is_online } : o))
            );
            if (selectedOfficer?.id === data.officerId) {
                setSelectedOfficer((prev) => prev && { ...prev, is_online: data.is_online });
            }
        });

        // Real-time location updates
        socketRef.current.on('officer_location_update', (data: any) => {
            const newLoc = {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp,
            };
            setOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, current_location: newLoc } : o))
            );
            setFilteredOfficers((prev) =>
                prev.map((o) => (o.id === data.officerId ? { ...o, current_location: newLoc } : o))
            );
            if (selectedOfficer?.id === data.officerId) {
                setSelectedOfficer((prev) => prev && { ...prev, current_location: newLoc });
            }
        });

        // Real-time monthly online hours update (badge & profile card)
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
            setFilteredOfficers((prev) =>
                prev.map((o) =>
                    o.id === data.officerId ? { ...o, monthly_online_hours: data.monthly_online_hours } : o
                )
            );

            if (selectedOfficer?.id === data.officerId) {
                setSelectedOfficer((prev) =>
                    prev ? { ...prev, monthly_online_hours: data.monthly_online_hours } : null
                );
            }
        });

        // Real-time daily attendance row update
        socketRef.current.on('officer_daily_update', (data: {
            officerId: number;
            date: string;
            online_hours: string;
        }) => {
            if (selectedOfficer?.id !== data.officerId) return;
            if (!officerStats) return;
            if (!officerStats.daily_stats.some((d) => d.date === data.date)) return;

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

        socketRef.current.on('connect_error', (err: any) => {
            console.error('Socket connection error:', err.message);
        });

        return () => {
            socketRef.current?.off('officer_status_update');
            socketRef.current?.off('officer_location_update');
            socketRef.current?.off('officer_monthly_update');
            socketRef.current?.off('officer_daily_update');
            socketRef.current?.off('connect_error');
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

        // Sort by online status (online first), then by name
        result.sort((a, b) => {
            if (a.is_online === b.is_online) {
                return a.full_name.localeCompare(b.full_name);
            }
            return a.is_online ? -1 : 1;
        });

        setFilteredOfficers(result);
    }, [searchQuery, officers]);

    useEffect(() => {
        if (selectedOfficer) {
            fetchOfficerDailyStats(selectedOfficer.id);
        } else {
            setOfficerStats(null);
        }
    }, [selectedOfficer]);

    const fetchOfficers = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token');
            if (!token) throw new Error('No auth token');

            const response = await fetch(`${BACKEND_URL}/api/officers`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            if (result.success) {
                setOfficers(result.data.officers);
                setFilteredOfficers(result.data.officers);
            } else {
                toast.error(result.error?.message || 'Failed to load officers');
            }
        } catch (error) {
            console.error('Fetch officers error:', error);
            toast.error('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOfficerDailyStats = async (officerId: number) => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) return;

            const res = await fetch(`${BACKEND_URL}/api/officers/${officerId}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await res.json();
            if (result.success) {
                setOfficerStats(result.data);
            } else {
                console.warn('Failed to load daily stats:', result.error);
            }
        } catch (err) {
            console.error('Daily stats fetch error:', err);
        }
    };

    const stats = {
        total: officers.length,
        online: officers.filter((o) => o.is_online).length,
        offline: officers.filter((o) => !o.is_online).length,
        activeVerifications: officers.filter((o) => o.current_verification).length,
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <div className="mb-8">
                <h2 className="text-title-md2 font-bold text-black dark:text-white">
                    Verification Officer Management
                </h2>
                <p className="font-medium">
                    Real-time monitoring of officer status, location, attendance, and assignments.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6 xl:gap-7.5 mb-8">
                <StatCard title="Total Officers" value={stats.total} color="blue" />
                <StatCard title="Online Now" value={stats.online} color="green" isPulse />
                <StatCard title="Offline" value={stats.offline} color="gray" />
                <StatCard title="Active Jobs" value={stats.activeVerifications} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Officer List */}
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
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading officers...</div>
                            ) : filteredOfficers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No officers found</div>
                            ) : (
                                filteredOfficers.map((officer) => (
                                    <div
                                        key={officer.id}
                                        onClick={() => setSelectedOfficer(officer)}
                                        className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4 ${selectedOfficer?.id === officer.id
                                                ? 'bg-gray-50 dark:bg-meta-4/30 border-primary'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-meta-4/20'
                                            }`}
                                    >
                                        <div className="relative h-12 w-12 flex-shrink-0">
                                            <div className="h-full w-full rounded-full bg-gray-200 dark:bg-meta-4 flex items-center justify-center text-lg font-bold text-gray-500">
                                                {officer.full_name.charAt(0)}
                                            </div>
                                            <span
                                                className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-boxdark ${officer.is_online ? 'bg-green-500' : 'bg-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-black dark:text-white truncate">
                                                {officer.full_name}
                                            </h4>
                                            <p className="text-xs text-gray-400">@{officer.username}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Details View */}
                <div className="lg:col-span-8 xl:col-span-9">
                    {selectedOfficer ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Profile Header */}
                            <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center text-4xl font-bold border-4 border-gray-50 flex-shrink-0">
                                        {selectedOfficer.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-bold text-black dark:text-white">
                                                {selectedOfficer.full_name}
                                            </h3>
                                            <span
                                                className={`inline-flex rounded-full py-1 px-3 text-xs font-bold uppercase ${selectedOfficer.is_online ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                {selectedOfficer.is_online ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 mt-1">
                                            @{selectedOfficer.username} • {selectedOfficer.phone}
                                        </p>

                                        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-5">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</p>
                                                <p className="font-semibold mt-1">{selectedOfficer.account_status}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bike Range</p>
                                                <p className="font-semibold mt-1">
                                                    {selectedOfficer.bike_km_range ?? '—'} km
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Working Hours</p>
                                                <p className="font-semibold mt-1">
                                                    {selectedOfficer.working_hours ?? 'Not set'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monthly Online</p>
                                                <p className="font-semibold mt-1 text-green-600">
                                                    {selectedOfficer.monthly_online_hours} hrs
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location + Active Task */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Location Card */}
                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4">Current Position</h4>
                                    {selectedOfficer.current_location || selectedOfficer.last_known_location ? (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-lg font-mono">
                                                <p className="text-xs text-gray-500 uppercase mb-1">
                                                    {selectedOfficer.is_online ? 'Live' : 'Last known'}
                                                </p>
                                                <p className="text-lg font-bold text-primary">
                                                    {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.latitude.toFixed(6)},
                                                    {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.longitude.toFixed(6)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {selectedOfficer.is_online
                                                        ? 'Tracking active'
                                                        : `Last seen: ${new Date(selectedOfficer.last_known_location?.timestamp || '').toLocaleString()}`}
                                                </p>
                                            </div>
                                            <button className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition">
                                                View on Map
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">No location data</div>
                                    )}
                                </div>

                                {/* Active Task Card */}
                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4">Current Assignment</h4>
                                    {selectedOfficer.current_verification ? (
                                        <div className="p-4 border border-stroke dark:border-strokedark rounded-lg">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-sm font-bold text-primary">
                                                    #{selectedOfficer.current_verification.order.order_ref}
                                                </span>
                                                <span className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-2.5 py-1 rounded uppercase">
                                                    In Progress
                                                </span>
                                            </div>
                                            <h5 className="font-bold">
                                                {selectedOfficer.current_verification.order.customer_name}
                                            </h5>
                                            <p className="text-xs text-gray-500 mt-1">Identity & Residence Verification</p>
                                            <button className="mt-4 w-full py-2 border border-stroke dark:border-strokedark rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-meta-4 transition">
                                                View Details
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 italic">No active task</div>
                                    )}
                                </div>
                            </div>

                            {/* Attendance Table – fully real-time */}
                            {officerStats && (
                                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                    <h4 className="font-bold mb-4">
                                        Monthly Attendance ({officerStats.month})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-stroke dark:divide-strokedark">
                                            <thead>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Online Hours</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worked Hours</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offline (Duty Hrs)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                                {officerStats.daily_stats.map((day) => (
                                                    <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-meta-4/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{day.date}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                            {day.online_hours}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {day.worked_hours}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                            {day.offline_during_work_hours}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-4 text-sm text-gray-500">
                                        Expected daily hours: <strong>{officerStats.expected_daily_hours}</strong> hrs
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[500px] rounded-xl border border-dashed border-stroke bg-gray-50 dark:border-strokedark dark:bg-boxdark text-center">
                            <div className="mb-6 rounded-full bg-white dark:bg-meta-4 p-8 shadow-sm">
                                <svg className="h-16 w-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-6-6h-1m1-7.758a3.3 3.3 0 100 6.516" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-black dark:text-white mb-2">
                                Select an Officer
                            </h3>
                            <p className="max-w-md text-gray-500">
                                Choose a verification officer to view live status, location, current task, and real-time attendance records.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    color,
    isPulse = false,
}: {
    title: string;
    value: number;
    color: string;
    isPulse?: boolean;
}) {
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
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        {isPulse && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                        {title}
                    </span>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}