'use client'
import { useEffect, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import Cookies from 'js-cookie'
import { SearchIcon, PointerUp, ChevronUpIcon } from '@/assets/icons'
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import ColumnFilter from '../DataTables/ColumnFilter'
import { Modal } from '../Modal/Modal'
import { cn } from '@/lib/utils'
import { log } from 'console'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// ─────────────────────────────────────────────────────────────────────────────
// Types (aligned with your prisma select)
// ─────────────────────────────────────────────────────────────────────────────
interface UserSelect {
  id: number
  username: string
  full_name: string
}

interface VerificationNested {
  id: number
  status: 'in_progress' | 'completed'
  start_time: string
  end_time: string | null
  is_approved: boolean | null
  admin_remarks: string | null
  approved_at: string | null
  verification_officer: UserSelect
  approved_by_user: UserSelect | null
  purchaser: any | null          // adjust type if you have schema
  grantors: any[]                // adjust type
  nextOfKin: any | null
  locations: Array<{ timestamp: string /* + other fields */ }>
  documents: Array<{ uploaded_at: string /* + other fields */ }>
}

interface OrderWithVerification {
  id: number
  order_ref: string
  token_number: string
  customer_name: string
  whatsapp_number: string
  address: string
  city: string | null
  area: string | null
  product_name: string
  total_amount: number
  advance_amount: number
  monthly_amount: number
  months: number
  channel: string
  status: string
  created_at: string
  updated_at: string

  assigned_to: UserSelect | null
  created_by: { username: string; full_name: string } | null

  verification: VerificationNested | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const AssignedVerifications = () => {
  const [orders, setOrders] = useState<OrderWithVerification[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [loading, setLoading] = useState(false)

  // Modals (example – expand as needed)
  const [remarksModalOpen, setRemarksModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithVerification | null>(null)
  const [adminRemarks, setAdminRemarks] = useState('')
  const [formData, setFormData] = useState<Partial<OrderWithVerification>>({})

  useEffect(() => {
    if (selectedOrder && viewModalOpen) {
      setFormData(selectedOrder)
    }
  }, [selectedOrder, viewModalOpen])

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchAssignedVerifications = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('auth_token')
      if (!token) return

      const res = await fetch(`${BACKEND_URL}/api/orders/verification-pending`, {  // ← adjust endpoint path if needed
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to load verifications')
      const json = await res.json()

      if (json.success && json.data?.orders) {
        setOrders(json.data.orders)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedVerifications()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEditRemarks = (order: OrderWithVerification) => {
    setSelectedOrder(order)
    setAdminRemarks(order.verification?.admin_remarks || '')
    setRemarksModalOpen(true)
  }

  const handleView = (order: OrderWithVerification) => {
    setSelectedOrder(order)

    setViewModalOpen(true)

    console.log(order);

  }

  const saveRemarks = async () => {
    if (!selectedOrder?.verification?.id) return

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(
        `${BACKEND_URL}/api/verifications/${selectedOrder.verification.id}/remarks`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_remarks: adminRemarks.trim() || null }),
        }
      )

      if (!res.ok) throw new Error('Failed to save remarks')
      await fetchAssignedVerifications()
      setRemarksModalOpen(false)
      setSelectedOrder(null)
      setAdminRemarks('')
    } catch (err) {
      console.error('Remarks save failed:', err)
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<OrderWithVerification>[] = [
    {
      accessorKey: 'order_ref',
      header: 'Order Ref',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'whatsapp_number',
      header: 'WhatsApp',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'city',
      header: 'City',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ getValue }) => `£${Number(getValue()).toLocaleString()}`,
    },
    {
      id: 'officer',
      header: 'Verification Officer',
      accessorFn: (row) => row.verification?.verification_officer?.full_name || row.verification?.verification_officer?.username || '—',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'verification.status',
      header: 'Verification Status',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = row.original.verification?.status
        return (
          <span
            className={cn(
              'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
              status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
            )}
          >
            {status === 'completed' ? 'Completed' : 'In Progress'}
          </span>
        )
      },
    },
    {
      id: 'approved',
      header: 'Approved',
      accessorFn: (row) => row.verification?.is_approved,
      cell: ({ getValue }) => {
        const val = getValue() as boolean | null | undefined
        if (val === null || val === undefined) return <span className="text-gray-500">Pending</span>
        return val ? (
          <span className="text-green-600 font-medium">Yes</span>
        ) : (
          <span className="text-red-600 font-medium">No</span>
        )
      },
    },
    {
      id: 'docs',
      header: 'Documents',
      accessorFn: (row) => row.verification?.documents?.length ?? 0,
      cell: ({ getValue }) => {
        const count = Number(getValue())
        return count > 0 ? `${count} uploaded` : '—'
      },
    },
    {
      id: 'locations',
      header: 'Location Updates',
      accessorFn: (row) => row.verification?.locations?.length ?? 0,
      cell: ({ getValue }) => {
        const count = Number(getValue())
        return count > 0 ? `${count}` : '—'
      },
    },
    {
      id: 'subrecords',
      header: 'Records',
      accessorFn: (row) => {
        const v = row.verification
        if (!v) return ''
        const parts = []
        if (v.purchaser) parts.push('Purchaser')
        if (v.grantors?.length > 0) parts.push(`Grantors (${v.grantors.length})`)
        if (v.nextOfKin) parts.push('Next of Kin')
        return parts.join(', ') || '—'
      },
      enableColumnFilter: false,
    },
    {
      id: 'remarks',
      header: 'Admin Remarks',
      accessorFn: (row) => row.verification?.admin_remarks || '',
      enableColumnFilter: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const order = row.original
        const [isOpen, setIsOpen] = useState(false)

        return (
          <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
            <DropdownTrigger className="group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-dark shadow-sm hover:text-[#ff3d3d] data-[state=open]:text-[#ff3d3d] dark:border dark:border-dark-3 dark:text-white">
              <span>Actions</span>
              <ChevronUpIcon className="size-4 translate-y-[5%] rotate-180 transition-transform group-data-[state=open]:rotate-0" />
            </DropdownTrigger>
            <DropdownContent align="end" className="fixed !z-[9999] mt-2 w-48 rounded-md border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-900">
              <ul className="text-sm font-medium">
                <li>
                  <button
                    onClick={() => {
                      handleEditRemarks(order)
                      setIsOpen(false)
                    }}
                    className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3"
                  >
                    {order.verification?.admin_remarks ? 'Edit Remarks' : 'Add Remarks'}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleView(order)
                      setIsOpen(false)
                    }}
                    className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3"
                  >
                    View
                  </button>
                </li>
                {/* Add more actions: View full details, Approve/Reject, etc. */}
              </ul>
            </DropdownContent>
          </Dropdown>
        )
      },
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="data-table-common rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Top bar */}
      <div className="flex justify-between px-7.5 py-4.5">
        <div className="relative z-20 w-full max-w-[500px]">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-[#ff3d3d]"
            placeholder="Search order ref, customer, officer, remarks..."
          />
          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md bg-[#ff3d3d] text-white">
            <SearchIcon className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className=" grid grid-cols-1 overflow-x-auto">
        <table className="datatable-table datatable-one !border-collapse w-full px-4 md:px-8">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                className="border-t border-stroke dark:border-dark-3"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-3 py-4 align-top">
                    <div className="flex flex-col min-h-[70px]">
                      <div
                        className="flex cursor-pointer items-center"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="font-[500]">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="ml-2 inline-flex flex-col">
                            <PointerUp className="size-2.5" />
                            <PointerUp className="size-2.5 rotate-180" />
                          </div>
                        )}
                      </div>

                      {header.column.getCanFilter() && (
                        <div className="mt-2">
                          <ColumnFilter
                            column={{
                              filterValue: header.column.getFilterValue() as string,
                              setFilter: header.column.setFilterValue,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  Loading verifications...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  No assigned orders with verification records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  className="border-t border-stroke dark:border-dark-3 hover:bg-gray-50/50 dark:hover:bg-dark-2/50"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="truncate px-3 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Remarks Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedOrder(null)
          // Optional: reset form state if you use one
        }}
        className="max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8 overflow-y-auto max-h-[90vh]"
      >
        {selectedOrder && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark dark:text-white">
                Order {selectedOrder.order_ref}
              </h2>
              <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {selectedOrder.status.toUpperCase()}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                // handleSave() - implement your save logic here
                console.log("Saving:", formData)
                // You can call your PATCH API here
              }}
              className="space-y-8"
            >
              {/* ── Customer & Contact ──────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Token Number
                  </label>
                  <input
                    type="text"
                    value={formData.token_number}
                    readOnly
                    className="mt-1 block w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2.5 text-gray-500 dark:bg-dark-3 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* ── Address ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Area
                  </label>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>
              </div>

              {/* ── Product & Payment ───────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Amount (£)
                  </label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Advance Amount (£)
                  </label>
                  <input
                    type="number"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monthly Amount (£)
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_amount}
                    readOnly
                    className="mt-1 block w-full rounded-lg border border-stroke bg-gray-100 px-4 py-2.5 text-gray-500 dark:bg-dark-3 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Months
                  </label>
                  <input
                    type="number"
                    value={formData.months}
                    onChange={(e) => setFormData({ ...formData, months: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
                  />
                </div>
              </div>

              {/* ── System / Audit Fields (read-only) ──────────────────────────────── */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Order Reference
                  </label>
                  <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 dark:bg-dark-3 dark:text-gray-300">
                    {formData.order_ref}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created By
                  </label>
                  <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 dark:bg-dark-3 dark:text-gray-300">
                    {formData.created_by?.full_name || formData.created_by?.username || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Assigned To
                  </label>
                  <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 dark:bg-dark-3 dark:text-gray-300">
                    {formData.assigned_to?.full_name || formData.assigned_to?.username || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Channel
                  </label>
                  <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 dark:bg-dark-3 dark:text-gray-300">
                    {formData.channel}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </label>
                  <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 dark:bg-dark-3 dark:text-gray-300">
                    {formData.created_at
                      ? new Date(formData.created_at).toLocaleString()
                      : "-"}
                  </div>

                </div>
              </div>

              {/* Buttons */}
              <div className="mt-10 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="rounded-lg border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <Modal
        open={remarksModalOpen}
        onClose={() => {
          setRemarksModalOpen(false)
          setSelectedOrder(null)
          setAdminRemarks('')
        }}
        className="max-w-lg rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          {selectedOrder?.verification?.admin_remarks ? 'Edit' : 'Add'} Admin Remarks
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Order: <strong>{selectedOrder?.order_ref}</strong> — Officer:{' '}
          {selectedOrder?.verification?.verification_officer?.full_name ||
            selectedOrder?.verification?.verification_officer?.username ||
            '—'}
        </p>
        <textarea
          value={adminRemarks}
          onChange={(e) => setAdminRemarks(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
          placeholder="Internal notes, approval reasoning, issues found, etc..."
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setRemarksModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={saveRemarks}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90"
          >
            Save
          </button>
        </div>
      </Modal>
    </section>
  )
}

export default AssignedVerifications