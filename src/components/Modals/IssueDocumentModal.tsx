"use client";

import { useState, useEffect, useRef } from "react";
import { hrFetch } from "@/lib/employee-api";
import { X, FileText, Mail, User, AlertTriangle } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function wrapTextAsHtml(text: string, docType: string, employeeName: string) {
  const date = new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
  return `<div style="font-family: Arial, sans-serif; padding: 20px;">
    <p style="text-align: right; color: #555;">Date: ${date}</p>
    <p>To,<br/>${employeeName}</p>
    <hr style="border: 1px solid #ccc;" />
    ${text.split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("")}
    <hr style="border: 1px solid #ccc; margin-top: 30px;" />
    <p style="font-size: 12px; color: #888;">QIST Market — Har Chez Qist Pey</p>
  </div>`;
}

interface IssueModalProps {
  open: boolean;
  onClose: () => void;
  docType: string;
  docTitle: string;
  employeeId: number;
  employeeName: string;
  onIssued: () => void;
}

export function IssueDocumentModal({ open, onClose, docType, docTitle, employeeId, employeeName, onIssued }: IssueModalProps) {
  const [mode, setMode] = useState<"default" | "custom">("default");
  const [content, setContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const prevHtmlRef = useRef("");

  useEffect(() => {
    if (!open) return;
    setMode("default");
    setShowConfirm(false);
    setPreviewLoading(true);

    hrFetch(`/document-templates/${docType}/preview/${employeeId}`)
      .then((r) => {
        setContent(r.renderedContent);
        setPlainText(stripHtml(r.renderedContent));
        prevHtmlRef.current = r.renderedContent;
        setEmployeeInfo(r.employee);
      })
      .catch(console.error)
      .finally(() => setPreviewLoading(false));
  }, [open, docType, employeeId]);

  const handleModeChange = (newMode: "default" | "custom") => {
    setMode(newMode);
    if (newMode === "custom" && content) {
      setPlainText(stripHtml(content));
    } else if (newMode === "default" && plainText && !content.includes("<")) {
      setContent(wrapTextAsHtml(plainText, docType, employeeName));
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    try {
      const finalContent = mode === "custom" ? wrapTextAsHtml(plainText, docType, employeeName) : content;
      await hrFetch("/documents/issue", {
        method: "POST",
        body: JSON.stringify({
          doc_type: docType,
          employee_id: employeeId,
          custom_content: finalContent,
          send_via_email: sendEmail,
        }),
      });
      setShowConfirm(false);
      onIssued();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to issue document");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className={`fixed inset-0 flex items-center justify-center ${showConfirm ? "bg-black/20" : "bg-black/50 backdrop-blur-sm"} z-40`}>
        <div className="mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-stroke bg-white shadow-xl dark:border-stroke-dark dark:bg-dark-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-stroke-dark">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark dark:text-white">Issue {docTitle}</h2>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="h-3 w-3" /> {employeeName}
                </p>
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
                <input type="radio" name="mode" checked={mode === "default"} onChange={() => handleModeChange("default")} className="h-4 w-4 text-primary" />
                Default (Auto-filled)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="mode" checked={mode === "custom"} onChange={() => handleModeChange("custom")} className="h-4 w-4 text-primary" />
                Custom (Editable)
              </label>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : mode === "default" ? (
              <div className="rounded-xl border border-stroke bg-white p-6 dark:border-stroke-dark dark:bg-dark-2">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            ) : (
              <textarea
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                rows={20}
                className="w-full rounded-xl border border-stroke bg-white p-4 text-sm leading-relaxed dark:border-stroke-dark dark:bg-dark-3 dark:text-gray-200"
              />
            )}
          </div>

          {/* Custom fields info & options */}
          <div className="border-t border-stroke px-6 py-3 dark:border-stroke-dark">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary" />
                <Mail className="h-4 w-4 text-gray-500" /> Send via Email
              </label>
              <div className="flex gap-3">
                <button onClick={onClose} className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-stroke-dark">
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm text-white hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" /> Issue Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleIssue}
          title="Confirm Issue Document"
          message={`Are you sure you want to issue "${docTitle}" to ${employeeName}? A PDF will be generated, the employee will be notified, and ${sendEmail ? "an email will be sent." : "no email will be sent."}`}
          confirmText={loading ? "Issuing..." : "Yes, Issue Document"}
          variant="success"
          loading={loading}
        />
      )}
    </>
  );
}
