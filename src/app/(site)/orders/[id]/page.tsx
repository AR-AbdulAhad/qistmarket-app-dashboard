"use client";

import { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/Modal/Modal';
import Loader from '@/components/common/Loader';
import toast from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useAuth } from '../../../../../contexts/AuthContext';

// --- ReadOnlyField for view-only display (like Field, but always whitespace-pre-wrap) ---
const ReadOnlyField = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => {
    if (!shouldDisplay(value)) return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 whitespace-pre-wrap dark:bg-dark-3 dark:text-gray-300">{displayValue}</div>
        </div>
    );
};

function DocumentCard({ doc }: { doc: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
            >
                <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                    {doc.label || doc.document_type}
                </h4>
                <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>Type: <span className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</span></p>
                    <p>Uploaded: <span className="font-medium">{formatDateTimeUTC(doc.uploaded_at)}</span></p>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                    <img
                        src={doc.file_url}
                        alt={doc.label || doc.document_type}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <div className="mt-3 inline-flex items-center text-sm font-medium text-[#ff3d3d] hover:underline">
                    Click to view full size →
                </div>
            </div>
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={doc.file_url}
                            alt={doc.label || doc.document_type}
                            className="max-h-[90vh] w-auto object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

function LocationPhotoCard({ photo, label }: { photo: { file_url: string, uploaded_at: string }, label: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
      >
        <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">
          {label} - Location Photo
        </h4>
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          <p>Uploaded: {new Date(photo.uploaded_at).toLocaleString()}</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
          <img
            src={photo.file_url}
            alt={`Location photo for ${label}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="mt-3 inline-flex items-center text-sm font-medium text-[#ff3d3d] hover:underline">
          Click to view full size →
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={photo.file_url}
              alt={`Location photo for ${label}`}
              className="max-h-[90vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}

// --- Verification Data Types (copied from verification page) ---
interface VerificationData {
    id: number;
    order_id: number;
    verification_officer_id: number;
    status: string;
    start_time: string;
    end_time: string | null;
    created_at: string;
    updated_at: string;
    order: {
        id: number;
        order_ref: string;
        status: string;
    };
    verification_officer: {
        full_name: string;
        username: string;
    };
    purchaser: any;
    grantors: any[];
    nextOfKin: any;
    locations: any[];
    verification_locations: any[];
    documents: any[];
    reviews: any[];
    edit_history?: any[];
    home_location_required: boolean;
    home_location_verified: boolean;
}

dayjs.extend(utc);

const formatDateTimeUTC = (value?: string): string => {
    if (!value) return "Not set";
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
};
const formatDateTimeLocal = (value?: string): string => {
    if (!value) return "Not set";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
};

const shouldDisplay = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
};
// --- Verification Section Components (Field, Modal, etc.) ---
const Field = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => {
    if (!shouldDisplay(value)) return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {displayValue}
            </div>
        </div>
    );
};
// --- Main Component ---

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
    // --- Verification State ---
    const [verification, setVerification] = useState<VerificationData | null>(null);
    const [verificationLoading, setVerificationLoading] = useState(true);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    // Modal state for home location assignment
    const [modalOpen, setModalOpen] = useState(false);
    const [modalOfficerType, setModalOfficerType] = useState<'vo' | 'do' | null>(null);
    const [locationRequestPending, setLocationRequestPending] = useState(false);
    const { user } = useAuth();
    // Fetch verification data for this order
    const fetchVerification = async () => {
        try {
            setVerificationLoading(true);
            setVerificationError(null);
            const token = Cookies.get('auth_token');
            if (!token) throw new Error('Authentication required');
            const res = await fetch(`${BACKEND_URL}/api/verification/order/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (res.ok && json.success && json.data?.verification) {
                setVerification(json.data.verification);
            } else if (res.status === 404 || (json.error?.code === 404)) {
                // soft state: no verification yet
                setVerification(null);
                setVerificationError(null);
            } else if (json.success === false && json.error?.message) {
                setVerificationError(json.error.message);
            } else {
                setVerificationError('No verification data found');
            }
        } catch (err: any) {
            setVerificationError(err.message || 'An error occurred');
        } finally {
            setVerificationLoading(false);
        }
    };

    // States for Edit / Cancel
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [newProductName, setNewProductName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [handoverModalOpen, setHandoverModalOpen] = useState(false);
    const [handoverOtp, setHandoverOtp] = useState('');
    const [selectedImei, setSelectedImei] = useState('');
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [otpSent, setOtpSent] = useState(false);

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
        if (id) {
            fetchOrder();
            fetchVerification();
        }
    }, [id]);
    // Home location assignment action
    const handleLocationAction = async (action: 'send-to-vo' | 'send-to-do', officerId: string) => {
        if (!verification?.id) return;
        const token = Cookies.get('auth_token');
        try {
            const res = await fetch(`${BACKEND_URL}/api/verification/${verification.id}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ officer_id: officerId })
            });
            if (!res.ok) throw new Error('Failed to assign officer for location capture');
            toast.success(action === 'send-to-vo' ? 'Successfully sent to Verification Officer' : 'Successfully sent to Delivery Officer');
            // Refresh verification data
            await fetchVerification();
        } catch (err: any) {
            toast.error(err.message || 'Error assigning officer');
        }
    };

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

            {/* --- Verification Section (View + Home Location) --- */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Verification & Home Location</h2>
                {verificationLoading ? (
                    <Loader text="Loading verification details..." />
                ) : verificationError ? (
                    <div className="text-red-600 py-8">{verificationError}</div>
                ) : !verification ? (
                    <div className="text-gray-600 py-8">No verification record exists for this order yet.</div>
                ) : (
                    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <Field label="Verification ID" value={verification.id} />
                            <Field label="Order ID" value={verification.order_id} />
                            <Field label="Status" value={verification.status} />
                            {verification.verification_officer && (
                                <Field label="Officer" value={`${verification.verification_officer.full_name} (${verification.verification_officer.username})`} />
                            )}
                            <Field label="Start Time" value={verification.start_time ? formatDateTimeUTC(verification.start_time) : null} />
                            <Field label="End Time" value={verification.end_time ? formatDateTimeUTC(verification.end_time) : null} />
                        </div>
                        {verification.home_location_required && (
                            <div className={cn(
                                "flex items-center gap-2 rounded-lg p-4 font-bold border-2 mb-4",
                                verification.home_location_verified
                                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800"
                                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 animate-pulse"
                            )}>
                                <span className="text-xl">📍</span>
                                <span>HOME LOCATION REQUIRED</span>
                                {verification.home_location_verified && (
                                    <span className="ml-auto text-sm font-medium bg-green-100 px-2 py-0.5 rounded text-green-800">Verified</span>
                                )}
                            </div>
                        )}
                        {/* Home Location Assignment Actions */}
                        {verification.home_location_required && !verification.home_location_verified && (
                            <div className="mb-6 rounded-xl border border-warning bg-warning/5 p-6 dark:border-warning/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">📍</span>
                                    <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300">Home Location Assignment Required</h3>
                                </div>
                                <p className="mb-6 text-gray-700 dark:text-gray-300 text-sm">
                                    This verification requires a customer home location capture. Assign an officer to proceed. Once a request is sent, you cannot assign again until the current request is resolved.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {verification.verification_officer && (
                                        <button
                                            onClick={() => {
                                                setModalOfficerType('vo');
                                                setModalOpen(true);
                                            }}
                                            className={cn(
                                                "rounded-lg px-6 py-2.5 font-semibold shadow-sm transition-colors",
                                                locationRequestPending || verification.status === 'location_capture_pending'
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-primary text-white hover:bg-primary/90"
                                            )}
                                            disabled={locationRequestPending || verification.status === 'location_capture_pending'}
                                        >
                                            Option 1: Send to Verification Officer
                                        </button>
                                    )}
                                </div>
                                {(locationRequestPending || verification.status === 'location_capture_pending') && (
                                    <div className="mt-6 flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-base font-medium">
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                        Officer assignment is pending. Please wait for completion before assigning again.
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Officer Selection Modal */}
                        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                            <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                                <h2 className="text-lg font-bold mb-4">
                                    {modalOfficerType === 'vo' ? 'Send to Verification Officer' : 'Send to Delivery Officer'}
                                </h2>
                                {modalOfficerType === 'vo' && verification.verification_officer && (
                                    <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-gray-800">
                                        <div className="font-semibold">Officer Details:</div>
                                        <div>Name: {verification.verification_officer.full_name}</div>
                                        <div>Username: {verification.verification_officer.username}</div>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button
                                        className="bg-primary text-white px-4 py-2 rounded"
                                        onClick={async () => {
                                            setLocationRequestPending(true);
                                            setModalOpen(false);
                                            await handleLocationAction(
                                                modalOfficerType === 'vo' ? 'send-to-vo' : 'send-to-do',
                                                modalOfficerType === 'vo' ? String(verification.verification_officer_id) : ''
                                            );
                                            setLocationRequestPending(false);
                                        }}
                                        disabled={locationRequestPending || (modalOfficerType === 'vo' && !verification.verification_officer)}
                                    >
                                        Confirm & Send
                                    </button>
                                    <button
                                        className="bg-gray-300 px-4 py-2 rounded"
                                        onClick={() => setModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </Modal>

                                                {/* Purchaser Details (view-only, verification page order/logic) */}
                                                {verification.purchaser && Object.values(verification.purchaser).some(val => shouldDisplay(val)) && (
                                                    <div className="mb-12">
                                                        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Purchaser Details</h2>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <ReadOnlyField label="Name" value={verification.purchaser.name} />
                                                            <ReadOnlyField label="Father/Husband Name" value={verification.purchaser.father_husband_name} />
                                                            {shouldDisplay(verification.purchaser.present_address) && (
                                                                <ReadOnlyField label="Present Address" value={`${verification.purchaser.present_address}${verification.purchaser.present_zone ? `\nZone: ${verification.purchaser.present_zone}` : ''}${verification.purchaser.present_area ? `\nArea: ${verification.purchaser.present_area}` : ''}${verification.purchaser.present_block ? `\nBlock: ${verification.purchaser.present_block}` : ''}${verification.purchaser.present_street ? `\nStreet: ${verification.purchaser.present_street}` : ''}${verification.purchaser.present_house_no ? `\nHouse No: ${verification.purchaser.present_house_no}` : ''}`} />
                                                            )}
                                                            {shouldDisplay(verification.purchaser.permanent_address) && (
                                                                <ReadOnlyField label="Permanent Address" value={`${verification.purchaser.permanent_address}${verification.purchaser.permanent_zone ? `\nZone: ${verification.purchaser.permanent_zone}` : ''}${verification.purchaser.permanent_area ? `\nArea: ${verification.purchaser.permanent_area}` : ''}${verification.purchaser.permanent_block ? `\nBlock: ${verification.purchaser.permanent_block}` : ''}${verification.purchaser.permanent_street ? `\nStreet: ${verification.purchaser.permanent_street}` : ''}${verification.purchaser.permanent_house_no ? `\nHouse No: ${verification.purchaser.permanent_house_no}` : ''}`} />
                                                            )}
                                                            <ReadOnlyField label="CNIC Number" value={verification.purchaser.cnic_number} />
                                                            <ReadOnlyField label="Telephone Number" value={verification.purchaser.telephone_number} />
                                                            <ReadOnlyField label="Employment Type" value={verification.purchaser.employment_type} />
                                                            <ReadOnlyField label="Job Type" value={verification.purchaser.job_type} />
                                                            <ReadOnlyField label="Employer Name" value={verification.purchaser.employer_name} />
                                                            <ReadOnlyField label="Employer Address" value={verification.purchaser.employer_address} />
                                                            <ReadOnlyField label="Designation" value={verification.purchaser.designation} />
                                                            <ReadOnlyField label="Official Number" value={verification.purchaser.official_number} />
                                                            <ReadOnlyField label="Business Name" value={verification.purchaser.business_name} />
                                                            <ReadOnlyField label="Established Since" value={verification.purchaser.established_since} />
                                                            <ReadOnlyField label="Business Address" value={verification.purchaser.business_address} />
                                                            <ReadOnlyField label="Net Income" value={verification.purchaser.net_income} />
                                                            <ReadOnlyField label="Years in Company" value={verification.purchaser.years_in_company} />
                                                            <ReadOnlyField label="Gross Salary" value={verification.purchaser.gross_salary} />
                                                            <ReadOnlyField label="Nearest Location" value={verification.purchaser.nearest_location} />
                                                            <ReadOnlyField label="Verified" value={verification.purchaser.is_verified} />
                                                        </div>
                                                        {/* Purchaser Documents */}
                                                        {verification.documents.filter((doc: any) => doc.person_type === 'purchaser').length > 0 && (
                                                            <div className="mt-8">
                                                                <h3 className="mb-4 text-xl font-semibold text-blue-700 dark:text-blue-400">Purchaser Uploaded Documents</h3>
                                                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                                    {verification.documents.filter((doc: any) => doc.person_type === 'purchaser').map((doc: any) => (
                                                                        <DocumentCard key={doc.id} doc={doc} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Grantors (view-only, verification page order/logic) */}
                                                {verification.grantors && verification.grantors.map((grantor: any) => {
                                                    const hasGrantorData = Object.values(grantor).some(val => shouldDisplay(val));
                                                    const hasDocuments = verification.documents.filter((doc: any) => doc.person_type === `grantor${grantor.grantor_number}`).length > 0;
                                                    if (!hasGrantorData && !hasDocuments) return null;
                                                    return (
                                                        <div key={grantor.id} className="mb-16">
                                                            <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Grantor {grantor.grantor_number} Details</h2>
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                                <ReadOnlyField label="Name" value={grantor.name} />
                                                                <ReadOnlyField label="Father/Husband Name" value={grantor.father_husband_name} />
                                                                {shouldDisplay(grantor.present_address) && (
                                                                    <ReadOnlyField label="Present Address" value={`${grantor.present_address}${grantor.present_zone ? `\nZone: ${grantor.present_zone}` : ''}${grantor.present_area ? `\nArea: ${grantor.present_area}` : ''}${grantor.present_block ? `\nBlock: ${grantor.present_block}` : ''}${grantor.present_street ? `\nStreet: ${grantor.present_street}` : ''}${grantor.present_house_no ? `\nHouse No: ${grantor.present_house_no}` : ''}`} />
                                                                )}
                                                                {shouldDisplay(grantor.permanent_address) && (
                                                                    <ReadOnlyField label="Permanent Address" value={`${grantor.permanent_address}${grantor.permanent_zone ? `\nZone: ${grantor.permanent_zone}` : ''}${grantor.permanent_area ? `\nArea: ${grantor.permanent_area}` : ''}${grantor.permanent_block ? `\nBlock: ${grantor.permanent_block}` : ''}${grantor.permanent_street ? `\nStreet: ${grantor.permanent_street}` : ''}${grantor.permanent_house_no ? `\nHouse No: ${grantor.permanent_house_no}` : ''}`} />
                                                                )}
                                                                <ReadOnlyField label="CNIC Number" value={grantor.cnic_number} />
                                                                <ReadOnlyField label="Telephone Number" value={grantor.telephone_number} />
                                                                <ReadOnlyField label="Employment Type" value={grantor.employment_type} />
                                                                <ReadOnlyField label="Job Type" value={grantor.job_type} />
                                                                <ReadOnlyField label="Designation" value={grantor.designation} />
                                                                <ReadOnlyField label="Official Number" value={grantor.official_number} />
                                                                <ReadOnlyField label="Office Address" value={grantor.office_address} />
                                                                <ReadOnlyField label="Company Name" value={grantor.company_name} />
                                                                <ReadOnlyField label="Years in Company" value={grantor.years_in_company} />
                                                                <ReadOnlyField label="Monthly Income" value={grantor.monthly_income} />
                                                                <ReadOnlyField label="Business Name" value={grantor.business_name} />
                                                                <ReadOnlyField label="Established Since" value={grantor.established_since} />
                                                                <ReadOnlyField label="Business Address" value={grantor.business_address} />
                                                                <ReadOnlyField label="Net Income" value={grantor.net_income} />
                                                                <ReadOnlyField label="Full Residential Address" value={grantor.full_residential_address} />
                                                                <ReadOnlyField label="Relationship" value={grantor.relationship} />
                                                                <ReadOnlyField label="Nearest Location" value={grantor.nearest_location} />
                                                                <ReadOnlyField label="Verified" value={grantor.is_verified} />
                                                            </div>
                                                            {/* Grantor Documents */}
                                                            {hasDocuments && (
                                                                <div className="mt-8">
                                                                    <h3 className="mb-4 text-xl font-semibold text-indigo-700 dark:text-indigo-400">Grantor {grantor.grantor_number} Uploaded Documents</h3>
                                                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                                        {verification.documents.filter((doc: any) => doc.person_type === `grantor${grantor.grantor_number}`).map((doc: any) => (
                                                                            <DocumentCard key={doc.id} doc={doc} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Next of Kin (view-only, verification page order/logic) */}
                                                {verification.nextOfKin && Object.values(verification.nextOfKin).some(val => shouldDisplay(val)) && (
                                                    <div className="mb-12">
                                                        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Next of Kin Details</h2>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                            <ReadOnlyField label="Name" value={verification.nextOfKin.name} />
                                                            <ReadOnlyField label="CNIC Number" value={verification.nextOfKin.cnic_number} />
                                                            <ReadOnlyField label="Relation" value={verification.nextOfKin.relation} />
                                                            <ReadOnlyField label="Phone Number" value={verification.nextOfKin.phone_number} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Locations (view-only, verification page order/logic) */}
                                                {(verification.locations.length > 0 || verification.verification_locations.length > 0) && (
                                                    <div className="mb-12">
                                                        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Location Tracking</h2>

                                                        {verification.locations.length > 0 && (
                                                            <div className="mb-8">
                                                                <h3 className="mb-3 text-xl font-semibold text-dark dark:text-white">GPS Locations</h3>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b border-stroke dark:border-dark-3">
                                                                                <th className="px-4 py-2 text-left">Label</th>
                                                                                <th className="px-4 py-2 text-left">Latitude</th>
                                                                                <th className="px-4 py-2 text-left">Longitude</th>
                                                                                <th className="px-4 py-2 text-left">Accuracy</th>
                                                                                <th className="px-4 py-2 text-left">Timestamp</th>
                                                                                <th className="px-4 py-2 text-left">Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {verification.locations.map((loc) => (
                                                                                <tr key={loc.id} className="border-b border-stroke dark:border-dark-3">
                                                                                    <td className="px-4 py-2">{loc.label}</td>
                                                                                    <td className="px-4 py-2">{loc.latitude}</td>
                                                                                    <td className="px-4 py-2">{loc.longitude}</td>
                                                                                    <td className="px-4 py-2">{loc.accuracy ? `${loc.accuracy} meters` : '—'}</td>
                                                                                    <td className="px-4 py-2">{formatDateTimeUTC(loc.timestamp)}</td>
                                                                                    <td className="px-4 py-2">
                                                                                        <a
                                                                                            href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-primary hover:underline font-medium"
                                                                                        >
                                                                                            View on Map
                                                                                        </a>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {verification.verification_locations.length > 0 && (
                                                            <div>
                                                                <h3 className="mb-3 text-xl font-semibold text-dark dark:text-white">Location Photos</h3>
                                                                <div className="space-y-6">
                                                                    {verification.verification_locations.map((loc) => (
                                                                        <div key={loc.id} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                                                                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                                <Field label="Location Type" value={loc.location_type} />
                                                                                <Field label="Label" value={loc.label} />
                                                                                <Field label="Person Type" value={loc.person_type} />
                                                                                <div className="flex flex-col">
                                                                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Coordinates</label>
                                                                                    <div className="mt-1 flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3">
                                                                                        <span className="dark:text-gray-300">
                                                                                            {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : '—'}
                                                                                        </span>
                                                                                        {loc.latitude && loc.longitude && (
                                                                                            <a
                                                                                                href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-xs font-bold text-primary hover:underline ml-auto"
                                                                                            >
                                                                                                VIEW ON GOOGLE MAP
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <Field label="Address" value={loc.address} />
                                                                                <Field label="Captured At" value={loc.created_at ? formatDateTimeUTC(loc.created_at) : null} />
                                                                            </div>

                                                                            {loc.photos && loc.photos.length > 0 && (
                                                                                <div>
                                                                                    <h4 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Photos</h4>
                                                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                                                        {loc.photos.map((photo: any) => (
                                                                                            <LocationPhotoCard key={photo.id} photo={photo} label={loc.label} />
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
