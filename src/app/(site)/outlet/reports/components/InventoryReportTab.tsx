"use client";

import React, { useEffect, useState, useRef } from 'react';
import Loader from '@/components/common/Loader';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

interface InventoryReportTabProps {
    token: string;
    startDate: Date | null;
    endDate: Date | null;
    searchQuery: string;
}

export default function InventoryReportTab({ token, startDate, endDate, searchQuery }: InventoryReportTabProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const printRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let url = `${API_BASE}/api/outlet-reports/stock-summary`;
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate.toISOString());
                if (endDate) params.append('endDate', endDate.toISOString());
                if (params.toString()) url += `?${params.toString()}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token, startDate, endDate]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Inventory_Report',
    });

    const handleExportCSV = () => {
        if (!data || data.length === 0) return;
        const rows = data.map((item: any) => ({
            "Product Name": item.product,
            "Total In Stock": item.inStock,
            "Sold": item.sold,
            "Total Movement": item.total,
            "Total Valuation": item.valuation
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
        XLSX.writeFile(wb, "Inventory_Report.xlsx");
    };

    const filteredData = data.filter((item: any) => 
        item.product?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStockValuation = filteredData.reduce((acc: number, item: any) => acc + (item.valuation || 0), 0);
    const totalItemsInStock = filteredData.reduce((acc: number, item: any) => acc + (item.inStock || 0), 0);
    const totalItemsSold = filteredData.reduce((acc: number, item: any) => acc + (item.sold || 0), 0);

    if (loading) return <div className="p-8 text-center"><Loader /></div>;

    return (
        <div className="flex flex-col gap-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Inventory Movement Report</h2>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">
                        Export CSV
                    </button>
                    <button onClick={handlePrint} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* Print Container */}
            <div ref={printRef} className="print:p-6 flex flex-col gap-6">
                <div className="hidden print:block mb-4 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Movement Report</h1>
                    <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Items in Stock</p>
                        <p className="text-2xl font-bold text-green-600">{totalItemsInStock}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Items Sold in Period</p>
                        <p className="text-2xl font-bold text-blue-600">{totalItemsSold}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Capital Valuation</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">Rs {totalStockValuation.toLocaleString()}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50 text-gray-800 dark:bg-gray-900/50 dark:text-white">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Product Name</th>
                                    <th className="px-4 py-3 font-medium">Currently In Stock</th>
                                    <th className="px-4 py-3 font-medium">Sold</th>
                                    <th className="px-4 py-3 font-medium">Total Movement</th>
                                    <th className="px-4 py-3 font-medium">Calculated Valuation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredData.length > 0 ? filteredData.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.product}</td>
                                        <td className="px-4 py-3 font-medium text-green-600">{item.inStock}</td>
                                        <td className="px-4 py-3 font-medium text-blue-600">{item.sold}</td>
                                        <td className="px-4 py-3">{item.total}</td>
                                        <td className="px-4 py-3">Rs {item.valuation?.toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No inventory data found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
