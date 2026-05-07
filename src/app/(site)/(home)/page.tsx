'use client'

import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PaymentsOverviewChart } from '@/components/Charts/payments-overview/chart'
import { useNotifications } from '../../../../contexts/NotificationContext'
import { useAuth } from '../../../../contexts/AuthContext'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;


type OrderStatus =
  | 'new'
  | 'pending'
  | 'in_progress'
  | 'picked'
  | 'approved'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | string

interface OrderSummary {
  id: number
  order_ref: string
  token_number: string
  customer_name: string
  whatsapp_number: string
  city: string | null
  area: string | null
  product_name: string
  total_amount: number
  advance_amount: number
  status: OrderStatus
  channel: string
  created_at: string
}

interface DeliveryStatusItem {
  id: number
  order_ref: string
  customer_name: string
  address: string
  product_name: string
  amount: number
  status: OrderStatus
  delivery_officer: {
    username: string
    full_name: string
  } | null
  updated_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface DashboardStats {
  totalOrders: number
  todayOrders: number
  newPendingOrders: number
  inProgressOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalCustomers: number
  activeDeliveries: number
}

const initialStats: DashboardStats = {
  totalOrders: 0,
  todayOrders: 0,
  newPendingOrders: 0,
  inProgressOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalCustomers: 0,
  activeDeliveries: 0,
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [recentOrdersPagination, setRecentOrdersPagination] = useState<PaginationInfo | null>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { notifications, unreadCount } = useNotifications()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      const userRole = user.role?.toLowerCase()
      if (userRole === 'sales officer') {
        router.push('/csr/dashboard')
      } else if (userRole === 'branch user') {
        router.push('/outlet/dashboard')
      }
    }
  }, [user, authLoading, router])

  const token = useMemo(() => Cookies.get('auth_token'), [])

  const fetchJson = async (url: string) => {
    if (!token) return null
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json()
  }

  const loadDashboard = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [
        allOrders,
        todayOrders,
        newPendingOrders,
        inProgressOrders,
        deliveredOrders,
        cancelledOrders,
        customersRes,
        recentOrdersRes,
        deliveryStatusRes,
      ] = await Promise.all([
        fetchJson(`${BACKEND_URL}/api/orders?page=1&limit=1`),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=1&dateRange=Day`
        ),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=1&status=new,pending`
        ),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=1&status=in_progress,picked,approved`
        ),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=1&status=delivered,completed`
        ),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=1&status=cancelled`
        ),
        fetchJson(`${BACKEND_URL}/api/customers?page=1&limit=1`),
        fetchJson(
          `${BACKEND_URL}/api/orders?page=1&limit=10&sortBy=updated_at&sortDir=desc`
        ),
        fetchJson(`${BACKEND_URL}/api/orders/delivery-status`),
      ])

      setStats({
        totalOrders: allOrders?.data?.pagination?.total ?? 0,
        todayOrders: todayOrders?.data?.pagination?.total ?? 0,
        newPendingOrders: newPendingOrders?.data?.pagination?.total ?? 0,
        inProgressOrders: inProgressOrders?.data?.pagination?.total ?? 0,
        deliveredOrders: deliveredOrders?.data?.pagination?.total ?? 0,
        cancelledOrders: cancelledOrders?.data?.pagination?.total ?? 0,
        totalCustomers: customersRes?.data?.pagination?.total ?? 0,
        activeDeliveries: Array.isArray(deliveryStatusRes?.data)
          ? deliveryStatusRes.data.length
          : 0,
      })

      setRecentOrders(recentOrdersRes?.data?.orders ?? [])
      setRecentOrdersPagination(recentOrdersRes?.data?.pagination ?? null)
      setDeliveryStatus(Array.isArray(deliveryStatusRes?.data) ? deliveryStatusRes.data : [])
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()

    const interval = setInterval(() => {
      loadDashboard()
    }, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const paymentsChartData = useMemo(() => {
    const categories = ['New/Pending', 'In Progress', 'Delivered', 'Cancelled']
    const baseSeries = [
      stats.newPendingOrders,
      stats.inProgressOrders,
      stats.deliveredOrders,
      stats.cancelledOrders,
    ]

    return {
      received: categories.map((label, idx) => ({
        x: label,
        y: idx === 2 ? stats.deliveredOrders : baseSeries[idx] * 0.6,
      })),
      due: categories.map((label, idx) => ({
        x: label,
        y: baseSeries[idx] * 0.4,
      })),
    }
  }, [stats])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Live overview of orders, customers, deliveries and collections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Total Orders:{' '}
            <strong>{stats.totalOrders.toLocaleString()}</strong>
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Today:{' '}
            <strong>{stats.todayOrders.toLocaleString()}</strong>
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 dark:bg-dark-3 dark:text-gray-200">
            Unread Notifications:{' '}
            <strong>{unreadCount}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="New / Pending Orders"
          value={stats.newPendingOrders}
          subtitle="Awaiting verification or processing"
          tone="primary"
        />
        <DashboardCard
          title="In Progress"
          value={stats.inProgressOrders}
          subtitle="Picked / approved / being worked"
          tone="info"
        />
        <DashboardCard
          title="Delivered / Completed"
          value={stats.deliveredOrders}
          subtitle="Successfully closed orders"
          tone="success"
        />
        <DashboardCard
          title="Cancelled"
          value={stats.cancelledOrders}
          subtitle="Orders cancelled by team"
          tone="danger"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-dark dark:text-white">
                  Orders & Payments Overview
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Synthetic received vs due curve based on current order pipeline.
                </p>
              </div>
            </div>
            <PaymentsOverviewChart data={paymentsChartData} />
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-dark dark:text-white">
                  Latest Orders
                </h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  LIFO: Latest First
                </span>
              </div>
              <Link
                href="/orders-list"
                className="text-xs font-medium text-[#ff3d3d] hover:underline"
              >
                View all orders
              </Link>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-3 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Advance</th>
                    <th className="px-3 py-2">Channel</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        Loading latest orders...
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-stroke last:border-0 dark:border-dark-3"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col">
                            <Link
                              href={`/orders/${order.id}`}
                              className="text-xs font-semibold text-[#ff3d3d] hover:underline"
                            >
                              {order.order_ref}
                            </Link>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              Token: {order.token_number}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-dark dark:text-white">
                              {order.customer_name}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {order.whatsapp_number}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {[order.area, order.city].filter(Boolean).join(', ') || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="line-clamp-2 text-xs text-gray-700 dark:text-gray-200">
                            {order.product_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <span className="text-xs font-semibold text-dark dark:text-white">
                            Rs. {order.advance_amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            {order.channel}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {recentOrdersPagination && (
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  Showing page {recentOrdersPagination.page} of{' '}
                  {recentOrdersPagination.totalPages}
                </span>
                <span>Total: {recentOrdersPagination.total.toLocaleString()} orders</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-dark dark:text-white">
                Live Deliveries
              </h2>
              <Link
                href="/delivered-orders"
                className="text-xs font-medium text-[#ff3d3d] hover:underline"
              >
                View history
              </Link>
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Orders currently assigned to delivery officers and their latest status.
            </p>
            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {loading && deliveryStatus.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Loading live deliveries...
                </p>
              ) : deliveryStatus.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No active deliveries right now.
                </p>
              ) : (
                deliveryStatus.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-stroke bg-gray-50 p-3 text-xs dark:border-dark-3 dark:bg-dark-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-dark dark:text-white">
                          {item.order_ref}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {item.customer_name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {item.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                          Rs. {item.amount.toLocaleString()}
                        </p>
                        <StatusBadge status={item.status} />
                        <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                          Updated:{' '}
                          {new Date(item.updated_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {item.delivery_officer && (
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        By{' '}
                        <span className="font-medium">
                          {item.delivery_officer.full_name} ({item.delivery_officer.username})
                        </span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-dark dark:text-white">
                Latest Notifications
              </h2>
              <Link
                href="/notifications"
                className="text-xs font-medium text-[#ff3d3d] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No notifications yet.
                </p>
              ) : (
                notifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 rounded-lg border border-stroke bg-gray-50 p-3 text-xs dark:border-dark-3 dark:bg-dark-3"
                  >
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#ff3d3d]" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-dark dark:text-white">
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="rounded-full bg-[#ff3d3d] px-2 py-0.5 text-[10px] font-semibold text-white">
                        New
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const value = (status || '').toLowerCase()

  let label = value
  let className =
    'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold '

  switch (value) {
    case 'new':
      label = 'New'
      className += 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      break
    case 'pending':
      label = 'Pending'
      className += 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
      break
    case 'in_progress':
    case 'in-progress':
      label = 'In Progress'
      className += 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      break
    case 'picked':
      label = 'Picked'
      className += 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
      break
    case 'approved':
      label = 'Approved'
      className += 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
      break
    case 'completed':
    case 'delivered':
      label = value === 'completed' ? 'Completed' : 'Delivered'
      className += 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      break
    case 'cancelled':
      label = 'Cancelled'
      className += 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      break
    default:
      label = status || 'Unknown'
      className += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  return <span className={className}>{label}</span>
}

interface DashboardCardProps {
  title: string
  value: number
  subtitle: string
  tone?: 'primary' | 'success' | 'danger' | 'info'
}

function DashboardCard({ title, value, subtitle, tone = 'primary' }: DashboardCardProps) {
  const toneClasses: Record<
    NonNullable<DashboardCardProps['tone']>,
    { badge: string; value: string }
  > = {
    primary: {
      badge: 'bg-[#ff3d3d]/10 text-[#ff3d3d]',
      value: 'text-[#ff3d3d]',
    },
    success: {
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      value: 'text-emerald-600 dark:text-emerald-300',
    },
    danger: {
      badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      value: 'text-red-600 dark:text-red-300',
    },
    info: {
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      value: 'text-blue-600 dark:text-blue-300',
    },
  }

  const tones = toneClasses[tone]

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${tones.value}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones.badge}`}>
          Live
        </span>
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}

