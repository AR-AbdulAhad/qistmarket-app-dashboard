'use client'
import { useEffect, useState } from 'react'
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
  RowSelectionState,
} from '@tanstack/react-table'
import Cookies from 'js-cookie'
import { ChevronLeft, ChevronRight, SearchIcon, PointerUp, ChevronUpIcon } from '@/assets/icons'
import ColumnFilter from '../DataTables/ColumnFilter'
import { Modal } from '../Modal/Modal'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'
import { useRef } from 'react'


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Order {
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
  created_by: { username: string } | null
  assigned_to: { username: string } | null
  delivery_officer: { username: string; full_name: string } | null
  verification: { status: string }
}

interface User {
  id: number
  full_name: string
  username: string
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
const ApprovedOrderList = () => {
  const [orders, setOrders] = useState<Order[]>([])
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
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [loading, setLoading] = useState(false)

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false)
  const [bulkUnassignModalOpen, setBulkUnassignModalOpen] = useState(false)
  const [singleUnassignModalOpen, setSingleUnassignModalOpen] = useState(false)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedDeliveryOfficerId, setSelectedDeliveryOfficerId] = useState<number | null>(null)
  const [deliveryOfficers, setDeliveryOfficers] = useState<User[]>([])

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchApprovedOrders = async () => {
    setLoading(true)
    try {
      const token = Cookies.get('auth_token')
      if (!token) return

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: globalFilter.trim(),
        sortBy: sorting[0]?.id || 'created_at',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc',
      })

      columnFilters.forEach((f) => {
        if (f.id && f.value) params.append(f.id, String(f.value))
      })

      const res = await fetch(`${BACKEND_URL}/api/orders/delivery-pending?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch approved orders')

      const json = await res.json()

      if (json.success && json.data?.orders) {
        setOrders(json.data.orders)
        setPagination(json.data.pagination)
      }
    } catch (err) {
      console.error('Failed to load approved orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryOfficers = async () => {
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/users/delivery-officers`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setDeliveryOfficers(json.data.officers || [])
        }
      }
    } catch (err) {
      console.error('Failed to load delivery officers:', err)
    }
  }

  useEffect(() => {
    fetchApprovedOrders()
  }, [pagination.page, pagination.limit, globalFilter, columnFilters, sorting])

  useEffect(() => {
    fetchDeliveryOfficers()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAssignClick = (order: Order) => {
    setSelectedOrder(order)
    setAssignModalOpen(true)
  }

  const handleUnassignClick = (order: Order) => {
    setSelectedOrder(order)
    setSingleUnassignModalOpen(true)
  }

  const confirmAssign = async () => {
    if (!selectedOrder || !selectedDeliveryOfficerId) return

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/assign-delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: selectedDeliveryOfficerId, action: 'assign' }),
      })

      if (!res.ok) throw new Error('Failed to assign delivery officer')

      await fetchApprovedOrders()
      setAssignModalOpen(false)
      setSelectedDeliveryOfficerId(null)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Assign delivery error:', err)
    }
  }

  const confirmSingleUnassign = async () => {
    if (!selectedOrder) return

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/assign-delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'unassign' }),
      })

      if (!res.ok) throw new Error('Failed to unassign delivery officer')

      await fetchApprovedOrders()
      setSingleUnassignModalOpen(false)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Unassign delivery error:', err)
    }
  }

  const handleBulkAssign = () => setBulkAssignModalOpen(true)
  const handleBulkUnassign = () => setBulkUnassignModalOpen(true)

  const confirmBulkAssign = async () => {
    if (!selectedDeliveryOfficerId) return

    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/assign-bulk-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_ids: ids, user_id: selectedDeliveryOfficerId, action: 'assign' }),
      })

      if (!res.ok) throw new Error('Bulk assign failed')

      await fetchApprovedOrders()
      setBulkAssignModalOpen(false)
      setRowSelection({})
      setSelectedDeliveryOfficerId(null)
    } catch (err) {
      console.error('Bulk assign delivery error:', err)
    }
  }

  const confirmBulkUnassign = async () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/assign-bulk-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_ids: ids, action: 'unassign' }),
      })

      if (!res.ok) throw new Error('Bulk unassign failed')

      await fetchApprovedOrders()
      setBulkUnassignModalOpen(false)
      setRowSelection({})
    } catch (err) {
      console.error('Bulk unassign delivery error:', err)
    }
  }

  console.log('Orders:', deliveryOfficers)

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Order>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          disabled={!row.getCanSelect()}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    { accessorKey: 'order_ref', header: 'Order Ref', enableColumnFilter: true },
    { accessorKey: 'token_number', header: 'Token Number', enableColumnFilter: true },
    { accessorKey: 'customer_name', header: 'Customer Name', enableColumnFilter: true },
    { accessorKey: 'whatsapp_number', header: 'WhatsApp', enableColumnFilter: true },
    { accessorKey: 'city', header: 'City', enableColumnFilter: true },
    { accessorKey: 'area', header: 'Area', enableColumnFilter: true },
    { accessorKey: 'product_name', header: 'Product', enableColumnFilter: true },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
      cell: ({ getValue }) => `Rs. ${Number(getValue()).toLocaleString()}`,
    },
    { accessorKey: 'status', header: 'Status', enableColumnFilter: true },
    {
      id: 'verification_status',
      accessorFn: (row) => row.verification?.status || 'N/A',
      header: 'Verification',
      enableColumnFilter: true,
    },
    {
      id: 'created_by',
      accessorFn: (row) => row.created_by?.username || '',
      header: 'Created By',
      enableColumnFilter: true,
    },
    {
      id: 'delivery_officer',
      accessorFn: (row) => row.delivery_officer?.username || 'Unassigned',
      header: 'Delivery Officer',
      enableColumnFilter: true,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => {
        const order = row.original;

        const [isOpen, setIsOpen] = useState(false);
        const [position, setPosition] = useState({ top: 0, left: 0 });
        const [openUp, setOpenUp] = useState(false);

        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const dropdownRef = useRef<HTMLDivElement | null>(null);

        const toggleDropdown = () => {
          if (!triggerRef.current) return;

          const rect = triggerRef.current.getBoundingClientRect();

          const dropdownWidth = 176; // w-44
          const dropdownHeight = 150;

          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceRight = window.innerWidth - rect.right;

          const shouldOpenUp = spaceBelow < dropdownHeight;
          const shouldAlignLeft = spaceRight < dropdownWidth;

          setOpenUp(shouldOpenUp);

          setPosition({
            top: shouldOpenUp
              ? rect.top + window.scrollY - 8
              : rect.bottom + window.scrollY + 6,
            left: shouldAlignLeft
              ? rect.left + window.scrollX
              : rect.right + window.scrollX - dropdownWidth,
          });

          setIsOpen((prev) => !prev);
        };

        // Outside click + ESC support
        useEffect(() => {
          const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
              triggerRef.current &&
              !triggerRef.current.contains(target) &&
              dropdownRef.current &&
              !dropdownRef.current.contains(target)
            ) {
              setIsOpen(false);
            }
          };

          const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          };

          if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);
          }

          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
          };
        }, [isOpen]);

        return (
          <>
            <button
              ref={triggerRef}
              onClick={toggleDropdown}
              className="group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-dark shadow-[0_1px_3px_0_rgba(166,175,195,0.4)] hover:text-[#ff3d3d] dark:border dark:border-dark-3 dark:text-white dark:shadow-none"
            >
              <span>Actions</span>
              <svg
                className={`size-4 transition-transform ${
                  isOpen ? "rotate-0" : "rotate-180"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {isOpen &&
              createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: position.top,
                    left: position.left,
                    transform: openUp ? "translateY(-100%)" : "none",
                  }}
                  className="z-[99999] w-44 rounded-md border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-900"
                >
                  <ul className="overflow-hidden text-sm font-medium text-current">

                    {order.delivery_officer ? (
                      <li>
                        <button
                          onClick={() => {
                            handleUnassignClick(order);
                            setIsOpen(false);
                          }}
                          className="block w-full px-4 py-2.5 text-left hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                          Unassign Delivery
                        </button>
                      </li>
                    ) : (
                      <li>
                        <button
                          onClick={() => {
                            handleAssignClick(order);
                            setIsOpen(false);
                          }}
                          className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3 dark:hover:text-neutral-50"
                        >
                          Assign Delivery
                        </button>
                      </li>
                    )}

                  </ul>
                </div>,
                document.body
              )}
          </>
        );
      },
    }
  ]

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      rowSelection,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function'
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

  const selectedCount = Object.keys(rowSelection).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="data-table-common rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Top bar */}
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
            placeholder="Search approved orders..."
          />
          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md bg-[#ff3d3d] text-white">
            <SearchIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center font-medium">
          <p className="pl-2 font-medium text-dark dark:text-current">Per Page:</p>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
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

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="px-7.5 pb-4 flex flex-wrap gap-4">
          <button
            onClick={handleBulkAssign}
            className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            Assign Delivery ({selectedCount})
          </button>

          <button
            onClick={handleBulkUnassign}
            className="rounded bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            Unassign Delivery ({selectedCount})
          </button>
        </div>
      )}

      {/* Table */}
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
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  No approved orders found
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

      {/* Pagination */}
      <div className="flex justify-between items-center px-7.5 py-7">
        <div className="flex items-center">
          <button
            className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none"
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page === 1 || loading}
          >
            <ChevronLeft width={18} height={18} />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPagination((p) => ({ ...p, page: pageNum }))}
              className={cn(
                'mx-1 flex items-center justify-center rounded-[3px] p-1.5 px-[15px] font-medium hover:bg-opacity-90 hover:bg-[#ff3d3d] hover:text-white',
                pagination.page === pageNum && 'bg-[#ff3d3d] text-white',
                loading && 'opacity-50 pointer-events-none'
              )}
              disabled={loading}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="flex items-center justify-center rounded-[3px] p-[7px] hover:bg-[#ff3d3d] hover:text-white disabled:pointer-events-none"
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            <ChevronRight width={18} height={18} />
          </button>
        </div>

        <p className="font-medium">
          Showing {pagination.page} of {pagination.totalPages} pages
        </p>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}

      {/* Single Assign Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false)
          setSelectedDeliveryOfficerId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Assign Delivery Officer</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Select a delivery officer:</p>
        <select
          value={selectedDeliveryOfficerId ?? ''}
          onChange={(e) => setSelectedDeliveryOfficerId(Number(e.target.value))}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
        >
          <option value="">Select Officer</option>
          {deliveryOfficers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.username})
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => {
              setAssignModalOpen(false)
              setSelectedDeliveryOfficerId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={confirmAssign}
            disabled={!selectedDeliveryOfficerId}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </Modal>

      {/* Single Unassign Modal */}
      <Modal
        open={singleUnassignModalOpen}
        onClose={() => setSingleUnassignModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Unassign Delivery Officer</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to unassign delivery officer from order{' '}
          <strong>{selectedOrder?.order_ref}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setSingleUnassignModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={confirmSingleUnassign}
            className="rounded bg-red-600 px-6 py-2.5 text-white hover:bg-red-700"
          >
            Unassign
          </button>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        open={bulkAssignModalOpen}
        onClose={() => {
          setBulkAssignModalOpen(false)
          setSelectedDeliveryOfficerId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Bulk Assign Delivery Officers</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Select a delivery officer for {selectedCount} selected orders:
        </p>
        <select
          value={selectedDeliveryOfficerId ?? ''}
          onChange={(e) => setSelectedDeliveryOfficerId(Number(e.target.value))}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
        >
          <option value="">Select Officer</option>
          {deliveryOfficers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.username})
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => {
              setBulkAssignModalOpen(false)
              setSelectedDeliveryOfficerId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkAssign}
            disabled={!selectedDeliveryOfficerId}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            Assign All
          </button>
        </div>
      </Modal>

      {/* Bulk Unassign Modal */}
      <Modal
        open={bulkUnassignModalOpen}
        onClose={() => setBulkUnassignModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Bulk Unassign Delivery Officers</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to unassign delivery officer from{' '}
          <strong>{selectedCount}</strong> selected orders?
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setBulkUnassignModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkUnassign}
            className="rounded bg-red-600 px-6 py-2.5 text-white hover:bg-red-700"
          >
            Unassign All
          </button>
        </div>
      </Modal>
    </section>
  )
}

export default ApprovedOrderList