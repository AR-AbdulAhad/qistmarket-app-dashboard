"use client"
import React, { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Plus, Trash2, MapPin, Edit, Loader2 } from 'lucide-react';
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Zone {
    id: number;
    name: string;
    city?: { name: string };
}

interface Area {
    id: number;
    name: string;
    zone_id: number;
    zone?: Zone;
}

const AreasPage = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [formData, setFormData] = useState({ name: '', zone_id: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        try {
            const token = Cookies.get("auth_token");
            const [areasResp, zonesResp] = await Promise.all([
                fetch(`${BACKEND_URL}/api/address/areas`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/address/zones`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const areasData = await areasResp.json();
            const zonesData = await zonesResp.json();

            if (areasData.success) setAreas(areasData.data);
            if (zonesData.success) setZones(zonesData.data);

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
        if (!formData.name.trim() || !formData.zone_id) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/areas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Area created successfully");
                setFormData({ name: '', zone_id: '' });
                setIsCreateModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to create area");
            }
        } catch (err) {
            toast.error("Error creating area");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArea || !formData.name.trim() || !formData.zone_id) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/areas/${selectedArea.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Area updated successfully");
                setFormData({ name: '', zone_id: '' });
                setIsEditModalOpen(false);
                setSelectedArea(null);
                fetchData();
            } else {
                toast.error(data.error || "Failed to update area");
            }
        } catch (err) {
            toast.error("Error updating area");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedArea) return;

        setDeleting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/areas/${selectedArea.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("Area deleted");
                setIsDeleteModalOpen(false);
                setSelectedArea(null);
                fetchData();
            } else {
                toast.error(data.error || "Failed to delete area");
            }
        } catch (err) {
            toast.error("Error deleting area");
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (area: Area) => {
        setSelectedArea(area);
        setFormData({ name: area.name, zone_id: area.zone_id.toString() });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (area: Area) => {
        setSelectedArea(area);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Area Management" />

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setFormData({ name: '', zone_id: '' }); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add New Area
                </button>
            </div>

            <div className="bg-white dark:bg-gray-dark rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold">
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">Area Name</th>
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">Zone (City)</th>
                                <th className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <Loader text="Loading areas..." />
                                    </td>
                                </tr>
                            ) : areas.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">No areas found.</td></tr>
                            ) : areas.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{area.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">{area.zone?.name}</span>
                                            <span className="text-xs text-gray-500 font-normal">({area.zone?.city?.name})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => openEditModal(area)}
                                                className="text-gray-500 hover:text-blue-600 transition"
                                                title="Edit Area"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(area)}
                                                className="text-gray-500 hover:text-red-600 transition"
                                                title="Delete Area"
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
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Area</h3>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Zone</label>
                                    <select
                                        value={formData.zone_id}
                                        onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        required
                                    >
                                        <option value="">Select Zone</option>
                                        {zones.map(zone => (
                                            <option key={zone.id} value={zone.id}>{zone.name} ({zone.city?.name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Area Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        placeholder="e.g. Gulshan-e-Iqbal"
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
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Area'}
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
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Area</h3>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Zone</label>
                                    <select
                                        value={formData.zone_id}
                                        onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        required
                                    >
                                        <option value="">Select Zone</option>
                                        {zones.map(zone => (
                                            <option key={zone.id} value={zone.id}>{zone.name} ({zone.city?.name})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Area Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                        placeholder="e.g. Gulshan-e-Iqbal"
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
            {isDeleteModalOpen && selectedArea && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 text-red-600 mb-6">
                            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Delete Area?</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                            Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">"{selectedArea.name}"</span>?
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

export default AreasPage;
