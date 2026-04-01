'use client'

import { useEffect, useState, useMemo } from 'react'
import Cookies from 'js-cookie'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Loader from '@/components/common/Loader'
import { Phone, User, Banknote, AlertCircle } from 'lucide-react'
import OutletSelector from '@/components/common/OutletSelector'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface RecoveryItem {
  order_id: number
  order_ref: string
  customer: string
  phone: string
  total_amount: number
  total_paid: number
  balance: number
}

export default function GlobalRecoveryReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RecoveryItem[]>([])
  const [outletId, setOutletId] = useState('all')
  const token = useMemo(() => Cookies.get('auth_token'), [])

  const fetchRecovery = async (selOutletId: string) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/outlet-reports/recovery?outletId=${selOutletId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch recovery report:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecovery(outletId)
  }, [outletId, token])

  const totals = useMemo(() => {
    return data.reduce((acc, item) => ({
      count: acc.count + 1,
      totalBalance: acc.totalBalance + item.balance
    }), { count: 0, totalBalance: 0 })
  }, [data])

  return (
    <>
      <Breadcrumb pageName="Global Recovery Report" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white text-purple-600">Nationwide Credit Risk</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor pending installments and overdue accounts across the business.</p>
        </div>
        <OutletSelector selectedId={outletId} onSelect={setOutletId} />
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Credit Accounts</p>
          <p className="mt-2 text-3xl font-black text-dark dark:text-white">{totals.count.toLocaleString()}</p>
        </div>
        <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Outstanding Balance</p>
          <p className="mt-2 text-3xl font-black text-[#ff3d3d]">Rs. {totals.totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 dark:bg-dark-3 z-10">
                <tr className="text-[11px] uppercase text-gray-400">
                  <th className="px-6 py-4">Customer Information</th>
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right text-red-500">Balance</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 flex flex-col items-center gap-2 font-medium">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                    No credit exposure found for the selected criteria.
                  </td></tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.order_id} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-dark dark:text-white flex items-center gap-1.5">
                            <User className="h-3 w-3 text-gray-400" /> {item.customer}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3 text-gray-400" /> {item.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">{item.order_ref}</td>
                      <td className="px-6 py-4 text-right">Rs. {item.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-medium">Rs. {item.total_paid.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-black text-red-600 bg-red-50/30">Rs. {item.balance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
