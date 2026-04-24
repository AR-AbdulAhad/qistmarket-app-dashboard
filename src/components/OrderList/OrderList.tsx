'use client'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
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
  RowSelectionState,
} from '@tanstack/react-table'
import Cookies from 'js-cookie'
import { ChevronLeft, ChevronRight, SearchIcon, PointerUp, ChevronUpIcon } from '@/assets/icons'
import ColumnFilter from '../DataTables/ColumnFilter'
import { Modal } from '../Modal/Modal'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Pagination from '../common/Pagination'
import { useAuth } from '../../../contexts/AuthContext'
import { ArrowRightLeft, Send } from 'lucide-react'

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
  area: string;
  zone: string | null;
  block: string | null;
  street: string | null;
  house_no: string | null;
  product_name: string
  advance_amount: number
  monthly_amount: number
  months: number
  channel: string
  status: string
  created_at: string
  created_by: { username: string } | null
  assigned_to: { username: string } | null
  outlet_id?: number | null
  cancelled_reason?: string | null
  cancelled_at?: string | null
  productHistories?: {
    id: number
    previous_product: string
    current_product: string
    changed_at: string
    changed_by: { username: string, full_name: string }
  }[]
}

interface OrderListProps {
  forcedStatus?: string
  forcedChannel?: string
  hideActions?: boolean
  hideSelection?: boolean
  onRowSelectionChange?: (selectedOrders: Order[]) => void
  customTopBarActions?: React.ReactNode
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
const OrderList = ({ forcedStatus, forcedChannel, hideActions, hideSelection, onRowSelectionChange, customTopBarActions }: OrderListProps) => {
  const router = useRouter()
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false)
  const [bulkUnassignModalOpen, setBulkUnassignModalOpen] = useState(false)
  const [singleUnassignModalOpen, setSingleUnassignModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [bulkTransferModalOpen, setBulkTransferModalOpen] = useState(false)
  const [outlets, setOutlets] = useState<any[]>([])
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null)
  const { user } = useAuth()
  const userRole = user?.role?.toLowerCase() || ''
  const isSalesOfficer = userRole === 'sales officer'

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedVerifierId, setSelectedVerifierId] = useState<number | null>(null)
  const [verifiers, setVerifiers] = useState<User[]>([])

  // Filtration
  const [dateRange, setDateRange] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Action Modals
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchOrders = async () => {
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

      if (forcedStatus) {
        params.append('status', forcedStatus)
      } else {
        // Default for Order List page: new and pending
        const statusFilter = columnFilters.find(f => f.id === 'status')
        if (!statusFilter) {
          params.append('status', 'new,pending')
        }
      }

      if (forcedChannel) {
        params.append('channel', forcedChannel)
      }

      if (dateRange !== 'All') {
        params.append('dateRange', dateRange)
        if (dateRange === 'Custom Range' && startDate && endDate) {
          params.append('startDate', startDate)
          params.append('endDate', endDate)
        }
      }

      columnFilters.forEach((f) => {
        if (f.id && f.value) params.append(f.id, String(f.value))
      })

      const res = await fetch(`${BACKEND_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to fetch orders')
      const json = await res.json()

      if (json.success && json.data?.orders) {
        setOrders(json.data.orders)
        setPagination(json.data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchVerifiers = async () => {
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/users/verification-officers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) setVerifiers(json.data.users || [])
      }
    } catch (err) {
      console.error('Failed to load verifiers', err)
    }
  }

  const fetchOutlets = async () => {
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/all-outlets`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) setOutlets(json.data || [])
      }
    } catch (err) {
      console.error('Failed to load outlets', err)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, pagination.limit, globalFilter, columnFilters, sorting, dateRange, startDate, endDate])

  useEffect(() => {
    fetchVerifiers()
    fetchOutlets()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = Cookies.get('auth_token')
        const res = await fetch(`${BACKEND_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setProducts(json.data)
            const uniqueCategories = Array.from(new Set(json.data.map((p: any) => p.category_name))) as string[]
            setCategories(uniqueCategories.sort())
          }
        }
      } catch (err) {
        console.error('Failed to load products', err)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      const filteredSubcats = Array.from(new Set(
        products
          .filter(p => p.category_name === selectedCategory)
          .map(p => p.subcategory_name)
      )) as string[]
      setSubcategories(filteredSubcats.sort())
      setSelectedSubcategory('')
      setSelectedProduct(null)
      setSelectedPlan(null)
    } else {
      setSubcategories([])
    }
  }, [selectedCategory, products])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAssignClick = (order: Order) => {
    setSelectedOrder(order)
    setAssignModalOpen(true)
  }

  const handleTransferClick = (order: Order) => {
    setSelectedOrder(order)
    setTransferModalOpen(true)
  }

  const handleUnassignClick = (order: Order) => {
    setSelectedOrder(order)
    setSingleUnassignModalOpen(true)
  }

  const confirmAssign = async () => {
    if (!selectedOrder || !selectedVerifierId) return
    setIsSubmitting(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: selectedVerifierId, action: 'assign' }),
      })

      if (!res.ok) throw new Error('Assign failed')
      await fetchOrders()
      setAssignModalOpen(false)
      setSelectedVerifierId(null)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Assign error:', err)
      alert('Assign failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmSingleUnassign = async () => {
    if (!selectedOrder) return
    setIsSubmitting(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'unassign' }),
      })

      if (!res.ok) throw new Error('Unassign failed')
      await fetchOrders()
      setSingleUnassignModalOpen(false)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Unassign error:', err)
      alert('Unassign failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkAssign = () => {
    setBulkAssignModalOpen(true)
  }

  const handleBulkTransfer = () => {
    setBulkTransferModalOpen(true)
  }

  const handleBulkUnassign = () => {
    setBulkUnassignModalOpen(true)
  }

  const confirmBulkAssign = async () => {
    if (!selectedVerifierId) return
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)
    setIsSubmitting(true)

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/assign-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_ids: ids, user_id: selectedVerifierId, action: 'assign' }),
      })

      if (!res.ok) throw new Error('Bulk assign failed')
      await fetchOrders()
      setBulkAssignModalOpen(false)
      setRowSelection({})
      setSelectedVerifierId(null)
    } catch (err) {
      console.error('Bulk assign error:', err)
      alert('Bulk assign failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmTransfer = async () => {
    if (!selectedOrder || !selectedOutletId) return
    setIsSubmitting(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/transfer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outlet_id: selectedOutletId }),
      })

      if (!res.ok) throw new Error('Transfer failed')
      await fetchOrders()
      setTransferModalOpen(false)
      setSelectedOutletId(null)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Transfer error:', err)
      alert('Transfer failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmBulkTransfer = async () => {
    if (!selectedOutletId) return
    const ids = table.getSelectedRowModel().rows
      .filter((r) => r.original.outlet_id === null)
      .map((r) => r.original.id)
    
    if (ids.length === 0) {
      alert('Selected orders are already transferred.')
      setBulkTransferModalOpen(false)
      setRowSelection({})
      return
    }

    setIsSubmitting(true)

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/transfer-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_ids: ids, outlet_id: selectedOutletId }),
      })

      if (!res.ok) throw new Error('Bulk transfer failed')
      await fetchOrders()
      setBulkTransferModalOpen(false)
      setRowSelection({})
      setSelectedOutletId(null)
    } catch (err) {
      console.error('Bulk transfer error:', err)
      alert('Bulk transfer failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelClick = (order: Order) => {
    setSelectedOrder(order)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return
    setIsSubmitting(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!res.ok) throw new Error('Cancellation failed')
      await fetchOrders()
      setCancelModalOpen(false)
      setSelectedOrder(null)
    } catch (err) {
      console.error('Cancel error:', err)
      alert('Cancellation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order)
    setNewProductName(order.product_name)
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedProduct(null)
    setSelectedPlan(null)
    setEditModalOpen(true)
  }

  const confirmEdit = async () => {
    if (!selectedOrder || !selectedProduct || !selectedPlan) return
    setIsSubmitting(true)
    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/update-item`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: selectedProduct.name,
          advance_amount: selectedPlan.advance,
          monthly_amount: selectedPlan.monthlyAmount,
          months: selectedPlan.months,
          total_amount: selectedPlan.totalPrice
        }),
      })

      if (!res.ok) throw new Error('Update failed')
      await fetchOrders()
      setEditModalOpen(false)
      setSelectedOrder(null)
      setSelectedProduct(null)
      setSelectedPlan(null)
    } catch (err) {
      console.error('Update error:', err)
      alert('Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewClick = (order: Order) => {
    router.push(`/orders/${order.id}`)
  }

  const confirmBulkUnassign = async () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id)
    setIsSubmitting(true)

    try {
      const token = Cookies.get('auth_token')
      const res = await fetch(`${BACKEND_URL}/api/orders/assign-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_ids: ids, action: 'unassign' }),
      })

      if (!res.ok) throw new Error('Bulk unassign failed')
      await fetchOrders()
      setBulkUnassignModalOpen(false)
      setRowSelection({})
    } catch (err) {
      console.error('Bulk unassign error:', err)
      alert('Bulk unassign failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Order>[] = [
    ...(hideSelection ? [] : [{
      id: 'select',
      header: ({ table }: { table: any }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: { row: any }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          disabled={!row.getCanSelect()}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    }]),
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ getValue }) => dayjs(getValue() as string).format('MMM DD, YYYY'),
      enableColumnFilter: true,
    },
    { accessorKey: 'order_ref', header: 'Order Ref', enableColumnFilter: true },
    { accessorKey: 'customer_name', header: 'Customer Name', enableColumnFilter: true },
    { accessorKey: 'whatsapp_number', header: 'WhatsApp', enableColumnFilter: true },
    { accessorKey: 'city', header: 'City', enableColumnFilter: true },
    { accessorKey: 'area', header: 'Area', enableColumnFilter: true },
    { accessorKey: 'product_name', header: 'Suggested Product', enableColumnFilter: true },
    {
      accessorKey: 'status',
      header: 'Status',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const order = row.original
        const isActuallyTransferred = isSalesOfficer && order.outlet_id !== null && order.status?.toLowerCase() === 'pending'
        const status = order.status?.toLowerCase() || '';

        let label = '';
        let className = 'inline-flex px-2.5 py-1 rounded-full text-xs font-medium';

        switch (status) {
          case 'new':
            label = 'New';
            className += ' bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
            break;

          case 'pending':
            if (isActuallyTransferred) {
              label = 'Transferred'
              className += ' bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
            } else {
              label = 'Pending'
              className += ' bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
            }
            break;

          case 'in_progress':
          case 'in-progress':
            label = 'In Progress';
            className += ' bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
            break;

          case 'ready_for_pickup':
            label = 'Ready for Pickup';
            className += ' bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
            break;

          case 'picked':
            label = 'Picked';
            className += ' bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            break;

          case 'cancelled':
            label = 'Cancelled';
            className += ' bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            break;

          case 'expired':
            label = 'Expired';
            className += ' bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            break;

          case 'completed':
            label = 'Completed';
            className += ' bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
            break;

          case 'delivered':
            label = 'Delivered';
            className += ' bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            break;

          default:
            label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
            className += ' bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            break;
        }

        return <span className={className}>{label}</span>;
      },
    },
    {
      id: 'created_by',
      accessorFn: (row) => row.created_by?.username || '',
      header: 'Created By',
      enableColumnFilter: true,
    },
    ...(isSalesOfficer ? [] : [{
      id: 'assigned_to',
      accessorFn: (row: Order) => row.assigned_to?.username || 'Unassigned',
      header: 'Assigned To',
      enableColumnFilter: true,
    }]),
    {
  id: 'actions',
  header: 'Actions',
  enableSorting: false,
  enableColumnFilter: false,
  cell: ({ row }) => {
    const order = row.original
    const orderStatus = order.status?.toLowerCase() || '';
    
    // Check if order is cancelled or delivered
    const isCancelledOrDelivered = orderStatus === 'cancelled' || orderStatus === 'delivered';

    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [openUp, setOpenUp] = useState(false)

    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const dropdownRef = useRef<HTMLDivElement | null>(null)

    const toggleDropdown = () => {
      if (!triggerRef.current) return

      const rect = triggerRef.current.getBoundingClientRect()

      const dropdownWidth = 180
      const dropdownHeight = 120

      const spaceBelow = window.innerHeight - rect.bottom
      const spaceRight = window.innerWidth - rect.right

      const shouldOpenUp = spaceBelow < dropdownHeight
      const shouldAlignLeft = spaceRight < dropdownWidth

      setOpenUp(shouldOpenUp)

      setPosition({
        top: shouldOpenUp
          ? rect.top + window.scrollY - 8
          : rect.bottom + window.scrollY + 6,
        left: shouldAlignLeft
          ? rect.left + window.scrollX
          : rect.right + window.scrollX - dropdownWidth,
      })

      setIsOpen((prev) => !prev)
    }

    // Outside click + ESC close
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node

        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false)
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false)
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen])

    return (
      <>
        <button
          ref={triggerRef}
          onClick={toggleDropdown}
          className="group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-dark shadow-[0_1px_3px_0_rgba(166,175,195,0.4)] hover:text-[#ff3d3d] dark:border dark:border-dark-3 dark:text-white dark:shadow-none"
        >
          <span>Actions</span>
          <ChevronUpIcon
            className={`size-4 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'
              }`}
          />
        </button>

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                transform: openUp ? 'translateY(-100%)' : 'none',
              }}
              className="z-[99999] w-44 rounded-md border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-gray-900"
            >
              <ul className="overflow-hidden text-sm font-medium">

                <li>
                  <button
                    onClick={() => {
                      handleViewClick(order)
                      setIsOpen(false)
                    }}
                    className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3"
                  >
                    View Details
                  </button>
                </li>

                {/* Only show Edit Item if status is NOT cancelled or delivered */}
                {!isCancelledOrDelivered && (
                  <li>
                    <button
                      onClick={() => {
                        handleEditClick(order)
                        setIsOpen(false)
                      }}
                      className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3"
                    >
                      Edit Item
                    </button>
                  </li>
                )}

                {/* Only show Cancel Order if status is NOT cancelled or delivered */}
                {!isCancelledOrDelivered && (
                  <li>
                    <button
                      onClick={() => {
                        handleCancelClick(order)
                        setIsOpen(false)
                      }}
                      className="block w-full px-4 py-2.5 text-left hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      Cancel Order
                    </button>
                  </li>
                )}

                {!hideActions && (
                  <>
                    {isSalesOfficer ? (
                      <>
                        {order.outlet_id === null && (
                          <li>
                            <button
                              onClick={() => {
                                handleTransferClick(order)
                                setIsOpen(false)
                              }}
                              className="block w-full px-4 py-2.5 text-left hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 font-bold"
                            >
                              Transfer to Outlet
                            </button>
                          </li>
                        )}
                      </>
                    ) : (
                      <>
                        {order.assigned_to ? (
                          <li>
                            <button
                              onClick={() => {
                                handleUnassignClick(order)
                                setIsOpen(false)
                              }}
                              className="block w-full px-4 py-2.5 text-left hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            >
                              Unassign
                            </button>
                          </li>
                        ) : (
                          <li>
                            <button
                              onClick={() => {
                                handleAssignClick(order)
                                setIsOpen(false)
                              }}
                              className="block w-full px-4 py-2.5 text-left hover:bg-[#F5F7FD] hover:text-[#ff3d3d] dark:hover:bg-dark-3"
                            >
                              Assign
                            </button>
                          </li>
                        )}
                      </>
                    )}
                  </>
                )}

              </ul>
            </div>,
            document.body
          )}
      </>
    )
  },
}
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getRowId: (row) => String(row.id),
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
    enableRowSelection: !hideSelection,
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

  useEffect(() => {
    if (!onRowSelectionChange) return
    const selectedIds = Object.keys(rowSelection).map((key) => Number(key))
    const selectedOrders = orders.filter((order) => selectedIds.includes(order.id))
    onRowSelectionChange(selectedOrders)
  }, [rowSelection, orders, onRowSelectionChange])

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
            placeholder="Search here..."
          />
          <button className="absolute right-0 top-0 flex h-11.5 w-11.5 items-center justify-center rounded-r-md bg-[#ff3d3d] text-white">
            <SearchIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex items-center font-medium gap-4">
          <div className="flex items-center">
            <p className="pr-2 text-dark dark:text-current">Date Range:</p>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
            >
              {['All', 'Day', 'Week', 'Month', 'Quarter', 'Year', 'Custom Range'].map((r) => (
                <option key={r} value={r} className='dark:bg-dark-2'>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {dateRange === 'Custom Range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-stroke bg-transparent px-2 py-1 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-stroke bg-transparent px-2 py-1 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
              />
            </div>
          )}

          <div className="flex items-center">
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

          {customTopBarActions && (
            <div className="flex items-center">
              {customTopBarActions}
            </div>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && !hideSelection && (
        <div className="px-7.5 pb-4 flex flex-wrap gap-4">
          {!isSalesOfficer && (
            <>
              <button
                onClick={handleBulkAssign}
                className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
              >
                Assign Selected ({selectedCount})
              </button>

              <button
                onClick={handleBulkUnassign}
                className="rounded bg-red-600 px-5 py-2 text-white hover:bg-red-700"
              >
                Unassign Selected ({selectedCount})
              </button>
            </>
          )}

          {isSalesOfficer && (
            <button
              onClick={handleBulkTransfer}
              className="rounded bg-green-600 px-5 py-2 text-white hover:bg-green-700 font-bold flex items-center gap-2"
            >
              <ArrowRightLeft className='w-4 h-4' /> Transfer Selected ({selectedCount})
            </button>
          )}
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
                  <Loader text="Loading orders..." />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  No orders found
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

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}

      {/* Edit Product Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Edit Product Name</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Changing product name for order <strong>{selectedOrder?.order_ref}</strong>. This action will be logged in history.
        </p>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Current Product:</label>
            <div className="p-3 bg-gray-50 dark:bg-dark-3 rounded-lg border border-stroke dark:border-dark-3 text-sm">
              {selectedOrder?.product_name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Subcategory:</label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 text-sm disabled:bg-gray-100"
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Select New Product:</label>
            <select
              disabled={!selectedSubcategory}
              onChange={(e) => {
                const prod = products.find(p => p.name === e.target.value)
                if (prod) setSelectedProduct(prod)
              }}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 text-sm disabled:bg-gray-100"
            >
              <option value="">Select Product</option>
              {products
                .filter(p => p.category_name === selectedCategory && p.subcategory_name === selectedSubcategory)
                .map((p: any) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium dark:text-gray-300">Installment Plan:</label>
              <div className="grid grid-cols-1 gap-3">
                {selectedProduct.ProductInstallments?.filter((p: any) => p.isActive).map((plan: any) => (
                  <label
                    key={plan.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedPlan?.id === plan.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-stroke hover:border-primary/50 dark:border-dark-3'
                      }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={selectedPlan?.id === plan.id}
                      onChange={() => setSelectedPlan(plan)}
                    />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-dark dark:text-white">{plan.months} Months</span>
                      <div className="text-right text-xs space-y-0.5">
                        <div className="text-gray-500">Advance: <span className="text-dark dark:text-white font-medium">Rs. {plan.advance.toLocaleString()}</span></div>
                        <div className="text-gray-500">Monthly: <span className="text-dark dark:text-white font-medium">Rs. {plan.monthlyAmount.toLocaleString()}</span></div>
                        <div className="text-gray-500">Total: <span className="text-dark dark:text-white font-medium">Rs. {plan.totalPrice.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setEditModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmEdit}
            disabled={!selectedProduct || !selectedPlan || isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Cancel Order</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Are you sure you want to cancel order <strong>{selectedOrder?.order_ref}</strong>?
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Reason for Cancellation (Mandatory):</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3"
              rows={3}
              placeholder="e.g., Customer not responding, Incorrect information..."
            ></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setCancelModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button
            onClick={confirmCancel}
            disabled={!cancelReason.trim() || isSubmitting}
            className="rounded bg-red-600 px-6 py-2.5 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </Modal>

      {/* Single Assign Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false)
          setSelectedVerifierId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Assign Order</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Select a verification officer:</p>
        <select
          value={selectedVerifierId ?? ''}
          onChange={(e) => setSelectedVerifierId(Number(e.target.value))}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
        >
          <option value="">Select Officer</option>
          {verifiers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.username})
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => {
              setAssignModalOpen(false)
              setSelectedVerifierId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmAssign}
            disabled={!selectedVerifierId || isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </Modal>

      {/* Single Unassign Modal */}
      <Modal
        open={singleUnassignModalOpen}
        onClose={() => setSingleUnassignModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Unassign Order</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to unassign order <strong>{selectedOrder?.order_ref}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setSingleUnassignModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmSingleUnassign}
            disabled={isSubmitting}
            className="rounded bg-red-600 px-6 py-2.5 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Unassigning...' : 'Unassign'}
          </button>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        open={bulkAssignModalOpen}
        onClose={() => {
          setBulkAssignModalOpen(false)
          setSelectedVerifierId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Bulk Assign Orders</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Select a verification officer for {selectedCount} selected orders:
        </p>
        <select
          value={selectedVerifierId ?? ''}
          onChange={(e) => setSelectedVerifierId(Number(e.target.value))}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
        >
          <option value="">Select Officer</option>
          {verifiers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.username})
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => {
              setBulkAssignModalOpen(false)
              setSelectedVerifierId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkAssign}
            disabled={!selectedVerifierId || isSubmitting}
            className="rounded bg-[#ff3d3d] px-6 py-2.5 text-white hover:bg-[#ff3d3d]/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Assigning All...' : 'Assign All'}
          </button>
        </div>
      </Modal>

      {/* Bulk Unassign Modal */}
      <Modal
        open={bulkUnassignModalOpen}
        onClose={() => setBulkUnassignModalOpen(false)}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">Bulk Unassign Orders</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to unassign <strong>{selectedCount}</strong> selected orders?
        </p>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => setBulkUnassignModalOpen(false)}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkUnassign}
            disabled={isSubmitting}
            className="rounded bg-red-600 px-6 py-2.5 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Unassigning All...' : 'Unassign All'}
          </button>
        </div>
      </Modal>

      {/* Single Transfer Modal */}
      <Modal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false)
          setSelectedOutletId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-blue-600" /> Transfer to Outlet
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Transfer order <strong>{selectedOrder?.order_ref}</strong> to a specific branch:
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Select Target Outlet:</label>
            <select
              value={selectedOutletId ?? ''}
              onChange={(e) => setSelectedOutletId(Number(e.target.value))}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="">Select Branch</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => {
              setTransferModalOpen(false)
              setSelectedOutletId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmTransfer}
            disabled={!selectedOutletId || isSubmitting}
            className="rounded bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50 font-bold"
          >
            {isSubmitting ? 'Transferring...' : 'Transfer Now'}
          </button>
        </div>
      </Modal>

      {/* Bulk Transfer Modal */}
      <Modal
        open={bulkTransferModalOpen}
        onClose={() => {
          setBulkTransferModalOpen(false)
          setSelectedOutletId(null)
        }}
        className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-green-600" /> Bulk Transfer to Outlet
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Transfer <strong>{selectedCount}</strong> selected orders to a branch:
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Select Target Outlet:</label>
            <select
              value={selectedOutletId ?? ''}
              onChange={(e) => setSelectedOutletId(Number(e.target.value))}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-primary dark:border-dark-3 dark:bg-dark-2"
            >
              <option value="">Select Branch</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => {
              setBulkTransferModalOpen(false)
              setSelectedOutletId(null)
            }}
            className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkTransfer}
            disabled={!selectedOutletId || isSubmitting}
            className="rounded bg-green-600 px-6 py-2.5 text-white hover:bg-green-700 disabled:opacity-50 font-bold"
          >
            {isSubmitting ? 'Transferring All...' : 'Transfer Selected'}
          </button>
        </div>
      </Modal>
    </section>
  )
}

export default OrderList