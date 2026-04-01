'use client'

import { useEffect, useState, useMemo } from 'react'
import Cookies from 'js-cookie'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Loader from '@/components/common/Loader'
import { Package, DollarSign, CheckCircle2, ShoppingCart } from 'lucide-react'
import OutletSelector from '@/components/common/OutletSelector'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface StockItem {
  product: string
  total: number
  inStock: number
  sold: number
  valuation: number
}

export default function GlobalStockSummaryPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StockItem[]>([])
  const [outletId, setOutletId] = useState('all')
  const token = useMemo(() => Cookies.get('auth_token'), [])

  const fetchStock = async (selOutletId: string) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/outlet-reports/stock-summary?outletId=${selOutletId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch stock summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock(outletId)
  }, [outletId, token])

  const totals = useMemo(() => {
    return data.reduce((acc, item) => ({
      total: acc.total + item.total,
      inStock: acc.inStock + item.inStock,
      sold: acc.sold + item.sold,
      valuation: acc.valuation + item.valuation
    }), { total: 0, inStock: 0, sold: 0, valuation: 0 })
  }, [data])

  return (
    <>
      <Breadcrumb pageName="Global Stock Summary" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark dark:text-white">Business Inventory Hub</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Consolidated stock levels and valuation worldwide.</p>
        </div>
        <OutletSelector selectedId={outletId} onSelect={setOutletId} />
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Global Stock" value={totals.total} icon={Package} color="blue" />
        <MiniStat label="Total Available" value={totals.inStock} icon={CheckCircle2} color="emerald" />
        <MiniStat label="Total Sold Items" value={totals.sold} icon={ShoppingCart} color="orange" />
        <MiniStat label="Nationwide Valuation" value={totals.valuation} icon={DollarSign} color="red" isCurrency />
      </div>

      {loading ? <Loader /> : (
        <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 dark:bg-dark-3">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Available</th>
                  <th className="px-6 py-4 text-center text-emerald-600">Sold</th>
                  <th className="px-6 py-4 text-right">Valuation (Purchase)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.map((item, idx) => (
                  <tr key={idx} className="border-b border-stroke last:border-0 dark:border-dark-3 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-dark dark:text-white capitalize">{item.product}</td>
                    <td className="px-6 py-4 text-center font-semibold">{item.total}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/20">{item.inStock}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20">{item.sold}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-dark dark:text-white">Rs. {item.valuation.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function MiniStat({ label, value, icon: Icon, color, isCurrency = false }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  }
  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
          <p className="text-lg font-bold text-dark dark:text-white">
            {isCurrency ? 'Rs. ' : ''}{value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
