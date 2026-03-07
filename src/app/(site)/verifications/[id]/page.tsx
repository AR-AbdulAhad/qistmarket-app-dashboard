'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import Cookies from 'js-cookie'
import { cn } from '@/lib/utils'
import toast from "react-hot-toast";
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

interface VerificationData {
  id: number
  order_id: number
  verification_officer_id: number
  status: string
  start_time: string
  end_time: string | null
  created_at: string
  updated_at: string
  order: {
    id: number
    order_ref: string
    status: string
  }
  verification_officer: {
    full_name: string
    username: string
  }
  purchaser: {
    id: number
    verification_id: number
    name: string
    father_husband_name: string
    present_address: string
    present_zone: string | null
    present_area: string | null
    present_block: string | null
    present_street: string | null
    present_house_no: string | null
    present_period_of_stay: string | null
    permanent_address: string
    permanent_zone: string | null
    permanent_area: string | null
    permanent_block: string | null
    permanent_street: string | null
    permanent_house_no: string | null
    permanent_period_of_stay: string | null
    utility_bill_url: string | null
    cnic_number: string
    cnic_front_url: string | null
    cnic_back_url: string | null
    telephone_number: string
    employment_type: string
    job_type: string | null
    employer_name: string
    employer_address: string
    designation: string
    official_number: string | null
    business_name: string | null
    established_since: string | null
    business_address: string | null
    net_income: string | null
    service_card_url: string | null
    years_in_company: string | null
    gross_salary: string | null
    signature_url: string | null
    nearest_location: string
    is_verified: boolean
  }
  grantors: Array<{
    id: number
    verification_id: number
    grantor_number: number
    name: string
    father_husband_name: string
    present_address: string
    present_zone: string | null
    present_area: string | null
    present_block: string | null
    present_street: string | null
    present_house_no: string | null
    present_period_of_stay: string | null
    permanent_address: string
    permanent_zone: string | null
    permanent_area: string | null
    permanent_block: string | null
    permanent_street: string | null
    permanent_house_no: string | null
    permanent_period_of_stay: string | null
    utility_bill_url: string | null
    cnic_number: string
    cnic_front_url: string | null
    cnic_back_url: string | null
    telephone_number: string
    employment_type: string
    job_type: string | null
    designation: string
    official_number: string | null
    service_card_url: string | null
    office_address: string
    company_name: string | null
    years_in_company: string | null
    monthly_income: string | null
    business_name: string | null
    established_since: string | null
    business_address: string | null
    net_income: string | null
    full_residential_address: string
    relationship: string
    signature_url: string | null
    nearest_location: string
    is_verified: boolean
  }>
  nextOfKin: null | {
    id: number
    verification_id: number
    name: string
    cnic_number: string
    relation: string
    phone_number: string
  }
  locations: Array<{
    id: number
    verification_id: number
    latitude: number
    longitude: number
    accuracy: number | null
    label: string
    timestamp: string
  }>
  verification_locations: Array<{
    id: number
    verification_id: number
    location_type: string
    latitude: number
    longitude: number
    address: string | null
    label: string
    person_type: string
    person_id: number
    created_at: string
    photos: Array<{
      id: number
      verification_location_id: number
      file_url: string
      uploaded_at: string
    }>
  }>
  documents: Array<{
    id: number
    verification_id: number
    document_type: string
    person_type: string
    person_id: number | null
    file_url: string
    label: string | null
    uploaded_at: string
  }>
  reviews: Array<{
    id: number
    approved: boolean
    remarks: string | null
    created_at: string
    reviewer: {
      full_name: string
      username: string
    }
  }>
}

// Helper function to check if value should be displayed
const shouldDisplay = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  if (typeof value === 'object' && Object.keys(value).length === 0) return false
  return true
}

// Reusable Field Component
const Field = ({ label, value, className = "" }: { label: string; value: any; className?: string }) => {
  if (!shouldDisplay(value)) return null

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </div>
    </div>
  )
}

