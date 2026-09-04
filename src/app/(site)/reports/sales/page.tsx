'use client'

import { useEffect, useState, useMemo } from 'react'
import Cookies from 'js-cookie'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Loader from '@/components/common/Loader'
import { ClipboardCheck, DollarSign } from 'lucide-react'
import OutletSelector from '@/components/common/OutletSelector'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface SalesSummary {
  totalOrders: number
  totalGrossAmount: number
  totalReceived: number
}

interface Order {
  id: number
  order_ref: string
  customer_name: string
  total_amount: number
  sales_value?: number
  status: string
  created_at: string
  payments: any[]
}

export default function GlobalSalesReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ summary: SalesSummary; orders: Order[] } | null>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [outletId, setOutletId] = useState('all')
  const token = useMemo(() => Cookies.get('auth_token'), [])

  const fetchSales = async () => {
    if (!token) return
    setLoading(true)
    try {
      let url = `${BACKEND_URL}/api/outlet-reports/sales?outletId=${outletId}`
      if (dateRange.start) url += `&startDate=${dateRange.start}`
      if (dateRange.end) url += `&endDate=${dateRange.end}`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch sales summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [dateRange, outletId, token])

  return (
    <>
      <Breadcrumb pageName="Global Sales Report" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Nationwide Sales Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track orders and collections across all outlets.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <OutletSelector selectedId={outletId} onSelect={setOutletId} />
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white"
            />
            <span className="text-gray-400">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-stroke bg-white px-3 py-1.5 text-xs outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white"
            />
          </div>
        </div>
      </div>

      {loading && !data ? <Loader /> : (
        data && (
          <>
            <div className="mb-6 grid gap-5 md:grid-cols-3">
              <StatCard label="Total Orders" value={data.summary.totalOrders} icon={ClipboardCheck} color="blue" />
              <StatCard label="Gross Sales" value={data.summary.totalGrossAmount} icon={DollarSign} color="emerald" isCurrency />
              <StatCard label="Total Collected" value={data.summary.totalReceived} icon={DollarSign} color="orange" isCurrency />
            </div>

            <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-dark-3 z-10">
                    <tr className="text-[11px] uppercase text-gray-500">
                      <th className="px-6 py-4">Order Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.orders.map((o) => (
                      <tr key={o.id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-50/50 dark:hover:bg-dark-3/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-dark dark:text-white font-mono">{o.order_ref}</div>
                          <div className="text-xs text-gray-500">{o.customer_name} • {new Date(o.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            o.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                            o.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-dark dark:text-white">
                          Rs. {(o.sales_value ?? o.total_amount ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </>
  )
}

function StatCard({ label, value, icon: Icon, color, isCurrency = false }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20',
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-dark dark:text-white mt-1">
            {isCurrency ? 'Rs. ' : ''}{value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
