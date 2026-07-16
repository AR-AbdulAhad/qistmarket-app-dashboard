"use client";

import { ReactNode } from "react";

type PageHeaderProps = {
  icon: any;
  title: string;
  subtitle?: string;
  accent?: string;
  actions?: ReactNode;
};

export default function PageHeader({ icon: Icon, title, subtitle, accent = "bg-[#ff3d3d]/10 text-[#ff3d3d]", actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-dark dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
