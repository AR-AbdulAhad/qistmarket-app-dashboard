"use client";
import React, { useState } from "react";
import Image from "next/image";
import logo from "@/assets/logos/logo.png";
import {
  FileText,
  Search,
  Upload,
  X,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  Building2,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface SelectedFile {
  file: File;
  id: string;
  previewUrl: string | null;
}

interface ComplaintRecord {
  id: number;
  complaint_id: string;
  customer_name: string;
  customer_cnic?: string;
  mobile_number: string;
  description: string;
  status: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function PublicComplaintPage() {
  const [activeTab, setActiveTab] = useState<"register" | "track">("register");

  // Registration Form State
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_cnic: "",
    mobile_number: "",
    description: "",
  });
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastComplaintId, setLastComplaintId] = useState("");

  // Search/Track State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ComplaintRecord[] | null>(null);
  const [searchError, setSearchError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedList = Array.from(e.target.files);
      const updated = [...files];

      for (const file of selectedList) {
        if (updated.length >= 5) {
          setErrorMessage("Maximum 5 files can be attached.");
          break;
        }
        const isImage = file.type.startsWith("image/");
        updated.push({
          file,
          id: Math.random().toString(36).substring(2, 9),
          previewUrl: isImage ? URL.createObjectURL(file) : null,
        });
      }
      setFiles(updated);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
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

      files.forEach((item) => {
        data.append("media", item.file);
      });

      const res = await fetch(`${API_BASE}/api/complaints/public`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        const ticketId = result.data?.complaint?.complaint_id || "";
        setLastComplaintId(ticketId);
        setSuccessMessage(`Complaint registered successfully! Your Tracking ID is ${ticketId}`);
        setFormData({
          customer_name: "",
          customer_cnic: "",
          mobile_number: "",
          description: "",
        });
        files.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setFiles([]);
        const fileInput = document.getElementById("media") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setErrorMessage(result.message || result.error?.message || "Failed to submit complaint.");
      }
    } catch (error) {
      setErrorMessage("An error occurred while submitting your complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const performSearchQuery = async (queryTerm: string) => {
    if (!queryTerm || !queryTerm.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/complaints/public/search?query=${encodeURIComponent(queryTerm.trim())}`
      );
      const result = await res.json();

      if (result.success) {
        setSearchResults(result.data || []);
        if (!result.data || result.data.length === 0) {
          setSearchError("No complaints found for this CNIC, Mobile Number, or Complaint ID.");
        }
      } else {
        setSearchError(result.message || "Failed to search complaint status.");
      }
    } catch (error) {
      setSearchError("Error connecting to server. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const query = params.get("query");
      const name = params.get("customer_name") || params.get("name");
      const cnic = params.get("customer_cnic") || params.get("cnic");
      const phone = params.get("mobile_number") || params.get("phone");

      if (name || cnic || phone) {
        setFormData((prev) => ({
          ...prev,
          customer_name: name || prev.customer_name,
          customer_cnic: cnic || prev.customer_cnic,
          mobile_number: phone || prev.mobile_number,
        }));
      }

      if (tab === "track" || query) {
        setActiveTab("track");
        if (query) {
          setSearchQuery(query);
          performSearchQuery(query);
        }
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearchQuery(searchQuery);
  };

  const handleWhatsAppRedirect = () => {
    const whatsappNum = "923404444660";
    const text = encodeURIComponent("Assalam-o-Alaikum, Qist Market Support, I need assistance with a complaint.");
    window.open(`https://api.whatsapp.com/send?phone=${whatsappNum}&text=${text}`, "_blank");
  };

  const getStatusStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "new") return { label: "Under Review", bg: "bg-amber-50 text-amber-700 border-amber-200", step: 1 };
    if (s === "assigned" || s === "in progress") return { label: "In Progress", bg: "bg-blue-50 text-blue-700 border-blue-200", step: 2 };
    if (s === "resolved" || s === "solved") return { label: "Resolved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 4 };
    if (s === "rejected") return { label: "Rejected", bg: "bg-rose-50 text-rose-700 border-rose-200", step: 4 };
    return { label: status || "Pending", bg: "bg-gray-50 text-gray-700 border-gray-200", step: 1 };
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-6 sm:p-8 shadow-xl text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <Image src={logo} alt="Qist Market Logo" width={220} height={60} className="mx-auto mb-4 brightness-0 invert drop-shadow" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Customer Support & Complaints</h1>
          <p className="text-red-100 text-xs sm:text-sm mt-1 max-w-xl mx-auto font-medium">
            Register a new complaint or track your complaint status in real-time.
          </p>

          {/* Navigation Tabs */}
          <div className="mt-6 inline-flex p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "register"
                  ? "bg-white text-red-600 shadow-md scale-105"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              <FileText className="size-4" /> Register Complaint
            </button>
            <button
              onClick={() => setActiveTab("track")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "track"
                  ? "bg-white text-red-600 shadow-md scale-105"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`}
            >
              <Search className="size-4" /> Track Status
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Register Form OR Track Complaint */}
          <div className="lg:col-span-8 space-y-6">

            {activeTab === "register" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="size-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Register a Complaint</h2>
                    <p className="text-xs text-slate-400 font-medium">Fill in your details below. We are here to assist you.</p>
                  </div>
                </div>

                {successMessage && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-black text-sm">
                      <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                      {successMessage}
                    </div>
                    {lastComplaintId && (
                      <button
                        onClick={() => {
                          setSearchQuery(lastComplaintId);
                          setActiveTab("track");
                        }}
                        className="self-start mt-1 text-xs font-bold text-emerald-700 underline flex items-center gap-1 hover:text-emerald-900"
                      >
                        Track your complaint now <ChevronRight className="size-3" />
                      </button>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold">
                    <AlertCircle className="size-5 text-rose-600 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        required
                        value={formData.customer_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        placeholder="e.g. Ali Raza"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        CNIC (Optional)
                      </label>
                      <input
                        type="text"
                        name="customer_cnic"
                        value={formData.customer_cnic}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        placeholder="42101-1234567-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mobile_number"
                      required
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      placeholder="03XXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Complaint Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                      placeholder="Please describe your issue in detail..."
                    />
                  </div>

                  {/* Attachment Section with Card Previews */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Attachments (Optional)
                      </label>
                      <span className="text-[10px] font-bold text-slate-400">
                        {files.length} of 5 selected
                      </span>
                    </div>

                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center">
                      <input
                        type="file"
                        id="media"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={files.length >= 5}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <Upload className="size-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">Click or drag files here to upload</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Images, PDFs or Documents up to 5MB (Max 5 files)</p>
                    </div>

                    {/* Card-style Uploaded Files Preview Grid */}
                    {files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                        {files.map((item) => (
                          <div
                            key={item.id}
                            className="relative group rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm flex flex-col items-center justify-between"
                          >
                            {/* Cross / Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item.id)}
                              className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-transform active:scale-95 z-10"
                              title="Remove File"
                            >
                              <X className="size-3.5" />
                            </button>

                            {item.previewUrl ? (
                              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                                <img
                                  src={item.previewUrl}
                                  alt={item.file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 mb-2">
                                <FileCheck className="size-8 text-slate-500 mb-1" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Document</span>
                              </div>
                            )}

                            <div className="w-full text-center">
                              <p className="text-[11px] font-bold text-slate-700 truncate max-w-full" title={item.file.name}>
                                {item.file.name}
                              </p>
                              <p className="text-[9px] text-slate-400 font-semibold">
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-black uppercase tracking-wider py-3.5 px-6 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Submitting Complaint...
                      </>
                    ) : (
                      "Submit Complaint"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Track Complaint Status Tab */
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Search className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Track Complaint Status</h2>
                    <p className="text-xs text-slate-400 font-medium">Search by CNIC, Mobile Number, or Complaint Ticket ID.</p>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="size-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 42101-1234567-1, 03001234567, or CMP-XXXX"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="bg-blue-600 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    {searchLoading ? <Loader2 className="size-4 animate-spin" /> : "Check Status"}
                  </button>
                </form>

                {searchError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="size-4 text-rose-600 shrink-0" />
                    {searchError}
                  </div>
                )}

                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Found {searchResults.length} Complaint{searchResults.length > 1 ? "s" : ""}
                    </h3>

                    {searchResults.map((cmp) => {
                      const statusMeta = getStatusStyle(cmp.status);
                      const createdDate = new Date(cmp.created_at).toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={cmp.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:bg-white transition-all shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Complaint Ticket</span>
                              <span className="text-base font-black text-slate-800">{cmp.complaint_id}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statusMeta.bg}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          {/* Progress Stepper Visualizer */}
                          <div className="py-2">
                            <div className="grid grid-cols-3 gap-2 relative">
                              <div
                                className={`text-center p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                                  statusMeta.step >= 1 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                1. Registered
                              </div>
                              <div
                                className={`text-center p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                                  statusMeta.step >= 2 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                2. In Progress
                              </div>
                              <div
                                className={`text-center p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                                  statusMeta.step >= 4 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                3. Resolved
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs text-slate-600">
                            {/* Customer Information Block */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Customer Name</span>
                                <span className="font-bold text-slate-800 text-xs">{cmp.customer_name}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CNIC</span>
                                <span className="font-bold text-slate-800 text-xs">{cmp.customer_cnic || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mobile Number</span>
                                <span className="font-bold text-slate-800 text-xs">{cmp.mobile_number}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Clock className="size-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-400">Date:</span>
                              <span className="font-bold text-slate-800">{createdDate}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Description:</span>
                              <p className="mt-0.5 bg-white p-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs">
                                {cmp.description}
                              </p>
                            </div>
                            {cmp.resolution_note && (
                              <div className="pt-2">
                                <span className="font-bold text-emerald-600 text-xs">Resolution Note:</span>
                                <div className="mt-1 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
                                  {cmp.resolution_note}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Head Office & Support Helpline Info */}
          <div className="lg:col-span-4 space-y-5">

            {/* Head Office Address Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Head Office</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Location</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="font-semibold text-slate-700 leading-relaxed">
                    Office no 401, Plot # 31-C, Street 5, DHA Phase 5 Badar Commercial Area Defence V Defence Housing Authority, Karachi, 75500, Pakistan.
                  </p>
                </div>
              </div>
            </div>

            {/* UAN & Telephone Helpline Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">UAN Helpline</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Support</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <a
                  href="tel:+923041111144"
                  className="block p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all font-black text-slate-800 text-sm flex items-center justify-between"
                >
                  <span>+92 304 111 1144</span>
                  <ExternalLink className="size-3.5 text-blue-500" />
                </a>
                <p className="text-[10px] font-bold text-slate-400 text-center tracking-wider uppercase">
                  Mon - Sat: 9:00 AM - 9:00 PM
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Wati Redirect Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-md">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">WhatsApp Helpline</h3>
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Instant Assistance</p>
                </div>
              </div>

              <p className="text-xs text-emerald-50 font-medium mb-2 leading-relaxed">
                WATI Helpline: <span className="font-black text-white">0340-4444660</span>
              </p>

              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-white text-emerald-700 font-black text-xs uppercase tracking-wider hover:bg-emerald-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="size-4" /> Chat on WhatsApp
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
