import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import { X, RefreshCw } from 'lucide-react';
import type { HistoricCommande } from '../types';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    commande: HistoricCommande | null;
}

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, commande }) => {
    const navigate = useNavigate();

    const handleReorder = () => {
        if (!commande) return;
        // Stocker les articles dans la session pour que la page de commande puisse les récupérer
        sessionStorage.setItem('reorder', JSON.stringify(commande.items));
        navigate('/commande-client');
    };

    if (!isOpen || !commande) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Détails de la commande</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <p><strong>Date :</strong> {new Date(commande.date).toLocaleString('fr-FR')}</p>
                    <p><strong>Total :</strong> {formatCOP(commande.total)}</p>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2 border-t dark:border-gray-700 pt-3">
                    {commande.items.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                           <div className="flex justify-between items-start">
                                <p className="font-semibold">{item.produit.nom_produit}</p>
                                <p className="text-sm">{formatCOP(item.produit.prix_vente * item.quantite)}</p>
                           </div>
                           {(item.excluded_ingredients?.length || item.commentaire) && (
                                <div className="mt-1 pl-2 text-xs text-gray-500 dark:text-gray-400">
                                    {item.excluded_ingredients && item.excluded_ingredients.length > 0 && 
                                        <p className="text-red-600 dark:text-red-400"><strong>Sans:</strong> {item.excluded_ingredients.length} ingrédient(s)</p>
                                    }
                                    {item.commentaire &&
                                        <p className="italic">"{item.commentaire}"</p>
                                    }
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t dark:border-gray-600 flex justify-end">
                    <button onClick={handleReorder} className="flex items-center justify-center py-2 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                        <RefreshCw size={18} className="mr-2" />
                        Commander à nouveau
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default OrderHistoryModal;
