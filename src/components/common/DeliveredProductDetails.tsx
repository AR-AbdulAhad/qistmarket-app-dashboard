import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import { cn } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const formatDateTimeUTC = (value?: string): string => {
    if (!value) return "Not set";
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
};

// DeliveryPhotoCard Component - For delivery uploads (similar to RecoveryPhotoCard)
function DeliveryPhotoCard({ upload, index }: { upload: any; index: number }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
            >
                <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                    Delivery Upload #{index + 1}
                </h4>
                <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {upload.upload_type && (
                        <p>Type: <span className="font-medium capitalize">{upload.upload_type.replace(/_/g, ' ')}</span></p>
                    )}
                    <p>Uploaded: <span className="font-medium">{formatDateTimeUTC(upload.uploaded_at)}</span></p>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                    {upload.file_url ? (
                        <img
                            src={upload.file_url}
                            alt={`Delivery upload ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs text-center p-2">
                            {upload.link ? <span className="text-primary underline font-medium">Document Link</span> : 'No Preview'}
                        </div>
                    )}
                </div>
                <div className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline">
                    <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    View Details →
                </div>
            </div>
            
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="p-4 border-b dark:border-dark-3">
                            <h3 className="text-xl font-bold dark:text-white">Delivery Upload Details</h3>
                            <p className="text-sm text-gray-500 capitalize">{upload.upload_type?.replace(/_/g, ' ')}</p>
                        </div>
                        
                        <div className="overflow-auto p-4 max-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-dark-2">
                            {upload.file_url ? (
                                <img
                                    src={upload.file_url}
                                    alt="Full size"
                                    className="max-w-full h-auto shadow-lg rounded"
                                />
                            ) : upload.link ? (
                                <div className="p-8 text-center">
                                    <p className="mb-4 dark:text-gray-300">This upload is a document link:</p>
                                    <a 
                                        href={upload.link} 
                                        target="_blank" 
                                        className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-md font-bold"
                                    >
                                        Open Document in New Tab
                                    </a>
                                </div>
                            ) : (
                                <p className="dark:text-gray-400">No preview available</p>
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-dark-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                             <div>Uploaded: {formatDateTimeUTC(upload.uploaded_at)}</div>
                             {upload.tag && <div>Tag: <span className="font-medium text-dark dark:text-white px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{upload.tag}</span></div>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function DeliveredProductDetails({ orderId }: { orderId: string | number }) {
    const [deliveredProduct, setDeliveredProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedInstallments, setExpandedInstallments] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchDeliveredProductDetails();
        }
    }, [orderId]);

    const fetchDeliveredProductDetails = async () => {
        if (!orderId) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/delivered-product/order/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setDeliveredProduct(json.data);
            } else {
                setError(json.error?.message || 'Failed to fetch delivered product details');
            }
        } catch (err: any) {
            console.error('Error fetching delivered product:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-8">
                <div className="flex items-center justify-center space-x-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading delivered product details...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 p-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-400">Unable to load delivered product details</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!deliveredProduct) return null;

    // Helper function to get delivery agent name
    const getDeliveryAgentName = () => {
        // First check if we have delivery agent details from API
        if (deliveredProduct.delivery_details?.delivery_agent_name) {
            return deliveredProduct.delivery_details.delivery_agent_name;
        }
        // Fallback to ID if name not available
        if (deliveredProduct.delivery_details?.delivery_agent_id) {
            return `Agent ID: ${deliveredProduct.delivery_details.delivery_agent_id}`;
        }
        return 'N/A';
    };

    return (
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800">
            {/* Header */}
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                        <h2 className="text-xl font-bold text-dark dark:text-white">Delivered Product Details</h2>
                    </div>
                    {deliveredProduct.order_info?.delivered_at && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Delivered on: {formatDateTimeUTC(deliveredProduct.order_info.delivered_at)}
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Order Reference */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-dark-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Order Reference</p>
                            <p className="text-lg font-semibold text-dark dark:text-white">{deliveredProduct.order_info?.order_ref}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Token: {deliveredProduct.order_info?.token_number}</p>
                        </div>
                    </div>
                </div>

                {/* Product Information Section */}
                <div className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Product Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Product Name</label>
                            <p className="mt-1 font-semibold text-dark dark:text-white">{deliveredProduct.product_details?.product_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">IMEI / Serial Number</label>
                            <p className="mt-1 font-mono text-sm text-dark dark:text-white">{deliveredProduct.product_details?.imei_serial || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Color Variant</label>
                            <p className="mt-1 text-dark dark:text-white">{deliveredProduct.product_details?.color_variant || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
                            <p className="mt-1 text-dark dark:text-white">{deliveredProduct.product_details?.category || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Plan Details Section */}
                {(deliveredProduct.product_details?.total_amount || deliveredProduct.product_details?.months) && (
                    <div className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pricing Plan
                        </h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3 md:grid-cols-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Total Amount</label>
                                <p className="mt-1 text-lg font-bold text-primary">Rs. {deliveredProduct.product_details?.total_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Advance Amount</label>
                                <p className="mt-1 font-semibold text-dark dark:text-white">Rs. {deliveredProduct.product_details?.advance_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Monthly Amount</label>
                                <p className="mt-1 font-semibold text-dark dark:text-white">Rs. {deliveredProduct.product_details?.monthly_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Plan Duration</label>
                                <p className="mt-1 font-semibold text-dark dark:text-white">{deliveredProduct.product_details?.months} Months</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Information Section - Updated with Agent Name */}
                {deliveredProduct.delivery_details && (
                    <div className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 15v6" />
                            </svg>
                            Delivery Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Status</label>
                                <span className={cn(
                                    "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                    deliveredProduct.delivery_details.status === 'completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700"
                                )}>
                                    {deliveredProduct.delivery_details.status}
                                </span>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Feedback</label>
                                <p className="mt-1 text-dark dark:text-white">{deliveredProduct.delivery_details.feedback || 'No feedback provided'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Verified</label>
                                <p className="mt-1 text-dark dark:text-white">{deliveredProduct.delivery_details.verified ? 'Yes ✓' : 'No ✗'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Self Pickup</label>
                                <p className="mt-1 text-dark dark:text-white">{deliveredProduct.delivery_details.self_pickup ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Agent</label>
                                <p className="mt-1 font-semibold text-primary dark:text-primary">
                                    {getDeliveryAgentName()}
                                </p>
                            </div>
                            {deliveredProduct.delivery_details.end_time && (
                                <div className="md:col-span-2 lg:col-span-4">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Date & Time</label>
                                    <p className="mt-1 text-dark dark:text-white">{formatDateTimeUTC(deliveredProduct.delivery_details.end_time)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Delivery Uploads Section */}
                {deliveredProduct.delivery_details?.uploads && deliveredProduct.delivery_details.uploads.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Delivery Uploads
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {deliveredProduct.delivery_details.uploads.map((upload: any, idx: number) => (
                                <DeliveryPhotoCard key={upload.id || idx} upload={upload} index={idx} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Details Section */}
                {deliveredProduct.payment_details && (
                    <div className="mb-6">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-dark dark:text-white">
                            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Payment Details
                        </h3>

                        {/* Advance Payment */}
                        {deliveredProduct.payment_details.advance_payment && (
                            <div className="mb-4 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
                                <h4 className="mb-3 font-medium text-dark dark:text-white">Advance Payment</h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
                                        <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                                            Rs. {deliveredProduct.payment_details.advance_payment.amount?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                                        <p className="mt-1 text-dark dark:text-white">{deliveredProduct.payment_details.advance_payment.payment_method || 'Cash'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                                        <span className={cn(
                                            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                                            deliveredProduct.payment_details.advance_payment.status === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {deliveredProduct.payment_details.advance_payment.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Payment Date</label>
                                        <p className="mt-1 text-sm text-dark dark:text-white">
                                            {deliveredProduct.payment_details.advance_payment.created_at ? formatDateTimeUTC(deliveredProduct.payment_details.advance_payment.created_at) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Installment Plan */}
                        {deliveredProduct.payment_details.installment_plan && (
                            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <h4 className="font-medium text-dark dark:text-white">Installment Plan</h4>
                                    {deliveredProduct.payment_details.installment_plan.token && (
                                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-mono dark:bg-dark-2">
                                            Token: {deliveredProduct.payment_details.installment_plan.token}
                                        </span>
                                    )}
                                </div>

                                {/* Summary Cards */}
                                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                                        <p className="text-2xl font-bold text-primary">
                                            {deliveredProduct.payment_details.installment_plan.summary?.total_installments || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Installments</p>
                                    </div>
                                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                                        <p className="text-2xl font-bold text-green-600">
                                            {deliveredProduct.payment_details.installment_plan.summary?.paid_installments || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                                    </div>
                                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {deliveredProduct.payment_details.installment_plan.summary?.pending_installments || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                                    </div>
                                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-800">
                                        <p className="text-sm font-bold text-dark dark:text-white">
                                            Rs. {deliveredProduct.payment_details.installment_plan.summary?.total_paid_amount?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Paid / {deliveredProduct.payment_details.installment_plan.summary?.total_due_amount?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {deliveredProduct.payment_details.installment_plan.summary?.total_installments > 0 && (
                                    <div className="mb-4">
                                        <div className="mb-1 flex justify-between text-xs">
                                            <span className="text-gray-600 dark:text-gray-400">Payment Progress</span>
                                            <span className="font-medium text-dark dark:text-white">
                                                {Math.round((deliveredProduct.payment_details.installment_plan.summary?.paid_installments / 
                                                   deliveredProduct.payment_details.installment_plan.summary?.total_installments) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div 
                                                className="h-full rounded-full bg-primary transition-all duration-500"
                                                style={{ 
                                                    width: `${(deliveredProduct.payment_details.installment_plan.summary?.paid_installments / 
                                                             deliveredProduct.payment_details.installment_plan.summary?.total_installments) * 100}%` 
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Installments Table */}
                                {deliveredProduct.payment_details.installment_plan.installments?.length > 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setExpandedInstallments(!expandedInstallments)}
                                            className="mb-3 flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-left text-sm font-medium text-dark shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                        >
                                            <span>Installment Schedule</span>
                                            <svg 
                                                className={cn("h-4 w-4 transition-transform", expandedInstallments && "rotate-180")}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        {expandedInstallments && (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Month</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Due Date</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Amount Due</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Paid</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Remaining</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Payment Date</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Method</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                                        {deliveredProduct.payment_details.installment_plan.installments.map((inst: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                <td className="px-4 py-2 text-sm text-dark dark:text-white">{inst.label || `Month ${inst.month}`}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-medium text-dark dark:text-white">
                                                                    Rs. {inst.due_amount?.toLocaleString()}
                                                                    {inst.arrears > 0 && (
                                                                        <div className="text-[10px] text-red-500 font-medium">
                                                                            +{inst.arrears?.toLocaleString()} arr
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-green-600 dark:text-green-400">
                                                                    {inst.paid_amount > 0 ? `Rs. ${inst.paid_amount.toLocaleString()}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-red-500">
                                                                    {inst.remaining_amount > 0 ? `Rs. ${inst.remaining_amount.toLocaleString()}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <span className={cn(
                                                                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                                        inst.status === 'paid' 
                                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                                                            : (inst.paid_amount > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")
                                                                    )}>
                                                                        {inst.paid_amount > 0 && inst.status !== 'paid' ? 'Partial' : inst.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {inst.paid_at ? new Date(inst.paid_at).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                                                    {inst.payment_method || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* No Data Message */}
                {!deliveredProduct.product_details && !deliveredProduct.delivery_details && !deliveredProduct.payment_details && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-900/10">
                        <p className="text-yellow-800 dark:text-yellow-400">No delivered product details available for this order.</p>
                    </div>
                )}
            </div>
        </div>
    );
};