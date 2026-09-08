import { useEffect, useState } from 'react';

interface MediaReplaceModalProps {
    open: boolean;
    onClose: () => void;
    file: File | null;
    onConfirm: (editedFile: File) => Promise<void>;
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
    title = "Preview & Edit Media",
    description = "Crop, zoom, rotate, or flip your image below, then click confirm to replace."
}: MediaReplaceModalProps) {
    const [preview, setPreview] = useState<string | null>(null)

    // Image editing states
    const [zoom, setZoom] = useState<number>(1)
    const [rotation, setRotation] = useState<number>(0)
    const [flipH, setFlipH] = useState<boolean>(false)
    const [flipV, setFlipV] = useState<boolean>(false)
    const [offsetX, setOffsetX] = useState<number>(0)
    const [offsetY, setOffsetY] = useState<number>(0)

    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

    // The crop viewport used to be a fixed 280x210 (4:3 landscape) box with a
    // fixed 800x600 output canvas — any non-4:3 photo (e.g. a portrait selfie)
    // got squeezed to fit that shape, cutting off real content even at the
    // default zoom. The viewport now matches each photo's own aspect ratio
    // (capped to a max box) so at zoom=1 the whole image shows with nothing
    // cropped; zooming/panning crops only what the user deliberately chooses.
    const MAX_VIEWPORT_W = 320
    const MAX_VIEWPORT_H = 320
    const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: MAX_VIEWPORT_W, height: MAX_VIEWPORT_W * 0.75 })

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            handleReset()

            const img = new Image()
            img.onload = () => {
                const aspect = img.naturalWidth / img.naturalHeight
                let width = MAX_VIEWPORT_W
                let height = width / aspect
                if (height > MAX_VIEWPORT_H) {
                    height = MAX_VIEWPORT_H
                    width = height * aspect
                }
                setViewport({ width, height })
            }
            img.src = objectUrl

            return () => URL.revokeObjectURL(objectUrl)
        } else {
            setPreview(null)
        }
    }, [file])

    const handleReset = () => {
        setZoom(1)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
        setOffsetX(0)
        setOffsetY(0)
    }

    // Drag-to-pan handlers (Mouse)
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffsetX(e.clientX - dragStart.x);
        setOffsetY(e.clientY - dragStart.y);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Drag-to-pan handlers (Touch)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - offsetX, y: e.touches[0].clientY - offsetY });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        setOffsetX(e.touches[0].clientX - dragStart.x);
        setOffsetY(e.touches[0].clientY - dragStart.y);
    };

    // Generates the final edited image file using HTML5 canvas
    const getEditedFile = (): Promise<File | null> => {
        return new Promise((resolve) => {
            if (!file || !preview) {
                resolve(null);
                return;
            }

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Output canvas keeps the same aspect ratio as the viewport
                // (which itself matches the source photo at zoom=1 — see the
                // viewport-sizing effect above), scaled up to a decent
                // resolution instead of forcing a fixed 800x600 landscape
                // frame that cropped non-4:3 photos.
                const scaleFactor = 1000 / Math.max(viewport.width, viewport.height);
                const cropWidth = Math.round(viewport.width * scaleFactor);
                const cropHeight = Math.round(viewport.height * scaleFactor);
                canvas.width = cropWidth;
                canvas.height = cropHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }

                // White canvas background
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, cropWidth, cropHeight);

                ctx.save();
                // Move origin to canvas center
                ctx.translate(cropWidth / 2, cropHeight / 2);

                // Apply flip and rotation around the center
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

                // Translate panned offsets scaled to canvas dimensions
                ctx.translate(offsetX * scaleFactor, offsetY * scaleFactor);

                // Centered aspect-ratio calculation — with the viewport now
                // matching the image's own aspect, this fills the frame
                // exactly (initWidth === viewport.width, initHeight ===
                // viewport.height) at zoom=1, so nothing is cropped unless
                // the user deliberately zooms/pans.
                const imgAspect = img.width / img.height;
                const viewAspect = viewport.width / viewport.height;
                let initWidth, initHeight;
                if (imgAspect > viewAspect) {
                    initWidth = viewport.width;
                    initHeight = viewport.width / imgAspect;
                } else {
                    initWidth = viewport.height * imgAspect;
                    initHeight = viewport.height;
                }

                const drawWidth = initWidth * scaleFactor * zoom;
                const drawHeight = initHeight * scaleFactor * zoom;

                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                ctx.restore();

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
                        resolve(newFile);
                    } else {
                        resolve(null);
                    }
                }, file.type || 'image/jpeg', 0.95);
            };
            img.src = preview;
        });
    };

    const handleConfirm = async () => {
        if (!file) return;
        const editedFile = await getEditedFile();
        if (editedFile) {
            await onConfirm(editedFile);
        } else {
            await onConfirm(file); // fallback to original file if canvas fails
        }
    };

    if (!open || !file) return null

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
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

                {/* ────────────────────────────────────────────────
                    Interactive Image Crop/Pan & Zoom Viewport
                ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-center">
                    {/* Viewport: acts as crop frame — sized to the photo's own aspect ratio so it shows fully by default */}
                    <div className="relative overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-900 shadow-inner flex items-center justify-center cursor-move select-none"
                         style={{ width: viewport.width, height: viewport.height }}
                         onMouseDown={handleMouseDown}
                         onMouseMove={handleMouseMove}
                         onMouseUp={handleMouseUp}
                         onMouseLeave={handleMouseUp}
                         onTouchStart={handleTouchStart}
                         onTouchMove={handleTouchMove}
                         onTouchEnd={handleMouseUp}
                    >
                        {preview ? (
                            <img
                                src={preview}
                                alt="Crop Preview"
                                className="pointer-events-none select-none max-w-none origin-center"
                                style={{
                                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 text-center">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>No image selected</span>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-[9px] text-white px-2 py-0.5 rounded font-medium pointer-events-none uppercase tracking-wider">
                            Drag to pan
                        </div>
                    </div>

                    {/* Editor Control Panel */}
                    <div className="flex flex-col gap-4 w-full max-w-[200px]">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Zoom ({zoom.toFixed(1)}x)</label>
                            <input 
                                type="range" 
                                min="1" 
                                max="3" 
                                step="0.1" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-primary bg-gray-200 dark:bg-gray-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button" 
                                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary transition-all text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                                title="Rotate 90° Clockwise"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-wider">Rotate</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setFlipH((prev) => !prev)}
                                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary transition-all text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                                title="Flip Horizontal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-wider">Flip H</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setFlipV((prev) => !prev)}
                                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary transition-all text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                                title="Flip Vertical"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8v12m0 0l-4-4m4 4l4-4m6 0V4m0 0l4 4m-4-4l-4 4" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-wider">Flip V</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={handleReset}
                                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-500/5 dark:border-gray-700 dark:hover:border-red-500 transition-all text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-500"
                                title="Reset Controls"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3m0 0l3-3m-3 3V8" />
                                </svg>
                                <span className="text-[9px] font-black uppercase tracking-wider">Reset</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleConfirm}
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
