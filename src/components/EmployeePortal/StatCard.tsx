interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, subtitle, icon, color = "bg-primary" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-stroke-dark dark:bg-dark-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-6">{title}</p>
          <p className="mt-2 text-2xl font-bold text-dark dark:text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
