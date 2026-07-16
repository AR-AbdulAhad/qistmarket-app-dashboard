"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import PageHeader from "@/components/Accounts/PageHeader";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const authHeaders = () => ({ Authorization: `Bearer ${Cookies.get("auth_token")}`, "Content-Type": "application/json" });

export default function AdminSecuritySettingsPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/2fa/status`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => { if (json.success) setEnabled(json.data.is_2fa_enabled); })
      .catch((err) => console.error("Failed to load 2FA status:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStatus(); }, []);

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/generate`, { method: "POST", headers: authHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to start enrollment.");
      setQrDataUrl(json.data.qrDataUrl);
      setSecret(json.data.secret);
    } catch (err: any) {
      toast.error(err.message);
      setEnrolling(false);
    }
  };

  const confirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/verify`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ totp_code: code }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Invalid code.");
      toast.success("2FA enabled successfully.");
      setEnabled(true);
      setEnrolling(false);
      setQrDataUrl(null);
      setSecret(null);
      setCode("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Disable 2FA for your account?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/disable`, { method: "POST", headers: authHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("2FA disabled.");
      setEnabled(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Breadcrumb pageName="Security Settings" />
      <PageHeader icon={ShieldCheck} title="Security Settings" subtitle="Two-factor authentication for your own account — opt-in, off by default." />

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-gray-400 dark:border-white/10 dark:bg-boxdark">Loading...</div>
      ) : (
        <div className="max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-boxdark">
          {enabled && !enrolling ? (
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><ShieldCheck className="size-5" /></div>
                <div>
                  <p className="font-bold text-dark dark:text-white">2FA is enabled</p>
                  <p className="text-sm text-gray-500">Your account requires an authenticator code at login.</p>
                </div>
              </div>
              <button onClick={handleDisable} className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10">
                <ShieldOff className="size-4" /> Disable 2FA
              </button>
            </div>
          ) : !enrolling ? (
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-white/10"><ShieldOff className="size-5" /></div>
                <div>
                  <p className="font-bold text-dark dark:text-white">2FA is off</p>
                  <p className="text-sm text-gray-500">Enable it for an extra layer of protection on this account.</p>
                </div>
              </div>
              <button onClick={startEnrollment} className="flex items-center gap-1.5 rounded-xl bg-[#ff3d3d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90">
                <KeyRound className="size-4" /> Enable 2FA
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code to confirm.</p>
              {qrDataUrl && <img src={qrDataUrl} alt="2FA QR code" className="mx-auto size-48 rounded-xl border border-stroke dark:border-dark-3" />}
              {secret && <p className="text-center font-mono text-xs text-gray-400">Manual key: {secret}</p>}
              <form onSubmit={confirmEnrollment} className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} className="flex-1 rounded-xl border border-stroke bg-white px-4 py-2.5 text-center text-lg tracking-widest outline-none transition focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
                <button type="submit" disabled={saving} className="rounded-xl bg-[#ff3d3d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-50">{saving ? "..." : "Confirm"}</button>
              </form>
              <button onClick={() => { setEnrolling(false); setQrDataUrl(null); }} className="text-xs font-semibold text-gray-400 hover:underline">Cancel</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
