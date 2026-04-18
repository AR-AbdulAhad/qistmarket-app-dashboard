'use client'
import { useEffect, useState } from 'react'
import Loader from '@/components/common/Loader'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Cookies from 'js-cookie'
import { SearchIcon, PointerUp } from '@/assets/icons'
import CustomerProfileModal from '@/components/common/CustomerProfileModal'
import { AlertTriangle, Ban } from 'lucide-react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

interface CustomerGroup {
  customer: any
  ledgerSummary: any
  orders: any[]
}

const fmt = (n: number) => `Rs. ${Number(n).toLocaleString()}`

const BlacklistedCustomerList = () => {
  const [customers, setCustomers] = useState<CustomerGroup[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchBlacklist = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('auth_token')
      if (!token) return

      const res = await fetch(`${BACKEND_URL}/api/customers/blacklist`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch blacklist')
      const json = await res.json()

      if (json.success && json.data) {
        setCustomers(json.data.customers ?? [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlacklist()
  }, [])

  const openProfile = (customerGroup: CustomerGroup) => {
    // The profile modal expects an 'order' object that has 'verification' and other details.
    // Our API returns grouped customers. In CustomerProfileModal, it's used with an order.
    // We'll pass the first blacklisted order from the group.
    if (customerGroup.orders && customerGroup.orders.length > 0) {
      // We need to fetch the full order details for the modal to work properly
      // Or ensure the API returns enough info.
      // Let's check CustomerProfileModal requirements: verification (purchaser, grantors, documents).
      // My getBlacklistedCustomers already includes these!
      setSelectedOrder(customerGroup.orders[0]);
      setModalOpen(true);
    }
  }

  const columns: ColumnDef<CustomerGroup>[] = [
    {
      id: 'customer_name',
      accessorFn: (row) => row.customer.name,
      header: 'Customer Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Ban size={18} />
          </div>
          <span className="font-bold text-dark dark:text-white">{row.original.customer.name}</span>
        </div>
      )
    },
    {
      id: 'whatsapp_number',
      accessorFn: (row) => row.customer.telephone_number,
      header: 'WhatsApp',
    },
    {
      id: 'cnic_number',
      accessorFn: (row) => row.customer.cnic_number || '-',
      header: 'CNIC',
    },
    {
      id: 'total_remaining',
      accessorFn: (row) => row.ledgerSummary.totalRemaining,
      header: 'Total Overdue',
      cell: ({ getValue }) => (
        <div className="font-black text-red-500">
          {fmt(Number(getValue()))}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Risk Level',
      cell: () => (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase text-white animate-pulse">
          <AlertTriangle size={12} /> High Risk
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Deep View',
      cell: ({ row }) => (
        <button
          onClick={() => openProfile(row.original)}
          className="rounded-xl bg-red-500 px-6 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Open Profile
        </button>
      ),
    },
  ]

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const filteredData = globalFilter
    ? customers.filter(c =>
      c.customer.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      c.customer.whatsapp_number.includes(globalFilter) ||
      (c.customer.cnic_number && c.customer.cnic_number.includes(globalFilter))
    )
    : customers;

  return (
    <section className="rounded-[2.5rem] bg-white p-8">
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
            <Ban className="text-red-500" size={32} />
            Blacklisted Accounts
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Automatic monitoring of accounts with 90+ days delinquency.</p>
        </div>

        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-2xl border border-stroke bg-gray-50 px-6 py-4 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 transition-all"
            placeholder="Search blacklisted customers..."
          />
          <SearchIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-stroke dark:border-strokedark">
                {hg.headers.map((header) => (
                  <th key={header.id} className="pb-6 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-meta-4/20">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center text-red-500 font-black">
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  SCANNING FOR DEFAULTERS...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] inline-block border border-emerald-100 dark:border-emerald-900/20">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">No Blacklisted Accounts Found</p>
                    <p className="text-xs text-emerald-500 mt-2">All delivered orders are currently active or up-to-date.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-6 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomerProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedOrder}
      />
    </section>
  )
}

function CheckCircle2({ size, className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export default BlacklistedCustomerList
