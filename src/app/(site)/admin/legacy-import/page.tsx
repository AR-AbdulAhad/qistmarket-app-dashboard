'use client';

import React, { useCallback, useState } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, XCircle, Download, ArrowRight } from 'lucide-react';
import { useAuth } from "../../../../../contexts/AuthContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Fixed column order for the legacy paper-ledger spreadsheets (confirmed
// consistent across all sheets) — position-based, not header-name-based,
// since the sheet repeats header text like "Cnic" / "Contact No." for both
// granters, which would collide if mapped by name.
const COLUMNS = [
  'acc_no', 'g_no', 's_no', 'order_date', 'order_by', 'ins_date', 'bill_id',
  'purchaser_name', 'purchaser_cnic', 'purchaser_phone', 'purchaser_address',
  'item_price', 'item_model', 'serial', 'tenure_months', 'advance', 'installment',
  'grantor1_name', 'grantor1_cnic', 'grantor1_phone',
  'grantor2_name', 'grantor2_cnic', 'grantor2_phone',
  'pay1', 'pay2', 'pay3', 'pay4', 'remain',
] as const;

type LegacyRow = Record<(typeof COLUMNS)[number], any> & { _rowNum: number; _issues: string[] };

// Mirrors legacyImportController.js's VALID_STATUSES exactly. Every legacy
// row is an already-transacted historical sale, so these are the only two
// statuses that make sense here — both build the full order (delivery,
// installment ledger, 1Bill/SmartPay numbers).
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'delivered', label: 'Delivered (recommended — already-sold stock)' },
  { value: 'completed', label: 'Completed (fully paid off)' },
];

type ImportResult = { row: number; success: boolean; order_id?: number; error?: string; reconciliation_warning?: string | null };

