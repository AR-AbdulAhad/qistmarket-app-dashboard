"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldOff, KeyRound, MessageSquare, PhoneCall, Save, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
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

  // OTP Channel Settings State
  const [watiEnabled, setWatiEnabled] = useState(true);
  const [jazzEnabled, setJazzEnabled] = useState(true);
  const [otpLoading, setOtpLoading] = useState(true);
  const [otpSaving, setOtpSaving] = useState(false);

  const loadStatus = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/2fa/status`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => { if (json.success) setEnabled(json.data.is_2fa_enabled); })
      .catch((err) => console.error("Failed to load 2FA status:", err))
      .finally(() => setLoading(false));
  };

  const loadOtpSettings = () => {
    setOtpLoading(true);
    fetch(`${BACKEND_URL}/api/admin-panel/settings/otp`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.settings) {
          setWatiEnabled(json.settings.wati_enabled);
          setJazzEnabled(json.settings.jazz_enabled);
        }
      })
      .catch((err) => console.error("Failed to load OTP settings:", err))
      .finally(() => setOtpLoading(false));
  };

  useEffect(() => {
    loadStatus();
    loadOtpSettings();
  }, []);

  const handleSaveOtpSettings = async () => {
    setOtpSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin-panel/settings/otp`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          wati_enabled: watiEnabled,
          jazz_enabled: jazzEnabled,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update OTP settings");
      toast.success(json.message || "OTP channel settings updated");
      if (json.settings) {
        setWatiEnabled(json.settings.wati_enabled);
        setJazzEnabled(json.settings.jazz_enabled);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save OTP settings");
    } finally {
      setOtpSaving(false);
    }
  };

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
      <PageHeader icon={ShieldCheck} title="Security & Gateway Control" subtitle="Configure account 2FA and manage global OTP dispatch channels." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Account 2FA Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-boxdark">
          <h3 className="text-lg font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-red-600" /> Account 2FA Authentication
          </h3>
          {loading ? (
            <div className="text-sm text-gray-400 py-4 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading 2FA status...</div>
          ) : enabled && !enrolling ? (
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

        {/* OTP Channel Control Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-boxdark">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-dark dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> OTP Dispatch Channels
            </h3>
            <span className="text-xs text-gray-400 font-medium">Real-time Control</span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Control which gateways dispatch OTPs across the system (Login, Stock Transfers, Verification OTPs, Ledger Access, etc.).
          </p>

          {otpLoading ? (
            <div className="text-sm text-gray-400 py-4 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading OTP channel settings...</div>
          ) : (
            <div className="space-y-5">
              {/* WATI WhatsApp Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-stroke dark:border-dark-3 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white text-sm">WATI WhatsApp OTP</p>
                    <p className="text-xs text-gray-400">Send OTPs via WATI WhatsApp gateway</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watiEnabled}
                    onChange={(e) => setWatiEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Jazz SMS Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-stroke dark:border-dark-3 bg-gray-50 dark:bg-gray-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white text-sm">Jazz CMT SMS OTP</p>
                    <p className="text-xs text-gray-400">Send OTPs via Jazz CMT SMS gateway</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jazzEnabled}
                    onChange={(e) => setJazzEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Status Badge */}
              <div className="p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2">
                {watiEnabled && jazzEnabled ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Both WATI (WhatsApp) and Jazz (SMS) gateways are ACTIVE. OTPs will be sent via BOTH channels.</span>
                  </div>
                ) : watiEnabled ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>WATI (WhatsApp) is ACTIVE. Jazz SMS is OFF.</span>
                  </div>
                ) : jazzEnabled ? (
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Jazz SMS is ACTIVE. WATI WhatsApp is OFF.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                    <span>WARNING: No OTP gateway is active! OTPs will NOT be delivered.</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveOtpSettings}
                disabled={otpSaving}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {otpSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving Settings…</>
                ) : (
                  <><Save className="w-4 h-4" /> Save OTP Channel Settings</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
