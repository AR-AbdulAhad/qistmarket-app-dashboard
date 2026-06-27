"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  PackageX, Search, RefreshCw, User, DollarSign, Tag, CheckCircle2,
  Clock, AlertCircle, Phone, X, ChevronRight, History
} from "lucide-react";
import Loader from "@/components/common/Loader";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}` });

export default function OutletReturnsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Direct return flow
  const [orderQuery, setOrderQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isCash, setIsCash] = useState(false);
  const [refundAmt, setRefundAmt] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation popup
  const [confirmData, setConfirmData] = useState<any | null>(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);

  const token = useMemo(() => Cookies.get("auth_token"), []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/outlet/return-exchanges`, {
        headers: getHeaders()
      });
      if (!res.ok) { console.error('Records API error:', res.status); return; }
      const d = await res.json();
      if (d.success) setRecords(d.data);
    } catch (e) { console.error('Records fetch error:', e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Search orders
  useEffect(() => {
    if (orderQuery.length < 3) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/outlet/search-delivered-orders?query=${encodeURIComponent(orderQuery)}`, { headers: getHeaders() });
        if (!res.ok) { console.error('Search API error:', res.status, await res.text()); return; }
        const d = await res.json();
        console.log('Search raw response:', d);
        if (d.success) {
          setSearchResults(d.data || []);
        } else {
          console.error('Search API returned not success:', d);
        }
      } catch (e) { console.error('Search fetch error:', e); } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [orderQuery, token]);

  const handleSelectOrder = (o: any) => {
    setSelectedOrder(o);
    setSearchResults([]);
    setOrderQuery(o.order_ref);
    setRefundAmt("");
    setCustomerPhone(o.whatsapp_number || "");
  };

  const handleInitiateReturn = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/outlet/initiate-direct-return`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          is_cash_refund: isCash,
          refund_amount: isCash ? parseFloat(refundAmt) : 0,
          customer_phone: customerPhone || undefined,
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed");
      const recId = d.data.record_id;
      // Open confirmation popup
      setConfirmData({
        record_id: recId,
        order_ref: selectedOrder.order_ref,
        customer_name: selectedOrder.customer_name,
        product_name: selectedOrder.delivered_product_name,
        imei: selectedOrder.delivered_imei,
        advance: selectedOrder.delivered_advance,
        is_cash_refund: isCash,
        refund_amount: isCash ? parseFloat(refundAmt) : 0,
        phone: customerPhone || selectedOrder.whatsapp_number,
      });
      setSelectedOrder(null);
      setOrderQuery("");
      setIsCash(false);
      setRefundAmt("");
      setCustomerPhone("");
      setOtp(["", "", "", ""]);
      setOtpError("");
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate return");
    } finally { setSubmitting(false); }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 4) { setOtpError("Enter complete 4-digit OTP"); return; }
    setVerifying(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE}/api/outlet/verify-return-otp`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: confirmData.record_id, otp: code }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Invalid OTP");
      setConfirmData(null);
      setOtp(["", "", "", ""]);
      fetchRecords();
    } catch (e: any) {
      setOtpError(e.message || "Verification failed");
    } finally { setVerifying(false); }
  };

  const handleResendOtp = async () => {
    if (!confirmData) return;
    setResending(true);
    try {
      const phone = customerPhone || confirmData.phone || undefined;
      const res = await fetch(`${API_BASE}/api/outlet/resend-return-otp`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: confirmData.record_id, customer_phone: phone }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed to resend");
      setOtpError("");
    } catch (e: any) {
      setOtpError(e.message || "Failed to resend OTP");
    } finally { setResending(false); }
  };

  const handleClearSelection = () => {
    setSelectedOrder(null);
    setOrderQuery("");
    setSearchResults([]);
    setIsCash(false);
    setRefundAmt("");
    setCustomerPhone("");
  };

  const filteredRecords = records.filter(r =>
    r.order?.order_ref?.toLowerCase().includes(search.toLowerCase()) ||
    r.order?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.imei_returned?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRecords = filteredRecords.filter(r => r.status === "pending");
  const completedRecords = filteredRecords.filter(r => r.status === "verified");

  if (loading && records.length === 0) return <Loader text="Loading Returns..." />;

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Sales Returns" />

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <PackageX className="text-red-500" /> Sales Returns
          </h1>
          <p className="text-sm text-gray-400 mt-1">Process customer returns and restock items.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></span>
            <input type="text" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-xl text-sm outline-none focus:border-primary transition-all w-64 shadow-sm" />
          </div>
          <button onClick={fetchRecords}
            className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Returns</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{records.length}</p>
        </div>
        <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-warning">
          <p className="text-[10px] font-black uppercase tracking-widest text-warning mb-1">Pending Verification</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{pendingRecords.length}</p>
        </div>
        <div className="bg-white dark:bg-boxdark p-4 rounded-2xl border border-stroke dark:border-strokedark shadow-sm border-l-4 border-l-success">
          <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">Completed</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{completedRecords.length}</p>
        </div>
      </div>

      {/* ── NEW RETURN FORM ── */}
      <div className="bg-white dark:bg-boxdark rounded-3xl border border-stroke dark:border-strokedark p-6 md:p-8 mb-10 shadow-sm">
        <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 mb-6">
          <Search size={18} className="text-primary" /> Initiate New Return
        </h2>

        {/* Search */}
        <div className="mb-5">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            Search Delivered Order
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Order ref, customer name, or IMEI" value={orderQuery}
              onChange={e => setOrderQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-stroke dark:border-strokedark rounded-2xl focus:border-primary outline-none font-bold text-gray-800 dark:text-white transition-all" />
            {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}
          </div>

          {searchResults.length > 0 && !selectedOrder && (
            <div className="mt-2 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-2xl shadow-xl overflow-hidden">
              {searchResults.map((o: any) => (
                <button key={o.id} onClick={() => handleSelectOrder(o)}
                  className="w-full px-5 py-4 text-left hover:bg-primary/5 border-b border-stroke dark:border-strokedark last:border-none transition-colors flex items-center justify-between group">
                  <div>
                    <p className="font-black text-gray-800 dark:text-white group-hover:text-primary transition-colors">#{o.order_ref}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{o.customer_name} &bull; {o.delivered_product_name} &bull; IMEI: {o.delivered_imei}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-stroke dark:border-strokedark flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><PackageX size={22} /></div>
                <div>
                  <p className="text-sm font-black text-gray-800 dark:text-white">#{selectedOrder.order_ref}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customer_name} &bull; {selectedOrder.delivered_product_name}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">IMEI: {selectedOrder.delivered_imei}</p>
                </div>
              </div>
              <button onClick={handleClearSelection} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Change</button>
            </div>

            {/* Cash Refund? */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cash Refund?</p>
              <div className="flex gap-2">
                <button onClick={() => { setIsCash(false); setRefundAmt(""); }}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${!isCash ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>No Cash</button>
                <button onClick={() => setIsCash(true)}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${isCash ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white dark:bg-boxdark border border-stroke dark:border-strokedark text-gray-400'}`}>With Cash</button>
              </div>
            </div>

              {isCash && (
              <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 p-5 rounded-3xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white"><DollarSign size={20} /></div>
                  <div>
                    <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">Cash Refund Amount</h3>
                    <p className="text-[10px] text-red-500 font-bold uppercase">Impacts Daily Book</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">Rs.</span>
                  <input type="number" placeholder="Refund Amount" value={refundAmt} onChange={e => setRefundAmt(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800 rounded-2xl focus:border-red-500 outline-none font-black text-2xl text-red-600 transition-all shadow-inner" />
                </div>
              </div>
            )}

            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                <Phone size={12} /> Customer Phone (OTP will be sent here)
              </label>
              <input type="text" placeholder="03XXXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 border-stroke dark:border-strokedark rounded-2xl focus:border-primary outline-none font-bold text-gray-800 dark:text-white transition-all" />
            </div>

            <button onClick={handleInitiateReturn} disabled={submitting || (isCash && !refundAmt)}
              className="w-full py-5 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Processing...</span></>
              ) : (
                <><CheckCircle2 size={18} /><span>Send OTP &amp; Process Return</span></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION POPUP ── */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-boxdark rounded-3xl p-8 max-w-md w-full mx-auto shadow-2xl border border-stroke dark:border-strokedark animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                  <PackageX size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 dark:text-white">Confirm Return</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OTP Verification</p>
                </div>
              </div>
              <button onClick={() => { setConfirmData(null); setOtp(["", "", "", ""]); setOtpError(""); }}
                className="bg-gray-100 dark:bg-meta-4 text-gray-500 p-2 rounded-full hover:bg-gray-200 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6 space-y-2 border border-stroke dark:border-strokedark">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">Product</span>
                <span className="font-black text-gray-800 dark:text-white text-right">{confirmData.product_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">IMEI</span>
                <span className="font-mono text-primary font-bold text-xs">{confirmData.imei}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">Order</span>
                <span className="font-black text-gray-800 dark:text-white">#{confirmData.order_ref}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-bold">Customer</span>
                <span className="font-black text-gray-800 dark:text-white">{confirmData.customer_name}</span>
              </div>
              {confirmData.is_cash_refund && (
                <div className="flex justify-between text-sm pt-2 border-t border-stroke dark:border-strokedark">
                  <span className="text-red-500 font-black text-xs uppercase tracking-wider">Cash Refund</span>
                  <span className="font-black text-red-600 text-lg">Rs. {confirmData.refund_amount?.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone (OTP sent here)</label>
              <input type="text" value={customerPhone || confirmData.phone || ""} onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-xl focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white" />
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {otp.map((d, i) => (
                <input key={i} type="text" maxLength={1} value={d} autoFocus={i === 0}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newOtp = [...otp];
                    newOtp[i] = val;
                    setOtp(newOtp);
                    if (val && i < 3) {
                      const next = document.getElementById(`otp-${i + 1}`);
                      next?.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      const prev = document.getElementById(`otp-${i - 1}`);
                      prev?.focus();
                    }
                  }}
                  id={`otp-${i}`}
                  className="w-14 h-14 text-center text-2xl font-black bg-gray-50 dark:bg-gray-900 border-2 border-stroke dark:border-strokedark rounded-2xl focus:border-primary outline-none transition-all text-gray-800 dark:text-white" />
              ))}
            </div>

            {otpError && (
              <p className="text-xs font-black text-red-500 text-center mb-4 bg-red-50 dark:bg-red-900/10 py-2 rounded-xl">{otpError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={handleVerifyOtp} disabled={verifying || otp.join("").length !== 4}
                className="flex-1 py-4 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {verifying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={18} />}
                {verifying ? "Verifying..." : "Verify & Confirm Return"}
              </button>
            </div>

            <button onClick={handleResendOtp} disabled={resending}
              className="w-full mt-3 py-3 bg-gray-100 dark:bg-meta-4 hover:bg-gray-200 dark:hover:bg-meta-3 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              {resending ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div> : <RefreshCw size={14} />}
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {/* ── PENDING RETURNS ── */}
      <div className="mb-10">
        <h2 className="text-sm font-black uppercase tracking-widest text-warning flex items-center gap-2 mb-4 ml-1">
          <Clock size={16} /> Pending Verification ({pendingRecords.length})
        </h2>
        {pendingRecords.length === 0 ? (
          <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-10 text-center text-gray-400">
            <PackageX size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold text-sm uppercase tracking-widest">No pending returns</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRecords.map(r => (
              <div key={r.id} className="bg-white dark:bg-boxdark rounded-2xl p-5 border border-warning/30 border-l-4 border-l-warning shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-100 text-red-600">Return Request</span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-meta-4 px-2 py-1 rounded italic">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight flex items-center gap-2">
                    <User size={16} className="text-gray-400" /> {r.order?.customer_name || "N/A"}
                  </h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Ref: #{r.order?.order_ref || r.order_id}</p>
                </div>
                {r.is_cash_refund && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"><DollarSign size={14} /></div>
                      <div>
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Cash Refund</p>
                        <p className="text-sm font-black text-red-700 dark:text-red-400">Rs. {r.refund_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-meta-4/20 p-3 rounded-xl border border-stroke dark:border-strokedark mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Product</p>
                    <Tag size={10} className="text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-700 dark:text-gray-200 text-xs leading-none mb-1">{r.product_name || r.order?.product_name || "N/A"}</p>
                  {r.imei_returned && <p className="text-[9px] font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded inline-block">IMEI: {r.imei_returned}</p>}
                </div>
                <button onClick={async () => {
                  setConfirmData({
                    record_id: r.id,
                    order_ref: r.order?.order_ref,
                    customer_name: r.order?.customer_name,
                    product_name: r.product_name || r.order?.product_name,
                    imei: r.imei_returned,
                    advance: r.delivered_advance_amount,
                    is_cash_refund: r.is_cash_refund,
                    refund_amount: r.refund_amount,
                    phone: r.order?.whatsapp_number,
                  });
                  setOtp(["", "", "", ""]);
                  setOtpError("");
                  // Auto-send OTP when popup opens
                  try {
                    const phone = r.order?.whatsapp_number || undefined;
                    await fetch(`${API_BASE}/api/outlet/resend-return-otp`, {
                      method: "POST",
                      headers: { ...getHeaders(), "Content-Type": "application/json" },
                      body: JSON.stringify({ record_id: r.id, customer_phone: phone }),
                    });
                  } catch (_) {}
                }}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Verify OTP
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── COMPLETED RETURNS TABLE ── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-success flex items-center gap-2">
            <History size={16} /> Completed Returns ({completedRecords.length})
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Ready Stock</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> Used Stock</div>
          </div>
        </div>
        <div className="bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-stroke dark:border-strokedark overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
                <tr className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-4">Ref/Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Financials</th>
                  <th className="px-5 py-4">Initiated By</th>
                  <th className="px-5 py-4">Status & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {completedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">
                      <History size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="uppercase tracking-widest text-xs font-black">No completed returns.</p>
                    </td>
                  </tr>
                ) : completedRecords.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-all group">
                    <td className="px-5 py-4">
                      <p className="font-black text-gray-800 dark:text-white leading-none mb-1 group-hover:text-primary transition-colors">#{r.order?.order_ref}</p>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${r.is_used ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-success/10 text-success border border-success/20'}`}>
                        {r.is_used ? 'Used Stock' : 'Ready Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-600 dark:text-gray-300">
                      {r.order?.customer_name || "N/A"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800 dark:text-white font-black text-xs truncate max-w-[180px]">{r.product_name || r.order?.product_name}</p>
                      <p className="text-[9px] text-primary/60 font-mono tracking-tighter italic">{r.imei_returned || "No IMEI"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {r.is_cash_refund ? (
                        <div>
                          <p className="text-[10px] font-black text-red-500 leading-none mb-1">CASH REFUND</p>
                          <p className="font-black text-gray-800 dark:text-white">Rs. {r.refund_amount?.toLocaleString()}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No Refund</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.initiated_by === "Outlet" ? (
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 size={14} />
                          <p className="font-black text-[10px] uppercase tracking-widest">Direct Return</p>
                        </div>
                      ) : (
                        <p className="font-bold text-xs">{r.delivery_officer?.full_name}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <p className="text-xs font-black text-gray-700 dark:text-gray-200">
                          {r.verified_at ? new Date(r.verified_at).toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" }) : ""}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 pl-3.5 mt-0.5">
                        {r.verified_at ? new Date(r.verified_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
