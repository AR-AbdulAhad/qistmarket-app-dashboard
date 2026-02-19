import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    colorClass: string;
}

const StatCard = ({ title, value, icon, trend, colorClass }: StatCardProps) => (
    <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className={`flex h-11.5 w-11.5 items-center justify-center rounded-full bg-opacity-10 ${colorClass} text-white mb-4`}>
            {icon}
        </div>

        <div className="flex items-end justify-between">
            <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                    {value}
                </h4>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
            </div>

            {trend && (
                <span className="flex items-center gap-1 text-sm font-medium text-meta-3">
                    {trend}
                </span>
            )}
        </div>
    </div>
);

export const DeliveryStats = ({
    totalRiders,
    activeDeliveries,
    completedToday,
    returnedToday
}: {
    totalRiders: number,
    activeDeliveries: number,
    completedToday: number,
    returnedToday: number
}) => {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6 xl:gap-7.5 mb-8">
            <StatCard
                title="Total Riders"
                value={totalRiders}
                icon={<svg className="fill-blue-600 dark:fill-white" width="22" height="22" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}
                colorClass="bg-blue-600"
            />
            <StatCard
                title="In Transit"
                value={activeDeliveries}
                icon={<svg className="fill-yellow-500 dark:fill-white" width="22" height="22" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>}
                colorClass="bg-yellow-500"
            />
            <StatCard
                title="Delivered Today"
                value={completedToday}
                icon={<svg className="fill-green-600 dark:fill-white" width="22" height="22" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                colorClass="bg-green-600"
            />
            <StatCard
                title="Returned Today"
                value={returnedToday}
                icon={<svg className="fill-red-600 dark:fill-white" width="22" height="22" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>}
                colorClass="bg-red-600"
            />
        </div>
    );
};
