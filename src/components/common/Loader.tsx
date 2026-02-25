import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    text?: string;
    className?: string;
}

const Loader = ({ text = 'Loading...', className = 'py-20' }: LoaderProps) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            {text && <p className="text-gray-500 animate-pulse font-medium">{text}</p>}
        </div>
    );
};

export default Loader;
