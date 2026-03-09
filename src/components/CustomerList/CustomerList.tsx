'use client'
import { useEffect, useState } from 'react'
import Loader from '@/components/common/Loader'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import Cookies from 'js-cookie'
import { SearchIcon, PointerUp } from '@/assets/icons'
import ColumnFilter from '../DataTables/ColumnFilter'
import Pagination from '../common/Pagination'
import { Modal } from '../Modal/Modal'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AdvancePayment {
  amount: number
  paid: boolean
  paidAt: string | null
  status: string
  paidVia: string | null
}

interface InstallmentEntry {
  monthNumber: number
  dueDate: string
  yearMonth: string
  dueAmount: number
  paidAmount: number
  remainingAmount: number
  status: string
  paidAt: string | null
}

interface OrderLedgerSummary {
  totalDue: number
  totalPaid: number
  totalRemaining: number
  paidInstallments: number
  pendingInstallments: number
}

interface OrderLedgerHistory {
  advancePayment: AdvancePayment
  installmentLedger: InstallmentEntry[]
  summary: OrderLedgerSummary
}

interface CustomerOrder {
  order_id: number
  order_ref: string
  token_number: string
  product_name: string
  total_amount: number
  advance_amount: number
  monthly_amount: number
  months: number
  status: string
  created_at: string
  is_delivered: boolean
  delivered_at: string | null
  verification_status: string | null
  ledgerHistory: OrderLedgerHistory
}

interface CustomerLedgerSummary {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalAdvanceReceived: number;
  totalPendingAmount: number;
}

interface CustomerInfo {
  name: string;
  whatsapp_number: string;
  address: string;
  city: string | null;
  area: string | null;
}

interface CustomerGroup {
  customer: CustomerInfo;
  ledgerSummary: CustomerLedgerSummary;
  orders?: CustomerOrder[];
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const CustomerList = () => {
  const [customers, setCustomers] = useState<CustomerGroup[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([{ id: 'customer_name', desc: false }])
  const [loading, setLoading] = useState(false)

  // View details modal state
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerGroup | null>(null)

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('auth_token')
      if (!token) return

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: globalFilter.trim(),
        sortBy: sorting[0]?.id || 'customer_name',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc',
      })

      columnFilters.forEach((f) => {
        if (f.id && f.value) params.append(f.id, String(f.value))
      })

