"use client";
import React, { useState } from "react";
import Image from "next/image";
import logo from "@/assets/logos/logo.png";

export default function PublicComplaintPage() {
    const [formData, setFormData] = useState({
        customer_name: "",
        customer_cnic: "",
        mobile_number: "",
        description: "",
    });
    const [media, setMedia] = useState<FileList | null>(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMedia(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const data = new FormData();
            data.append("customer_name", formData.customer_name);
            data.append("customer_cnic", formData.customer_cnic);
            data.append("mobile_number", formData.mobile_number);
            data.append("description", formData.description);

            if (media) {
                for (let i = 0; i < media.length; i++) {
                    data.append("media", media[i]);
                }
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/complaints/public`, {
                method: "POST",
                body: data,
            });

            const result = await res.json();
            if (result.success) {
                setSuccessMessage(`Complaint registered successfully. Your Tracking ID is ${result.data?.complaint?.complaint_id}`);
                setFormData({
                    customer_name: "",
                    customer_cnic: "",
                    mobile_number: "",
                    description: "",
                });
                setMedia(null);
                const fileInput = document.getElementById("media") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
            } else {
                setErrorMessage(result.message || result.error?.message || "Failed to submit complaint.");
            }
        } catch (error) {
            setErrorMessage("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-primary p-6 text-center">
                    <Image src={logo} alt="Qistmarket Logo" width={200} height={50} className="mx-auto mb-4 brightness-0 invert" />
                    <h2 className="text-2xl font-bold text-white">Register a Complaint</h2>
                    <p className="text-primary-foreground/80 mt-2 text-white">We are here to help you.</p>
                </div>

                <div className="p-8">
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                            {successMessage}
                        </div>
                    )}
                    
                    {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    required
                                    value={formData.customer_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    placeholder="e.g. Ali Raza"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC (Optional)</label>
                                <input
                                    type="text"
                                    name="customer_cnic"
                                    value={formData.customer_cnic}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    placeholder="42101-1234567-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                            <input
                                type="text"
                                name="mobile_number"
                                required
                                value={formData.mobile_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="03XXXXXXXXX"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none"
                                placeholder="Please describe your issue in detail..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
                            <input
                                type="file"
                                id="media"
                                name="media"
                                multiple
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <p className="mt-1 text-xs text-gray-500">You can upload up to 5 images/files.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Complaint"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
