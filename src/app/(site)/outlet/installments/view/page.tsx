"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  Search,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  Edit3,
  Loader2,
  Filter,
  RefreshCw,
  TrendingUp,
  X,
  FileDown,
  Maximize2,
  Minimize2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const getAuthHeaders = () => {
  const token = Cookies.get("auth_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const MONTHS_LIST = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const YEARS_LIST = [2024, 2025, 2026, 2027, 2028];

function InstallmentsViewContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  // UI States
  const [isFullView, setIsFullView] = useState(false);

  // Query state
  const [search, setSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<'fresh' | 'due' | 'completed'>('fresh');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Column-level advanced filters
  const [colFilters, setColFilters] = useState({
    order_ref: "",
    customer_name: "",
    whatsapp_number: "",
    alternate_number: "",
    area: "",
    grantor1Name: "",
    grantor2Name: "",
    product_name: "",
    imei_serial: "",
    status: ""
  });

  // Data states
  const [installments, setInstallments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDueThisMonth: 0,
    totalPaidThisMonth: 0,
    remainingThisMonth: 0,
    overallSystemRemaining: 0,
    overallSystemPaid: 0
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // Array of orderRef_dueDate keys

  // Notes Modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeOrderForNote, setActiveOrderForNote] = useState<{ id: number; ref: string; customer: string; currentNote: string; monthNumber: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Sync search URL
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  // Handle Escape key to exit full wall view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullView) {
        setIsFullView(false);
        toast.success("Exited Full Screen mode");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullView]);

  // Fetch installments data from backend
  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        tab: activeTab,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });

      const res = await fetch(`${API_BASE}/api/outlet/installments/due-list?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (data.success) {
        setInstallments(data.data.installments || []);
        setStats(data.data.stats || {
          totalDueThisMonth: 0,
          totalPaidThisMonth: 0,
          remainingThisMonth: 0,
          overallSystemRemaining: 0,
          overallSystemPaid: 0
        });
        setPagination({
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        });
      } else {
        toast.error(data.message || "Failed to load installments");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, activeTab, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  // Reset page when filters change
  const handleTabChange = (tabName: 'fresh' | 'due' | 'completed') => {
    setActiveTab(tabName);
    setPage(1);
    setSelectedRows([]);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
    setPage(1);
    setSelectedRows([]);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
    setPage(1);
    setSelectedRows([]);
  };

  // Filter local rows using column-level advanced filters
  const filteredInstallments = installments.filter(inst => {
    return (
      (colFilters.order_ref === "" || inst.order_ref?.toLowerCase().includes(colFilters.order_ref.toLowerCase())) &&
      (colFilters.customer_name === "" || inst.customer_name?.toLowerCase().includes(colFilters.customer_name.toLowerCase())) &&
      (colFilters.whatsapp_number === "" || inst.whatsapp_number?.toLowerCase().includes(colFilters.whatsapp_number.toLowerCase())) &&
      (colFilters.alternate_number === "" || inst.alternate_number?.toLowerCase().includes(colFilters.alternate_number.toLowerCase())) &&
      (colFilters.area === "" || inst.area?.toLowerCase().includes(colFilters.area.toLowerCase())) &&
      (colFilters.grantor1Name === "" || inst.grantor1Name?.toLowerCase().includes(colFilters.grantor1Name.toLowerCase())) &&
      (colFilters.grantor2Name === "" || inst.grantor2Name?.toLowerCase().includes(colFilters.grantor2Name.toLowerCase())) &&
      (colFilters.product_name === "" || inst.product_name?.toLowerCase().includes(colFilters.product_name.toLowerCase())) &&
      (colFilters.imei_serial === "" || inst.imei_serial?.toLowerCase().includes(colFilters.imei_serial.toLowerCase())) &&
      (colFilters.status === "" || inst.status?.toLowerCase() === colFilters.status.toLowerCase())
    );
  });

  // Handle Multi-Checkbox Selection
  const getRowKey = (inst: any) => `${inst.order_ref}_${inst.dueDate}`;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(filteredInstallments.map(getRowKey));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (inst: any, checked: boolean) => {
    const key = getRowKey(inst);
    if (checked) {
      setSelectedRows(prev => [...prev, key]);
    } else {
      setSelectedRows(prev => prev.filter(k => k !== key));
    }
  };

  // Export CSV Helper
  const downloadCSV = (rowsToExport: any[], filename: string) => {
    const headers = [
      "S.No",
      "Order Ref",
      "Customer Name",
      "WhatsApp Number",
      "Alternate Contact",
      "Area/Location",
      "Due Date",
      "Date of Purchase",
      "Guarantor 1 Name",
      "Guarantor 1 Phone",
      "Guarantor 2 Name",
      "Guarantor 2 Phone",
      "Product Name",
      "IMEI/Serial",
      "This Month's Due Amount",
      "Remaining Outstandings",
      "Partial Payment",
      "Payment Date & Logs",
      "Ledger Status",
      "Installment Note"
    ];

    const csvRows = [
      headers.join(","), // Header row
      ...rowsToExport.map((row, idx) => {
        const paymentHistoryStr = row.paymentHistory && row.paymentHistory.length > 0
          ? row.paymentHistory.map((h: any) => `${new Date(h.date).toLocaleDateString("en-PK")}: Rs. ${h.amount} (${h.method})`).join(" | ")
          : row.paidDate
            ? new Date(row.paidDate).toLocaleDateString("en-PK")
            : "-";

        return [
          idx + 1,
          `"${row.order_ref || ''}"`,
          `"${row.customer_name || ''}"`,
          `"${row.whatsapp_number || ''}"`,
          `"${row.alternate_number || ''}"`,
          `"${row.area || ''}"`,
          `"${row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PK") : ''}"`,
          `"${row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString("en-PK") : ''}"`,
          `"${row.grantor1Name || ''}"`,
          `"${row.grantor1Phone || ''}"`,
          `"${row.grantor2Name || ''}"`,
          `"${row.grantor2Phone || ''}"`,
          `"${row.product_name || ''}"`,
          `"${row.imei_serial || ''}"`,
          row.monthlyAmount || 0,
          row.remainingAmount || 0,
          row.partialPayment || "",
          `"${paymentHistoryStr}"`,
          `"${row.status || ''}"`,
          `"${(row.note || '').replace(/"/g, '""')}"`
        ].join(",");
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelected = () => {
    const selectedData = filteredInstallments.filter(inst => selectedRows.includes(getRowKey(inst)));
    if (selectedData.length === 0) {
      toast.error("Please select at least one row to export");
      return;
    }
    const currentMonthLabel = MONTHS_LIST.find(m => m.value === selectedMonth)?.label || "Month";
    downloadCSV(selectedData, `installments_${currentMonthLabel}_${selectedYear}_selected.csv`);
    toast.success(`Successfully exported ${selectedData.length} records`);
  };

  const handleExportAll = () => {
    if (filteredInstallments.length === 0) {
      toast.error("No records found in the current view to export");
      return;
    }
    const currentMonthLabel = MONTHS_LIST.find(m => m.value === selectedMonth)?.label || "Month";
    downloadCSV(filteredInstallments, `installments_${currentMonthLabel}_${selectedYear}_all.csv`);
    toast.success(`Successfully exported all ${filteredInstallments.length} records`);
  };

  // Open Notes Modal
  const openNoteDialog = (inst: any) => {
    setActiveOrderForNote({
      id: inst.order_id,
      ref: inst.order_ref,
      customer: inst.customer_name,
      currentNote: inst.note || "",
      monthNumber: inst.monthNumber
    });
    setNoteText(inst.note || "");
    setNoteModalOpen(true);
  };

  // Submit Note Save to specific month number
  const handleSaveNote = async () => {
    if (!activeOrderForNote) return;
    setSavingNote(true);

    try {
      const res = await fetch(`${API_BASE}/api/outlet/installments/${activeOrderForNote.id}/note`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          note: noteText,
          month_number: activeOrderForNote.monthNumber
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Installment note successfully saved");
        setNoteModalOpen(false);
        // Instant local update for this specific monthly row
        setInstallments(prev =>
          prev.map(inst => {
            if (inst.order_id === activeOrderForNote.id && inst.monthNumber === activeOrderForNote.monthNumber) {
              return { ...inst, note: noteText };
            }
            return inst;
          })
        );
      } else {
        toast.error(data.message || "Failed to save note");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving note");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className={`mx-auto ${isFullView ? 'fixed inset-0 z-[999999] bg-[#f8fafc] dark:bg-boxdark w-screen h-screen overflow-y-auto p-4 md:p-8 animate-fade-in' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'} transition-all duration-300`}>

      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Installments <span className="text-[#E31E24] font-light text-xl">View</span>
            {isFullView && (
              <span className="ml-3 inline-flex items-center rounded-full bg-red-100 dark:bg-meta-4 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#E31E24] tracking-widest animate-pulse">
                Full Wall Mode
              </span>
            )}
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            High-fidelity flat matrix view of customer installment ledgers with advanced query actions.
          </p>
        </div>

        {/* Month Year Selector Controls */}
        <div className="flex items-center gap-2.5 bg-white dark:bg-boxdark p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark">
          <Calendar className="h-4.5 w-4.5 text-gray-400 ml-1.5" />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="bg-transparent border-0 text-xs font-black uppercase text-gray-500 dark:text-white focus:ring-0 cursor-pointer py-1"
          >
            {MONTHS_LIST.map(m => (
              <option key={m.value} value={m.value} className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">
                {m.label}
              </option>
            ))}
          </select>
          <span className="text-gray-200 dark:text-slate-700">|</span>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="bg-transparent border-0 text-xs font-black uppercase text-gray-500 dark:text-white focus:ring-0 cursor-pointer py-1 mr-1.5"
          >
            {YEARS_LIST.map(y => (
              <option key={y} value={y} className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATISTICS CARDS SECTION */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">

        {/* Total Due This Month */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50 dark:bg-boxdark dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Month's Due</p>
              <h3 className="mt-2 text-xl font-black text-slate-800 dark:text-white">Rs. {stats.totalDueThisMonth.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl bg-[#E31E24]/5 p-2.5 text-[#E31E24]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#E31E24]/20" />
        </div>

        {/* Total Collected This Month */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50 dark:bg-boxdark dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Month's Collected</p>
              <h3 className="mt-2 text-xl font-black text-slate-800 dark:text-white">Rs. {stats.totalPaidThisMonth.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/20" />
        </div>

        {/* Total Unpaid This Month */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50 dark:bg-boxdark dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Month's Remaining</p>
              <h3 className="mt-2 text-xl font-black text-slate-800 dark:text-white">Rs. {stats.remainingThisMonth.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl bg-[#E31E24]/5 p-2.5 text-[#E31E24]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-[#E31E24]/20" />
        </div>

        {/* Overall System Collected */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50 dark:bg-boxdark dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">System Collected</p>
              <h3 className="mt-2 text-xl font-black text-slate-800 dark:text-white">Rs. {stats.overallSystemPaid.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-500/20" />
        </div>

        {/* Overall System Unpaid */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/50 dark:bg-boxdark dark:border-strokedark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">System Outstanding</p>
              <h3 className="mt-2 text-xl font-black text-slate-800 dark:text-white">Rs. {stats.overallSystemRemaining.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-meta-4 dark:text-slate-300">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-500/20" />
        </div>

      </div>

      {/* FILTER TABS & CONTROL ACTIONS */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-boxdark px-4 py-2.5 rounded-3xl shadow-sm border border-gray-100 dark:border-strokedark">

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-transparent self-start border-b border-gray-50 w-full lg:w-auto">
          <button
            onClick={() => handleTabChange('fresh')}
            className={`whitespace-nowrap px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'fresh'
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Fresh
          </button>

          <button
            onClick={() => handleTabChange('due')}
            className={`whitespace-nowrap px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'due'
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Due / Overdue
          </button>

          <button
            onClick={() => handleTabChange('completed')}
            className={`whitespace-nowrap px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'completed'
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Fully Paid
          </button>
        </div>

        {/* Global Search and CSV Exports */}
        <div className="flex flex-wrap items-center gap-2.5">

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border-gray-100 bg-gray-50/50 py-2 pl-9 pr-4 text-xs outline-none focus:border-[#E31E24] focus:bg-white dark:border-strokedark dark:bg-meta-4 dark:text-white"
            />
          </div>

          {/* TRUE FULL-WALL WINDOW OVERLAY TOGGLE */}
          <button
            onClick={() => {
              setIsFullView(!isFullView);
              if (!isFullView) {
                toast.success("Switched to Full Wall Screen mode! (Press ESC to exit)");
              } else {
                toast.success("Returned to standard dashboard layout");
              }
            }}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-100 dark:border-strokedark bg-[#E31E24]/5 hover:bg-[#E31E24]/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#E31E24] transition-all cursor-pointer"
            title={isFullView ? "Exit Fullscreen (Esc)" : "Full Wall Screen mode"}
          >
            {isFullView ? (
              <>
                <Minimize2 className="h-4 w-4" /> Exit Fullscreen (Esc)
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" /> Full Wall Screen
              </>
            )}
          </button>

          <button
            onClick={handleExportSelected}
            disabled={selectedRows.length === 0}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-white disabled:opacity-40 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#E31E24]" /> Export Selected ({selectedRows.length})
          </button>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 rounded-2xl bg-[#E31E24] hover:bg-[#c7161c] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4" /> Export All CSV
          </button>

          <button
            onClick={fetchInstallments}
            className="flex items-center justify-center p-2.5 rounded-2xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark text-gray-400 hover:text-[#E31E24] hover:bg-gray-50 transition-all cursor-pointer"
            title="Refresh Ledger Grid"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* EXCEL SHEET HIGH-FIDELITY GRID CONTAINER */}
      <div className="bg-white dark:bg-boxdark rounded-3xl shadow-xl shadow-gray-100/40 border border-gray-100 dark:border-strokedark overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full border-collapse text-left text-xs text-gray-500 dark:text-gray-400">

            {/* Table Header Row matched with CSR RankingBoard style (Enlarged to text-[10px]) */}
            <thead className="bg-white sticky top-0 z-10 border-b border-gray-100 dark:border-strokedark">
              <tr className="bg-gray-50/50">
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredInstallments.length > 0 && selectedRows.length === filteredInstallments.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-[#E31E24] focus:ring-[#E31E24] dark:border-strokedark cursor-pointer"
                  />
                </th>
                <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase text-center w-12">S.No</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[120px]">Order Ref</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[160px]">Customer</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[140px]">WhatsApp</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[140px]">Alt Contact</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[140px]">Area</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[120px]">Due Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[120px]">Purchase Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[160px]">Guarantor 1 Name</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[140px]">Guarantor 1 Phone</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[160px]">Guarantor 2 Name</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[140px]">Guarantor 2 Phone</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[170px]">Item</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[150px]">IMEI / Device ID</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[180px]">1Bill Consumer No.</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[170px]">Recovery Officer</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[110px] text-right">Monthly Due</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[125px] text-right">Total Remaining</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[120px] text-right">Partial Paid</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[160px]">Paid Date / History</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[190px]">Installment Note</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase min-w-[110px] text-center">Status</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase w-16 text-center">Action</th>
              </tr>

              {/* ADVANCED COLUMN FILTERS ROW */}
              <tr className="bg-gray-50/20 border-b border-gray-100 dark:border-strokedark">
                <td className="px-4 py-2"></td>
                <td className="px-3 py-2">
                  <div className="flex justify-center"><Filter className="h-3.5 w-3.5 text-gray-300" /></div>
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.order_ref}
                    onChange={(e) => setColFilters(prev => ({ ...prev, order_ref: e.target.value }))}
                    placeholder="Filter Ref"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.customer_name}
                    onChange={(e) => setColFilters(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Filter Customer"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.whatsapp_number}
                    onChange={(e) => setColFilters(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="Filter WhatsApp"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.alternate_number}
                    onChange={(e) => setColFilters(prev => ({ ...prev, alternate_number: e.target.value }))}
                    placeholder="Filter Alternate"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.area}
                    onChange={(e) => setColFilters(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Filter Area"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.grantor1Name}
                    onChange={(e) => setColFilters(prev => ({ ...prev, grantor1Name: e.target.value }))}
                    placeholder="Filter G1 Name"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.grantor2Name}
                    onChange={(e) => setColFilters(prev => ({ ...prev, grantor2Name: e.target.value }))}
                    placeholder="Filter G2 Name"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.product_name}
                    onChange={(e) => setColFilters(prev => ({ ...prev, product_name: e.target.value }))}
                    placeholder="Filter Item"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={colFilters.imei_serial}
                    onChange={(e) => setColFilters(prev => ({ ...prev, imei_serial: e.target.value }))}
                    placeholder="Filter IMEI"
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  />
                </td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2"></td>
                <td className="px-2 py-2">
                  <select
                    value={colFilters.status}
                    onChange={(e) => setColFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded bg-white dark:bg-boxdark border-gray-150 dark:border-strokedark px-2 py-1 text-xs outline-none focus:border-[#E31E24]"
                  >
                    <option value="">All</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                  </select>
                </td>
                <td className="px-2 py-2"></td>
              </tr>
            </thead>

            {/* Table Body Content (Enlarged from text-xs to text-[13px] for ultimate readability) */}
            <tbody className="divide-y divide-gray-100 dark:divide-strokedark text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={22} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#E31E24] animate-spin" />
                      <span className="text-xs font-black tracking-wider uppercase text-gray-400">Querying installments database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-gray-300" />
                      <span className="text-xs font-black uppercase tracking-wider">No installments found for the selected month and filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstallments.map((inst, index) => {
                  const isChecked = selectedRows.includes(getRowKey(inst));
                  const purchaseDateStr = inst.purchaseDate ? new Date(inst.purchaseDate).toLocaleDateString("en-PK") : "N/A";
                  const dueDateStr = inst.dueDate ? new Date(inst.dueDate).toLocaleDateString("en-PK") : "N/A";

                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 dark:border-strokedark">
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(inst, e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-gray-300 text-[#E31E24] focus:ring-[#E31E24] dark:border-strokedark cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3.5 text-center font-black text-gray-300">{(page - 1) * limit + index + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">{inst.order_ref}</td>
                      <td className="px-4 py-3.5 font-black text-slate-800 dark:text-slate-200">{inst.customer_name}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{inst.whatsapp_number}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{inst.alternate_number}</td>
                      <td className="px-4 py-3.5 font-medium">{inst.area}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-700 dark:text-slate-300">{dueDateStr}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-600">{purchaseDateStr}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{inst.grantor1Name}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-600">{inst.grantor1Phone}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{inst.grantor2Name}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-600">{inst.grantor2Phone}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-700 dark:text-slate-300">{inst.product_name}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-600">{inst.imei_serial}</td>
                      <td className="px-4 py-3.5">
                        {inst.consumer_number ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-sm tracking-widest text-[#E31E24]">{inst.consumer_number}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Not Generated</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {inst.recovery_officer ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{inst.recovery_officer.name}</span>
                            <span className="text-xs text-gray-500">{inst.recovery_officer.phone || 'No phone'}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">Rs. {inst.monthlyAmount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-black text-[#E31E24]">Rs. {inst.remainingAmount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {inst.partialPayment ? `Rs. ${inst.partialPayment.toLocaleString()}` : "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 font-black">
                          {inst.paidDate ? (
                            <span className="text-slate-800 dark:text-slate-200">
                              {new Date(inst.paidDate).toLocaleDateString("en-PK", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-300 font-black">-</span>
                          )}
                          {inst.paymentHistory && inst.paymentHistory.length > 1 && (
                            <span
                              className="text-[10px] text-[#E31E24] cursor-help hover:underline italic font-black uppercase tracking-wider"
                              title={inst.paymentHistory
                                .map((h: any) => `Rs. ${h.amount.toLocaleString()} via ${h.method} on ${new Date(h.date).toLocaleDateString("en-PK")}`)
                                .join("\n")
                              }
                            >
                              ({inst.paymentHistory.length} logs)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 max-w-[200px] truncate">
                        {inst.note ? (
                          <span
                            onClick={() => openNoteDialog(inst)}
                            className="cursor-pointer text-slate-800 dark:text-slate-300 hover:text-[#E31E24] hover:underline italic font-black"
                          >
                            {inst.note}
                          </span>
                        ) : (
                          <button
                            onClick={() => openNoteDialog(inst)}
                            className="text-gray-400 hover:text-[#E31E24] transition-all italic font-black text-[12px]"
                          >
                            + Add note
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${inst.status === "paid"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : inst.status === "partial"
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : "bg-red-50 text-[#E31E24] border border-red-200"
                            }`}
                        >
                          {inst.status === "paid" ? "Paid" : inst.status === "partial" ? "Partial" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => openNoteDialog(inst)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-[#E31E24] hover:bg-gray-100 dark:hover:bg-meta-4 transition-all cursor-pointer"
                          title="Update Monthly Note"
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>

        </div>

        {/* PAGINATION PANEL CONTROLS */}
        {!loading && filteredInstallments.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-strokedark px-6 py-4 bg-gray-50/20 text-xs">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
              Showing <span className="text-gray-600">{(page - 1) * limit + 1}</span> to{" "}
              <span className="text-gray-600">{Math.min(page * limit, pagination.total)}</span> of{" "}
              <span className="text-gray-600">{pagination.total}</span> entries
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-40 transition-all cursor-pointer"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                  if (p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded-xl h-8 w-8 text-[10px] font-black uppercase flex items-center justify-center transition-all cursor-pointer ${page === p
                            ? "bg-[#E31E24] text-white"
                            : "border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  } else if (p === 2 || p === pagination.totalPages - 1) {
                    return <span key={p} className="px-1 text-gray-300">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-40 transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* NOTE EDITING MODAL / DIALOG */}
      {noteModalOpen && activeOrderForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-boxdark p-6 shadow-2xl border border-gray-100 dark:border-strokedark transform animate-fade-in transition-all">

            <div className="flex items-center justify-between border-b border-gray-100 dark:border-strokedark pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Edit3 className="h-4.5 w-4.5 text-[#E31E24]" /> Month {activeOrderForNote.monthNumber} Installment Note
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Update specific monthly ledger context for Order {activeOrderForNote.ref}
                </p>
              </div>

              <button
                onClick={() => setNoteModalOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-meta-4 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                Customer Context
              </label>
              <div className="rounded-xl bg-gray-50 dark:bg-meta-4 p-3 text-xs font-black text-gray-600 dark:text-slate-300">
                Customer Name: <span className="font-bold text-[#E31E24]">{activeOrderForNote.customer}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                Monthly Installment Note
              </label>
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log monthly contact details, promised payments, or other notes specific to this month..."
                className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-xs outline-none focus:border-[#E31E24] focus:bg-white dark:border-strokedark dark:bg-meta-4 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-strokedark pt-4">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-2xl border border-gray-100 dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="flex items-center gap-1.5 rounded-2xl bg-[#E31E24] hover:bg-[#c7161c] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {savingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function InstallmentsViewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-boxdark">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#E31E24] animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Initializing Installment Matrix...</span>
        </div>
      </div>
    }>
      <InstallmentsViewContent />
    </Suspense>
  );
}
