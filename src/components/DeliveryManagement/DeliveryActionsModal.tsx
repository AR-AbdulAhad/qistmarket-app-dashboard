import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface DeliveryActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number | null;
    actionType: 'deliver' | 'return' | null;
    onSuccess: () => void;
}

export const DeliveryActionsModal = ({
    isOpen,
    onClose,
    orderId,
    actionType,
    onSuccess,
}: DeliveryActionsModalProps) => {
    const [remarks, setRemarks] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!orderId || !actionType) return;

        if (actionType === 'return' && !returnReason) {
            toast.error('Please select a reason for return');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = Cookies.get('auth_token');
            const endpoint =
                actionType === 'deliver'
                    ? `${BACKEND_URL}/api/orders/${orderId}/mark-delivered`
                    : `${BACKEND_URL}/api/orders/${orderId}/mark-returned`;

            const body =
                actionType === 'deliver'
                    ? { remarks }
                    : { reason: returnReason, remarks };

            // Simulating API call if backend not ready
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Action failed');
            }

            toast.success(
                actionType === 'deliver'
                    ? 'Order marked as Delivered'
                    : 'Order marked as Returned'
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Delivery action error:', error);
            toast.error(error.message || 'Failed to update order status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
        >
            <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
                {actionType === 'deliver' ? 'Mark as Delivered' : 'Mark as Returned'}
            </h2>

            <div className="space-y-4">
                {actionType === 'return' && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reason for Return *
                        </label>
                        <select
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
                        >
                            <option value="">Select Reason</option>
                            <option value="Customer Not Available">Customer Not Available</option>
                            <option value="Refused to Accept">Refused to Accept</option>
                            <option value="Wrong Address">Wrong Address</option>
                            <option value="Damaged Item">Damaged Item</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                )}

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Remarks (Optional)
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-[#ff3d3d] dark:border-dark-3 dark:bg-dark-2"
                        rows={3}
                        placeholder="Add any additional notes..."
                    />
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded border border-stroke px-6 py-2.5 text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`rounded px-6 py-2.5 text-white disabled:opacity-50 ${actionType === 'deliver'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
