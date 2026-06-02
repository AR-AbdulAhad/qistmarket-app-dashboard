'use client';

import React from 'react';
import { formatExactDate } from "@/utils/dateUtils";

interface ProfileHistory {
  updatedAt: string;
  previous?: {
    bike_km_range?: number;
    working_hours_start?: string;
    working_hours_end?: string;
  };
  updated?: {
    bike_km_range?: number;
    working_hours_start?: string;
    working_hours_end?: string;
  };
}

interface OfficerProfileHistoryProps {
  history: ProfileHistory[];
  title?: string;
}

// Convert 24-hour time (HH:MM) to 12-hour format
const convertTo12HourFormat = (time?: string): string => {
  if (!time) return "Not set";

  // Agar full datetime aa raha ho
  if (time.includes(" ")) {
    return formatExactDate(time, "h:mm A");
  }

  // Agar sirf HH:mm:ss ya HH:mm ho
  return formatExactDate(`2000-01-01T${time}`, "h:mm A");
};

export const OfficerProfileHistory: React.FC<OfficerProfileHistoryProps> = ({
  history,
  title = 'Profile History',
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-4 text-center text-sm text-gray-500">No profile changes yet</p>
      </div>
    );
  }

  // Sort by date descending (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
        {sortedHistory.map((entry, idx) => {
          const formattedDate = formatExactDate(entry.updatedAt, 'dddd, MMMM D, YYYY'); // e.g., "Monday, April 1, 2026"
          const formattedTime = formatExactDate(entry.updatedAt, 'h:mm:ss A'); // e.g., "3:45:30 PM"
          
          return (
            <div
              key={idx}
              className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-50/30 p-4 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Date and Time Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                    📅 {formattedDate}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    🕐 {formattedTime}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 uppercase">
                  Updated
                </span>
              </div>

              <div className="border-t border-blue-200 pt-3 space-y-2.5 text-sm">
                {/* Bike KM Range */}
                {entry.previous?.bike_km_range !== undefined &&
                  entry.updated?.bike_km_range !== undefined && (
                    <div className="flex items-start justify-between bg-white p-2.5 rounded border border-blue-100">
                      <span className="text-gray-700 font-medium">🏍️ Bike KM Range:</span>
                      <span className="font-medium text-right">
                        <span className="block text-gray-500 text-xs mb-1">
                          Previous: {entry.previous.bike_km_range} km
                        </span>
                        <span className="block text-green-600 font-bold">
                          Updated: {entry.updated.bike_km_range} km
                        </span>
                      </span>
                    </div>
                  )}

                {/* Working Hours */}
                {entry.previous?.working_hours_start !== undefined &&
                  entry.updated?.working_hours_start !== undefined && (
                    <div className="flex items-start justify-between bg-white p-2.5 rounded border border-blue-100">
                      <span className="text-gray-700 font-medium">⏰ Working Hours:</span>
                      <span className="font-medium text-right">
                        <span className="block text-gray-500 text-xs mb-1">
                          Previous: {formatExactDate(entry.previous.working_hours_start, 'h:mm A')} - {formatExactDate(entry.previous.working_hours_end, 'h:mm A')}
                        </span>
                        <span className="block text-green-600 font-bold">
                          Updated: {formatExactDate(entry.updated.working_hours_start, 'h:mm A')} - {formatExactDate(entry.updated.working_hours_end, 'h:mm A')}
                        </span>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
