import { useEffect, useState } from 'react';

interface MediaReplaceModalProps {
    open: boolean;
    onClose: () => void;
    file: File | null;
    onConfirm: () => Promise<void>;
    isUploading: boolean;
    title?: string;
    description?: string;
}

export function MediaReplaceModal({
    open,
    onClose,
    file,
    onConfirm,
    isUploading,
    title = "Preview New Media",
    description = "You are about to replace the existing media with the one shown below. Please confirm if this is correct."
}: MediaReplaceModalProps) {
    const [preview, setPreview] = useState<string | null>(null)

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            return () => URL.revokeObjectURL(objectUrl)
        } else {
            setPreview(null)
        }
    }, [file])

    if (!open || !file) return null

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-dark dark:text-white">{title}</h3>
                    <button onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>

                <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-3 flex items-center justify-center">
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                        <div className="text-gray-400 text-center">
                            <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>No image selected</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onConfirm}
                        disabled={isUploading}
                        className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-md transition-all hover:bg-primary/90 disabled:bg-gray-400"
                    >
                        {isUploading ? (
                            <>
                                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                Uploading...
                            </>
                        ) : (
                            'Confirm & Replace'
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="flex-1 rounded-lg border border-stroke bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200 dark:border-dark-3 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
