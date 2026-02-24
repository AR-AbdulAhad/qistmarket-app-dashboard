'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal/Modal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Order {
    id: number;
    order_ref: string;
    token_number: string;
    customer_name: string;
    whatsapp_number: string;
    address: string;
    city: string | null;
    area: string | null;
    product_name: string;
    total_amount: number;
    advance_amount: number;
    monthly_amount: number;
    months: number;
    channel: string;
    status: string;
    created_at: string;
    cancelled_reason?: string | null;
    cancelled_at?: string | null;
    created_by: { username: string } | null;
    assigned_to: { username: string } | null;
    productHistories?: {
        id: number;
        previous_product: string;
        current_product: string;
        changed_at: string;
        changed_by: { username: string, full_name: string };
    }[];
}

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // States for Edit / Cancel
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [newProductName, setNewProductName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Order not found');
            const json = await res.json();
            if (json.success) setOrder(json.data.order);
            else throw new Error(json.message || 'Failed to fetch order');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const confirmEdit = async () => {
        if (!order || !newProductName.trim()) return;
        setIsSubmitting(true);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/orders/${order.id}/update-item`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ product_name: newProductName }),
            });
            if (!res.ok) throw new Error('Update failed');
            await fetchOrder();
            setEditModalOpen(false);
        } catch (err) {
            alert('Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmCancel = async () => {
        if (!order || !cancelReason.trim()) return;
        setIsSubmitting(true);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/orders/${order.id}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });
            if (!res.ok) throw new Error('Cancellation failed');
            await fetchOrder();
            setCancelModalOpen(false);
        } catch (err) {
            alert('Cancellation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName={`Order: ${order.order_ref}`} />

            <div className="mt-4 flex flex-wrap justify-end gap-3 mb-6 font-medium">
                <button
                    onClick={() => {
                        setNewProductName(order.product_name);
                        setEditModalOpen(true);
                    }}
                    className="rounded-md bg-primary px-6 py-2 text-white hover:bg-opacity-90 shadow-md"
                >
                    Edit Item
                </button>
                <button
                    onClick={() => {
                        setCancelReason('');
                        setCancelModalOpen(true);
                    }}
                    className="rounded-md bg-red-600 px-6 py-2 text-white hover:bg-opacity-90 shadow-md"
                >
                    Cancel Order
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Customer Info Card */}
                <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-6">
                    <h3 className="text-xl font-bold border-b pb-4 mb-4 dark:text-white">Customer Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                            <p className="font-semibold">{order.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp Number</p>
                            <p className="font-semibold">{order.whatsapp_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">City / Area</p>
                            <p className="font-semibold">{order.city || 'N/A'} / {order.area || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                            <p className="font-semibold">{order.address}</p>
                        </div>
                    </div>
                </div>

                {/* Order Info Card */}
                <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-6">
                    <h3 className="text-xl font-bold border-b pb-4 mb-4 dark:text-white">Order Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <span className={cn(
                                "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mt-1",
                                order.status === 'cancelled' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                            )}>
                                {order.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reference Number</p>
                            <p className="font-semibold">{order.order_ref}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Product Name</p>
                            <p className="font-semibold">{order.product_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="font-semibold">Rs. {order.total_amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Advance / Monthly</p>
                            <p className="font-semibold">Rs. {order.advance_amount.toLocaleString()} / Rs. {order.monthly_amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
                            <p className="font-semibold">{order.months} Months</p>
                        </div>
                    </div>
                </div>

                {/* Cancellation Info (Spans full width if shown) */}
                {order.status === 'cancelled' && (
                    <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4">Cancellation Details</h3>
                        <div className="space-y-2">
                            <p><span className="font-medium text-red-700 dark:text-red-300">Reason:</span> {order.cancelled_reason}</p>
                            <p><span className="font-medium text-red-700 dark:text-red-300">Cancelled At:</span> {order.cancelled_at ? new Date(order.cancelled_at).toLocaleString() : 'N/A'}</p>
                        </div>
                    </div>
                )}

                {/* Product History Card (Spans full width) */}
                {order.productHistories && order.productHistories.length > 0 && (
                    <div className="lg:col-span-2 rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-6">
                        <h3 className="text-xl font-bold border-b pb-4 mb-4 dark:text-white">Product Name History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border dark:border-dark-3">
                                <thead className="bg-gray-50 dark:bg-dark-2 uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3 border dark:border-dark-3">Previous Product</th>
                                        <th className="px-4 py-3 border dark:border-dark-3">Current Product</th>
                                        <th className="px-4 py-3 border dark:border-dark-3">Changed By</th>
                                        <th className="px-4 py-3 border dark:border-dark-3">Changed At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.productHistories.map((h) => (
                                        <tr key={h.id} className="border-t dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2 transition-colors">
                                            <td className="px-4 py-3 border dark:border-dark-3 font-medium">{h.previous_product}</td>
                                            <td className="px-4 py-3 border dark:border-dark-3 font-medium text-primary">{h.current_product}</td>
                                            <td className="px-4 py-3 border dark:border-dark-3">{h.changed_by.full_name} (@{h.changed_by.username})</td>
                                            <td className="px-4 py-3 border dark:border-dark-3">{new Date(h.changed_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modals (Edit/Cancel) */}
            <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
                <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                    <h2 className="text-2xl font-bold mb-4">Edit Product Name</h2>
                    <div className="mb-4">
                        <label className="mb-2.5 block text-black dark:text-white">New Product Name</label>
                        <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setEditModalOpen(false)} className="rounded border px-6 py-2">Cancel</button>
                        <button onClick={confirmEdit} disabled={isSubmitting} className="bg-primary text-white rounded px-6 py-2 disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)}>
                <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Cancel Order</h2>
                    <div className="mb-6">
                        <label className="mb-2.5 block text-black dark:text-white font-medium">Cancellation Reason <span className="text-red-500">*</span></label>
                        <textarea
                            rows={4}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Please provide a reason for cancellation..."
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 text-sm font-medium">
                        <button onClick={() => setCancelModalOpen(false)} className="rounded border border-stroke px-6 py-2 hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-2">Back</button>
                        <button
                            onClick={confirmCancel}
                            disabled={isSubmitting || !cancelReason.trim()}
                            className="bg-red-600 text-white rounded px-8 py-2 hover:bg-opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
