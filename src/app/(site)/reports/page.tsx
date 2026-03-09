'use client'

import { useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import { PaymentsOverviewChart } from '@/components/Charts/payments-overview/chart'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;

type StatusKey =
  | 'new'
  | 'pending'
  | 'in_progress'
  | 'picked'
  | 'approved'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | string

interface ReportOverview {
  totalOrders: number
  totalCustomers: number
  ordersByStatus: Record<StatusKey, number>
  totalReceived: number
  totalPending: number
}

interface ChannelBreakdown {
  channel: string
  count: number
}

interface CityBreakdown {
  city: string
  count: number
}

interface DailyTrendPoint {
  date: string
  count: number
  totalAmount: number
  advanceAmount: number
}

interface ReportData {
  meta: {
    dateRange: string
    startDate: string | null
    endDate: string | null
  }
  overview: ReportOverview
  breakdown: {
    byChannel: ChannelBreakdown[]
    byCity: CityBreakdown[]
    dailyTrend: DailyTrendPoint[]
  }
}

const initialOverview: ReportOverview = {
  totalOrders: 0,
  totalCustomers: 0,
  ordersByStatus: {},
  totalReceived: 0,
  totalPending: 0,
}

type DateRange = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('Month')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [channelFilter, setChannelFilter] = useState<string>('')

  const token = useMemo(() => Cookies.get('auth_token'), [])

  const loadReport = async (range: DateRange, status?: string, channel?: string) => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ dateRange: range })
      if (status) params.append('status', status)
      if (channel) params.append('channel', channel)
      const res = await fetch(`${BACKEND_URL}/api/reports/summary?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        setReport(json.data)
      } else {
        throw new Error(json.error?.message || 'Unknown error')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport(dateRange, statusFilter || undefined, channelFilter || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, statusFilter, channelFilter, token])

  const overview = report?.overview ?? initialOverview

  const paymentsChartData = useMemo(() => {
    const counts = overview.ordersByStatus || {}
    const delivered = (counts.delivered || 0) + (counts.completed || 0)
    const newPending = (counts.new || 0) + (counts.pending || 0)
    const inProgress =
      (counts.in_progress || 0) + (counts['in-progress' as StatusKey] || 0) + (counts.picked || 0)
    const cancelled = counts.cancelled || 0

    const labels = ['New/Pending', 'In Progress', 'Delivered', 'Cancelled']
    const base = [newPending, inProgress, delivered, cancelled]

    return {
      received: labels.map((label, idx) => ({
        x: label,
        y: idx === 2 ? delivered : Math.round(base[idx] * 0.7),
      })),
      due: labels.map((label, idx) => ({
        x: label,
        y: Math.max(0, base[idx] - Math.round(base[idx] * 0.7)),
      })),
    }
  }, [overview.ordersByStatus])

  const statusEntries = useMemo(() => {
    const counts = overview.ordersByStatus || {}
    const order: StatusKey[] = [
      'new',
      'pending',
      'in_progress',
      'picked',
      'approved',
      'delivered',
      'completed',
      'cancelled',
    ]
    return order
      .map((key) => ({ key, value: counts[key] || 0 }))
      .filter((item) => item.value > 0)
  }, [overview.ordersByStatus])

  const dateLabel = useMemo(() => {
    if (!report?.meta?.startDate || !report.meta.endDate) return null
    const from = new Date(report.meta.startDate).toLocaleDateString()
    const to = new Date(report.meta.endDate).toLocaleDateString()
    return `${from} → ${to}`
  }, [report])

  return (
    <>
      <Breadcrumb pageName="Reports & Analytics" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Portfolio Reports
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            High-level view of orders, customers, and collections across your BNPL operation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-[#ff3d3d] dark:border-dark-3"
            >
              {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((r) => (
                <option key={r} value={r} className="dark:bg-dark-2">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-[#ff3d3d] dark:border-dark-3"
            >
              <option value="" className="dark:bg-dark-2">
                All
              </option>
              {['new', 'pending', 'in_progress', 'picked', 'approved', 'delivered', 'completed', 'cancelled'].map(
                (s) => (
                  <option key={s} value={s} className="dark:bg-dark-2">
                    {prettyStatus(s)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Channel
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-lg border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-[#ff3d3d] dark:border-dark-3"
            >
              <option value="" className="dark:bg-dark-2">
                All
              </option>
              {Array.from(new Set(report?.breakdown.byChannel.map((c) => c.channel) || [])).map(
                (ch) => (
                  <option key={ch} value={ch} className="dark:bg-dark-2">
                    {ch}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Orders"
          value={overview.totalOrders}
          subtitle="Orders in selected period"
          tone="primary"
        />
        <KpiCard
          label="Unique Customers"
          value={overview.totalCustomers}
          subtitle="Based on WhatsApp number"
          tone="info"
        />
        <KpiCard
          label="Total Received"
          value={overview.totalReceived}
          subtitle="Advance + installments"
          tone="success"
          isCurrency
        />
        <KpiCard
          label="Estimated Outstanding"
          value={overview.totalPending}
          subtitle="Remaining portfolio exposure"
          tone="danger"
          isCurrency
        />
      </div>

      {dateLabel && (
        <p className="mb-4 text-xs font-medium text-gray-500 dark:text-gray-400">
          Reporting window: <span className="font-semibold">{dateLabel}</span>
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-dark dark:text-white">
                  Volume & Collections Overview
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Synthetic received vs due curve based on status mix in the selected period.
                </p>
              </div>
            </div>
            <PaymentsOverviewChart data={paymentsChartData} />
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
              Orders by Status
            </h2>
            {statusEntries.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                No orders in the selected period.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {statusEntries.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-stroke bg-gray-50 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3"
                  >
                    <span className="font-medium text-gray-600 dark:text-gray-200">
                      {prettyStatus(item.key)}
                    </span>
                    <span className="text-right text-sm font-semibold text-dark dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-3 text-base font-semibold text-dark dark:text-white">
              Top Channels
            </h2>
            {report?.breakdown.byChannel?.length ? (
              <ul className="space-y-2 text-sm">
                {report.breakdown.byChannel.map((row) => (
                  <li
                    key={row.channel}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-3"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {row.channel}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                      {row.count.toLocaleString()} orders
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-xs text-gray-500 dark:text-gray-400">
                No channel data available.
              </p>
            )}
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-3 text-base font-semibold text-dark dark:text-white">
              Top Cities by Volume
            </h2>
            {report?.breakdown.byCity?.length ? (
              <ul className="space-y-2 text-sm">
                {report.breakdown.byCity.map((row) => (
                  <li
                    key={row.city}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-3"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {row.city}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                      {row.count.toLocaleString()} orders
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-xs text-gray-500 dark:text-gray-400">
                No city data available.
              </p>
            )}
          </div>

          <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-semibold text-dark dark:text-white">
                Daily Trend (Orders & Amount)
              </h2>
              {loading && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Refreshing...
                </span>
              )}
            </div>
            {report?.breakdown.dailyTrend?.length ? (
              <div className="max-h-[260px] overflow-y-auto pr-1 text-xs">
                <table className="min-w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-dark-3 dark:text-gray-400">
                    <tr>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2 text-right">Orders</th>
                      <th className="px-2 py-2 text-right">Total Amount</th>
                      <th className="px-2 py-2 text-right">Advance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.dailyTrend.map((point, idx) => (
                      <tr
                        key={`${point.date}-${idx}`}
                        className="border-b border-stroke last:border-0 dark:border-dark-3"
                      >
                        <td className="px-2 py-2">{point.date}</td>
                        <td className="px-2 py-2 text-right">{point.count}</td>
                        <td className="px-2 py-2 text-right">
                          Rs. {point.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-right">
                          Rs. {point.advanceAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-3 text-xs text-gray-500 dark:text-gray-400">
                No daily trend data for this range.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function prettyStatus(status: StatusKey) {
  const value = (status || '').toLowerCase()
  switch (value) {
    case 'new':
      return 'New'
    case 'pending':
      return 'Pending'
    case 'in_progress':
    case 'in-progress':
      return 'In Progress'
    case 'picked':
      return 'Picked'
    case 'approved':
      return 'Approved'
    case 'delivered':
      return 'Delivered'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status || 'Unknown'
  }
}

interface KpiCardProps {
  label: string
  value: number
  subtitle: string
  tone?: 'primary' | 'success' | 'danger' | 'info'
  isCurrency?: boolean
}

function KpiCard({
  label,
  value,
  subtitle,
  tone = 'primary',
  isCurrency = false,
}: KpiCardProps) {
  const toneClasses: Record<
    NonNullable<KpiCardProps['tone']>,
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
  const displayValue = isCurrency
    ? `Rs. ${value.toLocaleString()}`
    : value.toLocaleString()

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${tones.value}`}>{displayValue}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones.badge}`}>
          Report
        </span>
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  )
}

