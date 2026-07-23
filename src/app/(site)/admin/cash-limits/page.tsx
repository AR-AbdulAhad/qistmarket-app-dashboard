"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  Banknote, ShieldCheck, Plus, Trash2, RefreshCw, AlertTriangle,
  Building2, User, Search, ChevronDown, AlertCircle, CheckCircle2
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}`, "Content-Type": "application/json" });

export default function CashLimitsPage() {
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Form state
  const [scopeType, setScopeType] = useState<"outlet" | "officer">("officer");
  const [scopeId, setScopeId] = useState("");
  const [scopeSearch, setScopeSearch] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");

  // Officer search state
  const [officers, setOfficers] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [searchingOfficers, setSearchingOfficers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/cash/limits`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setLimits(data.data);
      else toast.error(data.message || "Failed to load limits");
    } catch {
      toast.error("Failed to load limits");
    } finally {
      setLoading(false);
    }
  };

  const searchEntities = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setOfficers([]); setOutlets([]); return; }
    setSearchingOfficers(true);
    try {
      if (scopeType === "officer") {
        const res = await fetch(`${BACKEND_URL}/api/admin-panel/users?search=${query}&role_id=2,3&limit=10`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) setOfficers(data.users || data.data || []);
      } else {
        const res = await fetch(`${BACKEND_URL}/api/admin-panel/outlets?search=${query}&limit=10`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) setOutlets(data.outlets || data.data || []);
      }
    } catch {
      // silence
    } finally {
      setSearchingOfficers(false);
    }
  }, [scopeType]);

  useEffect(() => { fetchLimits(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => searchEntities(scopeSearch), 300);
    return () => clearTimeout(timer);
  }, [scopeSearch, searchEntities]);

  const selectEntity = (entity: any) => {
    setSelectedEntity(entity);
    setScopeId(String(entity.id));
    setScopeSearch(entity.full_name || entity.name || "");
    setShowDropdown(false);
  };

  const handleAddLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeId) return toast.error("Please select a target");
    setAdding(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/cash/limits`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ scope_type: scopeType, scope_id: parseInt(scopeId), daily_limit: parseFloat(dailyLimit) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cash limit configured successfully");
        setScopeId(""); setScopeSearch(""); setDailyLimit(""); setSelectedEntity(null); setOfficers([]); setOutlets([]);
        fetchLimits();
      } else {
        toast.error(data.message || "Failed to add cash limit");
      }
    } catch {
      toast.error("Failed to add cash limit");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this cash limit?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/accounts/cash/limits/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (data.success) { toast.success("Cash limit removed"); setLimits(limits.filter(l => l.id !== id)); }
      else toast.error(data.message || "Failed to remove limit");
    } catch {
      toast.error("Failed to remove limit");
    }
  };

  const overLimitCount = limits.filter(l => l.is_over_limit).length;
  const dropdownItems = scopeType === "officer" ? officers : outlets;

  return (
    <>
      <Breadcrumb pageName="Cash Limits Management" />
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-2xl text-green-500"><Banknote size={28} /></div>
              Cash Limit Management
            </h1>
            <p className="text-sm text-gray-400 mt-2 font-bold">Set maximum allowed cash in hand for delivery &amp; recovery officers and outlets.</p>
          </div>
          <button onClick={fetchLimits} className="flex items-center gap-2 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Alert banner */}
        {overLimitCount > 0 && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              ⚠️ <strong>{overLimitCount}</strong> officer{overLimitCount > 1 ? "s are" : " is"} currently over their cash limit — immediate submission required.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Rules", value: limits.length, color: "blue", icon: <ShieldCheck size={20} /> },
            { label: "Officer Limits", value: limits.filter(l => l.scope_type === "officer").length, color: "purple", icon: <User size={20} /> },
            { label: "Outlet Limits", value: limits.filter(l => l.scope_type === "outlet").length, color: "teal", icon: <Building2 size={20} /> },
            { label: "Over Limit", value: overLimitCount, color: "red", icon: <AlertTriangle size={20} /> },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-boxdark rounded-3xl border border-stroke dark:border-strokedark p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-${s.color}-50 text-${s.color}-500`}>{s.icon}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Limit Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-[2.5rem] shadow-sm p-8 sticky top-24">
              <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" /> Set Cash Limit
              </h3>
              <form onSubmit={handleAddLimit} className="space-y-5">
                {/* Scope Type Toggle */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Apply To</label>
                  <div className="flex bg-gray-50 dark:bg-meta-4 rounded-xl p-1">
                    {(["officer", "outlet"] as const).map(type => (
                      <button key={type} type="button" onClick={() => { setScopeType(type); setScopeId(""); setScopeSearch(""); setSelectedEntity(null); setOfficers([]); setOutlets([]); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${scopeType === type ? "bg-white dark:bg-boxdark shadow-sm text-primary" : "text-gray-500 hover:text-gray-700"}`}>
                        {type === "officer" ? <User size={16} /> : <Building2 size={16} />}
                        {type === "officer" ? "Officer" : "Outlet"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Entity Search */}
                <div className="relative">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">
                    Search {scopeType === "officer" ? "Officer (Delivery/Recovery)" : "Outlet"}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={scopeSearch}
                      onChange={(e) => { setScopeSearch(e.target.value); setShowDropdown(true); setSelectedEntity(null); setScopeId(""); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder={`Type to search ${scopeType}...`}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    {searchingOfficers && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                  </div>
                  {showDropdown && dropdownItems.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-lg z-30 max-h-48 overflow-y-auto">
                      {dropdownItems.map((item: any) => (
                        <button key={item.id} type="button" onMouseDown={() => selectEntity(item)}
                          className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                            {(item.full_name || item.name || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-800 dark:text-white">{item.full_name || item.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {item.id} {item.phone ? `· ${item.phone}` : ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedEntity && (
                    <div className="mt-2 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                      <CheckCircle2 size={14} className="text-primary" />
                      <span className="text-sm font-bold text-primary">{selectedEntity.full_name || selectedEntity.name} (ID: {selectedEntity.id})</span>
                    </div>
                  )}
                </div>

                {/* Limit Amount */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Daily Cash Limit (PKR)</label>
                  <input
                    type="number" required value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <button type="submit" disabled={adding || !scopeId}
                  className="w-full bg-primary text-white rounded-xl py-3.5 text-sm font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {adding ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                  Save Limit
                </button>
              </form>
            </div>
          </div>

          {/* Limits List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-meta-4 rounded-3xl animate-pulse" />)}
              </div>
            ) : limits.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-boxdark rounded-[2.5rem] border border-stroke dark:border-strokedark">
                <Banknote size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-500">No Cash Limits Configured</p>
                <p className="text-sm text-gray-400 mt-2">Add a limit using the form to get started.</p>
              </div>
            ) : (
              limits.map((l) => (
                <div key={l.id} className={`bg-white dark:bg-boxdark rounded-3xl border-2 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${l.is_over_limit ? "border-red-300 dark:border-red-700/50 shadow-sm shadow-red-100 dark:shadow-none" : "border-stroke dark:border-strokedark"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${l.scope_type === "outlet" ? "bg-teal-50 text-teal-600" : "bg-purple-50 text-purple-600"}`}>
                      {l.scope_type === "outlet" ? <Building2 size={22} /> : <User size={22} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-gray-800 dark:text-white">{l.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-meta-4 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 dark:border-strokedark">
                          {l.scope_type === "outlet" ? "Outlet" : "Officer"} · ID {l.scope_id}
                        </span>
                        {l.is_over_limit && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                            <AlertTriangle size={10} /> Over Limit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center justify-between md:justify-end gap-6 bg-gray-50 dark:bg-meta-4 p-4 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Set Limit</p>
                      <p className="text-base font-black text-gray-800 dark:text-white">PKR {(l.daily_limit || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Pending Now</p>
                      <p className={`text-base font-black flex items-center gap-1 ${l.is_over_limit ? "text-red-500" : "text-green-500"}`}>
                        {l.is_over_limit && <AlertTriangle size={14} />}
                        PKR {(l.current_pending || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Utilization</p>
                      <div className="flex flex-col gap-1">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-meta-4 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${l.is_over_limit ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, ((l.current_pending || 0) / (l.daily_limit || 1)) * 100)}%` }}
                          />
                        </div>
                        <p className={`text-[10px] font-black ${l.is_over_limit ? "text-red-500" : "text-green-600"}`}>
                          {l.daily_limit > 0 ? Math.round(((l.current_pending || 0) / l.daily_limit) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => handleDelete(l.id)}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-500/10 rounded-2xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
