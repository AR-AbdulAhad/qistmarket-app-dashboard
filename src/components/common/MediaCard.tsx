import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { MediaReplaceModal } from './MediaReplaceModal';
import { cn } from '@/lib/utils';

const formatDateTimeUTC = (value?: string): string => {
    if (!value) return "Not set";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("MMM D, YYYY h:mm A") : value;
};

interface MediaCardProps {
    id: number;
    title: string;
    subtitle?: string;
    fileUrl: string;
    uploadedAt: string;
    isEditable?: boolean;
    onEdit?: (file: File) => Promise<void>;
    editHistory?: any[];
    historyFilter?: (history: any) => boolean;
}

export function MediaCard({
    id,
    title,
    subtitle,
    fileUrl,
    uploadedAt,
    isEditable = false,
    onEdit,
    editHistory = [],
    historyFilter
}: MediaCardProps) {
    const [isFullSizeModalOpen, setIsFullSizeModalOpen] = useState(false)
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const filteredHistory = historyFilter 
        ? editHistory.filter(historyFilter)
        : [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSelectedFile(file)
        setIsReplaceModalOpen(true)
        e.target.value = ''
    }

    const handleConfirmUpload = async (editedFile: File) => {
        if (!editedFile || !onEdit) return
        setIsUploading(true)
        try {
            await onEdit(editedFile)
            setIsReplaceModalOpen(false)
            setSelectedFile(null)
        } catch (err) {
            console.error(err)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <div
                className="group relative overflow-hidden rounded-lg border border-stroke bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-800"
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                            {title}
                        </h4>
                        {filteredHistory.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="mt-0.5 text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                                <span className="flex items-center gap-1">
                                    📋 {filteredHistory.length} edit{filteredHistory.length > 1 ? 's' : ''}
                                </span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {isEditable && onEdit && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 dark:hover:bg-primary transition-colors text-gray-500 dark:text-gray-400 shadow-sm"
                                title="Replace Media"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        <button
                            onClick={() => setIsFullSizeModalOpen(true)}
                            className="p-1.5 rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white dark:bg-gray-700 dark:hover:bg-blue-600 transition-colors text-gray-500 dark:text-gray-400 shadow-sm"
                            title="View Full Size"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {subtitle && <p><span className="font-medium capitalize">{subtitle}</span></p>}
                    <p>Uploaded: <span className="font-medium">{formatDateTimeUTC(uploadedAt)}</span></p>
                </div>
                <div
                    className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 cursor-pointer"
                    onClick={() => setIsFullSizeModalOpen(true)}
                >
                    <img
                        src={fileUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <div
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline cursor-pointer"
                    onClick={() => setIsFullSizeModalOpen(true)}
                >
                    View Full Size →
                </div>

                {/* History Popup */}
                {showHistory && filteredHistory.length > 0 && (
                    <div className="absolute z-20 mt-1 right-2 left-2 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 animate-in fade-in zoom-in duration-200 ring-1 ring-black/5">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-1.5">
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Edit History</span>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-red-500">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                            {filteredHistory.map((history: any) => (
                                <div key={history.id} className="text-[10px] border-b border-gray-50 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between text-gray-500 mb-1.5">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{history.edited_by_name}</span>
                                        <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{formatDateTimeUTC(history.edited_at)}</span>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <span className="text-gray-400 block mb-1 text-[9px] uppercase tracking-wider font-semibold">Previous</span>
                                            {history.old_value ? (
                                                <a href={history.old_value} target="_blank" rel="noreferrer" className="group/old block relative aspect-video rounded overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors bg-gray-50 dark:bg-dark-3">
                                                    <img src={history.old_value} alt="Old" className="h-full w-full object-cover opacity-50 grayscale transition-all group-hover/old:opacity-80 group-hover/old:grayscale-0" />
                                                </a>
                                            ) : (
                                                <div className="aspect-video rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-dark-3 flex items-center justify-center text-gray-400 italic">
                                                    Initial upload
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-5 text-gray-400">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-gray-400 block mb-1 text-[9px] uppercase tracking-wider font-semibold text-blue-500">Replaced With</span>
                                            <a href={history.new_value} target="_blank" rel="noreferrer" className="group/new block relative aspect-video rounded overflow-hidden border border-blue-200 dark:border-blue-700 hover:border-blue-400 transition-colors bg-gray-50 dark:bg-dark-3 shadow-sm">
                                                <img src={history.new_value} alt="New" className="h-full w-full object-cover transition-transform group-hover/new:scale-110" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Full Size View Modal */}
            {isFullSizeModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setIsFullSizeModalOpen(false)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsFullSizeModalOpen(false)}
                            className="sticky top-2 right-2 z-10 float-right rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-70 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-4 border-b dark:border-dark-3 clear-both">
                            <h3 className="text-xl font-bold dark:text-white">{title}</h3>
                            {subtitle && <p className="text-sm text-gray-500 capitalize">{subtitle}</p>}
                        </div>

                        <div className="p-4 flex items-center justify-center bg-gray-50 dark:bg-dark-2">
                            <img
                                src={fileUrl}
                                alt="Full size"
                                className="max-w-full max-h-[75vh] w-auto h-auto object-contain shadow-lg rounded"
                            />
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-dark-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>Uploaded: {formatDateTimeUTC(uploadedAt)}</div>
                        </div>
                    </div>
                </div>
            )}

            <MediaReplaceModal 
                open={isReplaceModalOpen}
                onClose={() => setIsReplaceModalOpen(false)}
                file={selectedFile}
                onConfirm={handleConfirmUpload}
                isUploading={isUploading}
                title={`Replace ${title}`}
            />
        </>
    );
}
