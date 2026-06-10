"use client";

import { useState, useEffect, useRef } from "react";
import { hrFetch } from "@/lib/employee-api";
import { X, FileText, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

function stripHtml(html: string) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/h[1-6]>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
}

function wrapTextAsHtml(text: string, docTitle: string) {
  const date = new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
  return `<div style="font-family: Arial, sans-serif; padding: 20px;">
    <p style="text-align: right; color: #555;">Date: ${date}</p>
    <hr style="border: 1px solid #ccc;" />
    ${text.split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("")}
    <hr style="border: 1px solid #ccc; margin-top: 30px;" />
    <p style="font-size: 12px; color: #888;">QIST Market — Har Chez Qist Pey</p>
  </div>`;
}

interface BulkIssueModalProps {
  open: boolean;
  onClose: () => void;
  docType: string;
  docTitle: string;
  selectedIds: number[];
  onIssued: () => void;
}

export function BulkIssueModal({ open, onClose, docType, docTitle, selectedIds, onIssued }: BulkIssueModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [result, setResult] = useState<{ issued: number; errors: number } | null>(null);
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [customContent, setCustomContent] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  useEffect(() => {
    if (!open || selectedIds.length === 0) return;
    hrFetch(`/employees`).then((r) => {
      const filtered = r.employees.filter((e: any) => selectedIds.includes(e.id));
      setEmployees(filtered);
    }).catch(console.error);
    setResult(null);
    setShowConfirm(false);
    setMode("default");
    setCustomContent("");
    // fetch template preview for one employee to show editor
    if (selectedIds.length > 0) {
      hrFetch(`/document-templates/${docType}/preview/${selectedIds[0]}`)
        .then((r) => setTemplateContent(r.renderedContent))
        .catch(() => {});
    }
  }, [open, docType, selectedIds]);

  const handleBulkIssue = async () => {
    setLoading(true);
    try {
      const body: any = { doc_type: docType, employee_ids: selectedIds, send_via_email: sendEmail };
      if (mode === "custom" && customContent) {
        body.custom_content = wrapTextAsHtml(customContent, docTitle);
      }
      const data = await hrFetch("/documents/bulk-issue", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult({ issued: data.issued, errors: data.errors });
      if (data.errors === 0) {
        onIssued();
      }
    } catch (err: any) {
      alert(err.message || "Bulk issue failed");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className={`fixed inset-0 z-40 flex items-center justify-center ${showConfirm ? "bg-black/20" : "bg-black/50 backdrop-blur-sm"}`}>
        <div className="mx-4 max-h-[90vh] w-full max-w-lg rounded-2xl border border-stroke bg-white shadow-xl dark:border-stroke-dark dark:bg-dark-2">
          <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-stroke-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark dark:text-white">Bulk Issue: {docTitle}</h2>
                <p className="text-xs text-gray-500">{selectedIds.length} employee(s) selected</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-2 dark:hover:bg-dark-3">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode selector */}
          <div className="border-b border-stroke px-6 py-3 dark:border-stroke-dark">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Content Mode:</span>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bulkMode" checked={mode === "default"} onChange={() => { setMode("default"); setCustomContent(""); }} className="h-4 w-4 text-primary" />
                Default (Auto-filled)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bulkMode" checked={mode === "custom"} onChange={() => { setMode("custom"); setCustomContent(stripHtml(templateContent)); }} className="h-4 w-4 text-primary" />
                Custom (Editable)
              </label>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto px-6 py-4">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-green/10 p-4">
                  <CheckCircle className="h-6 w-6 text-green" />
                  <div>
                    <p className="font-medium text-green">Successfully Issued</p>
                    <p className="text-sm text-gray-500">{result.issued} document(s) issued{result.errors > 0 ? `, ${result.errors} error(s)` : ""}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-full rounded-lg bg-primary py-2 text-sm text-white">Done</button>
              </div>
            ) : mode === "custom" ? (
              <textarea value={customContent} onChange={(e) => setCustomContent(e.target.value)} rows={10} className="w-full rounded-lg border border-stroke p-3 text-sm dark:border-stroke-dark dark:bg-dark-3" />
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Recipients:</p>
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 rounded-lg bg-gray-2 px-3 py-2 text-sm dark:bg-dark-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{emp.full_name}</span>
                    <span className="ml-auto text-xs text-gray-500">{emp.department || "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!result && (
            <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-stroke-dark">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded text-primary" />
                Send emails
              </label>
              <div className="flex gap-2">
                <button onClick={onClose} className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-stroke-dark">Cancel</button>
                <button onClick={() => setShowConfirm(true)} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">
                  Issue to All ({selectedIds.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleBulkIssue}
          title="Bulk Issue Confirmation"
          message={`Issue "${docTitle}" to ${selectedIds.length} employee(s)? ${sendEmail ? "Emails will be sent." : "No emails."}`}
          confirmText={loading ? "Issuing..." : "Yes, Issue All"}
          variant="info"
          loading={loading}
        />
      )}
    </>
  );
}
