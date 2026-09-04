"use client";

import React, { useState, useEffect } from "react";
import { X, Settings2, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface ScoringConfig {
  outlet: {
    points_per_delivered_order: number;
    points_deducted_per_returned_order: number;
    points_deducted_per_cancelled_order: number;
    sales_divisor: number;
    sales_multiplier: number;
    recovery_pct_multiplier: number;
  };
  csr: {
    points_per_delivered_order: number;
    points_deducted_per_returned_order: number;
    points_deducted_per_cancelled_order: number;
    points_deducted_per_expired_order: number;
    points_per_completed_order: number;
    points_per_repeat_customer: number;
    points_per_solved_complaint?: number;
  };
  delivery: {
    points_per_delivered_order: number;
    points_deducted_per_returned_order: number;
    points_deducted_per_cancelled_order: number;
    points_deducted_per_expired_order: number;
    points_per_completed_order: number;
  };
  recovery: {
    points_per_collected_visit: number;
    points_deducted_per_returned_order: number;
    points_deducted_per_cancelled_order: number;
    points_deducted_per_expired_order: number;
    points_per_completed_order: number;
  };
  verification: {
    points_per_completed_verification: number;
    points_per_delivered_order: number;
    points_deducted_per_returned_order: number;
    points_deducted_per_cancelled_order: number;
    points_deducted_per_expired_order: number;
  };
}

interface ScoringConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ScoringConfigModal({ isOpen, onClose, onSaved }: ScoringConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"outlet" | "csr" | "delivery" | "recovery" | "verification">("outlet");
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin-panel/scoring-rules`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
      } else {
        toast.error(json.message || "Failed to load scoring rules");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error fetching scoring rules");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin-panel/scoring-rules`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Scoring rules saved successfully!");
        if (onSaved) onSaved();
      } else {
        toast.error(json.message || "Failed to save scoring rules");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving scoring rules");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin-panel/scoring-rules/recalculate`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("All rankings recalculated successfully!");
        if (onSaved) onSaved();
      } else {
        toast.error(json.message || "Failed to recalculate rankings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error triggering recalculation");
    } finally {
      setRecalculating(false);
    }
  };

  const updateVal = (section: keyof ScoringConfig, key: string, value: number) => {
    if (!config) return;
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "outlet", label: "Outlets" },
    { id: "csr", label: "CSR Officers" },
    { id: "delivery", label: "Delivery Officers" },
    { id: "recovery", label: "Recovery Officers" },
    { id: "verification", label: "Verification Officers" },
  ] as const;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark dark:text-white border border-gray-100 dark:border-gray-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings2 className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Admin Scoring Rules Handover
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure custom score addition and deduction rules for each role
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

        {/* Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        {loading || !config ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {activeTab === "outlet" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Delivered Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.outlet.points_per_delivered_order}
                    onChange={(e) => updateVal("outlet", "points_per_delivered_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Added score when an order is delivered by outlet</p>
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Returned Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.outlet.points_deducted_per_returned_order}
                    onChange={(e) => updateVal("outlet", "points_deducted_per_returned_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-rose-500/80 mt-1">Deducted from score when an order is returned</p>
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Cancelled Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.outlet.points_deducted_per_cancelled_order ?? 0}
                    onChange={(e) => updateVal("outlet", "points_deducted_per_cancelled_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-rose-500/80 mt-1">Deducted when an order is cancelled</p>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Sales Divisor (e.g. 1000)
                  </label>
                  <input
                    type="number"
                    value={config.outlet.sales_divisor ?? 1000}
                    onChange={(e) => updateVal("outlet", "sales_divisor", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Total Sales ÷ Divisor for sales points scaling</p>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Sales Multiplier
                  </label>
                  <input
                    type="number"
                    value={config.outlet.sales_multiplier ?? 1}
                    onChange={(e) => updateVal("outlet", "sales_multiplier", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Multiplier for sales points after divisor</p>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Recovery % Multiplier
                  </label>
                  <input
                    type="number"
                    value={config.outlet.recovery_pct_multiplier ?? 5}
                    onChange={(e) => updateVal("outlet", "recovery_pct_multiplier", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Multiplier applied to Recovery Percentage</p>
                </div>
              </div>
            )}

            {activeTab === "csr" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Delivered Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_per_delivered_order}
                    onChange={(e) => updateVal("csr", "points_per_delivered_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Completed/Approved Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_per_completed_order}
                    onChange={(e) => updateVal("csr", "points_per_completed_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Repeat Customer (+)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_per_repeat_customer}
                    onChange={(e) => updateVal("csr", "points_per_repeat_customer", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Solved Complaint (+)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_per_solved_complaint ?? 1}
                    onChange={(e) => updateVal("csr", "points_per_solved_complaint", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Returned Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_deducted_per_returned_order}
                    onChange={(e) => updateVal("csr", "points_deducted_per_returned_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Cancelled Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_deducted_per_cancelled_order}
                    onChange={(e) => updateVal("csr", "points_deducted_per_cancelled_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Expired Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.csr.points_deducted_per_expired_order}
                    onChange={(e) => updateVal("csr", "points_deducted_per_expired_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Delivered Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.delivery.points_per_delivered_order}
                    onChange={(e) => updateVal("delivery", "points_per_delivered_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Completed Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.delivery.points_per_completed_order ?? 5}
                    onChange={(e) => updateVal("delivery", "points_per_completed_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Returned Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.delivery.points_deducted_per_returned_order}
                    onChange={(e) => updateVal("delivery", "points_deducted_per_returned_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Cancelled Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.delivery.points_deducted_per_cancelled_order}
                    onChange={(e) => updateVal("delivery", "points_deducted_per_cancelled_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Expired Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.delivery.points_deducted_per_expired_order}
                    onChange={(e) => updateVal("delivery", "points_deducted_per_expired_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "recovery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Collected Visit (+)
                  </label>
                  <input
                    type="number"
                    value={config.recovery.points_per_collected_visit}
                    onChange={(e) => updateVal("recovery", "points_per_collected_visit", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Completed Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.recovery.points_per_completed_order ?? 5}
                    onChange={(e) => updateVal("recovery", "points_per_completed_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Returned Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.recovery.points_deducted_per_returned_order}
                    onChange={(e) => updateVal("recovery", "points_deducted_per_returned_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Cancelled Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.recovery.points_deducted_per_cancelled_order}
                    onChange={(e) => updateVal("recovery", "points_deducted_per_cancelled_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Expired Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.recovery.points_deducted_per_expired_order ?? 3}
                    onChange={(e) => updateVal("recovery", "points_deducted_per_expired_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "verification" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Completed Verification (+)
                  </label>
                  <input
                    type="number"
                    value={config.verification.points_per_completed_verification}
                    onChange={(e) => updateVal("verification", "points_per_completed_verification", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-meta-4/20">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">
                    Points Per Delivered Order (+)
                  </label>
                  <input
                    type="number"
                    value={config.verification.points_per_delivered_order}
                    onChange={(e) => updateVal("verification", "points_per_delivered_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Returned Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.verification.points_deducted_per_returned_order}
                    onChange={(e) => updateVal("verification", "points_deducted_per_returned_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Cancelled Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.verification.points_deducted_per_cancelled_order}
                    onChange={(e) => updateVal("verification", "points_deducted_per_cancelled_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="rounded-xl border border-rose-100 dark:border-rose-900/30 p-4 bg-rose-50/30 dark:bg-rose-900/10">
                  <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Points Deducted Per Expired Order (-)
                  </label>
                  <input
                    type="number"
                    value={config.verification.points_deducted_per_expired_order ?? 3}
                    onChange={(e) => updateVal("verification", "points_deducted_per_expired_order", Number(e.target.value))}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-boxdark px-3 py-2 text-sm font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating || saving || loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Recalculating..." : "Recalculate All Scores Now"}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/30 hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "Saving Rules..." : "Save Scoring Rules"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