// Reusable Document Card Component
function DocumentCard({ doc }: { doc: VerificationData['documents'][number] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
      >
        <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
          {doc.label || doc.document_type}
        </h4>

        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>
            Type: <span className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</span>
          </p>
          <p>
            Uploaded:{' '}
            <span className="font-medium">{new Date(doc.uploaded_at).toLocaleString()}</span>
          </p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
          <img
            src={doc.file_url}
            alt={doc.label || doc.document_type}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <div className="mt-3 inline-flex items-center text-sm font-medium text-[#ff3d3d] hover:underline">
          Click to view full size →
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={doc.file_url}
              alt={doc.label || doc.document_type}
              className="max-h-[90vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}

// Reusable Location Photo Card
function LocationPhotoCard({ photo, label }: { photo: { file_url: string, uploaded_at: string }, label: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800 cursor-pointer"
      >
        <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">
          {label} - Location Photo
        </h4>

        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          <p>Uploaded: {new Date(photo.uploaded_at).toLocaleString()}</p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
          <img
            src={photo.file_url}
            alt={`Location photo for ${label}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <div className="mt-3 inline-flex items-center text-sm font-medium text-[#ff3d3d] hover:underline">
          Click to view full size →
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={photo.file_url}
              alt={`Location photo for ${label}`}
              className="max-h-[90vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}

const VerificationDetails = ({ params }: { params: Promise<{ id: string }> }) => {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id

  const [data, setData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Review form states
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get('auth_token')
        if (!token) {
          setError('Authentication required')
          return
        }

        const res = await fetch(`${BACKEND_URL}/api/verification/order/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Failed to fetch verification details')

        const json = await res.json()

        if (json.success && json.data?.verification) {
          setData(json.data.verification)
        } else {
          setError('No verification data found')
        }
      } catch (err) {
        setError((err as Error).message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!decision) {
      toast.error('Please select Approve or Reject')
      return
    }

    if (decision === 'reject' && !remarks.trim()) {
      toast.error('Remarks are required when rejecting')
      return
    }

    if (!data?.id) {
      toast.error('Verification ID not available')
      return
    }

    setSubmitting(true)

    try {
      const token = Cookies.get('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/verification/${data.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved: decision === 'approve',
          remarks: decision === 'approve' ? null : remarks.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // Refresh
      const refreshRes = await fetch(`${BACKEND_URL}/api/verification/order/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshJson = await refreshRes.json();

      if (refreshJson.success && refreshJson.data?.verification) {
        setData(refreshJson.data.verification);
        setDecision(null);
        setRemarks('');
        toast.success('Review submitted successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading verification details..." />
  if (error) return <div className="py-20 text-center text-red-600">{error}</div>
  if (!data) return <div className="py-20 text-center">No data available</div>

  const approves = data.reviews ? data.reviews.filter(r => r.approved).length : 0
  const percentage = approves * 30

  // Check if the officer who completed verification has already reviewed
  const hasReviewed = data.reviews.some(
    (r) => r.reviewer.username === data.verification_officer.username
  )

  return (
    <section className="rounded-[10px] bg-white p-8 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Verification Details
        </h1>
        {data.order?.order_ref && (
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Order Reference</p>
            <p className="text-lg font-semibold text-primary">{data.order.order_ref}</p>
          </div>
        )}
      </div>

      {/* ── Verification Information ──────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
          Verification Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="ID" value={data.id} />
          <Field label="Order ID" value={data.order_id} />
          {data.order?.status && <Field label="Order Status" value={data.order.status} />}
          {data.verification_officer && (
            <Field
              label="Officer"
              value={`${data.verification_officer.full_name} (${data.verification_officer.username})`}
            />
          )}
          {data.status && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3">
                <span className={cn(
                  "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                  data.status === 'completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    data.status === 'in_progress' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                )}>
                  {data.status}
                </span>
              </div>
            </div>
          )}
          <Field label="Start Time" value={data.start_time ? new Date(data.start_time).toLocaleString() : null} />
          <Field label="End Time" value={data.end_time ? new Date(data.end_time).toLocaleString() : null} />
          <Field label="Created At" value={data.created_at ? new Date(data.created_at).toLocaleString() : null} />
          <Field label="Updated At" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : null} />
        </div>
      </div>

      {/* ── Verification Reviews Section with Submit Form ─────────────────── */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
          Verification Reviews
        </h2>

        {data.reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No reviews submitted yet.</p>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Approval Percentage
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 text-2xl font-bold dark:bg-dark-3 dark:text-gray-300">
                {percentage}%
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-stroke bg-gray-100 p-4 dark:border-dark-3 dark:bg-dark-3"
                >
                  {review.reviewer && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Reviewer: {review.reviewer.full_name} ({review.reviewer.username})
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Approved: {review.approved ? 'Yes' : 'No'}
                  </p>
                  {shouldDisplay(review.remarks) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Remarks: {review.remarks}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Date: {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Review Submission Form */}
        {data.status === 'completed' && (
          <div className="mt-10 rounded-lg border border-primary bg-primary/5 p-6 dark:border-blue-500/30 dark:bg-blue-950/20">
            <h3 className="mb-6 text-2xl font-semibold text-primary dark:text-blue-400">
              Submit Your Review
            </h3>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded bg-white p-4 text-center shadow-sm dark:bg-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Reviews Submitted</div>
                <div className="text-2xl font-bold">{data.reviews.length}/3</div>
              </div>
              <div className="rounded bg-white p-4 text-center shadow-sm dark:bg-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Approval Percentage</div>
                <div className={cn(
                  "text-2xl font-bold",
                  percentage >= 60 ? "text-green-600" :
                    percentage >= 30 ? "text-amber-600" : "text-red-600"
                )}>
                  {percentage}%
                </div>
              </div>
              <div className="rounded bg-white p-4 text-center shadow-sm dark:bg-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Status</div>
                <div className="flex flex-col">
                  <div
                    className={cn(
                      "text-2xl font-bold tracking-wide",
                      percentage === 0
                        ? "text-gray-500"
                        : percentage >= 60
                          ? "text-green-600"
                          : percentage < 30
                            ? "text-red-600"
                            : "text-amber-600"
                    )}
                  >
                    {percentage === 0
                      ? "Awaiting Review"
                      : percentage >= 60
                        ? "APPROVED"
                        : percentage < 30
                          ? "REJECTED"
                          : "Pending Final Decision"}
                  </div>

                  {percentage === 0 && (
                    <span className="text-sm text-gray-400">
                      No evaluation has been submitted yet.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {hasReviewed ? (
              <div className="rounded bg-green-100 p-5 text-center text-green-800 dark:bg-green-950/40 dark:text-green-200">
                You have already submitted your review for this verification.
              </div>
            ) : data.reviews.length >= 3 ? (
              <div className="rounded bg-amber-100 p-5 text-center text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Maximum 3 reviews have been submitted.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="mb-3 block font-medium text-gray-700 dark:text-gray-300">
                    Your Decision
                  </label>
                  <div className="flex gap-10">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value="approve"
                        checked={decision === 'approve'}
                        onChange={() => setDecision('approve')}
                        className="h-5 w-5 accent-green-600"
                        required
                      />
                      <span>Approve</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value="reject"
                        checked={decision === 'reject'}
                        onChange={() => setDecision('reject')}
                        className="h-5 w-5 accent-red-600"
                      />
                      <span>Reject</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block font-medium text-gray-700 dark:text-gray-300">
                    Remarks / Feedback
                    {decision === 'reject' && <span className="ml-1 text-red-600">*</span>}
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 p-4 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    rows={5}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={decision === 'reject'
                      ? "Please explain why you are rejecting..."
                      : "Optional notes (not saved when approving)"}
                    disabled={decision === 'approve'}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !decision}
                    className={cn(
                      "rounded-lg px-10 py-3 font-medium text-white transition-colors",
                      submitting || !decision
                        ? "bg-gray-400 cursor-not-allowed"
                        : decision === 'approve'
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── Purchaser Details ─────────────────────────────────────────────── */}
      {data.purchaser && Object.values(data.purchaser).some(val => shouldDisplay(val)) && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
            Purchaser Details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" value={data.purchaser.name} />
            <Field label="Father/Husband Name" value={data.purchaser.father_husband_name} />
            {shouldDisplay(data.purchaser.present_address) && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Present Address</label>
                <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                  {data.purchaser.present_address}
                  {(data.purchaser.present_zone || data.purchaser.present_area || data.purchaser.present_block) && (
                    <div className="mt-1 text-xs text-gray-500">
                      Structured: {data.purchaser.present_zone}, {data.purchaser.present_area}, {data.purchaser.present_block}, {data.purchaser.present_street}, {data.purchaser.present_house_no}
                    </div>
                  )}
                  {shouldDisplay(data.purchaser.present_period_of_stay) && (
                    <div className="mt-1 text-xs font-medium text-blue-600">
                      Stay Period: {data.purchaser.present_period_of_stay}
                    </div>
                  )}
                </div>
              </div>
            )}
            {shouldDisplay(data.purchaser.permanent_address) && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Permanent Address</label>
                <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                  {data.purchaser.permanent_address}
                  {(data.purchaser.permanent_zone || data.purchaser.permanent_area || data.purchaser.permanent_block) && (
                    <div className="mt-1 text-xs text-gray-500">
                      Structured: {data.purchaser.permanent_zone}, {data.purchaser.permanent_area}, {data.purchaser.permanent_block}, {data.purchaser.permanent_street}, {data.purchaser.permanent_house_no}
                    </div>
                  )}
                  {shouldDisplay(data.purchaser.permanent_period_of_stay) && (
                    <div className="mt-1 text-xs font-medium text-blue-600">
                      Stay Period: {data.purchaser.permanent_period_of_stay}
                    </div>
                  )}
                </div>
              </div>
            )}
            <Field label="CNIC Number" value={data.purchaser.cnic_number} />
            <Field label="Telephone Number" value={data.purchaser.telephone_number} />
            <Field label="Employment Type" value={data.purchaser.employment_type} />
            <Field label="Job Type" value={data.purchaser.job_type} />
            <Field label="Employer Name" value={data.purchaser.employer_name} />
            <Field label="Employer Address" value={data.purchaser.employer_address} />
            <Field label="Designation" value={data.purchaser.designation} />
            <Field label="Official Number" value={data.purchaser.official_number} />
            <Field label="Business Name" value={data.purchaser.business_name} />
            <Field label="Established Since" value={data.purchaser.established_since} />
            <Field label="Business Address" value={data.purchaser.business_address} />
            <Field label="Net Income" value={data.purchaser.net_income} />
            <Field label="Years in Company" value={data.purchaser.years_in_company} />
            <Field label="Gross Salary" value={data.purchaser.gross_salary} />
            <Field label="Nearest Location" value={data.purchaser.nearest_location} />
            <Field label="Verified" value={data.purchaser.is_verified} />
          </div>

          {/* Purchaser Documents */}
          {data.documents.filter((doc) => doc.person_type === 'purchaser').length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-xl font-semibold text-blue-700 dark:text-blue-400">
                Purchaser Uploaded Documents
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.documents
                  .filter((doc) => doc.person_type === 'purchaser')
                  .map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Grantors ──────────────────────────────────────────────────────── */}
      {data.grantors.map((grantor) => {
        // Check if grantor has any data to display
        const hasGrantorData = Object.values(grantor).some(val => shouldDisplay(val))
        const hasDocuments = data.documents.filter(doc => doc.person_type === `grantor${grantor.grantor_number}`).length > 0

        if (!hasGrantorData && !hasDocuments) return null

        return (
          <div key={grantor.id} className="mb-16">
            <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
              Grantor {grantor.grantor_number} Details
            </h2>

            {hasGrantorData && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Name" value={grantor.name} />
                <Field label="Father/Husband Name" value={grantor.father_husband_name} />
                {shouldDisplay(grantor.present_address) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Present Address</label>
                    <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                      {grantor.present_address}
                      {(grantor.present_zone || grantor.present_area || grantor.present_block) && (
                        <div className="mt-1 text-xs text-gray-500">
                          Structured: {grantor.present_zone}, {grantor.present_area}, {grantor.present_block}, {grantor.present_street}, {grantor.present_house_no}
                        </div>
                      )}
                      {shouldDisplay(grantor.present_period_of_stay) && (
                        <div className="mt-1 text-xs font-medium text-blue-600">
                          Stay Period: {grantor.present_period_of_stay}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {shouldDisplay(grantor.permanent_address) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Permanent Address</label>
                    <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                      {grantor.permanent_address}
                      {(grantor.permanent_zone || grantor.permanent_area || grantor.permanent_block) && (
                        <div className="mt-1 text-xs text-gray-500">
                          Structured: {grantor.permanent_zone}, {grantor.permanent_area}, {grantor.permanent_block}, {grantor.permanent_street}, {grantor.permanent_house_no}
                        </div>
                      )}
                      {shouldDisplay(grantor.permanent_period_of_stay) && (
                        <div className="mt-1 text-xs font-medium text-blue-600">
                          Stay Period: {grantor.permanent_period_of_stay}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Field label="CNIC Number" value={grantor.cnic_number} />
                <Field label="Telephone Number" value={grantor.telephone_number} />
                <Field label="Employment Type" value={grantor.employment_type} />
                <Field label="Job Type" value={grantor.job_type} />
                <Field label="Designation" value={grantor.designation} />
                <Field label="Official Number" value={grantor.official_number} />
                <Field label="Office Address" value={grantor.office_address} />
                <Field label="Company Name" value={grantor.company_name} />
                <Field label="Years in Company" value={grantor.years_in_company} />
                <Field label="Monthly Income" value={grantor.monthly_income} />
                <Field label="Business Name" value={grantor.business_name} />
                <Field label="Established Since" value={grantor.established_since} />
                <Field label="Business Address" value={grantor.business_address} />
                <Field label="Net Income" value={grantor.net_income} />
                <Field label="Full Residential Address" value={grantor.full_residential_address} />
                <Field label="Relationship" value={grantor.relationship} />
                <Field label="Nearest Location" value={grantor.nearest_location} />
                <Field label="Verified" value={grantor.is_verified} />
              </div>
            )}

            {/* Grantor Documents */}
            {hasDocuments && (
              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                  Grantor {grantor.grantor_number} Uploaded Documents
                  {grantor.name && ` – ${grantor.name}`}
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {data.documents
                    .filter(doc => doc.person_type === `grantor${grantor.grantor_number}`)
                    .map((doc) => (
                      <DocumentCard key={doc.id} doc={doc} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Next of Kin ───────────────────────────────────────────────────── */}
      {data.nextOfKin && Object.values(data.nextOfKin).some(val => shouldDisplay(val)) && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
            Next of Kin Details
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" value={data.nextOfKin.name} />
            <Field label="CNIC Number" value={data.nextOfKin.cnic_number} />
            <Field label="Relation" value={data.nextOfKin.relation} />
            <Field label="Phone Number" value={data.nextOfKin.phone_number} />
          </div>
        </div>
      )}

      {/* ── Locations ─────────────────────────────────────────────────────── */}
      {(data.locations.length > 0 || data.verification_locations.length > 0) && (
        <div className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Location Tracking</h2>

          {/* GPS Locations */}
          {data.locations.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-xl font-semibold text-dark dark:text-white">GPS Locations</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-stroke dark:border-dark-3">
                      <th className="px-4 py-2 text-left">Label</th>
                      <th className="px-4 py-2 text-left">Latitude</th>
                      <th className="px-4 py-2 text-left">Longitude</th>
                      <th className="px-4 py-2 text-left">Accuracy</th>
                      <th className="px-4 py-2 text-left">Timestamp</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.locations.map((loc) => (
                      <tr key={loc.id} className="border-b border-stroke dark:border-dark-3">
                        <td className="px-4 py-2">{loc.label}</td>
                        <td className="px-4 py-2">{loc.latitude}</td>
                        <td className="px-4 py-2">{loc.longitude}</td>
                        <td className="px-4 py-2">{loc.accuracy ? `${loc.accuracy} meters` : '—'}</td>
                        <td className="px-4 py-2">{new Date(loc.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            View on Map
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Verification Locations with Photos */}
          {data.verification_locations.length > 0 && (
            <div>
              <h3 className="mb-3 text-xl font-semibold text-dark dark:text-white">Location Photos</h3>
              <div className="space-y-6">
                {data.verification_locations.map((loc) => (
                  <div key={loc.id} className="rounded-lg border border-stroke p-4 dark:border-dark-3">
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Location Type" value={loc.location_type} />
                      <Field label="Label" value={loc.label} />
                      <Field label="Person Type" value={loc.person_type} />
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Coordinates</label>
                        <div className="mt-1 flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3">
                          <span className="dark:text-gray-300">
                            {loc.latitude && loc.longitude ? `${loc.latitude}, ${loc.longitude}` : '—'}
                          </span>
                          {loc.latitude && loc.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-primary hover:underline ml-auto"
                            >
                              VIEW ON GOOGLE MAP
                            </a>
                          )}
                        </div>
                      </div>
                      <Field label="Address" value={loc.address} />
                      <Field label="Captured At" value={loc.created_at ? new Date(loc.created_at).toLocaleString() : null} />
                    </div>

                    {loc.photos && loc.photos.length > 0 && (
                      <div>
                        <h4 className="mb-3 font-medium text-gray-700 dark:text-gray-300">Photos</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {loc.photos.map((photo) => (
                            <LocationPhotoCard
                              key={photo.id}
                              photo={photo}
                              label={loc.label}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default VerificationDetails