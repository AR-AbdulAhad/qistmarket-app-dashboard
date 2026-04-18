"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, FileText, ClipboardList, Loader2, X, Hash, MapPin, Phone, ArrowRight, UserCheck, ExternalLink } from "lucide-react";
import Cookies from "js-cookie";
import CustomerProfileModal from "./CustomerProfileModal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const statusColors: any = {
    'delivered': 'bg-green-500/10 text-green-500 border-green-500/20',
    'confirmed': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'in_progress': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    'cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
    'default': 'bg-gray-500/10 text-gray-500 border-gray-500/20'
};

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 3) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        setIsOpen(true);
        try {
            const res = await fetch(`${API_BASE}/api/outlet/search?query=${query}`, {
                headers: {
                    Authorization: `Bearer ${Cookies.get("auth_token")}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
            }
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setLoading(false);
        }
    };

    console.log("Search results:", results);

    return (
        <div className="relative w-full max-w-xl mx-4 group" ref={searchRef}>
            <div className={`relative flex items-center transition-all duration-500 ${isOpen && query.length >= 3 ? 'z-[1001]' : ''}`}>
                <div className="absolute left-5 text-gray-400 group-focus-within:text-primary transition-colors">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </div>
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setIsOpen(true)}
                    placeholder="Search Number, CNIC, IMEI, Name..."
                    className="w-full pl-14 pr-12 py-3.5 rounded-[22px] bg-gray-100 dark:bg-meta-4 border-2 border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-boxdark outline-none shadow-sm group-hover:shadow-md transition-all font-semibold text-sm"
                />
                {query && !loading && (
                    <button 
                        onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
                        className="absolute right-5 text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 3 && (
                <div className="absolute top-full mt-3 w-full bg-white dark:bg-boxdark rounded-[28px] border border-stroke dark:border-strokedark shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[1000] animate-fade-in-up">
                    <div className="p-5 bg-gray-50/80 dark:bg-meta-4/50 border-b border-stroke dark:border-strokedark flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Universal Matches ({results.length})</span>
                        </div>
                        {loading && <Loader2 size={14} className="animate-spin text-primary" />}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {results.length > 0 ? (
                            <div className="p-4 grid gap-4">
                                {results.map((item) => {
                                    const statusStyle = statusColors[item.status?.toLowerCase()] || statusColors.default;
                                    const purchaserPhoto = item.verification?.documents?.find((d: any) => d.document_type === 'photo' && d.person_type === 'purchaser')?.file_url;

                                    return (
                                        <div key={item.id} className="bg-white dark:bg-meta-4/20 rounded-2xl border border-stroke dark:border-strokedark hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden group/item">
                                            <div className="p-4">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="relative shrink-0">
                                                        <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden transition-transform group-hover/item:scale-105 shadow-sm">
                                                            {purchaserPhoto ? (
                                                                <img src={purchaserPhoto} alt={item.verification?.purchaser?.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={28} className="text-primary/40" />
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-boxdark ${item.status === 'delivered' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <h4 className="font-black text-gray-800 dark:text-white text-base  pr-2">
                                                                {item.verification?.purchaser?.name} 
                                                            </h4>
                                                            {/* <span className={`px-2.5 py-0.5 rounded-full border ${statusStyle} text-[8px] font-black uppercase tracking-widest shrink-0`}>
                                                                {item.status?.replace('_', ' ')}
                                                                </span> */}
                                                        </div>
                                                        <span className="text-gray-400 font-bold text-xs">S/O {item.father_name}</span>
                                                        <div className="space-y-1.5 mt-2">
                                                            <ResultMeta icon={<Phone size={11} />} text={item.verification?.purchaser?.telephone_number} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-stroke/50 dark:border-strokedark/50 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        <MapPin size={11} className="text-gray-400 shrink-0" />
                                                        {item.verification?.purchaser?.permanent_address && (
                                                            <span className="text-[10px] font-bold text-gray-400 truncate">{item.verification.purchaser.permanent_address}</span>
                                                        )}
                                                        {item.verification?.purchaser?.permanent_area || item.verification?.purchaser?.permanent_block || item.verification?.purchaser?.permanent_house_no || item.verification?.purchaser?.permanent_street || item.verification?.purchaser?.permanent_zone ? (
                                                            <span className="text-[10px] font-bold text-gray-400 truncate">{item.verification?.purchaser?.permanent_house_no || ''}, {item.verification?.purchaser?.permanent_block || ''}, {item.verification?.purchaser?.permanent_street || ''}, {item.verification?.purchaser?.permanent_area || ''}, {item.verification?.purchaser?.permanent_zone || ''}</span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <ActionIconButton 
                                                            icon={<User size={16} />} 
                                                            label="Profile"
                                                            color="blue"
                                                            onClick={() => { setSelectedProfile(item); setIsOpen(false); }}
                                                        />
                                                        <ActionIconButton 
                                                            icon={<FileText size={16} />} 
                                                            label="Order"
                                                            color="emerald"
                                                            href={`/outlet/orders/${item.id}`}
                                                        />
                                                        <ActionIconButton 
                                                            icon={<ArrowRight size={16} />} 
                                                            label="Ledger"
                                                            color="indigo"
                                                            href={`/outlet/installments?search=${encodeURIComponent(item.order_ref)}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : !loading ? (
                            <div className="p-16 text-center">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-meta-4 rounded-full flex items-center justify-center mx-auto mb-5 border border-stroke dark:border-strokedark">
                                    <Search size={32} className="text-gray-200" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">No matching records</h3>
                                <p className="text-xs text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                    Try searching with a full CNIC, WhatsApp number or Order reference ID.
                                </p>
                            </div>
                        ) : null}
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-meta-4/80 border-t border-stroke dark:border-strokedark text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search results are limited to top 10 matches</p>
                    </div>
                </div>
            )}

            <CustomerProfileModal 
                open={!!selectedProfile} 
                onClose={() => setSelectedProfile(null)} 
                data={selectedProfile} 
            />
        </div>
    );
}

function ResultMeta({ icon, text, isTruncate = false }: any) {
    return (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-0">
            <span className="shrink-0 text-primary/70">{icon}</span>
            <span className={`text-[11px] font-bold ${isTruncate ? 'truncate' : ''}`}>
                {text || '--'}
            </span>
        </div>
    );
}

function ActionIconButton({ icon, label, color, href, onClick }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-600',
        emerald: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-600',
        indigo: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-600',
    };

    const content = (
        <div className="relative group/tooltip">
            {icon}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-10 whitespace-nowrap">
                {label}
            </span>
        </div>
    );

    const className = `p-2.5 rounded-xl transition-all border border-transparent hover:text-white active:shadow-inner ${colors[color] || ''}`;

    if (href) return <a href={href} className={className}>{content}</a>;
    return <button onClick={onClick} className={className}>{content}</button>;
}
