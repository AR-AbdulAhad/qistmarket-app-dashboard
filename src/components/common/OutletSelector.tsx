'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Outlet {
  id: number;
  name: string;
  city: string;
}

interface OutletSelectorProps {
  onSelect: (outletId: string) => void;
  selectedId: string;
}

export default function OutletSelector({ onSelect, selectedId }: OutletSelectorProps) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOutlets = async () => {
      const token = Cookies.get('auth_token');
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/outlet-reports/all-outlets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setOutlets(json.data);
        }
      } catch (error) {
        console.error('Error fetching outlets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOutlets();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
        Outlet:
      </label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
        className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium text-dark outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white"
      >
        <option value="all">All Outlets (Aggregated)</option>
        {outlets.map((outlet) => (
          <option key={outlet.id} value={outlet.id.toString()}>
            {outlet.name} ({outlet.city})
          </option>
        ))}
      </select>
    </div>
  );
}
