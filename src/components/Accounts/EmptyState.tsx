"use client";

type EmptyStateProps = {
  icon: any;
  title: string;
  description?: string;
};

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 dark:bg-dark-2 dark:text-slate-600">
        <Icon className="size-7" />
      </div>
      <div>
        <p className="font-semibold text-slate-500 dark:text-slate-300">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{description}</p>}
      </div>
    </div>
  );
}
