import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { cn } from '@/lib/utils';
import dayjs from "dayjs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const formatDateTimeUTC = (value?: string): string => {
    if (!value) return "Not set";
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
};

// RecoveryPhotoCard Component - For recovery visit photos
function RecoveryPhotoCard({ photo, visitNumber, photoIndex }: { photo: any; visitNumber: number; photoIndex: number }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <>
            <div
                onClick={() => setIsModalOpen(true)}
                className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
            >
                <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                    Recovery Visit #{visitNumber} - Photo {photoIndex + 1}
                </h4>
                <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {photo.photo_type && (
                        <p>Type: <span className="font-medium capitalize">{photo.photo_type.replace('_', ' ')}</span></p>
                    )}
                    <p>Uploaded: <span className="font-medium">{formatDateTimeUTC(photo.uploaded_at)}</span></p>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                    <img
                        src={photo.file_url}
                        alt={`Recovery visit ${visitNumber} photo ${photoIndex + 1}`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <div className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline">
                    <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
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
                            className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={photo.file_url}
                            alt={`Recovery visit photo`}
                            className="max-h-[90vh] w-auto object-contain"
                        />
                        {/* Photo Info Footer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <div className="text-white">
                                <p className="text-sm font-medium">
                                    {photo.photo_type ? `Type: ${photo.photo_type.replace('_', ' ')}` : 'Recovery Visit Photo'}
                                </p>
                                <p className="text-xs opacity-75">
                                    Uploaded: {formatDateTimeUTC(photo.uploaded_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function RecoveryVisitDetails({ orderId }: { orderId: string | number }) {
    const [recoveryVisits, setRecoveryVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedVisit, setExpandedVisit] = useState<number | null>(null);

    useEffect(() => {
        if (orderId) {
            fetchRecoveryVisits();
        }
    }, [orderId]);

    const fetchRecoveryVisits = async () => {
        if (!orderId) return;
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('auth_token');
            const res = await fetch(`${BACKEND_URL}/api/recovery/order/${orderId}/visits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setRecoveryVisits(json.data || []);
            } else {
                setError(json.error?.message || 'Failed to fetch recovery visits');
            }
        } catch (err: any) {
            console.error('Error fetching recovery visits:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rs. ${amount?.toLocaleString() || 0}`;
    };

    const formatDateTime = (dateTime: string) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString('en-PK', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-8">
                <div className="flex items-center justify-center space-x-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading recovery visits...</span>
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
                        <h3 className="font-semibold text-red-800 dark:text-red-400">Unable to load recovery visits</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!recoveryVisits || recoveryVisits.length === 0) {
        return (
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 p-6">
                <div className="text-center">
                    <span className="text-4xl">🔍</span>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No recovery visits recorded for this order</p>
                </div>
            </div>
        );
    }

    // Calculate total recovery summary
    const totalVisits = recoveryVisits.length;
    const totalAmountCollected = recoveryVisits.reduce((sum, visit) => sum + (visit.amount_collected || 0), 0);
    const totalFuelCharges = recoveryVisits.reduce((sum, visit) => sum + (visit.fuel_charges || 0), 0);
    const visitsWithPayment = recoveryVisits.filter(v => v.payment_collected).length;

    return (
        <div className="space-y-6">
            {/* Recovery Summary Header */}
            <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800">
                <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </span>
                            <h2 className="text-xl font-bold text-dark dark:text-white">Recovery Visits</h2>
                        </div>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {totalVisits} Visit{totalVisits !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(totalAmountCollected)}
                                </p>
                            </div>
                            <span className="text-3xl">💰</span>
                        </div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fuel Charges</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {formatCurrency(totalFuelCharges)}
                                </p>
                            </div>
                            <span className="text-3xl">⛽</span>
                        </div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Visits with Payment</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {visitsWithPayment} / {totalVisits}
                                </p>
                            </div>
                            <span className="text-3xl">💳</span>
                        </div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {Math.round((visitsWithPayment / totalVisits) * 100)}%
                                </p>
                            </div>
                            <span className="text-3xl">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Individual Recovery Visits */}
            {recoveryVisits.map((visit, index) => (
                <div key={visit.id} className="rounded-lg border border-stroke bg-white shadow-default dark:border-dark-3 dark:bg-gray-800 overflow-hidden">
                    {/* Visit Header */}
                    <div 
                        className="cursor-pointer border-b border-stroke bg-gray-50 px-6 py-4 transition-colors hover:bg-gray-100 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
                        onClick={() => setExpandedVisit(expandedVisit === index ? null : index)}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="font-semibold text-dark dark:text-white">
                                        Recovery Visit #{index + 1}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDateTime(visit.visit_time)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {visit.payment_collected && (
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Payment Collected: {formatCurrency(visit.amount_collected)}
                                    </span>
                                )}
                                <svg 
                                    className={cn("h-5 w-5 text-gray-500 transition-transform", expandedVisit === index && "rotate-180")}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedVisit === index && (
                        <div className="p-6">
                            {/* Officer Information */}
                            {visit.officer && (
                                <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-dark-3">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark dark:text-white">
                                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Recovery Officer Details
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Officer Name</label>
                                            <p className="font-medium text-dark dark:text-white">{visit.officer?.full_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">Username</label>
                                            <p className="font-medium text-dark dark:text-white">{visit.officer?.username || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visit Location */}
                            {(visit.latitude || visit.longitude) && (
                                <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-dark-3">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark dark:text-white">
                                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Visit Location
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {visit.latitude && (
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Latitude</label>
                                                <p className="font-mono text-sm text-dark dark:text-white">{visit.latitude}</p>
                                            </div>
                                        )}
                                        {visit.longitude && (
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400">Longitude</label>
                                                <p className="font-mono text-sm text-dark dark:text-white">{visit.longitude}</p>
                                            </div>
                                        )}
                                    </div>
                                    {(visit.latitude && visit.longitude) && (
                                        <div className="mt-3">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View on Google Maps
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Customer Feedback & Notes */}
                            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {visit.customer_feedback && (
                                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
                                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            Customer Feedback
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {visit.customer_feedback}
                                        </p>
                                    </div>
                                )}

                                {visit.visit_notes && (
                                    <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/10">
                                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Officer Notes
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {visit.visit_notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Details */}
                            {visit.payment_collected && (
                                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-400">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment Collected
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400">Amount Collected</label>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(visit.amount_collected)}
                                            </p>
                                        </div>
                                        {visit.fuel_charges > 0 && (
                                            <div>
                                                <label className="text-xs text-gray-600 dark:text-gray-400">Fuel Charges</label>
                                                <p className="font-medium text-dark dark:text-white">
                                                    {formatCurrency(visit.fuel_charges)}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400">Net Collected</label>
                                            <p className="font-semibold text-dark dark:text-white">
                                                {formatCurrency((visit.amount_collected || 0) - (visit.fuel_charges || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Photos Section */}
                            {visit.photos && visit.photos.length > 0 && (
                                <div>
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-dark dark:text-white">
                                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Visit Photos ({visit.photos.length})
                                    </h4>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {visit.photos.map((photo: any, photoIdx: number) => (
                                            <RecoveryPhotoCard 
                                                key={photo.id || photoIdx}
                                                photo={photo}
                                                visitNumber={index + 1}
                                                photoIndex={photoIdx}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};