"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Loader from "@/components/common/Loader";
import { Printer, ArrowLeft, FileDown, Eye } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${Cookies.get("auth_token")}`,
    "Content-Type": "application/json",
});

interface CashSaleItem {
    inventory_id: number;
    product_name: string;
    category: string | null;
    imei_serial: string | null;
    color_variant: string | null;
    quoted_price: number;
    final_price: number;
}

interface CashSale {
    id: number;
    item_count: number;
    customer_name: string;
    customer_phone: string | null;
    customer_cnic: string | null;
    quoted_price: number;
    final_price: number;
    created_at: string;
    sold_by: { username: string; full_name: string } | null;
    outlet: { name: string; address: string | null } | null;
}

export default function CashSaleInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [sale, setSale] = useState<CashSale | null>(null);
    const [items, setItems] = useState<CashSaleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (params.id) {
            fetchSale();
        }
    }, [params.id]);

    const fetchSale = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/cash-sale/${params.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setSale(data.data.sale);
                setItems(data.data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async (open = false) => {
        if (!invoiceRef.current || !sale) return;
        setGenerating(true);

        try {
            const originalStyle = invoiceRef.current.style.width;
            invoiceRef.current.style.width = "900px";

            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: 900,
                windowWidth: 1024,
                height: invoiceRef.current.offsetHeight,
            });

            invoiceRef.current.style.width = originalStyle;

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const filename = `CashSale_${sale.id}.pdf`;

            if (pdfHeight > 297) {
                const longPdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [210, pdfHeight + 10] });
                longPdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
                if (open) {
                    const blob = longPdf.output("blob");
                    window.open(URL.createObjectURL(blob), "_blank");
                } else {
                    longPdf.save(filename);
                }
            } else {
                pdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
                if (open) {
                    const blob = pdf.output("blob");
                    window.open(URL.createObjectURL(blob), "_blank");
                } else {
                    pdf.save(filename);
                }
            }
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please use standard Print (Ctrl+P).");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <Loader text="Preparing invoice for print..." />;
    if (!sale) return <div className="p-20 text-center text-red-500 font-bold">Sale record not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-boxdark-2">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    aside, header, nav, footer, .print-hidden,
                    .sidebar, .header, .top-header, .sticky {
                        display: none !important;
                    }
                    main, .main-content {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .printable-invoice {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 auto !important;
                        padding: 20mm !important;
                        width: 100% !important;
                        max-width: none !important;
                    }
                }
            `}} />

            <div className="bg-white dark:bg-boxdark p-4 border-b border-stroke dark:border-strokedark flex items-center justify-between print:hidden sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-primary flex items-center gap-2 transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => generatePDF(true)}
                        disabled={generating}
                        className="bg-primary/10 text-primary border border-primary/20 px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {generating ? <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" /> : <Eye size={18} />}
                        {generating ? "Generating..." : "Generate PDF"}
                    </button>
                    <button
                        onClick={() => generatePDF(false)}
                        disabled={generating}
                        className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        <FileDown size={18} /> Download
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-800 text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                        <Printer size={18} /> Print (Manual)
                    </button>
                </div>
            </div>

            <div className="p-8 md:p-12 print:p-0">
                <div
                    ref={invoiceRef}
                    className="printable-invoice p-12 md:p-20 max-w-[900px] mx-auto bg-white text-gray-800 border border-gray-100 shadow-xl print:shadow-none print:border-none print:p-0"
                >
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <img src="/images/logo/qist-market-logo.png" alt="Qist Market" className="h-12 mb-4" />
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Cash Sale Invoice</div>
                            <div className="text-[11px] text-gray-400 max-w-[250px] mt-2 leading-relaxed">
                                {sale.outlet?.name || "QistMarket Outlet"}<br />
                                {sale.outlet?.address || ""}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Invoice Reference</div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">CS-{sale.id}</h1>
                            <div className="mt-4 space-y-1">
                                <div className="text-xs font-bold text-gray-800">
                                    Issue Date: {new Date(sale.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" })}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">System Generated ID: #{sale.id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-16 py-8 border-y-4 border-double border-gray-100">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sold To (Customer)</div>
                            <div className="text-xl font-black text-primary capitalize">{sale.customer_name}</div>
                            {sale.customer_phone && <div className="text-xs text-gray-500 mt-2">Phone: {sale.customer_phone}</div>}
                            {sale.customer_cnic && <div className="text-xs text-gray-500 mt-1">CNIC: {sale.customer_cnic}</div>}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sold By</div>
                            <div className="text-xl font-black text-gray-900">{sale.sold_by?.full_name || sale.sold_by?.username || "N/A"}</div>
                            <div className="text-xs text-gray-500 mt-2">{sale.outlet?.name || "QistMarket Outlet"}</div>
                        </div>
                    </div>

                    <table className="w-full text-left mb-16 border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-900 text-[10px] uppercase font-black tracking-widest text-gray-600">
                                <th className="p-4 w-12">#</th>
                                <th className="p-4">Item Description</th>
                                <th className="p-4">IMEI / Identification</th>
                                <th className="p-4 text-right">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <tr key={item.inventory_id}>
                                    <td className="p-4 text-gray-400 font-mono font-bold text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{item.product_name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{item.category || "General"} • {item.color_variant || "Standard Version"}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-600 uppercase tracking-tighter">
                                        {item.imei_serial || "N/A"}
                                    </td>
                                    <td className="p-4 text-right font-black tracking-tight text-sm">{(item.final_price || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="min-w-[300px] space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                <span className="uppercase tracking-[0.1em]">Quoted Price:</span>
                                <span className="text-gray-900">PKR {(sale.quoted_price || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex justify-between items-center bg-gray-900 text-white p-5 rounded-2xl shadow-xl shadow-gray-200">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Total Paid</span>
                                <span className="text-2xl font-black tabular-nums tracking-tighter">PKR {(sale.final_price || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 pt-10 border-t-2 border-gray-100 flex justify-between items-center px-4">
                        <div className="space-y-1">
                            <div className="text-[11px] font-black text-gray-900 uppercase">QistMarket Outright Sale</div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">Outright cash sale — no installment plan attached</div>
                        </div>
                        <div className="text-center px-10">
                            <div className="h-[2px] bg-gray-300 w-32 mb-2" />
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Signatory</div>
                        </div>
                    </div>

                    <div className="mt-20 text-center opacity-40">
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Thank you for shopping with Qist Market</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
