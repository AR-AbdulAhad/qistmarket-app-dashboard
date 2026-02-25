"use client"
import React, { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Plus, Trash2, Building2, Edit, Loader2 } from 'lucide-react';
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface City {
    id: number;
    name: string;
    _count?: {
        zones: number;
    };
}

const CitiesPage = () => {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [cityName, setCityName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchCities = async () => {
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/cities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.success) {
                setCities(data.data);
            } else {
                toast.error(data.error || "Failed to fetch cities");
            }
        } catch (err) {
            toast.error("Error fetching cities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cityName.trim()) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/cities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: cityName })
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("City created successfully");
                setCityName('');
                setIsCreateModalOpen(false);
                fetchCities();
            } else {
                toast.error(data.error || "Failed to create city");
            }
        } catch (err) {
            toast.error("Error creating city");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCity || !cityName.trim()) return;

        setSubmitting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/cities/${selectedCity.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: cityName })
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("City updated successfully");
                setCityName('');
                setIsEditModalOpen(false);
                setSelectedCity(null);
                fetchCities();
            } else {
                toast.error(data.error || "Failed to update city");
            }
        } catch (err) {
            toast.error("Error updating city");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCity) return;

        setDeleting(true);
        try {
            const token = Cookies.get("auth_token");
            const resp = await fetch(`${BACKEND_URL}/api/address/cities/${selectedCity.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await resp.json();
            if (data.success) {
                toast.success("City deleted");
                setIsDeleteModalOpen(false);
                setSelectedCity(null);
                fetchCities();
            } else {
                toast.error(data.error || "Failed to delete city");
            }
        } catch (err) {
            toast.error("Error deleting city");
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (city: City) => {
        setSelectedCity(city);
        setCityName(city.name);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (city: City) => {
        setSelectedCity(city);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="City Management" />

            <div className="flex justify-end mb-6">
                <button
                    onClick={() => { setCityName(''); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add New City
                </button>
            </div>

            <div className="bg-white dark:bg-gray-dark rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold">
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">City Name</th>
                                <th className="px-6 py-4 text-gray-700 dark:text-gray-300">Zones Count</th>
                                <th className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <Loader text="Loading cities..." />
                                    </td>
                                </tr>
                            ) : cities.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">No cities found. Create one to get started.</td></tr>
                            ) : cities.map(city => (
                                <tr key={city.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{city.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                                            {city._count?.zones || 0} Zones
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => openEditModal(city)}
                                                className="text-gray-500 hover:text-blue-600 transition"
                                                title="Edit City"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(city)}
                                                className="text-gray-500 hover:text-red-600 transition"
                                                title="Delete City"
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
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Add New City</h3>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">City Name</label>
                                <input
                                    type="text"
                                    value={cityName}
                                    onChange={(e) => setCityName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                    placeholder="e.g. Karachi"
                                    required
                                    autoFocus
                                />
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
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create City'}
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
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Edit City</h3>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">City Name</label>
                                <input
                                    type="text"
                                    value={cityName}
                                    onChange={(e) => setCityName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 transition-all font-medium"
                                    placeholder="e.g. Karachi"
                                    required
                                    autoFocus
                                />
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
            {isDeleteModalOpen && selectedCity && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 text-red-600 mb-6">
                            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Delete City?</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
                            Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">"{selectedCity.name}"</span>?
                            This will also delete all associated Zones and Areas.
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

export default CitiesPage;

