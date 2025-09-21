import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { Commande, UserRole } from '../types';
import { Loader2, Clock } from 'lucide-react';

const useTimer = (startTime: string) => {
    const [elapsed, setElapsed] = useState(Date.now() - new Date(startTime).getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - new Date(startTime).getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Ticket: React.FC<{ commande: Commande, tables: any[], onReady: (id: string) => void, isReadOnly: boolean }> = ({ commande, tables, onReady, isReadOnly }) => {
    // Le minuteur utilise maintenant la date du dernier envoi pour se réinitialiser
    const timer = useTimer(commande.date_dernier_envoi_cuisine || commande.date_envoi_cuisine || commande.date_creation);
    
    const isTakeaway = commande.table_id === 99;
    const title = isTakeaway ? commande.id : tables.find(t => t.id === commande.table_id)?.nom || 'Desconocida';
    
    const totalMinutes = Math.floor((Date.now() - new Date(commande.date_dernier_envoi_cuisine || commande.date_envoi_cuisine || commande.date_creation).getTime()) / 60000);
    const { getIngredientById } = useRestaurantData();

    let colorConfig = {
        header: 'bg-blue-500',
        border: 'border-blue-500',
        button: 'bg-blue-500 hover:bg-blue-600',
        text: 'text-white'
    };

    if (totalMinutes >= 20) {
        colorConfig = {
            header: 'bg-red-500 animate-pulse',
            border: 'border-red-500',
            button: 'bg-red-500 hover:bg-red-600',
            text: 'text-white'
        };
    } else if (totalMinutes >= 10) {
        colorConfig = {
            header: 'bg-yellow-500',
            border: 'border-yellow-500',
            button: 'bg-yellow-500 hover:bg-yellow-600',
            text: 'text-white'
        };
    }

    // Afficher uniquement les articles du dernier envoi s'il existe, sinon tous les articles envoyés
    const itemsToShow = commande.date_dernier_envoi_cuisine
        ? commande.items.filter(item => item.date_envoi === commande.date_dernier_envoi_cuisine)
        : commande.items.filter(i => i.estado === 'enviado' || i.estado === 'nuevo');


    return (
        <div className={`bg-white rounded-lg shadow-md flex flex-col h-full border-4 ${colorConfig.border} ${isReadOnly ? 'opacity-80' : ''}`}>
            <div className={`p-3 rounded-t-lg flex items-center justify-center relative ${colorConfig.header}`}>
                <h3 className={`font-bold text-xl text-center flex-grow ${colorConfig.text}`}>{title}</h3>
                <div className={`absolute right-3 flex items-center font-mono text-lg ${colorConfig.text}`}>
                    <Clock size={20} className="mr-2"/>
                    <span>{timer}</span>
                </div>
            </div>
            <div className="p-3 space-y-2 flex-grow overflow-y-auto bg-white text-black">
                {itemsToShow.map(item => (
                    <div key={item.id} className="pb-2 mb-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start">
                            <span className="font-bold text-2xl mr-3">{item.quantite}x</span>
                            <span className="font-bold text-2xl">{item.produit.nom_produit}</span>
                        </div>
                        {(item.excluded_ingredients && item.excluded_ingredients.length > 0) && (
                            <div className="pl-6 text-sm text-red-600">
                                <strong>Sin:</strong> {item.excluded_ingredients.map(id => getIngredientById(id)?.nom).filter(Boolean).join(', ')}
                            </div>
                        )}
                        {item.commentaire && (
                            <div className="pl-6 text-sm text-yellow-800 italic">
                               "{item.commentaire}"
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="p-3 mt-auto bg-white">
                <button 
                    onClick={() => onReady(commande.id)}
                    disabled={isReadOnly}
                    className={`w-full py-3 font-bold text-lg rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${colorConfig.button} ${colorConfig.text}`}
                    title={isReadOnly ? "Acceso de solo lectura" : ""}
                >
                    LISTO
                </button>
            </div>
        </div>
    );
};


const Kitchen: React.FC = () => {
    const { getKitchenOrders, markOrderAsReady, tables, currentUserRole } = useRestaurantData();
    const [orders, setOrders] = useState<Commande[]>([]);
    const [loading, setLoading] = useState(true);
    
    const isReadOnly = currentUserRole?.permissions['/cocina'] === 'readonly';
    
    const fetchOrders = useCallback(async () => {
        try {
            const kitchenOrders = await getKitchenOrders();
            setOrders(kitchenOrders.sort((a,b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime()));
        } catch (error) {
            console.error("Error al cargar los pedidos de cocina:", error);
        } finally {
            setLoading(false);
        }
    }, [getKitchenOrders]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Refrescar cada 5 segundos
        return () => clearInterval(interval);
    }, [fetchOrders]);
    
    const handleOrderReady = async (commandeId: string) => {
        if (isReadOnly) return;
        // Met à jour la commande et rafraîchit les données de contexte en arrière-plan
        await markOrderAsReady(commandeId);
        // Rafraîchit l'état local de cette page pour une mise à jour immédiate de l'interface utilisateur
        await fetchOrders();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Pedidos en Cocina</h1>
                {isReadOnly && <span className="text-sm font-semibold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 px-3 py-1 rounded-full">Modo solo lectura</span>}
            </div>
            {orders.length === 0 ? (
                <div className="flex-grow flex justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <p className="text-xl text-gray-500">No hay pedidos pendientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-grow" style={{alignItems: 'start'}}>
                    {orders.map(order => (
                        <Ticket key={order.id} commande={order} tables={tables} onReady={handleOrderReady} isReadOnly={isReadOnly} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Kitchen;