import { Modal } from "@/components/Modal/Modal";
import { useState } from "react";
import { AccountDeletionRequest } from "@/types/account-deletion";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: AccountDeletionRequest | null;
    onReview: (requestId: number, action: 'approve' | 'reject', remarks?: string) => Promise<void>;
}

export function ReviewModal({ isOpen, onClose, request, onReview }: ReviewModalProps) {
    const [remarks, setRemarks] = useState("");
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!request) return null;

    const handleSubmit = async () => {
        if (!action) return;

        setIsSubmitting(true);
        try {
            await onReview(request.id, action, remarks);
            onClose();
            setRemarks("");
            setAction(null);
        } catch (error) {
            console.error("Failed to review request", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={isOpen} onClose={onClose}>
            <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
                <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Review Deletion Request
                </h3>

                <div className="mb-4">
                    <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                        <strong>User:</strong> {request.user?.full_name} ({request.user?.username})
                    </p>
                    <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                        <strong>Reason:</strong> {request.reason || "No reason provided"}
                    </p>
                    <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                        <strong>Requested At:</strong> {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Decision
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="action"
                                value="approve"
                                checked={action === 'approve'}
                                onChange={() => setAction('approve')}
                                className="cursor-pointer"
                            />
                            <span className="text-black dark:text-white">Approve</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="action"
                                value="reject"
                                checked={action === 'reject'}
                                onChange={() => setAction('reject')}
                                className="cursor-pointer"
                            />
                            <span className="text-black dark:text-white">Reject</span>
                        </label>
                    </div>
                </div>

                {action && (
                    <div className="mb-6">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Remarks {action === 'reject' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            rows={3}
                            placeholder={action === 'approve' ? "Optional remarks" : "Reason for rejection"}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="flex justify-center rounded-lg border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!action || (action === 'reject' && !remarks.trim()) || isSubmitting}
                        className="flex justify-center rounded-lg bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span>Processing...</span>
                        ) : (
                            <span>Confirm Review</span>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
