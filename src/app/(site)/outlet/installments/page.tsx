"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import InstallmentsTable from "@/components/Installments/InstallmentsTable";
import InstallmentPaymentModal from "@/components/Installments/InstallmentPaymentModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => {
    const token = Cookies.get("auth_token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

function InstallmentsContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [data, setData] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearch);
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);

    // Sync search from URL if it changes
    useEffect(() => {
        if (initialSearch) setSearch(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        fetchInstallments();
    }, [pagination.page, search]);

    const fetchInstallments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/installments?page=${pagination.page}&search=${search}`, {
                headers: getAuthHeaders(),
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data.installments);
                setPagination(result.data.pagination);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (order: any, installment: any) => {
        setSelectedOrder(order);
        setSelectedInstallment(installment);
        setModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Installments & Ledgers</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage delivered orders and collect monthly installments.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search by Ref, Name, Phone or IMEI..."
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 animate-pulse">Loading ledgers...</p>
                </div>
            ) : (
                <>
                    <InstallmentsTable 
                        data={data} 
                        onPay={handlePayClick} 
                    />
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    )}
                </>
            )}

            <InstallmentPaymentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchInstallments}
                orderId={selectedOrder?.order_id}
                orderRef={selectedOrder?.order_ref}
                customerName={selectedOrder?.customer_name}
                installment={selectedInstallment}
            />
        </div>
    );
}

export default function OutletInstallmentsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <InstallmentsContent />
        </Suspense>
    );
}