      const res = await fetch(`${BACKEND_URL}/api/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch customers')
      const json = await res.json()

      if (json.success && json.data) {
        setCustomers(json.data.customers)
        setPagination(json.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, pagination.limit, globalFilter, columnFilters, sorting])

  const openDetails = (customer: CustomerGroup) => {
    setSelectedCustomer(customer)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedCustomer(null)
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<CustomerGroup>[] = [
    {
      id: 'customer_name',
      accessorFn: (row) => row.customer.name,
      header: 'Customer Name',
      enableColumnFilter: true,
    },
    {
      id: 'whatsapp_number',
      accessorFn: (row) => row.customer.whatsapp_number,
      header: 'WhatsApp',
      enableColumnFilter: true,
    },
    {
      id: 'city',
      accessorFn: (row) => row.customer.city || 'N/A',
      header: 'City',
      enableColumnFilter: true,
    },
    {
      id: 'area',
      accessorFn: (row) => row.customer.area || 'N/A',
      header: 'Area',
      enableColumnFilter: true,
    },
    {
      id: 'total_orders',
      accessorFn: (row) => row.ledgerSummary.totalOrders,
      header: 'Total Orders',
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <div className="rounded-lg bg-gray-100 px-2 py-1 text-center font-medium">
          {Number(getValue())}
        </div>
      ),
    },
    {
      id: 'paid_orders',
      accessorFn: (row) => row.ledgerSummary.paidOrders,
      header: 'Paid Orders',
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <div className="rounded-lg bg-green-100 px-2 py-1 text-center font-medium text-green-800">
          {Number(getValue())}
        </div>
      ),
    },
    {
      id: 'pending_orders',
      accessorFn: (row) => row.ledgerSummary.pendingOrders,
      header: 'Pending Orders',
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <div className="rounded-lg bg-orange-100 px-2 py-1 text-center font-medium text-orange-800">
          {Number(getValue())}
        </div>
      ),
    },
    {
      id: 'total_due',
      accessorFn: (row) => row.ledgerSummary.totalPendingAmount,
      header: 'Total Due',
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <div className="font-semibold text-red-500">
          Rs. {Number(getValue()).toLocaleString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <button
          onClick={() => openDetails(row.original)}
          className="rounded-md bg-[#ff3d3d] px-3 py-1.5 text-sm text-white hover:bg-[#e03131]"
        >
          View Details
        </button>
      ),
    },
  ]

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: false,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.limit })
          : updater
      setPagination((prev) => ({
        ...prev,
        page: newState.pageIndex + 1,
        limit: newState.pageSize,
      }))
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="data-table-common rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Top bar - same style as OrderList */}
      <div className="flex justify-between px-7.5 py-4.5">
        <div className="relative z-20 w-full max-w-[414px]">
          <input
            type="text"
            value={globalFilter || ''}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-[#ff3d3d]"
            placeholder="Search here..."
          />
          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md bg-[#ff3d3d] text-white">
            <SearchIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center font-medium gap-4">
          <div className="flex items-center">
            <p className="pl-2 font-medium text-dark dark:text-current">Per Page:</p>
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination((p) => ({
                  ...p,
                  limit: Number(e.target.value),
                  page: 1,
                }))
              }
              className="bg-transparent pl-2.5"
            >
              {[5, 10, 15, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table - same layout as OrderList */}
      <div className="grid grid-cols-1 overflow-x-auto">
        <table className="datatable-table datatable-one !border-collapse px-4 md:px-8">
          <thead className="border-separate px-4">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                className="border-t border-stroke dark:border-dark-3"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-3 py-4 align-top">
                    <div className="flex min-h-[70px] flex-col">
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

                      {header.column.getCanFilter() && header.column.id !== 'select' && (
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
                <td colSpan={columns.length} className="py-12 text-center">
                  <Loader text="Loading customers..." />
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  No customers found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  className="border-t border-stroke dark:border-dark-3"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="truncate px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - shared style with OrderList */}
      <div className="flex items-center justify-between px-7.5 py-7">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          isLoading={loading}
        />

        <p className="font-medium text-dark dark:text-white">
          Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
        </p>
      </div>

      {/* View Details Modal */}
      <Modal
        open={detailsOpen}
        onClose={closeDetails}
        className="max-w-4xl rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 border-b border-stroke pb-4 dark:border-dark-3">
              <h2 className="text-xl font-semibold text-dark dark:text-white">
                {selectedCustomer.customer.name}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p>WhatsApp: {selectedCustomer.customer.whatsapp_number}</p>
                <p>
                  Address: {selectedCustomer.customer.address || '-'}
                  {selectedCustomer.customer.area ? `, ${selectedCustomer.customer.area}` : ''}
                  {selectedCustomer.customer.city ? `, ${selectedCustomer.customer.city}` : ''}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-dark-3 dark:text-gray-200">
                  Total Orders: <strong>{selectedCustomer.ledgerSummary.totalOrders}</strong>
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Paid Orders: <strong>{selectedCustomer.ledgerSummary.paidOrders}</strong>
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Pending Orders: <strong>{selectedCustomer.ledgerSummary.pendingOrders}</strong>
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Total Due: <strong>Rs. {selectedCustomer.ledgerSummary.totalPendingAmount.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
                Orders & Ledger
              </h3>
              {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No orders found for this customer.
                </p>
              ) : (
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedCustomer.orders.map((order) => (
                    <div
                      key={order.order_id}
                      className="rounded-xl border border-stroke bg-gray-50 p-4 text-sm dark:border-dark-3 dark:bg-dark-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-dark dark:text-white">
                            {order.product_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Order Ref: {order.order_ref} • Token: {order.token_number}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Created:{' '}
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            Status: {order.status}
                          </span>
                          {order.is_delivered && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Delivered
                            </span>
                          )}
                          {order.delivered_at && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Delivered At:{' '}
                              {new Date(order.delivered_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total Amount
                          </p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            Rs. {order.total_amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Advance
                          </p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            Rs. {order.advance_amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Monthly / Months
                          </p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            Rs. {order.monthly_amount.toLocaleString()} / {order.months}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ledger (Paid / Remaining)
                          </p>
                          <p className="text-sm font-semibold text-dark dark:text-white">
                            Rs. {order.ledgerHistory.summary.totalPaid.toLocaleString()} /{' '}
                            Rs. {order.ledgerHistory.summary.totalRemaining.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Installments: {order.ledgerHistory.summary.paidInstallments} paid /{' '}
                            {order.ledgerHistory.summary.pendingInstallments} pending
                          </p>
                        </div>
                      </div>

                      {/* Advance payment & installments breakdown */}
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Advance Payment
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            Amount:{' '}
                            <span className="font-semibold">
                              Rs. {order.ledgerHistory.advancePayment.amount.toLocaleString()}
                            </span>
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            Status:{' '}
                            <span
                              className={`font-semibold ${
                                order.ledgerHistory.advancePayment.paid
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : 'text-orange-600 dark:text-orange-300'
                              }`}
                            >
                              {order.ledgerHistory.advancePayment.status}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Paid Via:{' '}
                            {order.ledgerHistory.advancePayment.paidVia || '-'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Paid At:{' '}
                            {order.ledgerHistory.advancePayment.paidAt
                              ? new Date(order.ledgerHistory.advancePayment.paidAt).toLocaleString()
                              : '-'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-3 dark:bg-gray-900 md:col-span-2">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Installments Timeline
                          </h4>
                          {order.ledgerHistory.installmentLedger.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              No installments configured for this order.
                            </p>
                          ) : (
                            <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-stroke text-[11px] uppercase text-gray-500 dark:border-dark-3 dark:text-gray-400">
                                    <th className="pb-1 pr-2 text-left">Month</th>
                                    <th className="pb-1 pr-2 text-left">Due Date</th>
                                    <th className="pb-1 pr-2 text-right">Due</th>
                                    <th className="pb-1 pr-2 text-right">Paid</th>
                                    <th className="pb-1 pr-2 text-right">Remaining</th>
                                    <th className="pb-1 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.ledgerHistory.installmentLedger.map((inst) => (
                                    <tr
                                      key={inst.monthNumber}
                                      className="border-b border-stroke last:border-0 dark:border-dark-3"
                                    >
                                      <td className="py-1 pr-2">
                                        #{inst.monthNumber}
                                      </td>
                                      <td className="py-1 pr-2">
                                        {inst.dueDate}
                                      </td>
                                      <td className="py-1 pr-2 text-right">
                                        Rs. {inst.dueAmount.toLocaleString()}
                                      </td>
                                      <td className="py-1 pr-2 text-right">
                                        {inst.paidAmount > 0
                                          ? `Rs. ${inst.paidAmount.toLocaleString()}`
                                          : '-'}
                                      </td>
                                      <td className="py-1 pr-2 text-right">
                                        {inst.remainingAmount > 0
                                          ? `Rs. ${inst.remainingAmount.toLocaleString()}`
                                          : '-'}
                                      </td>
                                      <td className="py-1 text-right">
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                            inst.status === 'paid'
                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                              : inst.status === 'overdue'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                          }`}
                                        >
                                          {inst.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default CustomerList
