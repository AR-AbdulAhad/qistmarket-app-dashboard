'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import Cookies from 'js-cookie'
import { cn } from '@/lib/utils'
import toast from "react-hot-toast";

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
    permanent_address: string
    utility_bill_url: string | null
    cnic_number: string
    cnic_front_url: string | null
    cnic_back_url: string | null
    telephone_number: string
    employer_name: string
    employer_address: string
    designation: string
    official_number: string | null
    service_card_url: string | null
    years_in_company: string | null
    gross_salary: string | null
    signature_url: string | null
    nearest_location: string
    is_verified: boolean
  } | null
  grantors: Array<{
    id: number
    verification_id: number
    grantor_number: number
    name: string
    father_husband_name: string
    present_address: string
    permanent_address: string
    utility_bill_url: string | null
    cnic_number: string
    cnic_front_url: string | null
    cnic_back_url: string | null
    telephone_number: string
    designation: string
    official_number: string | null
    service_card_url: string | null
    office_address: string
    company_name: string | null
    years_in_company: string | null
    monthly_income: string | null
    full_residential_address: string
    relationship: string
    signature_url: string | null
    nearest_location: string
    is_verified: boolean
  }>
  nextOfKin: {
    id: number
    verification_id: number
    name: string
    cnic_number: string
    relation: string
    phone_number: string
  } | null
  locations: Array<{
    id: number
    verification_id: number
    latitude: number
    longitude: number
    accuracy: number | null
    label: string
    timestamp: string
  }>
  verification_locations: Array<any>
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

// Reusable Document Card Component
function DocumentCard({ doc }: { doc: VerificationData['documents'][number] }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800">
      <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
        {doc.label || doc.document_type}
      </h4>

      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          Type: <span className="font-medium">{doc.document_type}</span>
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

      <a
        href={doc.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center text-sm font-medium text-[#ff3d3d] hover:underline"
      >
        View Full Size →
      </a>
    </div>
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

  if (loading) return <div className="py-20 text-center">Loading verification details...</div>
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
      <h1 className="mb-8 text-3xl font-bold text-dark dark:text-white">
        Verification Details for Order {id}
      </h1>

      {/* ── Verification Information ──────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
          Verification Information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">ID</label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {data.id}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Order ID
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {data.order_id}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Officer
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {data.verification_officer.full_name} ({data.verification_officer.username})
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {data.status}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Start Time
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {new Date(data.start_time).toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              End Time
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {data.end_time ? new Date(data.end_time).toLocaleString() : '—'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Created At
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {new Date(data.created_at).toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Updated At
            </label>
            <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
              {new Date(data.updated_at).toLocaleString()}
            </div>
          </div>
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
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Reviewer: {review.reviewer.full_name} ({review.reviewer.username})
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Approved: {review.approved ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Remarks: {review.remarks || '—'}
                  </p>
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
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
          Purchaser Details
        </h2>
        {data.purchaser ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Father/Husband Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.father_husband_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Present Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.present_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Permanent Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.permanent_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                CNIC Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.cnic_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Telephone Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.telephone_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Employer Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.employer_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Employer Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.employer_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Designation
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.designation}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Official Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.official_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Years in Company
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.years_in_company}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Gross Salary
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.gross_salary}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Nearest Location
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.nearest_location}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Verified
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.purchaser.is_verified ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Purchaser details not available</p>
        )}

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
          {data.documents.filter((doc) => doc.person_type === 'purchaser').length === 0 && (
            <p className="mt-4 text-gray-500 dark:text-gray-400 italic">
              No documents uploaded for purchaser
            </p>
          )}
        </div>
      </div>

      {/* ── Grantors ──────────────────────────────────────────────────────── */}
      {data.grantors.map((grantor) => (
        <div key={grantor.id} className="mb-16">
          <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
            Grantor {grantor.grantor_number} Details
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Father/Husband Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.father_husband_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Present Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.present_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Permanent Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.permanent_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                CNIC Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.cnic_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Telephone Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.telephone_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Designation
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.designation}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Official Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.official_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Office Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.office_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Company Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.company_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Years in Company
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.years_in_company}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Monthly Income
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.monthly_income}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Full Residential Address
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.full_residential_address}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Relationship
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.relationship}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Nearest Location
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.nearest_location}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Verified
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {grantor.is_verified ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-xl font-semibold text-indigo-700 dark:text-indigo-400">
              Grantor {grantor.grantor_number} Uploaded Documents
              {grantor.name && ` – ${grantor.name}`}
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.documents
                .filter(
                  (doc) =>
                    doc.person_type.startsWith('grantor') &&
                    Number(doc.person_type.replace('grantor', '')) === grantor.grantor_number
                )
                .map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
            </div>

            {data.documents.filter(
              (doc) =>
                doc.person_type.startsWith('grantor') &&
                Number(doc.person_type.replace('grantor', '')) === grantor.grantor_number
            ).length === 0 && (
              <p className="mt-4 text-gray-500 dark:text-gray-400 italic">
                No documents uploaded for this grantor
              </p>
            )}
          </div>
        </div>
      ))}

      {/* ── Next of Kin ───────────────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
          Next of Kin Details
        </h2>
        {data.nextOfKin ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.nextOfKin.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                CNIC Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.nextOfKin.cnic_number}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Relation
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.nextOfKin.relation}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Phone Number
              </label>
              <div className="mt-1 rounded-lg bg-gray-100 px-4 py-2.5 dark:bg-dark-3 dark:text-gray-300">
                {data.nextOfKin.phone_number}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Next of kin details not available</p>
        )}
      </div>

      {/* ── Locations ─────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">Locations</h2>
        {data.locations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No locations recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="px-4 py-2 text-left">Label</th>
                  <th className="px-4 py-2 text-left">Latitude</th>
                  <th className="px-4 py-2 text-left">Longitude</th>
                  <th className="px-4 py-2 text-left">Accuracy</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.locations.map((loc) => (
                  <tr key={loc.id} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-4 py-2">{loc.label}</td>
                    <td className="px-4 py-2">{loc.latitude}</td>
                    <td className="px-4 py-2">{loc.longitude}</td>
                    <td className="px-4 py-2">{loc.accuracy}</td>
                    <td className="px-4 py-2">{new Date(loc.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default VerificationDetails