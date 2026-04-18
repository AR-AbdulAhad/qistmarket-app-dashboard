"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X, Check, Plus } from "lucide-react";

interface Option {
  label: string;
  value: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string, selectedOption?: Option) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  allowCustom?: boolean;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search or type...",
  label,
  error,
  className = "",
  allowCustom = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEvents = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || portalRef.current?.contains(target)) {
          return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleEvents);
    return () => document.removeEventListener("mousedown", handleEvents);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const update = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      update();
      window.addEventListener("scroll", update);
      window.addEventListener("resize", update);
      return () => {
          window.removeEventListener("scroll", update);
          window.removeEventListener("resize", update);
      };
    }
  }, [isOpen]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
      <div 
        className={`flex items-center border-2 rounded-2xl transition-all ${isOpen ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100 dark:border-strokedark'} ${disabled ? 'opacity-50' : 'bg-white dark:bg-meta-4'}`}
      >
        <Search size={14} className="ml-4 text-gray-400" />
        <input
          type="text"
          value={isOpen ? search : (selected?.label || value)}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-3 bg-transparent outline-none text-sm font-bold dark:text-white"
        />
        <div className="flex items-center gap-1 pr-3">
            {value && !disabled && <X size={14} className="text-gray-300 hover:text-red-500 cursor-pointer" onClick={() => { onChange(""); setSearch(""); setIsOpen(false); }} />}
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && createPortal(
        <div 
          ref={portalRef}
          style={{
            position: 'absolute',
            top: coords.top + 5,
            left: coords.left,
            width: coords.width,
            zIndex: 9999999,
          }}
          className="bg-white dark:bg-boxdark border border-gray-100 dark:border-strokedark rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto py-2">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value, opt); setSearch(""); setIsOpen(false); }}
                  className={`px-5 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check size={14} />}
                </div>
              ))
            ) : (
              search && allowCustom ? (
                <div 
                  onClick={() => { onChange(search); setSearch(""); setIsOpen(false); }}
                  className="px-5 py-4 text-sm cursor-pointer hover:bg-primary/5 text-primary font-bold flex flex-col gap-1 border-y border-primary/10"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={14} /> Add Custom Entry
                  </div>
                  <span className="text-[10px] opacity-70 italic">"{search}"</span>
                </div>
              ) : (
                <div className="p-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {options.length === 0 && !search ? "Type to add custom..." : "No results"}
                </div>
              )
            )}
            
            {/* If there are results, but user wants something else and custom is allowed */}
            {filtered.length > 0 && allowCustom && search && !filtered.find(o => o.label.toLowerCase() === search.toLowerCase()) && (
              <div 
                onClick={() => { onChange(search); setSearch(""); setIsOpen(false); }}
                className="px-5 py-3 text-xs cursor-pointer hover:bg-gray-50 text-primary font-bold border-t border-gray-100 dark:border-strokedark"
              >
                + Use Custom Value: "{search}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      {error && <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
