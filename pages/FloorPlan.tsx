import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Table as TableIcon, Plus, Minus, X, Loader2, Clock, Soup, DollarSign } from 'lucide-react';
import type { Table } from '../types';
import ManageTablesModal from '../components/ManageTablesModal';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const ReadyTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(Date.now() - new Date(startTime).getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - new Date(startTime).getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="text-center">
            <div className="text-xs font-semibold flex items-center justify-center opacity-90">
                <Clock size={12} className="mr-1"/> LISTO HACE
            </div>
            <span className="text-2xl font-bold font-mono">
                {formattedTime}
            </span>
        </div>
    );
};

const OrderTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(Date.now() - new Date(startTime).getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - new Date(startTime).getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="text-center">
            <div className="text-xs font-semibold flex items-center justify-center opacity-90">
                <Clock size={12} className="mr-1"/> EN CURSO
            </div>
            <span className="text-2xl font-bold font-mono">
                {formattedTime}
            </span>
        </div>
    );
};

const TableCard: React.FC<{ table: Table }> = ({ table }) => {
    const navigate = useNavigate();
    const { createCommande, updateCommande, acknowledgeOrderReady } = useRestaurantData();
    
    const [showCouvertsInput, setShowCouvertsInput] = useState(false);
    const [numCouverts, setNumCouverts] = useState(table.capacite);
    const [isLoading, setIsLoading] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);

    const isOccupied = table.statut === 'occupee';

    const handleStartCommande = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoading(true);
        try {
            await createCommande(table.id, numCouverts);
            navigate(`/commande/${table.id}`);
        } catch (error) {
            console.error("Error al crear el pedido:", error);
            alert("No se pudo iniciar el pedido.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCouverts = async (e: React.MouseEvent, newCount: number) => {
        e.stopPropagation();
        if (newCount > 0 && table.commandeId) {
            await updateCommande(table.commandeId, { couverts: newCount });
        }
    };

    const handleCardClick = () => {
        if (isOccupied) {
            navigate(`/commande/${table.id}`);
        } else {
            setNumCouverts(table.capacite); // Reset to default on open
            setShowCouvertsInput(true);
        }
    };

    const handleDeliveredClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!table.commandeId || isDelivering) return;

        setIsDelivering(true);
        try {
            await acknowledgeOrderReady(table.commandeId);
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            alert("No se pudo confirmar la entrega.");
        } finally {
            setIsDelivering(false);
        }
    };
    
    const baseCardClasses = `relative flex flex-col p-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer h-52 w-full text-white`;
    
    let statusClasses = 'bg-green-500 dark:bg-green-600';
    if (table.isReady) {
        statusClasses = 'bg-red-500 dark:bg-red-600 animate-pulse-bright';
    } else if (table.kitchenStatus === 'servido') {
        statusClasses = 'bg-purple-600 dark:bg-purple-800';
    } else if (isOccupied) {
        statusClasses = 'bg-blue-600 dark:bg-blue-800';
    } else if (showCouvertsInput) {
        statusClasses = 'bg-yellow-400 dark:bg-yellow-600';
    }

    return (
        <div onClick={handleCardClick} className={`${baseCardClasses} ${statusClasses}`}>
            {showCouvertsInput ? (
                 <div className="flex flex-col h-full w-full justify-between text-gray-900">
                     <div className="w-full flex justify-between items-start">
                        <h3 className="font-bold">Número de cubiertos</h3>
                        <button onClick={(e) => { e.stopPropagation(); setShowCouvertsInput(false); }} className="p-1 rounded-full bg-black/10 hover:bg-black/20"><X size={16} /></button>
                     </div>
                     <div className="flex items-center space-x-2 my-2 self-center">
                         <button onClick={(e) => { e.stopPropagation(); setNumCouverts(c => Math.max(1, c - 1));}} className="p-2 rounded-full bg-gray-800 text-white"><Minus size={16}/></button>
                         <span className="text-3xl font-bold w-12 text-center">{numCouverts}</span>
                         <button onClick={(e) => { e.stopPropagation(); setNumCouverts(c => c + 1);}} className="p-2 rounded-full bg-gray-800 text-white"><Plus size={16}/></button>
                     </div>
                     <button onClick={handleStartCommande} disabled={isLoading} className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Iniciar'}
                    </button>
                </div>
            ) : (
                <>
                    {table.isReady && (
                        <span className="absolute top-2 right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                        </span>
                    )}
                    <div className="w-full text-center">
                         <span className="text-xl font-bold">{table.nom}</span>
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center">
                         {(() => {
                            if (table.isReady && table.readyTimestamp) {
                                return <ReadyTimer startTime={table.readyTimestamp} />;
                            }
                            if (table.kitchenStatus === 'servido' && table.totalCommande !== undefined) {
                                return (
                                    <div className="text-center">
                                        <div className="text-xs font-semibold opacity-90 flex items-center justify-center">
                                            <DollarSign size={12} className="mr-1"/>À PAYER
                                        </div>
                                        <span className="text-3xl font-bold font-mono">
                                            {formatCOP(table.totalCommande)}
                                        </span>
                                    </div>
                                );
                            }
                            if (table.kitchenStatus === 'recibido' && table.sentToKitchenTimestamp) {
                                return (
                                    <>
                                        <Soup size={48} className="mb-2 opacity-80" />
                                        <OrderTimer startTime={table.sentToKitchenTimestamp} />
                                    </>
                                );
                            }
                            if (isOccupied) {
                               return (
                                    <div className="text-center">
                                         <TableIcon size={48} />
                                         <span className="text-sm font-semibold uppercase tracking-wider mt-2">OCCUPÉE</span>
                                    </div>
                               )
                            }
                            return <TableIcon size={48} />;
                        })()}
                    </div>
                    <div className="h-10 w-full flex items-center justify-center">
                        {(isOccupied && !table.isReady) && table.couverts !== undefined ? (
                            <div className="flex items-center space-x-2 bg-black/20 rounded-full px-2 py-1">
                                <button onClick={(e) => handleUpdateCouverts(e, table.couverts! - 1)} className="p-1"><Minus size={14}/></button>
                                <span className="font-bold text-sm">{table.couverts} <span className="font-normal">cubiertos</span></span>
                                <button onClick={(e) => handleUpdateCouverts(e, table.couverts! + 1)} className="p-1"><Plus size={14}/></button>
                            </div>
                        ) : table.isReady && table.commandeId ? (
                            <button
                                onClick={handleDeliveredClick}
                                disabled={isDelivering}
                                className="px-4 py-2 bg-yellow-400 dark:bg-yellow-500 text-gray-900 font-bold uppercase rounded-lg text-sm hover:bg-yellow-300 dark:hover:bg-yellow-400 transition-colors flex items-center justify-center disabled:opacity-75 disabled:cursor-wait"
                            >
                                {isDelivering ? <Loader2 size={18} className="animate-spin" /> : 'Entregado'}
                            </button>
                        ) : (
                             <span className="text-sm font-semibold uppercase tracking-wider">Libre</span>
                        ) }
                    </div>
                     <style>{`
                        @keyframes pulse-bright {
                            0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
                            70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
                        }
                        .animate-pulse-bright {
                            animation: pulse-bright 2s infinite;
                        }
                    `}</style>
                </>
            )}
        </div>
    );
};

const FloorPlan: React.FC = () => {
    const { tables, loading, currentUserRole } = useRestaurantData();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    if (loading) return <div className="text-center p-8">Cargando plano del salón...</div>;
    
    const isAdmin = currentUserRole?.id === 'admin';

    const displayedTables = tables.filter(table => table.id < 90);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Plano del Salón</h1>
                 {isAdmin && (
                    <button 
                        onClick={() => setIsManageModalOpen(true)} 
                        className="px-4 py-2 rounded-md font-semibold bg-white text-gray-800 hover:bg-gray-200 border border-gray-300"
                    >
                        Gestionar Mesas
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {displayedTables.map(table => (
                    <TableCard 
                        key={table.id} 
                        table={table}
                    />
                ))}
            </div>
            {isAdmin && (
                <ManageTablesModal 
                    isOpen={isManageModalOpen}
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </div>
    );
};

export default FloorPlan;