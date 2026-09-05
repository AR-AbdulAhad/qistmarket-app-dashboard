"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Save, Edit3, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const toDatetimeLocal = (dateString?: string | Date | null) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => (n < 10 ? "0" + n : n);
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface StatusHistoryEdit {
  id: number;
  new_status: string;
  old_status?: string | null;
  created_at: string;
}

interface EditTimelineDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSaved: () => void;
}

export default function EditTimelineDatesModal({
  isOpen,
  onClose,
  order,
  onSaved,
}: EditTimelineDatesModalProps) {
  const [createdAt, setCreatedAt] = useState("");
  const [verificationAssignedAt, setVerificationAssignedAt] = useState("");
  const [deliveryAssignedAt, setDeliveryAssignedAt] = useState("");
  const [recoveryAssignedAt, setRecoveryAssignedAt] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [statusHistories, setStatusHistories] = useState<StatusHistoryEdit[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setCreatedAt(toDatetimeLocal(order.created_at));
      setVerificationAssignedAt(toDatetimeLocal(order.verification_assigned_at));
      setDeliveryAssignedAt(toDatetimeLocal(order.delivery_assigned_at));
      setRecoveryAssignedAt(toDatetimeLocal(order.recovery_assigned_at));
      setDeliveredAt(toDatetimeLocal(order.delivered_at));

      if (order.statusHistories && Array.isArray(order.statusHistories)) {
        setStatusHistories(
          order.statusHistories.map((h: any) => ({
            id: h.id,
            new_status: h.new_status,
            old_status: h.old_status,
            created_at: toDatetimeLocal(h.created_at),
          }))
        );
      } else {
        setStatusHistories([]);
      }
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("token");
      const payload = {
        created_at: createdAt ? new Date(createdAt).toISOString() : null,
        verification_assigned_at: verificationAssignedAt ? new Date(verificationAssignedAt).toISOString() : null,
        delivery_assigned_at: deliveryAssignedAt ? new Date(deliveryAssignedAt).toISOString() : null,
        recovery_assigned_at: recoveryAssignedAt ? new Date(recoveryAssignedAt).toISOString() : null,
        delivered_at: deliveredAt ? new Date(deliveredAt).toISOString() : null,
        status_histories: statusHistories.map((h) => ({
          id: h.id,
          created_at: h.created_at ? new Date(h.created_at).toISOString() : null,
        })),
      };

      const res = await fetch(`${API_BASE}/api/orders/${order.id}/update-timeline-dates`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Timeline dates updated successfully!");
        onSaved();
        onClose();
      } else {
        toast.error(json.message || "Failed to update timeline dates");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving timeline dates");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusHistoryDateChange = (id: number, val: string) => {
    setStatusHistories((prev) =>
      prev.map((h) => (h.id === id ? { ...h, created_at: val } : h))
    );
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark dark:text-white border border-gray-100 dark:border-gray-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Timeline Dates ({order.order_ref})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Adjust historical assignment and status transition dates for this legacy record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6 space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          
          {/* Section 1: Assignment Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-4 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                Assignment Timeline Dates
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-blue-50/30 dark:bg-blue-900/10">
                <label className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
                  Order Created Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {order.assigned_to && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                    Verification Assigned Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={verificationAssignedAt}
                    onChange={(e) => setVerificationAssignedAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {order.delivery_officer && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-green-50/30 dark:bg-green-900/10">
                  <label className="text-xs font-bold text-green-800 dark:text-green-300 block mb-1">
                    Delivery Assigned Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveryAssignedAt}
                    onChange={(e) => setDeliveryAssignedAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500"
                  />
                </div>
              )}

              {order.recovery_officer && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-orange-50/30 dark:bg-orange-900/10">
                  <label className="text-xs font-bold text-orange-800 dark:text-orange-300 block mb-1">
                    Recovery Assigned Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={recoveryAssignedAt}
                    onChange={(e) => setRecoveryAssignedAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {order.delivered_at && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-emerald-50/30 dark:bg-emerald-900/10">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Order Delivered Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveredAt}
                    onChange={(e) => setDeliveredAt(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Order Status History Timeline */}
          {statusHistories.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Edit3 className="size-4 text-purple-600" />
                <h4 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                  Order Status History Events
                </h4>
              </div>

              <div className="space-y-3">
                {statusHistories.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-meta-4/20"
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-800 dark:text-white uppercase">
                        {h.new_status.replace(/_/g, " ")}
                      </span>
                      {h.old_status && (
                        <span className="ml-2 text-[10px] text-gray-500">
                          (from {h.old_status.replace(/_/g, " ")})
                        </span>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={h.created_at}
                      onChange={(e) => handleStatusHistoryDateChange(h.id, e.target.value)}
                      className="w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/30 hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Saving..." : "Save Timeline Dates"}
          </button>
        </div>
      </div>
    </div>
  );
}
