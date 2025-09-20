import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import type { Commande } from '../types';
import { Loader2, Clock, CheckCircle, Eye, X } from 'lucide-react';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const ReceiptViewerModal: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="relative max-w-lg max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={imageUrl} alt="Comprobante de pago" className="rounded-lg object-contain max-w-full max-h-[90vh]" />
            <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-black rounded-full p-1 shadow-lg">
                <X size={24} />
            </button>
        </div>
    </div>
);

const useTimer = (startTime: string) => {
    const [elapsed, setElapsed] = useState(Date.now() - new Date(startTime).getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - new Date(startTime).getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const totalMinutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    return {
        formattedTime: `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        totalMinutes: totalMinutes
    };
};

const TakeawayTicket: React.FC<{ commande: Commande, onFinalize: (id: string) => void }> = ({ commande, onFinalize }) => {
    const total = useMemo(() => commande.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0), [commande.items]);
    const { getIngredientById } = useRestaurantData();
    const { formattedTime, totalMinutes } = useTimer(commande.date_listo_cuisine || new Date().toISOString());

    let colorConfig = {
        header: 'bg-blue-500',
        border: 'border-blue-500',
        button: 'bg-blue-500 hover:bg-blue-600',
        text: 'text-white'
    };

    if (totalMinutes >= 10) { // Rouge après 10 minutes d'attente
        colorConfig = {
            header: 'bg-red-500',
            border: 'border-red-500',
            button: 'bg-red-500 hover:bg-red-600',
            text: 'text-white'
        };
    } else if (totalMinutes >= 5) { // Jaune après 5 minutes
        colorConfig = {
            header: 'bg-yellow-500',
            border: 'border-yellow-500',
            button: 'bg-yellow-500 hover:bg-yellow-600',
            text: 'text-white'
        };
    }
    
    return (
        <div className={`bg-white rounded-lg shadow-md flex flex-col h-full border-4 ${colorConfig.border}`}>
            <div className={`p-3 rounded-t-lg flex items-center justify-center relative ${colorConfig.header}`}>
                <h3 className={`font-bold text-xl text-center flex-grow ${colorConfig.text}`}>{commande.id}</h3>
                 <div className={`absolute right-3 flex items-center font-mono text-lg ${colorConfig.text}`}>
                    <Clock size={20} className="mr-2"/>
                    <span>{formattedTime}</span>
                </div>
            </div>
             <div className="p-3 space-y-2 flex-grow overflow-y-auto bg-white text-black">
                 <p className="text-sm font-bold">Cliente: {commande.customer_name}</p>
                 <p className="text-sm">Dirección: {commande.customer_address}</p>
                 <div className="border-t border-gray-200 mt-2 pt-2">
                    {commande.items.map(item => (
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
            </div>
            <div className="p-3 mt-auto border-t border-gray-200 bg-white">
                 <div className="flex justify-between items-center text-xl font-bold mb-4 text-black">
                    <span>Total:</span>
                    <span>{formatCOP(total)}</span>
                </div>
                <button 
                    onClick={() => onFinalize(commande.id)}
                    className={`w-full py-3 font-bold text-lg rounded-md transition-colors flex items-center justify-center ${colorConfig.button} ${colorConfig.text}`}
                >
                    <CheckCircle size={20} className="mr-2" />
                    Confirmar Entrega
                </button>
            </div>
        </div>
    );
};


const PendingTicket: React.FC<{ commande: Commande, onValidate: (id: string) => void, onViewReceipt: (url: string) => void }> = ({ commande, onValidate, onViewReceipt }) => {
    const total = useMemo(() => commande.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0), [commande.items]);
    const { getIngredientById } = useRestaurantData();
    const { formattedTime, totalMinutes } = useTimer(commande.date_creation);

    let colorConfig = {
        header: 'bg-yellow-500 animate-pulse',
        border: 'border-yellow-500',
        button: 'bg-yellow-500 hover:bg-yellow-600',
        text: 'text-white'
    };
    if (totalMinutes >= 5) {
        colorConfig = {
            header: 'bg-red-500 animate-pulse',
            border: 'border-red-500',
            button: 'bg-red-500 hover:bg-red-600',
            text: 'text-white'
        };
    }

    return (
        <div className={`bg-white rounded-lg shadow-md flex flex-col h-full border-4 ${colorConfig.border}`}>
            <div className={`p-3 rounded-t-lg flex items-center justify-center relative ${colorConfig.header}`}>
                <h3 className={`font-bold text-xl text-center flex-grow ${colorConfig.text}`}>{commande.id}</h3>
                <div className={`absolute right-3 flex items-center font-mono text-lg ${colorConfig.text}`}>
                    <Clock size={20} className="mr-2"/>
                    <span>{formattedTime}</span>
                </div>
            </div>
            <div className="p-3 space-y-1 flex-grow overflow-y-auto bg-white text-black">
                <p className="text-sm font-bold">Cliente: {commande.customer_name}</p>
                <p className="text-sm">Dirección: {commande.customer_address}</p>
                <p className="font-bold mt-2">Artículos:</p>
                {commande.items.map(item => (
                    <div key={item.id} className="pb-1 mb-1 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start">
                            <span className="font-bold text-2xl mr-3">{item.quantite}x</span>
                            <span className="font-bold text-2xl">{item.produit.nom_produit}</span>
                        </div>
                        {(item.excluded_ingredients && item.excluded_ingredients.length > 0) && (
                            <div className="pl-5 text-xs text-red-600">
                                <strong>Sin:</strong> {item.excluded_ingredients.map(id => getIngredientById(id)?.nom).filter(Boolean).join(', ')}
                            </div>
                        )}
                        {item.commentaire && (
                            <div className="pl-5 text-xs text-yellow-800 italic">
                               "{item.commentaire}"
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="p-3 mt-auto border-t border-gray-200 bg-white">
                <div className="flex justify-between items-center text-xl font-bold mb-4 text-black">
                    <span>Total:</span>
                    <span>{formatCOP(total)}</span>
                </div>
                 {commande.receipt_image_base64 && (
                    <button 
                        onClick={() => onViewReceipt(commande.receipt_image_base64!)}
                        className="w-full py-2 mb-2 bg-gray-200 text-gray-800 font-bold text-md rounded-md hover:bg-gray-300 flex items-center justify-center"
                    >
                        <Eye size={18} className="mr-2" />
                        Ver Comprobante
                    </button>
                )}
                <button 
                    onClick={() => onValidate(commande.id)}
                    className={`w-full py-3 font-bold text-lg rounded-md flex items-center justify-center ${colorConfig.button} ${colorConfig.text}`}
                >
                    Validar y Enviar a Cocina
                </button>
            </div>
        </div>
    );
};

const Takeaway: React.FC = () => {
    const { readyTakeawayOrders, pendingTakeawayOrders, finaliserCommande, markCommandeAsPaid, validateAndSendTakeawayOrder, loading } = useRestaurantData();
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
    
    const visibleReadyOrders = useMemo(() => {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        return readyTakeawayOrders.filter(order => 
            order.date_listo_cuisine && new Date(order.date_listo_cuisine).getTime() > twentyFourHoursAgo
        ).sort((a,b) => new Date(a.date_listo_cuisine!).getTime() - new Date(b.date_listo_cuisine!).getTime());
    }, [readyTakeawayOrders]);

    const handleFinalize = async (commandeId: string) => {
        setIsProcessing(commandeId);
        try {
            await markCommandeAsPaid(commandeId);
            await finaliserCommande(commandeId);
        } catch (error) {
            console.error("Error al finalizar el pedido:", error);
            alert("No se pudo finalizar el pedido.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleValidate = async (commandeId: string) => {
        setIsProcessing(commandeId);
        try {
            await validateAndSendTakeawayOrder(commandeId);
        } catch (error) {
            console.error("Error al validar el pedido:", error);
            alert(`No se pudo validar el pedido: ${error}`);
        } finally {
            setIsProcessing(null);
        }
    };

    if (loading && !visibleReadyOrders.length && !pendingTakeawayOrders.length) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col space-y-8">
            {viewingReceipt && <ReceiptViewerModal imageUrl={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Pedidos Pendientes de Validación</h2>
                {pendingTakeawayOrders.length === 0 ? (
                    <div className="flex-grow flex justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-lg py-8">
                        <p className="text-gray-500">No hay pedidos pendientes de validación.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4" style={{alignItems: 'start'}}>
                        {pendingTakeawayOrders.map(order => (
                             <div key={order.id} className="relative">
                                <PendingTicket commande={order} onValidate={handleValidate} onViewReceipt={setViewingReceipt} />
                                {isProcessing === order.id && (
                                    <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-md">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Pedidos Listos para Entregar</h2>
                 {visibleReadyOrders.length === 0 ? (
                    <div className="flex-grow flex justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-lg py-8">
                        <p className="text-gray-500">No hay pedidos listos para ser recogidos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4" style={{alignItems: 'start'}}>
                        {visibleReadyOrders.map(order => (
                            <div key={order.id} className="relative">
                                <TakeawayTicket commande={order} onFinalize={handleFinalize} />
                                {isProcessing === order.id && (
                                    <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center rounded-md">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Takeaway;