
import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
    message: string;
    type: 'warning' | 'info';
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
    const baseClasses = "flex items-center p-4 rounded-lg";
    const typeClasses = {
        warning: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200",
        info: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
    };
    const Icon = type === 'warning' ? AlertTriangle : Info;

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <Icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{message}</span>
        </div>
    );
};

export default Alert;