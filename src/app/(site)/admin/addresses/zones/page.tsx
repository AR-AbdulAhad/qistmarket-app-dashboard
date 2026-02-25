"use client"
import React, { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Plus, Trash2, Map, Edit, Loader2 } from 'lucide-react';
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface City {
    id: number;
    name: string;
}

interface Zone {
    id: number;
    name: string;
    city_id: number;
    city?: City;
    _count?: {
        areas: number;
    };
}

const ZonesPage = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [formData, setFormData] = useState({ name: '', city_id: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        try {
            const token = Cookies.get("auth_token");
            const [zonesResp, citiesResp] = await Promise.all([
                fetch(`${BACKEND_URL}/api/address/zones`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/address/cities`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const zonesData = await zonesResp.json();
            const citiesData = await citiesResp.json();

            if (zonesData.success) setZones(zonesData.data);
            if (citiesData.success) setCities(citiesData.data);

        } catch (err) {
            toast.error("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.city_id) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/zones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Zone created successfully");
                setFormData({ name: '', city_id: '' });
                setIsCreateModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to create zone");
            }
        } catch (err) {
            toast.error("Error creating zone");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedZone || !formData.name.trim() || !formData.city_id) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/zones/${selectedZone.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Zone updated successfully");
                setFormData({ name: '', city_id: '' });
                setIsEditModalOpen(false);
                setSelectedZone(null);
                fetchData();
            } else {
                toast.error(data.error || "Failed to update zone");
            }
        } catch (err) {
            toast.error("Error updating zone");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedZone) return;

        setDeleting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/zones/${selectedZone.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Zone deleted");
                setIsDeleteModalOpen(false);
                setSelectedZone(null);
                fetchData();
            } else {
                toast.error(data.error || "Failed to delete zone");
            }
        } catch (err) {
            toast.error("Error deleting zone");
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (zone: Zone) => {
        setSelectedZone(zone);
        setFormData({ name: zone.name, city_id: zone.city_id.toString() });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (zone: Zone) => {
        setSelectedZone(zone);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Zone Management" />

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setFormData({ name: '', city_id: '' }); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add New Zone
                </button>
            </div>

            <div className="bg-white dark:bg-gray-dark rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold">
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">Zone Name</th>
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">City</th>
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">Areas Count</th>
                                <th className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Loader text="Loading zones..." />
                                    </td>
                                </tr>
                            ) : zones.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No zones found.</td></tr>
                            ) : zones.map(zone => (
                                <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg">
                                            <Map className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{zone.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{zone.city?.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {zone._count?.areas || 0} Areas
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => openEditModal(zone)}
                                                className="text-gray-500 hover:text-blue-600 transition"
                                                title="Edit Zone"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(zone)}
                                                className="text-gray-500 hover:text-red-600 transition"
                                                title="Delete Zone"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Zone</h3>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">City</label>
                                    <select
                                        value={formData.city_id}
                                        onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Zone Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        placeholder="e.g. Central"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:opacity-50 min-w-[140px]"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Zone'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                <Edit className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Zone</h3>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">City</label>
                                    <select
                                        value={formData.city_id}
                                        onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Zone Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        placeholder="e.g. Central"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 min-w-[140px]"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedZone && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 text-red-600 mb-6">
                            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Delete Zone?</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                            Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">"{selectedZone.name}"</span>?
                            This will also delete all associated Areas.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-gray-700 dark:text-gray-300"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:opacity-50 min-w-[140px]"
                            >
                                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZonesPage;

