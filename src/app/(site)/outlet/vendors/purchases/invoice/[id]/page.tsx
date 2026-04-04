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

interface PurchaseItem {
    id: number;
    product_name: string;
    category?: string;
    color_variant?: string;
    imei_serial?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Purchase {
    id: number;
    invoice_number: string;
    vendor_name: string;
    total_amount: number;
    paid_amount: number;
    balance: number;
    status: string;
    purchase_date: string;
    notes?: string;
    items: PurchaseItem[];
}

export default function VendorInvoicePrintPage() {
    const params = useParams();
    const router = useRouter();
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (params.id) {
            fetchPurchase();
        }
    }, [params.id]);

    const fetchPurchase = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/vendors/purchases/${params.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.success) {
                setPurchase(data.purchase);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async (open = false) => {
        if (!invoiceRef.current || !purchase) return;
        setGenerating(true);
        
        try {
            // Force temporary styles for high-quality capture
            const originalStyle = invoiceRef.current.style.width;
            invoiceRef.current.style.width = "900px";

            // Capture full height
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: 900,
                // Ensure we capture everything even if there's a scrollbar
                windowWidth: 1024, 
                height: invoiceRef.current.offsetHeight
            });
            
            // Restore original style
            invoiceRef.current.style.width = originalStyle;

            const imgData = canvas.toDataURL("image/png");
            
            // Calculate PDF dimensions (A4 = 210mm x 297mm)
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // If the content is taller than A4, use the calculated height for a single long page
            // Or create multiple pages. For invoices, usually fitting to A4 or a custom height is best.
            if (pdfHeight > 297) {
                // Resize PDF to fit content exactly (Long Page)
                const longPdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: [210, pdfHeight + 10]
                });
                longPdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
                
                if (open) {
                    const blob = longPdf.output("blob");
                    window.open(URL.createObjectURL(blob), "_blank");
                } else {
                    longPdf.save(`Invoice_${purchase.invoice_number}.pdf`);
                }
            } else {
                pdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
                
                if (open) {
                    const blob = pdf.output("blob");
                    window.open(URL.createObjectURL(blob), "_blank");
                } else {
                    pdf.save(`Invoice_${purchase.invoice_number}.pdf`);
                }
            }
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please use standard Print (Ctrl+P).");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <Loader text="Preparing Invoice for print..." />;
    if (!purchase) return <div className="p-20 text-center text-red-500 font-bold">Purchase record not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-boxdark-2">
            {/* INJECT PRINT CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Hide EVERYTHING in the dashboard layout */
                    aside, header, nav, footer, .print-hidden, 
                    .sidebar, .header, .top-header, .sticky {
                        display: none !important;
                    }
                    /* Reset main container padding/margins */
                    main, .main-content {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                    }
                    /* Ensure background is white and text is black */
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    /* Center and style the invoice specifically for A4 */
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

            {/* Header / Controls (Hidden on Print) */}
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

            {/* PRINTABLE AREA */}
            <div className="p-8 md:p-12 print:p-0">
                <div 
                    ref={invoiceRef}
                    className="printable-invoice p-12 md:p-20 max-w-[900px] mx-auto bg-white text-gray-800 border border-gray-100 shadow-xl print:shadow-none print:border-none print:p-0"
                >
                    {/* Branding & Invoice Info */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <img src="/images/logo/logo.svg" alt="QistMarket" className="h-12 mb-4" />
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Official Procurement Invoice</div>
                            <div className="text-[11px] text-gray-400 max-w-[250px] mt-2 leading-relaxed">
                                QistMarket Head Office: Business Square, Suite 201, Karachi, PK.<br/>
                                Contact: +92 21 111-QIST (7478)<br/>
                                Website: www.qistmarket.pk
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Invoice Reference</div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{purchase.invoice_number}</h1>
                            <div className="mt-4 space-y-1">
                                <div className="text-xs font-bold text-gray-800">Issue Date: {new Date(purchase.purchase_date).toLocaleDateString("en-PK", { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                <div className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">System Generated ID: #{purchase.id}</div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor & Billed To Card */}
                    <div className="grid grid-cols-2 gap-10 mb-16 py-8 border-y-4 border-double border-gray-100">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sourcing from (Vendor)</div>
                            <div className="text-xl font-black text-primary capitalize">{purchase.vendor_name}</div>
                            <div className="text-xs text-gray-500 mt-2">Vendor Verification: <span className="text-green-600 font-bold">Active Supplier</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sourced To (Outlet)</div>
                            <div className="text-xl font-black text-gray-900">QistMarket Official Outlet</div>
                            <div className="text-xs text-gray-500 mt-2">Inventory Department - Karachi South</div>
                        </div>
                    </div>

                    {/* Main Items Table */}
                    <table className="w-full text-left mb-16 border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-900 text-[10px] uppercase font-black tracking-widest text-gray-600">
                                <th className="p-4 w-12">#</th>
                                <th className="p-4">Detailed Description of Items</th>
                                <th className="p-4">IMEI / Identification</th>
                                <th className="p-4 text-right">Unit Rate</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-right">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {purchase.items.map((item, idx) => (
                                <tr key={idx} className="group">
                                    <td className="p-4 text-gray-400 font-mono font-bold text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{item.product_name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{item.category} • {item.color_variant || 'Standard Version'}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-gray-600 uppercase tracking-tighter">
                                        {item.imei_serial || 'BATCH PROCUREMENT'}
                                    </td>
                                    <td className="p-4 text-right tabular-nums text-sm">{(item.unit_price || 0).toLocaleString()}</td>
                                    <td className="p-4 text-center font-black text-sm">{item.quantity}</td>
                                    <td className="p-4 text-right font-black tracking-tight text-sm">{(item.total_price || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="flex justify-between items-end gap-10">
                        <div className="flex-1 max-w-[350px]">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Terms & General Notes</div>
                            <div className="p-4 bg-gray-50 rounded-2xl text-[11px] text-gray-500 leading-relaxed italic border border-gray-100">
                                {purchase.notes || "This is a computer-generated procurement invoice for inventory validation. All items have been inspected and verified at the destination outlet. Vendor credit is subject to the standard QistMarket payout policy."}
                            </div>
                        </div>
                        <div className="min-w-[300px] space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                <span className="uppercase tracking-[0.1em]">Items Net Total:</span>
                                <span className="text-gray-900">PKR {purchase.total_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-green-600">
                                <span className="uppercase tracking-[0.1em]">Amount Settle (Paid):</span>
                                <span className="font-black">PKR {purchase.paid_amount.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex justify-between items-center bg-gray-900 text-white p-5 rounded-2xl shadow-xl shadow-gray-200">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Balance Due</span>
                                <span className="text-2xl font-black tabular-nums tracking-tighter">PKR {purchase.balance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Signing Area */}
                    <div className="mt-24 pt-10 border-t-2 border-gray-100 flex justify-between items-center px-4">
                        <div className="space-y-1">
                            <div className="text-[11px] font-black text-gray-900 uppercase">QistMarket Operations</div>
                            <div className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-bold">Authorized Digital Signatory</div>
                        </div>
                        <div className="flex items-center gap-16">
                            <div className="text-center px-10">
                                <div className="h-[2px] bg-gray-300 w-32 mb-2" />
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory Officer</div>
                            </div>
                            <div className="text-center px-10">
                                <div className="h-[2px] bg-gray-300 w-32 mb-2" />
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Finance Manager</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center opacity-40">
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Generated via QM-Procure v9.1 • Secure Document</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
