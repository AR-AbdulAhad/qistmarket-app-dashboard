"use client";

import React, { useState } from 'react';
import { 
  Trophy, 
  User, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

interface CsrRanking {
  rank: number;
  userId: number;
  name: string;
  username: string;
  image?: string;
  uniqueCustomers: number;
  delivered: number;
  repeatCustomers: number;
  cancelled: number;
  expired: number;
  totalSales: number;
  score: number;
  trend: number;
  successRate: number;
  cancelRate: number;
  outletName?: string;
  target?: number;
  complaintsSolved: number;
  complaintsPending: number;
}

interface RankingBoardProps {
  rankings: CsrRanking[];
  currentUserId?: number;
}

const RankingBoard: React.FC<RankingBoardProps> = ({ rankings, currentUserId }) => {
  const [sortBy, setSortBy] = useState<'achievement' | 'sales' | 'score' | 'complaints'>('achievement');

  // Sort logic
  const sortedRankings = [...rankings].sort((a, b) => {
    if (sortBy === 'achievement') {
        const aPct = (a.target && a.target > 0) ? (a.delivered / a.target) : (a.delivered / 486);
        const bPct = (b.target && b.target > 0) ? (b.delivered / b.target) : (b.delivered / 486);
        return bPct - aPct;
    }
    if (sortBy === 'sales') return b.totalSales - a.totalSales;
    if (sortBy === 'complaints') return b.complaintsSolved - a.complaintsSolved;
    return b.score - a.score;
  }).map((r, i) => ({ ...r, displayRank: i + 1 }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col w-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 animate-in fade-in zoom-in-95 duration-700">
      {/* Sorting Tabs */}
      <div className="flex border-b border-gray-50 bg-gray-50/30 px-4 md:px-8 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'achievement', label: 'BY ACHIEVEMENT' },
          { id: 'sales', label: 'BY SALE AMOUNT' },
          { id: 'score', label: 'BY SCORE' },
          { id: 'complaints', label: 'BY COMPLAINTS' }
        ].map(tab => (
          <button 
              key={tab.id}
              onClick={() => setSortBy(tab.id as any)} 
              className={`whitespace-nowrap px-6 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${sortBy === tab.id ? 'border-[#E31E24] text-[#E31E24]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
              {tab.label}
          </button>
        ))}
      </div>

      {/* Table with fixed height and scroll */}
      <div className="overflow-x-auto w-full custom-scrollbar" style={{ maxHeight: '535px' }}>
        <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase">Rank</th>
                    <th className="px-4 py-4 text-[8px] font-black text-gray-400 uppercase w-[180px] md:w-[220px]">CSR Participant</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase text-center">Done</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase">Achievement</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase">Sale Amount</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase text-center">Complaints</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase text-center">Score</th>
                    <th className="px-6 py-4 text-[8px] font-black text-gray-400 uppercase text-right">Trend</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {sortedRankings.map((item) => {
                    const targetVal = item.target || 486; 
                    const achievementPct = Math.round((item.delivered / targetVal) * 100);
                    const isCurrentUser = item.userId === currentUserId;
                    const rank = item.displayRank;

                    return (
                        <tr key={item.userId} className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-3">
                                <div className="flex items-center justify-center">
                                    {rank <= 3 ? (
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-xl text-white shadow-md ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-slate-300' : 'bg-orange-300'}`}>
                                            <Trophy size={12} />
                                        </div>
                                    ) : (
                                        <span className="text-xs font-black text-gray-300">{rank}</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <User size={14} className="text-gray-200 m-auto mt-2" />}
                                    </div>
                                    <div>
                                        <span className={`text-xs font-black ${isCurrentUser ? 'text-[#E31E24]' : 'text-gray-800'}`}>{item.name}</span>
                                        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">@{item.username}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-3 text-center font-black text-gray-800 text-xs">{item.delivered}</td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${achievementPct >= 100 ? 'bg-emerald-500' : 'bg-[#E31E24]'}`} style={{ width: `${Math.min(100, achievementPct)}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-800">{achievementPct}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-3 font-black text-gray-800 text-xs">{formatCurrency(item.totalSales)}</td>
                            <td className="px-6 py-3">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-600">{item.complaintsSolved}</span>
                                        </div>
                                        <div className="w-px h-3 bg-gray-100"></div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare size={10} className="text-amber-500" />
                                            <span className="text-[10px] font-black text-amber-600">{item.complaintsPending}</span>
                                        </div>
                                    </div>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase mt-0.5">Solved / Pending</p>
                                </div>
                            </td>
                            <td className="px-6 py-3 text-center font-black text-[#E31E24] text-xs">{item.score.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right">
                                <div className={`flex items-center justify-end gap-1 font-black text-[9px] ${item.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {item.trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {Math.abs(item.trend || 0)}%
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingBoard;
