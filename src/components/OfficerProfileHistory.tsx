'use client';

import React from 'react';
import dayjs from 'dayjs';

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

// Helper function to convert 24-hour time to 12-hour format
const convertTo12HourFormat = (time24: string | undefined): string => {
  if (!time24) return 'Not set';
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time24;
  }
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
          const date = dayjs(entry.updatedAt);
          const formattedDate = date.format('dddd, MMMM D, YYYY'); // e.g., "Monday, April 1, 2026"
          const formattedTime = date.format('h:mm:ss A'); // e.g., "3:45:30 PM"
          
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
                        <span className="block text-gray-500 line-through text-xs mb-1">
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
                        <span className="block text-gray-500 line-through text-xs mb-1">
                          Previous: {convertTo12HourFormat(entry.previous.working_hours_start)} - {convertTo12HourFormat(entry.previous.working_hours_end)}
                        </span>
                        <span className="block text-green-600 font-bold">
                          Updated: {convertTo12HourFormat(entry.updated.working_hours_start)} - {convertTo12HourFormat(entry.updated.working_hours_end)}
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
