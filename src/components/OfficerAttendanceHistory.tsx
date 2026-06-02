'use client';

import React from 'react';
import { formatExactDate, isExactToday } from "@/utils/dateUtils";


interface Session {
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}

interface DailyStats {
  date: string;
  sessions: Session[];
}

interface OfficerAttendanceHistoryProps {
  dailyStats: DailyStats[];
  title?: string;
  expectedDailyHours?: string;
}

export const OfficerAttendanceHistory: React.FC<OfficerAttendanceHistoryProps> = ({
  dailyStats,
  title = 'Monthly Attendance',
  expectedDailyHours = '8.00',
}) => {
  if (!dailyStats || dailyStats.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-4 text-center text-sm text-gray-500">No attendance data available</p>
      </div>
    );
  }

  // Parse expected daily hours safely
  const safeParsedExpected = parseFloat(expectedDailyHours?.toString() || '8.00');
  const safeExpectedDailyHours = isNaN(safeParsedExpected) ? 8.00 : safeParsedExpected;

  // Sort by date descending (newest first)
  const sortedStats = [...dailyStats].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate stats safely
  const totalOnlineHours = sortedStats.reduce((sum, stat) => {
    const dayTotal = (stat.sessions || []).reduce((s, sess) => s + (sess.duration_minutes || 0), 0);
    return sum + dayTotal / 60;
  }, 0);
  const totalExpectedHours = sortedStats.length * safeExpectedDailyHours;
  const attendancePercentage = totalExpectedHours > 0 
    ? ((totalOnlineHours / totalExpectedHours) * 100).toFixed(1)
    : '0';
  const safeAttendancePercentage = isNaN(parseFloat(attendancePercentage)) ? '0' : attendancePercentage;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{totalOnlineHours.toFixed(2)}h</p>
          <p className="text-xs text-gray-500">
            {safeAttendancePercentage}% attendance
          </p>
        </div>
      </div>


      <div className="mt-4 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {sortedStats.map((stat, idx) => {
            const isToday = isExactToday(stat.date);
            const sessions = stat.sessions || [];
            const dayTotalMinutes = sessions.reduce((sum, sess) => sum + (sess.duration_minutes || 0), 0);
            const dayTotalHours = dayTotalMinutes / 60;

            return (
              <div
                key={idx}
                className={`rounded-lg p-3 ${isToday ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isToday ? 'text-green-900' : 'text-gray-900'}`}> 
                    {formatExactDate(stat.date, 'ddd, MMM DD')}
                    {isToday && <span className="ml-2 text-xs text-green-600 font-semibold">TODAY</span>}
                  </p>
                  <span className="text-xs text-gray-600">Total: <span className="font-semibold text-green-600">{dayTotalHours.toFixed(2)}h</span></span>
                </div>
                {/* Session breakdown */}
                <div className="mt-2 ml-2">
                  {sessions.length === 0 ? (
                    <span className="text-xs text-gray-400">No sessions</span>
                  ) : (
                    <ul className="space-y-1">
                      {sessions.map((sess, sidx) => {
                        
                        const duration = sess.duration_minutes || 0;
                        return (
                          <li key={sidx} className="flex items-center gap-2 text-xs">
                            <span className="font-mono text-blue-700">
                              {formatExactDate(sess.start_time, 'hh:mm A')}
                              {' - '}
                              {sess.end_time ? formatExactDate(sess.end_time, 'hh:mm A') : <span className="text-orange-500">Ongoing</span>}
                            </span>
                            <span className="ml-2 text-gray-500">({(duration / 60).toFixed(2)}h)</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-gray-600">Total Online</p>
          <p className="text-lg font-bold text-blue-600">{totalOnlineHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center">
          <p className="text-xs text-gray-600">Expected</p>
          <p className="text-lg font-bold text-purple-600">{totalExpectedHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-xs text-gray-600">Attendance</p>
          <p className="text-lg font-bold text-green-600">{safeAttendancePercentage}%</p>
        </div>
      </div>
    </div>
  );
};
