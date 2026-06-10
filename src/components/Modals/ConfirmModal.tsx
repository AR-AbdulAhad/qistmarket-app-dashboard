"use client";

import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "success" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmText = "Confirm", cancelText = "Cancel",
  variant = "info", loading,
}: ConfirmModalProps) {
  if (!open) return null;

  const iconMap = {
    danger: <AlertTriangle className="h-6 w-6 text-red" />,
    success: <CheckCircle className="h-6 w-6 text-green" />,
    info: <Info className="h-6 w-6 text-primary" />,
  };

  const btnMap = {
    danger: "bg-red hover:bg-red/90",
    success: "bg-green hover:bg-green/90",
    info: "bg-primary hover:bg-primary/90",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-xl dark:border-stroke-dark dark:bg-dark-2">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {iconMap[variant]}
            <h3 className="text-lg font-semibold text-dark dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-2 dark:hover:bg-dark-3">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-stroke px-4 py-2 text-sm dark:border-stroke-dark dark:text-gray-300">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`rounded-lg px-4 py-2 text-sm text-white ${btnMap[variant]} disabled:opacity-50`}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
