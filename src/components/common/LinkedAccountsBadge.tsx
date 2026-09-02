"use client";

import React, { useState, useEffect } from "react";
import { Link2, X, Copy, Check, ExternalLink } from "lucide-react";
import Cookies from "js-cookie";

interface LinkedOrder {
  id: number;
  order_ref: string;
  role?: string;
  status?: string;
  created_at?: string;
}

interface LinkedAccountsBadgeProps {
  cnic?: string;
  orders?: LinkedOrder[];
  currentOrderId?: number;
  className?: string;
  compact?: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function LinkedAccountsBadge({
  cnic,
  orders: initialOrders,
  currentOrderId,
  className = "",
  compact = false,
}: LinkedAccountsBadgeProps) {
  const [orders, setOrders] = useState<LinkedOrder[]>(initialOrders || []);
  const [loading, setLoading] = useState<boolean>(!initialOrders && !!cnic);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
      return;
    }

    if (!cnic || !cnic.trim()) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchLinkedOrders = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("auth_token");
        const res = await fetch(`${BACKEND_URL}/api/check-cnic`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cnic: cnic.trim() }),
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.results)) {
          setOrders(data.results);
        }
      } catch (err) {
        console.error("Error fetching linked orders for CNIC:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLinkedOrders();
    return () => {
      isMounted = false;
    };
  }, [cnic, initialOrders]);

  const otherOrders = orders.filter((o) => Number(o.id) !== Number(currentOrderId));

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-meta-4 text-gray-400 text-xs animate-pulse ${className}`}>
        <Link2 size={12} className="animate-spin" />
        Checking linked...
      </span>
    );
  }

  if (otherOrders.length === 0) return null;

  const handleCopy = (refText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(refText);
    setCopiedId(refText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    }
    if (s === "expired") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
    if (s === "returned" || s === "cancelled" || s === "rejected") {
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    if (s === "approved" || s === "verifying" || s === "in_verification" || s === "active") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800";
    }
    return "bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-300 border-gray-200 dark:border-strokedark";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Pill Badge Trigger - Matches Mobile App exact style */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 shadow-xs text-xs font-extrabold tracking-tight transition-all cursor-pointer ${className}`}
        title="Click to view linked accounts"
      >
        <Link2 size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Linked: {otherOrders.length}</span>
      </button>

      {/* Linked Accounts Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-stroke dark:border-strokedark overflow-hidden z-10 animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20">
              <div>
                <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Link2 size={18} className="text-amber-600 dark:text-amber-400" />
                  Linked Accounts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  This CNIC also appears on these orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-meta-4 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {otherOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-meta-4/30 border border-stroke dark:border-strokedark hover:border-amber-300 dark:hover:border-amber-600/50 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-red-600 dark:text-red-400 tracking-tight font-mono">
                        {o.order_ref}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(o.order_ref, e)}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors cursor-pointer"
                        title="Copy Order Ref"
                      >
                        {copiedId === o.order_ref ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                      Role: <span className="text-gray-700 dark:text-gray-200 font-extrabold">{o.role || "PURCHASER"}</span>
                    </p>
                    {o.created_at && (
                      <p className="text-[10px] text-gray-400 font-medium">
                        {formatDate(o.created_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadgeClass(
                        o.status
                      )}`}
                    >
                      {o.status || "PENDING"}
                    </span>
                    <a
                      href={`/orders/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white dark:bg-boxdark text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white border border-stroke dark:border-strokedark shadow-xs transition-colors"
                      title="View Order Details"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-200 dark:bg-meta-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-opacity-80 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
