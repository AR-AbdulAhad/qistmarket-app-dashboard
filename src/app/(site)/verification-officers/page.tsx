'use client';

import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { SearchIcon } from '@/assets/icons';
import io from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

    socketRef.current = io(BACKEND_URL, { auth: { token } });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_admin_notifications', token);
    });

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

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOfficers(officers);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredOfficers(
        officers.filter(
          (o) =>
            o.full_name.toLowerCase().includes(lower) ||
            o.username.toLowerCase().includes(lower)
        )
      );
    }
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
      const response = await fetch(`${BACKEND_URL}/api/officers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setOfficers(result.data.officers);
        setFilteredOfficers(result.data.officers);
      } else {
        toast.error(result.error?.message || 'Failed to fetch officers');
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficerDailyStats = async (officerId: number) => {
    try {
      const token = Cookies.get('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/officers/${officerId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setOfficerStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch officer stats', err);
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
        <p className="font-medium">Monitor officer status, locations, attendance, and field tasks in real-time.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6 xl:gap-7.5 mb-8">
        <StatCard title="Total Officers" value={stats.total} color="blue" />
        <StatCard title="Online Now" value={stats.online} color="green" isPulse />
        <StatCard title="Offline" value={stats.offline} color="gray" />
        <StatCard title="Active Jobs" value={stats.activeVerifications} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Officer List Sidebar */}
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
                <div className="p-8 text-center text-gray-500">No officers found.</div>
              ) : (
                filteredOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    onClick={() => setSelectedOfficer(officer)}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4 ${
                      selectedOfficer?.id === officer.id
                        ? 'bg-gray-50 dark:bg-meta-4/30 border-primary'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-meta-4/20'
                    }`}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <div className="h-full w-full rounded-full bg-gray-200 dark:bg-meta-4 flex items-center justify-center text-lg font-bold text-gray-500">
                        {officer.full_name.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-boxdark ${
                          officer.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
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

        {/* Details Pane */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedOfficer ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {/* Profile Card */}
              <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="h-24 w-24 flex-shrink-0 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center text-4xl font-bold border-4 border-gray-50">
                    {selectedOfficer.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-black dark:text-white">
                        {selectedOfficer.full_name}
                      </h3>
                      <span
                        className={`inline-flex rounded-full py-1 px-3 text-xs font-bold uppercase ${
                          selectedOfficer.is_online ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {selectedOfficer.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      @{selectedOfficer.username} • {selectedOfficer.phone}
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                        <p className="font-semibold text-black dark:text-white capitalize">
                          {selectedOfficer.account_status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bike Range</p>
                        <p className="font-semibold text-black dark:text-white">
                          {selectedOfficer.bike_km_range || 'N/A'} KM
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Working Hours
                        </p>
                        <p className="font-semibold text-black dark:text-white">
                          {selectedOfficer.working_hours || 'Not Set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Monthly Online
                        </p>
                        <p className="font-semibold text-black dark:text-white">
                          {selectedOfficer.monthly_online_hours} hrs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Card */}
                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h4 className="font-bold text-black dark:text-white mb-4">Tracking Information</h4>
                  {selectedOfficer.current_location || selectedOfficer.last_known_location ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-meta-4/20 p-4 rounded-lg">
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase">
                          {selectedOfficer.is_online ? 'Current Coordinates' : 'Last Known Position'}
                        </p>
                        <p className="text-lg font-mono font-bold text-primary">
                          {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.latitude.toFixed(
                            6
                          )}
                          ,{' '}
                          {(selectedOfficer.current_location || selectedOfficer.last_known_location)?.longitude.toFixed(
                            6
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedOfficer.is_online
                            ? 'Live tracking active'
                            : `Last seen: ${new Date(
                                selectedOfficer.last_known_location?.timestamp || ''
                              ).toLocaleString()}`}
                        </p>
                      </div>
                      <button className="w-full py-2 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90 transition shadow-sm">
                        View on Live Map
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 font-medium">No location data available</div>
                  )}
                </div>

                {/* Active Task Card */}
                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h4 className="font-bold text-black dark:text-white mb-4">Active Field Task</h4>
                  {selectedOfficer.current_verification ? (
                    <div className="p-4 border border-stroke dark:border-strokedark rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-bold text-primary">
                          #{selectedOfficer.current_verification.order.order_ref}
                        </span>
                        <span className="bg-yellow-500/10 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          In Progress
                        </span>
                      </div>
                      <h5 className="font-bold text-black dark:text-white">
                        {selectedOfficer.current_verification.order.customer_name}
                      </h5>
                      <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tight">
                        Identity & Residence Check
                      </p>
                      <button className="mt-4 w-full py-2 border border-stroke dark:border-strokedark text-sm font-bold hover:bg-gray-50 dark:hover:bg-meta-4 transition rounded-lg">
                        View Order Details
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 font-medium italic">No active assignment</div>
                  )}
                </div>
              </div>

              {/* Monthly Attendance Report */}
              {officerStats && (
                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <h4 className="font-bold text-black dark:text-white mb-4">
                    Monthly Attendance Report ({officerStats.month})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-stroke dark:divide-strokedark">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Online Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Worked Hours
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Offline During Work
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stroke dark:divide-strokedark">
                        {officerStats.daily_stats.map((day) => (
                          <tr
                            key={day.date}
                            className="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{day.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {day.online_hours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {day.worked_hours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {day.offline_during_work_hours}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    Expected daily working hours: {officerStats.expected_daily_hours} hrs
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-gray-50 text-center dark:border-strokedark dark:bg-boxdark">
              <div className="mb-6 rounded-full bg-white dark:bg-meta-4 p-8 shadow-sm">
                <svg className="h-16 w-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-6-6h-1m1-7.758a3.3 3.3 0 100 6.516"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-black dark:text-white">Select an Officer</h3>
              <p className="max-w-xs font-medium text-gray-500">
                Select a verification officer to view live status, location, current task, and monthly attendance details.
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
  isPulse,
}: {
  title: string;
  value: number;
  color: string;
  isPulse?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600/10 text-blue-600',
    green: 'bg-success/10 text-success',
    gray: 'bg-gray-100 text-gray-500',
    yellow: 'bg-warning/10 text-warning',
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark group hover:border-primary transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-title-md font-bold text-black dark:text-white">{value}</h4>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            {isPulse && <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>}
            {title}
          </span>
        </div>
        <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${colors[color]}`}>
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}