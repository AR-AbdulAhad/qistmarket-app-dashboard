'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal/Modal';
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Order {
    id: number;
    order_ref: string;
    token_number: string;
    customer_name: string;
    whatsapp_number: string;
    alternate_contact?: string | null;
    address: string;
    order_notes?: string | null;
    gender?: string | null;
    residential_type?: string | null;
    zone?: string | null;
    block?: string | null;
    house_no?: string | null;
    street?: string | null;
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

    // Product dynamic data
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = Cookies.get('auth_token');
                const res = await fetch(`${BACKEND_URL}/api/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) {
                        setProducts(json.data);
                        const uniqueCategories = Array.from(new Set(json.data.map((p: any) => p.category_name))) as string[];
                        setCategories(uniqueCategories.sort());
                    }
                }
            } catch (err) {
                console.error('Failed to load products', err);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            const filteredSubcats = Array.from(new Set(
                products
                    .filter(p => p.category_name === selectedCategory)
                    .map(p => p.subcategory_name)
            )) as string[];
            setSubcategories(filteredSubcats.sort());
            setSelectedSubcategory('');
            setSelectedProduct(null);
            setSelectedPlan(null);
        } else {
            setSubcategories([]);
        }
    }, [selectedCategory, products]);

    const confirmEdit = async () => {
        if (!order || !selectedProduct || !selectedPlan) return;
        setIsSubmitting(true);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/orders/${order.id}/update-item`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_name: selectedProduct.name,
                    advance_amount: selectedPlan.advance,
                    monthly_amount: selectedPlan.monthlyAmount,
                    months: selectedPlan.months,
                    total_amount: selectedPlan.totalPrice
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            await fetchOrder();
            setEditModalOpen(false);
            // Reset selection states
            setSelectedProduct(null);
            setSelectedPlan(null);
            setSelectedCategory('');
            setSelectedSubcategory('');
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

    if (loading) return <Loader text="Loading order details..." />;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!order) return <div className="p-8 text-center text-gray-500">Order not found.</div>;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName={`Order: ${order.order_ref}`} />

            <div className="mt-4 flex flex-wrap justify-end gap-3 mb-6 font-medium">
                <button
                    onClick={() => {
                        setNewProductName(order.product_name);
                        setSelectedCategory('');
                        setSelectedSubcategory('');
                        setSelectedProduct(null);
                        setSelectedPlan(null);
                        setEditModalOpen(true);
                    }}
                    className="rounded-md bg-primary px-6 py-2 text-white hover:bg-opacity-90 shadow-md transition-colors"
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
                        <p className="font-semibold">{order.customer_name || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp Number</p>
                        <p className="font-semibold">{order.whatsapp_number || 'N/A'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Alternate Contact</p>
                        <p className="font-semibold">{order.alternate_contact || 'N/A'}</p>
                    </div>
                    {order.address && order.address.trim() !== '' ? (
                        <div className="sm:col-span-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                            <p className="font-semibold">{order.address}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
                                <p className="font-semibold">{order.city || 'N/A'}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                                <p className="font-semibold">{order.area || 'N/A'}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Zone / Block</p>
                                <p className="font-semibold">{order.zone || order.block || 'N/A'}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">House No / Street</p>
                                <p className="font-semibold">
                                    {[
                                        order.house_no || null,
                                        order.street || null
                                    ].filter(Boolean).join(', ') || 'N/A'}
                                </p>
                            </div>
                        </>
                    )}
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                        <p className="font-semibold">{order.gender || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Residential Type</p>
                        <p className="font-semibold">{order.residential_type || 'N/A'}</p>
                    </div>

                    <div className="sm:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Order Notes</p>
                        <p className="font-semibold whitespace-pre-wrap">{order.order_notes || 'N/A'}</p>
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
                <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 max-w-lg w-full">
                    <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Product Selection</h2>
                    <p className="mb-6 text-gray-600 dark:text-gray-400 text-sm">
                        Select a new product for order <strong>{order.order_ref}</strong>. This update will include new pricing and installment details.
                    </p>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Current Product:</label>
                            <div className="p-3 bg-gray-50 dark:bg-dark-3 rounded-lg border border-stroke dark:border-dark-3 text-sm font-medium">
                                {order.product_name}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category:</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 text-sm"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Subcategory:</label>
                                <select
                                    value={selectedSubcategory}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSubcategory(e.target.value)}
                                    disabled={!selectedCategory}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 text-sm disabled:bg-gray-100 dark:disabled:bg-dark-2"
                                >
                                    <option value="">Select Subcategory</option>
                                    {subcategories.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">New Product:</label>
                            <select
                                disabled={!selectedSubcategory}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const prod = products.find(p => p.name === e.target.value);
                                    if (prod) setSelectedProduct(prod);
                                }}
                                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 text-sm disabled:bg-gray-100 dark:disabled:bg-dark-2"
                            >
                                <option value="">Select Product</option>
                                {products
                                    .filter(p => p.category_name === selectedCategory && p.subcategory_name === selectedSubcategory)
                                    .map((p: any) => (
                                        <option key={p.id} value={p.name}>
                                            {p.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {selectedProduct && (
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-medium dark:text-gray-300">Installment Plan:</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedProduct.ProductInstallments?.filter((p: any) => p.isActive).map((plan: any) => (
                                        <label
                                            key={plan.id}
                                            className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedPlan?.id === plan.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-stroke hover:border-primary/50 dark:border-dark-3'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                className="sr-only"
                                                checked={selectedPlan?.id === plan.id}
                                                onChange={() => setSelectedPlan(plan)}
                                            />
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-dark dark:text-white">{plan.months} Months</span>
                                                <div className="text-right text-xs space-y-0.5">
                                                    <div className="text-gray-500">Advance: <span className="text-dark dark:text-white font-medium">Rs. {plan.advance.toLocaleString()}</span></div>
                                                    <div className="text-gray-500">Monthly: <span className="text-dark dark:text-white font-medium">Rs. {plan.monthlyAmount.toLocaleString()}</span></div>
                                                    <div className="text-gray-500">Total: <span className="text-dark dark:text-white font-medium">Rs. {plan.totalPrice.toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6 dark:border-dark-3">
                        <button
                            onClick={() => setEditModalOpen(false)}
                            className="rounded-lg border border-stroke px-6 py-2.5 text-sm font-medium dark:border-dark-3 hover:bg-gray-50 dark:hover:bg-dark-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmEdit}
                            disabled={isSubmitting || !selectedProduct || !selectedPlan}
                            className="bg-primary text-white rounded-lg px-8 py-2.5 text-sm font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Order Item'}
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
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
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
