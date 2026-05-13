"use client";

import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Users, 
  ShoppingBag, 
  RefreshCcw, 
  XCircle, 
  Clock, 
  Target 
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
}

interface RankingBoardProps {
  rankings: CsrRanking[];
  currentUserId?: number;
}

const RankingBoard: React.FC<RankingBoardProps> = ({ rankings, currentUserId }) => {
  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-white shadow-lg"><Trophy size={20} /></div>;
      case 2: return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-slate-700 shadow-lg"><Trophy size={20} /></div>;
      case 3: return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg"><Trophy size={20} /></div>;
      default: return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold">{rank}</div>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top 3 Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topThree.map((item) => (
          <div 
            key={item.userId}
            className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
              item.userId === currentUserId ? 'ring-2 ring-primary border-primary/20' : 'border-stroke'
            }`}
          >
            <div className="absolute -right-4 -top-4 opacity-10">
              <Trophy size={100} />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              {getRankBadge(item.rank)}
              <div className="flex items-center gap-1 text-sm font-medium">
                {item.trend > 0 ? (
                  <span className="flex items-center text-meta-3"><TrendingUp size={16} className="mr-1" /> Up</span>
                ) : item.trend < 0 ? (
                  <span className="flex items-center text-meta-1"><TrendingDown size={16} className="mr-1" /> Down</span>
                ) : (
                  <span className="text-gray-400">Steady</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/10 bg-gray-100 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={32} className="text-gray-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-black dark:text-white text-lg leading-tight">{item.name}</h3>
                  {item.userId === currentUserId && (
                    <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">@{item.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Score</p>
                <p className="text-xl font-bold text-primary">{item.score}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">Conversion</p>
                <p className="text-xl font-bold text-black">{item.successRate}%</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 flex items-center justify-center gap-1">
                <Users size={14} className="text-blue-500" />
                <span className="text-xs font-bold text-black">{item.uniqueCustomers} Unq</span>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 flex items-center justify-center gap-1">
                <ShoppingBag size={14} className="text-green-500" />
                <span className="text-xs font-bold text-black">{item.delivered} Del</span>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 flex items-center justify-center gap-1 col-span-2">
                <RefreshCcw size={14} className="text-purple-500" />
                <span className="text-xs font-bold text-black">{item.repeatCustomers} Repeat Sales</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stroke">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Sales</span>
                <span className="font-semibold text-black">{formatCurrency(item.totalSales)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark flex justify-between items-center">
          <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
            <Target size={20} className="text-primary" /> Performance Ranking
          </h3>
        </div>
        
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white xl:pl-11">Rank</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Sales Officer</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Unique Customers</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Delivered</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Repeat</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Score</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white text-right xl:pr-11">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((item) => (
                <tr 
                  key={item.userId} 
                  className={`border-b border-stroke hover:bg-gray-50/50 transition-colors dark:border-strokedark ${
                    item.userId === currentUserId ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-5 xl:pl-11">
                    <div className="flex items-center gap-2">
                      {getRankBadge(item.rank)}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <User size={20} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-black dark:text-white">{item.name}</h5>
                          {item.userId === currentUserId && (
                            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">@{item.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
                      <Users size={14} /> {item.uniqueCustomers}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                      <ShoppingBag size={14} /> {item.delivered}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-600">
                      <RefreshCcw size={14} /> {item.repeatCustomers}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <p className="font-bold text-primary">{item.score}</p>
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      {item.trend > 0 ? (
                        <TrendingUp size={10} className="text-meta-3" />
                      ) : item.trend < 0 ? (
                        <TrendingDown size={10} className="text-meta-1" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right xl:pr-11">
                    <p className="font-semibold text-black dark:text-white">{formatCurrency(item.totalSales)}</p>
                    <p className="text-[10px] text-gray-500">{item.successRate}% Success</p>
                  </td>
                </tr>
              ))}
              {rankings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No data available for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RankingBoard;
