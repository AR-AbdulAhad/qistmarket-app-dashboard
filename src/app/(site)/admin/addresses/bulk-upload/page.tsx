'use client';

import React, { useState } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const BulkUploadPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error("Please upload a CSV file");
                return;
            }
            setFile(selectedFile);
            parseCSVPreview(selectedFile);
        }
    };

    const parseCSVPreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const rows = lines.slice(1, 6).map(line => {
                const [city, zone, area] = line.split(',').map(s => s.trim());
                return { city, zone, area };
            });
            setPreview(rows);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim());

                // Skip header row
                const data = lines.slice(1).map(line => {
                    const [city, zone, area] = line.split(',').map(s => s.trim());
                    return { city, zone, area };
                }).filter(row => row.city && row.zone && row.area);

                const token = Cookies.get("auth_token");
                const resp = await fetch(`${BACKEND_URL}/api/address/bulk-upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ data })
                });

                const result = await resp.json();
                if (result.success) {
                    toast.success(result.message || "Upload successful");
                    setFile(null);
                    setPreview([]);
                } else {
                    toast.error(result.error || "Upload failed");
                }
            };
            reader.readAsText(file);
        } catch (err) {
            toast.error("Error processing file");
        } finally {
            setUploading(false);
        }
    };

    const downloadSampleCSV = () => {
        const content = "cityName,zoneName,areaName\nKarachi,Central,Gulshan-e-Iqbal\nKarachi,South,Saddar\nLahore,Model Town,Garden Town";
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'address_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="mx-auto max-w-7xl">
            <Breadcrumb pageName="Bulk Address Upload" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Upload Area */}
                <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Upload CSV</h3>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                        Upload a CSV file with three columns: <span className="text-red-600 font-bold">cityName</span>, <span className="text-red-600 font-bold">zoneName</span>, and <span className="text-red-600 font-bold">areaName</span>.
                    </p>

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 transition hover:border-red-500 cursor-pointer bg-gray-50 dark:bg-gray-800/50 mb-8 group"
                        onClick={() => document.getElementById('csv-upload')?.click()}>
                        <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <FileText className="w-16 h-16 text-red-600 animate-bounce" />
                                <div>
                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{file.name}</p>
                                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-5 bg-white dark:bg-gray-700 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-red-600 transition-colors" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 font-bold">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-400 font-medium">CSV files only (max. 10MB)</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-4 rounded-xl hover:bg-red-700 transition font-bold disabled:opacity-50 shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Process CSV</>}
                        </button>

                        <button
                            onClick={downloadSampleCSV}
                            className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-bold text-gray-600 dark:text-gray-300"
                        >
                            <Download className="w-5 h-5" />
                            Download Sample Template
                        </button>
                    </div>
                </div>

                {/* Right Side: Instructions & Preview */}
                <div className="space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-400">
                            <AlertCircle className="w-6 h-6" />
                            <h4 className="text-xl font-bold">Important Instructions</h4>
                        </div>
                        <ul className="space-y-3 text-blue-800/80 dark:text-blue-300/80 font-medium">
                            <li className="flex gap-2"><span>1.</span> The first row should be the header (City Name, Zone Name, Area Name).</li>
                            <li className="flex gap-2"><span>2.</span> Each row must contain all three values.</li>
                            <li className="flex gap-2"><span>3.</span> The system automatically creates Cities and Zones if they don't exist.</li>
                            <li className="flex gap-2"><span>4.</span> Duplicate areas for the same zone will be skipped.</li>
                        </ul>
                    </div>

                    {file && preview.length > 0 && (
                        <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-sm p-8 animate-in fade-in slide-in-from-bottom duration-500">
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6">File Preview (First 5 Rows)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                                            <th className="py-3 px-2">City</th>
                                            <th className="py-3 px-2">Zone</th>
                                            <th className="py-3 px-2">Area</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {preview.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="py-3 px-2 text-gray-700 dark:text-gray-200 font-medium">{row.city}</td>
                                                <td className="py-3 px-2 text-gray-700 dark:text-gray-200 font-medium">{row.zone}</td>
                                                <td className="py-3 px-2 text-gray-700 dark:text-gray-200 font-medium">{row.area}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadPage;