function excelValueToIso(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function validateRow(row: LegacyRow): string[] {
  const issues: string[] = [];
  if (!row.purchaser_name) issues.push('Missing name');
  if (!row.purchaser_cnic) issues.push('Missing CNIC');
  if (!row.purchaser_phone) issues.push('Missing contact number');
  if (!row.item_price || isNaN(parseFloat(row.item_price))) issues.push('Missing/invalid item price');
  if (!row.tenure_months || isNaN(parseInt(row.tenure_months, 10))) issues.push('Missing/invalid tenure');
  if (!row.installment || isNaN(parseFloat(row.installment))) issues.push('Missing/invalid installment');
  return issues;
}

export default function LegacyImportPage() {
  const { user } = useAuth();
  const isSuperAdmin = (user?.role || "").toLowerCase() === "super admin";

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<LegacyRow[]>([]);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [defaultStatus, setDefaultStatus] = useState<string>('delivered');
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  const downloadDemoSheet = () => {
    try {
      const headers = [
        'ACC NO', 'G.NO', 'S.NO', 'DATE', 'ORDER BY', 'INS DATE', '1BILL ID',
        'Name', 'CNIC', 'Contact No.', 'Address',
        'ITEM PRICE', 'ITEM MODEL', 'SERIAL', 'Tenure', 'ADVANCE', 'INSTALLMENT',
        "Granter's 1 Name", 'Cnic', 'Contact No.',
        "Granter's 2 Name", 'Cnic', 'Contact No.',
        'PAY 1', 'PAY 2', 'PAY 3', 'PAY 4', 'remain',
      ];

      const sampleRows = [
        // Row 1: Delivered, ongoing installments (2 of 12 paid)
        [
          1, 1, 1, '04/06/2026', 'WALKING CUSTOMER', 1, '1017100015525265',
          'ADNAN AHSAN', '42101-9297807-5', '03153188174', 'FB AREA KARACHI',
          61500, 'ZTE V80 8/256', '862484082525265', 12, 6300, 4600,
          'MATHEW EMMANUAL', '42101-9237108-3', '03118959818',
          'NAVEED UL HASSAN', '42201-1866190-5', '03333387388',
          4600, 4600, '', '', 46000,
        ],
        // Row 2: Fully paid off (completed)
        [
          2, 2, 2, '10/01/2026', 'MUQADDAS', 2, '1017100015789412',
          'SANA YOUSUF', '42301-0633320-4', '03168125822', 'RAMSUAMI KARACHI',
          45300, 'OPPO A6X 6/128', '351122098765432', 6, 4800, 6750,
          'M IBAD KHAN', '42101-7547131-1', '03013321417',
          'M HASSAN', '42101-72170517', '03174732419',
          6750, 6750, 6750, 6750, 0,
        ],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Legacy Ledger');
      XLSX.writeFile(workbook, 'demo_legacy_import.xlsx');
      toast.success('Downloaded demo_legacy_import.xlsx successfully');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to download demo sheet');
    }
  };

  const parseFile = useCallback((selectedFile: File) => {
    setParsing(true);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        // header:1 -> array-of-arrays (positional), range:1 -> skip the header row.
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 1, defval: '' });

        const parsedRows: LegacyRow[] = raw
          .filter((r) => r.some((cell) => cell !== '' && cell !== null && cell !== undefined))
          .map((r, idx) => {
            const row: any = { _rowNum: idx + 2 }; // +2 = 1-indexed + header row
            COLUMNS.forEach((col, i) => {
              let v = r[i];
              if (col === 'order_date' || col === 'ins_date') v = excelValueToIso(v);
              row[col] = v;
            });
            row._issues = validateRow(row);
            return row as LegacyRow;
          });

        // Flag duplicate CNICs within the file itself.
        const cnicCounts: Record<string, number> = {};
        parsedRows.forEach((r) => {
          const c = String(r.purchaser_cnic || '').trim();
          if (c) cnicCounts[c] = (cnicCounts[c] || 0) + 1;
        });
        parsedRows.forEach((r) => {
          const c = String(r.purchaser_cnic || '').trim();
          if (c && cnicCounts[c] > 1) r._issues.push('Duplicate CNIC within this file');
        });

        setRows(parsedRows);
        setExcludedRows(new Set(parsedRows.filter((r) => r._issues.length > 0).map((r) => r._rowNum)));
      } catch (err) {
        console.error(err);
        toast.error('Could not read this file — make sure it is a valid .xlsx export of the legacy sheet.');
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setParsing(false);
      toast.error('Failed to read file');
    };
    reader.readAsBinaryString(selectedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!/\.xlsx?$/i.test(selected.name)) {
      toast.error('Please upload an .xlsx or .xls file');
      return;
    }
    setFile(selected);
    parseFile(selected);
  };

  const toggleExcluded = (rowNum: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum); else next.add(rowNum);
      return next;
    });
  };

  const includedRows = rows.filter((r) => !excludedRows.has(r._rowNum));

  const handleSubmit = async () => {
    if (includedRows.length === 0) {
      toast.error('No rows selected to import');
      return;
    }
    setSubmitting(true);
    setResults(null);
    try {
      const token = Cookies.get('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/admin-panel/legacy-import/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rows: includedRows.map(({ _rowNum, _issues, ...rest }) => rest),
          default_status: defaultStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');
      setResults(data.results || []);
      toast.success(data.message || 'Import complete');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <Breadcrumb pageName="Legacy Data Import" />
        <p className="text-gray-500 dark:text-gray-400">Only Super Admin (Head Office) can access this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Breadcrumb pageName="Legacy Data Import" />

      <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Upload Legacy Excel Sheet</h3>
              <p className="text-xs text-gray-400">Import historical sales records, installment ledgers & customer profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadDemoSheet}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Demo Excel Sheet
            </button>
            <Link
              href="/admin/legacy-import/pending"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm transition"
            >
              Pending Legacy Profiles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-sm">
          Upload the old paper-ledger .xlsx sheet (ACC NO ... remain, 28 columns). Each row becomes a full
          customer profile — order, customer, purchaser + guarantor records, and installment history —
          exactly like a normal completed sale. Photos and GPS location aren&apos;t in the sheet, so every
          imported profile is queued under <strong>Pending Legacy Profiles</strong> for staff to finish.
        </p>

        <div
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 transition cursor-pointer bg-gray-50 dark:bg-gray-800/50 mb-6 border-gray-200 dark:border-gray-700 hover:border-red-500"
          onClick={() => document.getElementById('legacy-upload')?.click()}
        >
          <input id="legacy-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <FileText className="w-14 h-14 text-red-600" />
              <p className="text-lg font-bold text-gray-800 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-300 font-bold">Click to upload the .xlsx sheet</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Default order status for this batch:</label>
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Every legacy row is treated as an already-transacted sale — the full order gets built either way
          (delivery, installment ledger, 1Bill/SmartPay numbers). &quot;Completed&quot; is for accounts that are
          fully paid off; &quot;Delivered&quot; also marks the exact handover date.
        </p>

        {parsing && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Parsing file…</p>}
      </div>

      {rows.length > 0 && (
        <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white">
              Preview — {rows.length} row(s), {includedRows.length} selected for import
            </h4>
            {rows.some((r) => r._issues.length > 0) && (
              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Rows with issues are unchecked by default — review before including them.</p>
            )}
          </div>
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/40 sticky top-0">
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-2 px-3">Include</th>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">1Bill ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">CNIC</th>
                  <th className="py-2 px-3">Contact</th>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Serial</th>
                  <th className="py-2 px-3">Tenure</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">Advance</th>
                  <th className="py-2 px-3">Installment</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 1 — Name</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 1 — CNIC</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 1 — Contact</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 2 — Name</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 2 — CNIC</th>
                  <th className="py-2 px-3 bg-red-50 dark:bg-red-900/10">Guarantor 2 — Contact</th>
                  <th className="py-2 px-3">Pay 1</th>
                  <th className="py-2 px-3">Pay 2</th>
                  <th className="py-2 px-3">Pay 3</th>
                  <th className="py-2 px-3">Pay 4</th>
                  <th className="py-2 px-3">Remain</th>
                  <th className="py-2 px-3">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <tr key={r._rowNum} className={excludedRows.has(r._rowNum) ? 'opacity-50' : ''}>
                    <td className="py-2 px-3">
                      <input type="checkbox" checked={!excludedRows.has(r._rowNum)} onChange={() => toggleExcluded(r._rowNum)} />
                    </td>
                    <td className="py-2 px-3 text-gray-400">{r._rowNum}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{r.bill_id}</td>
                    <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-200">{r.purchaser_name}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.purchaser_cnic}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.purchaser_phone}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.item_model}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.serial}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.tenure_months}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.item_price}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.advance}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.installment}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor1_name}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor1_cnic}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor1_phone}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor2_name}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor2_cnic}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 bg-red-50/50 dark:bg-red-900/5">{r.grantor2_phone}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.pay1}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.pay2}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.pay3}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.pay4}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.remain}</td>
                    <td className="py-2 px-3 text-red-600">{r._issues.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || includedRows.length === 0}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-red-600 text-white py-4 rounded-xl hover:bg-red-700 transition font-bold disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> <span>Importing…</span></>
            ) : (
              <><CheckCircle2 className="w-6 h-6" /> <span>Import {includedRows.length} row(s)</span></>
            )}
          </button>
        </div>
      )}

      {results && (
        <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-sm p-8">
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Results — {results.filter((r) => r.success).length}/{results.length} imported
          </h4>
          <div className="max-h-[360px] overflow-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-2 px-3">Row</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Order</th>
                  <th className="py-2 px-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((r) => (
                  <tr key={r.row}>
                    <td className="py-2 px-3 text-gray-400">{r.row + 1}</td>
                    <td className="py-2 px-3">
                      {r.success ? (
                        <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Imported</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Failed</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{r.order_id ? `#${r.order_id}` : '—'}</td>
                    <td className="py-2 px-3 text-amber-600">{r.error || r.reconciliation_warning || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
