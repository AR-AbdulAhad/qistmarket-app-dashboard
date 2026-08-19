"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  Search, ShoppingBag, User, Phone, CreditCard, Smartphone,
  CheckCircle2, X, ChevronLeft, ChevronRight, Receipt, Tag,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("auth_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const PKR = (val: number) => `PKR ${(val || 0).toLocaleString("en-PK")}`;

interface InventoryItem {
  id: number;
  product_name: string;
  category: string | null;
  imei_serial: string | null;
  color_variant: string | null;
  purchase_price: number;
  installment_price: number;
  sale_price?: number | null;
  suggested_price: number;
  is_used: boolean;
  status: string;
}

// Suggested cash-sale price: the API-recommended sale price if there is one,
// otherwise the installment price, then purchase price. Uses `||` (not `??`)
// deliberately — installment_price is a required column that's frequently
// left as 0 for items never priced for a qist plan (e.g. appliances added as
// outright-sale stock only), and 0 is never a real intended price here, so it
// must fall through the same way null/undefined would. Always editable below
// regardless of what it resolves to.
const suggestedPriceOf = (item: InventoryItem) =>
  item.sale_price || item.installment_price || item.purchase_price || 0;

interface CashSale {
  id: number;
  product_name: string;
  category: string | null;
  imei_serial: string | null;
  color_variant: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_cnic: string | null;
  quoted_price: number;
  final_price: number;
  created_at: string;
  sold_by: { username: string; full_name: string } | null;
}

export default function CashSalePage() {
  // ── Sale form state ────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCnic, setCustomerCnic] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // ── History state ──────────────────────────────────────────────────
  const [history, setHistory] = useState<CashSale[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });

  // ── Product search (debounced) ───────────────────────────────────────
  // Reuses the exact same GET /api/outlet/inventory endpoint the Stock List
  // page calls, so Cash Sale can never show a product Stock List doesn't —
  // filtered here to just what Stock List itself treats as available
  // (status "In Stock", not flagged is_used; "Used Stock"/"Out Of
  // Stock"/"Sold" units are excluded, matching getInventory's own rule).
  //
  // Runs on an empty search too (search="" — the backend's own `undefined`
  // OR-clause behavior returns everything unfiltered), so clicking into the
  // box immediately shows a browsable list of in-stock products instead of
  // staying blank until the user types something.
  useEffect(() => {
    setIsSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/outlet/inventory?search=${encodeURIComponent(productSearch.trim())}&limit=50&page=1`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          const sellable: InventoryItem[] = (data.inventory || [])
            .filter((item: InventoryItem) => item.status === "In Stock" && !item.is_used)
            .map((item: InventoryItem) => ({ ...item, suggested_price: suggestedPriceOf(item) }));
          setSearchResults(sellable);
        }
      } catch (err) {
        console.error("Product search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [productSearch]);

  // Close the results dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (item: InventoryItem) => {
    setSelectedProduct(item);
    setProductSearch(`${item.product_name}${item.imei_serial ? ` — ${item.imei_serial}` : ""}`);
    setFinalPrice(item.suggested_price || 0);
    setShowResults(false);
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setProductSearch("");
    setSearchResults([]);
    setFinalPrice("");
  };

  // ── History fetch ───────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: historySearch.trim(),
      });
      const res = await fetch(`${API_BASE}/api/outlet/cash-sale/history?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data.sales);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Fetch cash sale history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [page, limit, historySearch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Debounce history search
  useEffect(() => {
    const handle = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(handle);
  }, [historySearch]);

  // ── Confirm sale ────────────────────────────────────────────────────
  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerCnic("");
    clearProduct();
  };

  const handleConfirmSale = async () => {
    if (!selectedProduct) return toast.error("Select a product to sell");
    if (!customerName.trim()) return toast.error("Customer name is required");
    const priceNum = Number(finalPrice);
    if (!priceNum || priceNum <= 0) return toast.error("Enter a valid final price");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/outlet/cash-sale`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          inventory_id: selectedProduct.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || undefined,
          customer_cnic: customerCnic.trim() || undefined,
          quoted_price: selectedProduct.suggested_price || priceNum,
          final_price: priceNum,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Sale failed");

      toast.success("Sale completed successfully!");
      resetForm();
      setPage(1);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Sale failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Cash Sale" />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* ── New Sale Form ──────────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-dark rounded-[2rem] shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-dark-3 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-[#E31E24]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">New Cash Sale</h3>
              <p className="text-gray-400 dark:text-dark-6 text-sm font-medium">Outright walk-in sale against branch stock</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-4 mb-8">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative sm:col-span-2">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-2 border-2 border-transparent focus:border-[#E31E24] rounded-2xl outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-2 border-2 border-transparent focus:border-[#E31E24] rounded-2xl outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="CNIC (optional)"
                  value={customerCnic}
                  onChange={(e) => setCustomerCnic(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-2 border-2 border-transparent focus:border-[#E31E24] rounded-2xl outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-4 mb-8">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Product</p>
            <div className="relative" ref={searchBoxRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search in-stock product by name or IMEI..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowResults(true);
                  if (selectedProduct) setSelectedProduct(null);
                }}
                onFocus={() => setShowResults(true)}
                className="w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-dark-2 border-2 border-transparent focus:border-[#E31E24] rounded-2xl outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
              />
              {(productSearch || selectedProduct) && (
                <button
                  type="button"
                  onClick={clearProduct}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {showResults && !selectedProduct && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-dark-2 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-3 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-6 text-center text-sm text-gray-400 font-medium">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectProduct(item)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-3 border-b border-gray-50 dark:border-dark-3 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-3 flex items-center justify-center text-gray-400 shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.product_name}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">{item.imei_serial} {item.color_variant ? `• ${item.color_variant}` : ""}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-600 shrink-0">{PKR(item.suggested_price)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400 font-medium">No in-stock items found</div>
                  )}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900/30 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-sm truncate">{selectedProduct.product_name}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {selectedProduct.imei_serial && (
                      <span className="text-[10px] font-bold text-gray-500 bg-white dark:bg-dark-2 px-2 py-0.5 rounded-lg font-mono">{selectedProduct.imei_serial}</span>
                    )}
                    {selectedProduct.color_variant && (
                      <span className="text-[10px] font-bold text-gray-500 bg-white dark:bg-dark-2 px-2 py-0.5 rounded-lg">{selectedProduct.color_variant}</span>
                    )}
                    {selectedProduct.category && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg uppercase">{selectedProduct.category}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Suggested</p>
                  <p className="font-black text-emerald-600 text-sm">{PKR(selectedProduct.suggested_price)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Final Price */}
          <div className="space-y-3 mb-8">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Final Sale Price</p>
            <div className="flex items-center gap-3 bg-gray-900 dark:bg-dark-2 rounded-2xl p-5">
              <Tag className="w-6 h-6 text-emerald-400 shrink-0" />
              <span className="text-gray-400 font-black text-lg">Rs.</span>
              <input
                type="number"
                placeholder="0"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={!selectedProduct}
                className="flex-1 bg-transparent outline-none font-black text-2xl text-white placeholder:text-gray-600 disabled:opacity-40"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-dark-6 font-medium px-1">Editable — override the suggested price if needed.</p>
          </div>

          <button
            onClick={handleConfirmSale}
            disabled={isSubmitting || !selectedProduct}
            className="w-full py-4 bg-[#E31E24] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-100 dark:shadow-none hover:bg-red-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <div className="size-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm Sale
              </>
            )}
          </button>
        </div>

        {/* ── Side summary ───────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gray-900 dark:bg-dark-2 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-emerald-400">
                <Receipt className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">How it works</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-300 font-semibold">
                <li className="flex gap-2"><span className="text-emerald-400">1.</span> Enter the customer's details.</li>
                <li className="flex gap-2"><span className="text-emerald-400">2.</span> Search &amp; select a product — only in-stock items appear.</li>
                <li className="flex gap-2"><span className="text-emerald-400">3.</span> Adjust the final price if needed, then confirm.</li>
                <li className="flex gap-2"><span className="text-emerald-400">4.</span> The item is marked Sold and removed from available stock.</li>
                <li className="flex gap-2"><span className="text-emerald-400">5.</span> The amount is added to today's Cash Register automatically.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-dark rounded-[2rem] shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-dark-3 p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Today</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{pagination.total} <span className="text-sm font-bold text-gray-400">total sale{pagination.total === 1 ? "" : "s"} on record</span></p>
          </div>
        </div>
      </div>

      {/* ── Sale History ─────────────────────────────────────────────── */}
      <div className="mt-6 bg-white dark:bg-gray-dark rounded-[2rem] shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-dark-3 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Cash Sale History</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-2 border-2 border-transparent focus:border-[#E31E24] rounded-xl outline-none transition-all font-semibold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium w-56"
              />
            </div>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-3 py-2.5 bg-gray-50 dark:bg-dark-2 rounded-xl font-bold text-sm text-gray-700 dark:text-white outline-none border-2 border-transparent focus:border-[#E31E24]"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-3">
                {["Date", "Product", "IMEI", "Customer", "Phone", "Price", "Sold By"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 font-medium">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 font-medium">No cash sales yet</td></tr>
              ) : (
                history.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-50 dark:border-dark-3 hover:bg-gray-50/50 dark:hover:bg-dark-2/50 transition-colors">
                    <td className="py-3.5 px-3 whitespace-nowrap text-gray-500 dark:text-dark-6 font-medium">
                      {new Date(sale.created_at).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                      <div className="text-[10px] text-gray-400">{new Date(sale.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white whitespace-nowrap max-w-[220px] truncate">{sale.product_name}</td>
                    <td className="py-3.5 px-3 font-mono text-xs text-gray-500 dark:text-dark-6 whitespace-nowrap">{sale.imei_serial || "—"}</td>
                    <td className="py-3.5 px-3 font-semibold text-gray-700 dark:text-dark-6 whitespace-nowrap">{sale.customer_name}</td>
                    <td className="py-3.5 px-3 text-gray-500 dark:text-dark-6 whitespace-nowrap">{sale.customer_phone || "—"}</td>
                    <td className="py-3.5 px-3 font-black text-emerald-600 whitespace-nowrap">{PKR(sale.final_price)}</td>
                    <td className="py-3.5 px-3 text-gray-500 dark:text-dark-6 whitespace-nowrap">{sale.sold_by?.full_name || sale.sold_by?.username || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-dark-3">
          <p className="text-xs font-bold text-gray-400">
            Showing page {pagination.total === 0 ? 0 : page} of {pagination.totalPages} ({pagination.total} records)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="p-2 rounded-xl bg-gray-50 dark:bg-dark-2 text-gray-500 dark:text-dark-6 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-[#E31E24] text-white font-black text-sm min-w-[2.5rem] text-center">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="p-2 rounded-xl bg-gray-50 dark:bg-dark-2 text-gray-500 dark:text-dark-6 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
