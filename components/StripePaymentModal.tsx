import React, { useState } from 'react';
import Card from './ui/Card';
import { CreditCard, Loader2, ShieldCheck, X } from 'lucide-react';
import type { Commande } from '../types';

interface StripePaymentModalProps {
    isOpen: boolean;
    onClose: () => void; // Called on explicit close or cancel
    onSuccess: () => void; // Called on successful payment
    commande: Commande | null;
}

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ isOpen, onClose, onSuccess, commande }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const total = commande?.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0) || 0;

    const handlePayment = async () => {
        setIsProcessing(true);
        // Simuler un appel réseau à Stripe
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
        onSuccess();
    };

    if (!isOpen) return null;

    const inputClasses = "w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md relative">
                 <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Cerrar">
                    <X size={24} />
                </button>
                <div className="text-center">
                    <CreditCard size={40} className="mx-auto text-blue-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Finaliser le Paiement</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Total à payer : <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{formatCOP(total)}</span></p>
                    <div className="text-center bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-2 rounded-md text-sm mb-6">
                        <p><strong>Mode de test :</strong> Aucune vraie carte n'est requise.</p>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Numéro de la carte</label>
                        <input type="text" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" className={inputClasses} />
                    </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                            <input type="text" placeholder="MM/AA" defaultValue="12/28" className={inputClasses} />
                        </div>
                        <div className="flex-1">
                             <label className="block text-sm font-medium mb-1">CVC</label>
                            <input type="text" placeholder="123" defaultValue="123" className={inputClasses} />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Nom sur la carte</label>
                        <input type="text" placeholder="Jean Dupont" defaultValue="Jean Dupont" className={inputClasses} />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center py-3 px-4 mt-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <ShieldCheck className="mr-2" />}
                        {isProcessing ? 'Traitement...' : `Payer ${formatCOP(total)}`}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default StripePaymentModal;
