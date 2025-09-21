
// This file should be renamed to FloorPlan.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Table as TableIcon, User } from 'lucide-react';
import type { Table } from '../types';

const TableCard: React.FC<{ table: Table }> = ({ table }) => {
    const navigate = useNavigate();
    const isOccupied = table.statut === 'occupee';

    const statusClasses = isOccupied
        ? 'bg-blue-500 hover:bg-blue-600 text-white'
        : 'bg-green-500 hover:bg-green-600 text-white';

    const handleTableClick = () => {
        navigate(`/commande/${table.id}`);
    };

    return (
        <button
            onClick={handleTableClick}
            className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-yellow-400 ${statusClasses}`}
        >
            <TableIcon size={48} />
            <span className="text-xl font-bold mt-3">{table.nom}</span>
            <div className="flex items-center text-sm mt-1">
                <User size={14} className="mr-1" />
                <span>{table.capacite}</span>
            </div>
             <span className="text-xs font-semibold uppercase mt-2 tracking-wider">
                {isOccupied ? 'Occupée' : 'Libre'}
            </span>
        </button>
    );
};

const FloorPlan: React.FC = () => {
    const { tables, loading } = useRestaurantData();

    if (loading) return <div className="text-center p-8">Chargement du plan de salle...</div>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Plan de Salle</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map(table => (
                    <TableCard key={table.id} table={table} />
                ))}
            </div>
        </div>
    );
};

export default FloorPlan;
