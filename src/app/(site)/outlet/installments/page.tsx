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
    const [activeTab, setActiveTab] = useState<'fresh' | 'overdue' | 'completed'>('fresh');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [stats, setStats] = useState({ totalRecovery: 0, overdueCount: 0 });
    
    // Selection state for export
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
    }, [pagination.page, search, activeTab, startDate, endDate]);

    const fetchInstallments = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: pagination.page.toString(),
                search,
                tab: activeTab,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            }).toString();

            const res = await fetch(`${API_BASE}/api/outlet/installments?${query}`, {
                headers: getAuthHeaders(),
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data.installments);
                setPagination(result.data.pagination);
                setStats({
                    totalRecovery: result.data.totalRecovery || 0,
                    overdueCount: result.data.overdueCount || 0
                });
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

    const toggleRowSelection = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const exportToCSV = () => {
        const rowsToExport = selectedIds.length > 0 
            ? data.filter(item => selectedIds.includes(item.order_id))
            : data;

        if (rowsToExport.length === 0) return;

        // Determine max months across all exported ledgers to create dynamic columns
        let maxMonths = 0;
        rowsToExport.forEach(item => {
            if (item.installmentLedger && item.installmentLedger.length > maxMonths) {
                maxMonths = item.installmentLedger.length;
            }
        });

        // Base Headers
        const headers = [
            "Order Ref", "Status", "Customer Name", "Customer CNIC", "Customer Phone", 
            "Product", "IMEI", "Total Due", "Total Paid", "Remaining Balance",
            "Grantor 1 Name", "Grantor 1 CNIC", "Grantor 1 Phone",
            "Grantor 2 Name", "Grantor 2 CNIC", "Grantor 2 Phone"
        ];

        // Dynamic Ledger Headers
        for (let i = 1; i <= maxMonths; i++) {
            headers.push(`Month ${i} Amount`, `Month ${i} Status`, `Month ${i} Paid Date`);
        }

        const csvRows = [headers.join(",")];

        rowsToExport.forEach(item => {
            const p = item.purchaser || {};
            const g1 = item.grantors?.[0] || {};
            const g2 = item.grantors?.[1] || {};

            const safeString = (str: any) => `"${(str || '').toString().replace(/"/g, '""')}"`;

            const rowData = [
                safeString(item.order_ref),
                safeString(item.status),
                safeString(item.customer_name),
                safeString(p.cnic_number),
                safeString(item.whatsapp_number),
                safeString(item.product_name),
                safeString(item.imei_serial),
                item.ledgerSummaries.totalInstallmentDue || 0,
                item.ledgerSummaries.totalInstallmentPaid || 0,
                item.ledgerSummaries.totalRemaining || 0,
                safeString(g1.name), safeString(g1.cnic_number), safeString(g1.phone_number),
                safeString(g2.name), safeString(g2.cnic_number), safeString(g2.phone_number)
            ];

            // Append ledger details for each month
            for (let i = 0; i < maxMonths; i++) {
                const ledgerRow = item.installmentLedger[i];
                if (ledgerRow) {
                    rowData.push(
                        ledgerRow.dueAmount || 0,
                        safeString(ledgerRow.status || 'pending'),
                        safeString(ledgerRow.paidAt ? new Date(ledgerRow.paidAt).toISOString().split('T')[0] : 'N/A')
                    );
                } else {
                    rowData.push('""', '""', '""'); // empty cells if ledger doesn't go this high
                }
            }

            csvRows.push(rowData.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `installments_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Header & Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Installments Summary</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Tracking {activeTab} installments and collections.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 px-6 min-w-[240px]">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Recovery</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">PKR {stats.totalRecovery.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 px-6 min-w-[240px]">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue Accounts</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.overdueCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-4">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl w-full md:w-auto overflow-x-auto">
                    <button 
                        onClick={() => { setActiveTab('fresh'); setPagination({...pagination, page: 1}); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'fresh' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Fresh
                    </button>
                    <button 
                        onClick={() => { setActiveTab('overdue'); setPagination({...pagination, page: 1}); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overdue' ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Overdue
                    </button>
                    <button 
                        onClick={() => { setActiveTab('completed'); setPagination({...pagination, page: 1}); }}
                        className={`flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'completed' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Fully Paid
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Search */}
                <div className="relative flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Search customer, ref or IMEI..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-transparent border-none focus:ring-0 outline-none text-sm font-medium dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Date Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                        type="date" 
                        className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-400 text-xs font-bold">to</span>
                    <input 
                        type="date" 
                        className="bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 hidden md:block"></div>

                {/* Export */}
                <button 
                    onClick={exportToCSV}
                    className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
                </button>
            </div>

            {loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Fetching Ledgers...</p>
                </div>
            ) : (
                <>
                    <InstallmentsTable 
                        data={data} 
                        onPay={handlePayClick} 
                        selectedIds={selectedIds}
                        onSelectRow={toggleRowSelection}
                    />
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-10">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm disabled:opacity-30 hover:border-blue-500 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                            </button>
                            <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                                    Page {pagination.page} <span className="text-gray-300 mx-2">/</span> {pagination.totalPages}
                                </span>
                            </div>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.totalPages}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm disabled:opacity-30 hover:border-blue-500 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
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
