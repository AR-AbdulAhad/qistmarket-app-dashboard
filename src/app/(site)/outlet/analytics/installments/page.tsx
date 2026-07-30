'use client'

import { useEffect, useState, useMemo } from 'react'
import Cookies from 'js-cookie'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Loader from '@/components/common/Loader'
import {
  Users,
  Banknote,
  Smartphone,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Percent,
  CheckCircle,
  CreditCard,
  UserCheck,
  Activity
} from 'lucide-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AnalyticsData {
  totalCustomers: number
  paymentSplits: {
    online: { count: number; amount: number }
    cash: { count: number; amount: number }
    officer: { count: number; amount: number }
  }
  ptpStats: {
    active: number
    broken: number
    fulfilled: number
    none: number
  }
  devices: {
    lockedCount: number
    totalLockedBalance: number
    avgLockedBalance: number
  }
  trends: {
    today: number
    yesterday: number
    lastMonth: number
    thisMonthExpected: number
    thisMonthRecovered: number
    recoveryRatio: number
  }
}

export default function InstallmentAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const token = useMemo(() => Cookies.get('auth_token'), [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return
      try {
        const res = await fetch(`${BACKEND_URL}/api/outlet-reports/analytics/installments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [token])

  if (loading || !data) return <Loader />

  const { totalCustomers, paymentSplits, ptpStats, devices, trends } = data;
  const trendYesterday = trends.today - trends.yesterday;
  const trendPercent = trends.yesterday > 0 ? (trendYesterday / trends.yesterday) * 100 : 0;

  return (
    <>
      <Breadcrumb pageName="Advanced Installment Analytics" />

      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-[15px] border border-primary/20 dark:from-primary/20 dark:border-primary/30">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-2">
            <Activity className="h-6 w-6" /> Installment Health Overview
          </h2>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">Real-time metrics on customer payments, locked devices, and recovery performance.</p>
        </div>
        <div className="flex gap-4">
            <div className="rounded-[10px] bg-white dark:bg-boxdark px-5 py-3 border border-stroke dark:border-strokedark shadow-sm">
                <p className="text-[10px] uppercase font-bold text-gray-500">Monthly Recovery Ratio</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-primary">{trends.recoveryRatio.toFixed(1)}%</span>
                    <Percent className="h-5 w-5 text-primary opacity-50" />
                </div>
            </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-8">
        <div className="rounded-[10px] border border-stroke bg-white px-7.5 py-6 shadow-1 dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <Users className="h-6 w-6 text-primary dark:text-white" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">{totalCustomers}</h4>
              <span className="text-sm font-medium">Total Installment Customers</span>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-stroke bg-white px-7.5 py-6 shadow-1 dark:border-strokedark dark:bg-boxdark relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><Banknote className="w-32 h-32 text-emerald-500" /></div>
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/20">
            <Banknote className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-emerald-600 dark:text-emerald-400">Rs. {trends.today.toLocaleString()}</h4>
              <span className="text-sm font-medium">Today's Total Recovery</span>
            </div>
            <span className={`flex items-center gap-1 text-sm font-bold ${trendPercent >= 0 ? 'text-meta-3' : 'text-meta-1'}`}>
              {trendPercent >= 0 ? trendPercent.toFixed(1) + '%' : Math.abs(trendPercent).toFixed(1) + '%'}
              {trendPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </span>
          </div>
        </div>

        <div className="rounded-[10px] border border-stroke bg-white px-7.5 py-6 shadow-1 dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/20">
            <Smartphone className="h-6 w-6 text-rose-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-rose-600 dark:text-rose-400">{devices.lockedCount}</h4>
              <span className="text-sm font-medium">Devices Locked</span>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-stroke bg-white px-7.5 py-6 shadow-1 dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/20">
            <CheckCircle className="h-6 w-6 text-blue-500" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-blue-600 dark:text-blue-400">{ptpStats.fulfilled}</h4>
              <span className="text-sm font-medium">PTPs Fulfilled</span>
            </div>
            <span className="text-xs font-bold text-gray-400">Out of {ptpStats.active + ptpStats.broken + ptpStats.fulfilled}</span>
          </div>
        </div>
      </div>

      {/* Main Charts / Splits */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Payment Channels */}
        <div className="col-span-1 xl:col-span-2 rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-strokedark dark:bg-boxdark">
          <h3 className="text-lg font-bold text-black dark:text-white mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Channel Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-[10px] bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Online Payments</p>
                <p className="text-2xl font-black text-indigo-600">Rs. {paymentSplits.online.amount.toLocaleString()}</p>
                <p className="text-sm font-medium text-indigo-400 mt-1">{paymentSplits.online.count} Transactions</p>
            </div>

            <div className="p-5 rounded-[10px] bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Cash Payments</p>
                <p className="text-2xl font-black text-amber-600">Rs. {paymentSplits.cash.amount.toLocaleString()}</p>
                <p className="text-sm font-medium text-amber-400 mt-1">{paymentSplits.cash.count} Transactions</p>
            </div>

            <div className="p-5 rounded-[10px] bg-purple-50 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
                <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Officer Recoveries</p>
                <p className="text-2xl font-black text-purple-600">Rs. {paymentSplits.officer.amount.toLocaleString()}</p>
                <p className="text-sm font-medium text-purple-400 mt-1">{paymentSplits.officer.count} Transactions</p>
            </div>

          </div>

          <div className="mt-6 p-4 rounded bg-gray-50 border border-gray-100 dark:bg-dark-3 dark:border-dark-4">
             <h4 className="text-sm font-bold text-gray-500 mb-3">Recovery Trends Comparison</h4>
             <div className="flex flex-col sm:flex-row gap-6 justify-between">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Yesterday</p>
                    <p className="text-lg font-black text-gray-700 dark:text-gray-300">Rs. {trends.yesterday.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Last Month Total</p>
                    <p className="text-lg font-black text-gray-700 dark:text-gray-300">Rs. {trends.lastMonth.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">This Month (Recovered / Expected)</p>
                    <p className="text-lg font-black text-emerald-600">Rs. {trends.thisMonthRecovered.toLocaleString()} <span className="text-sm text-gray-400">/ Rs. {trends.thisMonthExpected.toLocaleString()}</span></p>
                </div>
             </div>
          </div>
        </div>

        {/* Device & PTP Health */}
        <div className="col-span-1 rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-strokedark dark:bg-boxdark flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Locked Device Impact
                </h3>
                <div className="p-4 rounded-[10px] bg-rose-500/10 border border-rose-500/20 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-rose-500/10 to-transparent"></div>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Avg Pending per Locked Device</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">Rs. {devices.avgLockedBalance.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    <p className="text-sm font-medium text-rose-400 mt-2 border-t border-rose-500/20 pt-2">Total Locked Debt: Rs. {devices.totalLockedBalance.toLocaleString()}</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                    Promise to Pay (PTP)
                </h3>
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center p-3 rounded bg-gray-50 dark:bg-dark-3 border border-gray-100 dark:border-dark-4">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Active PTPs</span>
                        <span className="text-sm font-black text-blue-500">{ptpStats.active}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">Broken PTPs</span>
                        <span className="text-sm font-black text-rose-600">{ptpStats.broken}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Fulfilled PTPs</span>
                        <span className="text-sm font-black text-emerald-600">{ptpStats.fulfilled}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>

    </>
  )
}
