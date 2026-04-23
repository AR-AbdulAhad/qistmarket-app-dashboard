"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { Search, Loader2 } from "lucide-react";

interface Purchaser {
  id: number;
  name: string;
  cnic_number: string;
  telephone_number: string;
}

interface CnicSearchProps {
  onSelect: (purchaser: Purchaser) => void;
  placeholder?: string;
  className?: string;
}

export default function CnicSearch({ onSelect, placeholder = "Search CNIC or Name...", className = "" }: CnicSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Purchaser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchPurchasers(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPurchasers = async (q: string) => {
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/complaints/search-purchasers?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
        setIsOpen(json.data.length > 0);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (purchaser: Purchaser) => {
    setQuery(purchaser.cnic_number);
    setIsOpen(false);
    onSelect(purchaser);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(results.length > 0)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 outline-none focus:border-[#ff3d3d] focus:ring-2 focus:ring-[#ff3d3d]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Search className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {results.map((purchaser) => (
            <button
              key={purchaser.id}
              type="button"
              onClick={() => handleSelect(purchaser)}
              className="flex w-full flex-col px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="font-medium text-gray-900 dark:text-white">{purchaser.name}</span>
              <span className="text-sm text-gray-500">{purchaser.cnic_number} • {purchaser.telephone_number}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
