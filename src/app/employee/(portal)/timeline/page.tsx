"use client";

import { useEffect, useState } from "react";
import { employeeFetch } from "@/lib/employee-api";

interface Event {
  id: number;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  document_url?: string;
}

const TYPE_COLORS: Record<string, string> = {
  joining: "bg-green",
  promotion: "bg-blue-DEFAULT",
  demotion: "bg-red",
  transfer: "bg-yellow-dark",
  increment: "bg-primary",
  warning: "bg-red",
  suspension: "bg-dark-4",
  review: "bg-green-dark",
};

export default function EmployeeTimelinePage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    employeeFetch("/employee/timeline").then((r) => setEvents(r.events));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark dark:text-white">Employment Timeline</h1>

      <div className="relative space-y-0">
        {events.length === 0 && <p className="text-gray-500">No timeline events yet.</p>}
        {events.map((event, i) => (
          <div key={event.id} className="relative flex gap-4 pb-8">
            {i < events.length - 1 && (
              <div className="absolute left-[15px] top-8 h-full w-0.5 bg-stroke dark:bg-stroke-dark" />
            )}
            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TYPE_COLORS[event.event_type] || "bg-gray-5"} text-xs font-bold text-white`}>
              {event.event_type[0].toUpperCase()}
            </div>
            <div className="flex-1 rounded-xl border border-stroke bg-white p-4 dark:border-stroke-dark dark:bg-dark-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-dark dark:text-white">{event.title}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-xs capitalize text-primary">{event.event_type.replace("_", " ")}</p>
              {event.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-6">{event.description}</p>}
              {event.document_url && (
                <a href={event.document_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                  View Letter PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
