"use client";

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { useAuth } from '../../../../../contexts/AuthContext';
import Cookies from 'js-cookie';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Loader from '@/components/common/Loader';
import SalesReportTab from './components/SalesReportTab';
import InventoryReportTab from './components/InventoryReportTab';
import FinancialsTab from './components/FinancialsTab';
import InstallmentRecoveriesTab from './components/InstallmentRecoveriesTab';
import OfficerRecoveryTab from './components/OfficerRecoveryTab';

export default function OutletReportsPage() {
    const { user } = useAuth();
    const token = Cookies.get('auth_token') || '';

    const [activeTab, setActiveTab] = useState('sales');

    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState<Date | null>(lastMonth);
    const [endDate, setEndDate] = useState<Date | null>(today);
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'sales',        label: 'Sales Report',             icon: '🛒' },
        { id: 'inventory',    label: 'Inventory Report',         icon: '📦' },
        { id: 'financials',   label: 'Financials',               icon: '💰' },
        { id: 'installments', label: 'Installment Recoveries',   icon: '🔁' },
        { id: 'officers',     label: 'Officer Recoveries',       icon: '👨‍💼' },
    ];

    if (!user) return <Loader />;

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Outlet Reports" />

            {/* Global Controls */}
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">From:</label>
                            <DatePicker
                                selected={startDate || undefined}
                                onChange={(date: Date | null) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                dateFormat="dd MMM yyyy"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">To:</label>
                            <DatePicker
                                selected={endDate || undefined}
                                onChange={(date: Date | null) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate || undefined}
                                className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                dateFormat="dd MMM yyyy"
                            />
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search in report..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Internal Sidebar */}
                <div className="w-full lg:w-64 shrink-0">
                    <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-white">Report Categories</h3>
                        </div>
                        <ul className="flex flex-col p-2 gap-1">
                            {tabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-xl transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        <span className="text-lg">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Report Content Area */}
                <div className="flex-1 min-h-[500px]">
                    {activeTab === 'sales'        && <SalesReportTab              token={token} startDate={startDate} endDate={endDate} searchQuery={searchQuery} />}
                    {activeTab === 'inventory'    && <InventoryReportTab          token={token} startDate={startDate} endDate={endDate} searchQuery={searchQuery} />}
                    {activeTab === 'financials'   && <FinancialsTab               token={token} startDate={startDate} endDate={endDate} searchQuery={searchQuery} />}
                    {activeTab === 'installments' && <InstallmentRecoveriesTab    token={token} startDate={startDate} endDate={endDate} searchQuery={searchQuery} />}
                    {activeTab === 'officers'     && <OfficerRecoveryTab          token={token} startDate={startDate} endDate={endDate} searchQuery={searchQuery} />}
                </div>
            </div>
        </div>
    );
}
