'use client'

import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import { 
  ClipboardCheck, 
  Banknote, 
  Package, 
  BarChart3, 
  Users, 
  Clock 
} from 'lucide-react'

const reports = [
  {
    title: 'Daily Daybook',
    description: 'Real-time cash book showing all payments received and expenses made today.',
    icon: Banknote,
    href: '/outlet/reports/daybook',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Sales Report',
    description: 'Detailed breakdown of all orders, gross amounts, and collections in a date range.',
    icon: ClipboardCheck,
    href: '/outlet/reports/sales',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Stock Summary',
    description: 'Current inventory status, quantity on hand, and total capital valuation.',
    icon: Package,
    href: '/outlet/reports/stock',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    title: 'Profit & Loss',
    description: 'Calculate your actual earnings after deducting cost of goods and expenses.',
    icon: BarChart3,
    href: '/outlet/reports/profit-loss',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    title: 'Recovery Report',
    description: 'Track all pending installments and overdue payments from your customers.',
    icon: Clock,
    href: '/outlet/reports/recovery',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'Customer Ledger',
    description: 'Look up specific customer transaction history and payment records.',
    icon: Users,
    href: '/outlet/reports/ledger',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
]

export default function OutletReportsPage() {
  return (
    <>
      <Breadcrumb pageName="Outlet Reports" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Business Intelligence</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Select a report below to view real-time data for your outlet.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group flex flex-col rounded-[12px] border border-stroke bg-white p-6 shadow-1 transition-all hover:border-[#ff3d3d] hover:shadow-2 dark:border-dark-3 dark:bg-gray-dark dark:hover:border-[#ff3d3d]"
          >
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${report.bgColor}`}>
              <report.icon className={`h-6 w-6 ${report.color}`} />
            </div>
            
            <h3 className="mb-2 text-lg font-semibold text-dark group-hover:text-[#ff3d3d] dark:text-white dark:group-hover:text-[#ff3d3d]">
              {report.title}
            </h3>
            
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {report.description}
            </p>
            
            <div className="mt-auto flex items-center text-sm font-medium text-[#ff3d3d]">
              View Full Report
              <svg 
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
