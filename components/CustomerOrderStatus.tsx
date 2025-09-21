import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import type { Commande } from '../types';
import { Check, CircleDot, Loader2, ShoppingBag, PartyPopper, ChefHat, CreditCard } from 'lucide-react';

interface CustomerOrderStatusProps {
    orderId: string;
    onComplete: () => void;
}

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const OrderStatusTimeline: React.FC<{ status: 'pendiente' | 'recibido' | 'listo' | 'finalisee' | 'unknown' }> = ({ status }) => {
    const steps = [
        { name: 'Commande reçue', icon: Check },
        { name: 'Commande payée', icon: CreditCard },
        { name: 'En préparation', icon: ChefHat },
        { name: 'Prête à être récupérée', icon: ShoppingBag },
    ];

    const currentStepIndex = useMemo(() => {
        if (status === 'finalisee') return 4; // Les 4 étapes sont terminées
        if (status === 'listo') return 3;     // L'étape 3 est en cours
        if (status === 'recibido') return 2;  // L'étape 2 est en cours ("En préparation")
        if (status === 'pendiente') return 1; // "Commande payée" est en cours
        return -1; // État inconnu
    }, [status]);


    return (
        <div className="w-full max-w-4xl mx-auto">
            <ol className="relative flex justify-between items-start text-center">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <li key={step.name} className="flex-1">
                            <div className="flex flex-col items-center">
                               <div className={`flex items-center justify-center w-16 h-16 rounded-full ring-4 ${
                                    isCompleted ? 'bg-green-500 ring-green-900' :
                                    isCurrent ? 'bg-blue-600 ring-blue-900 animate-pulse-fast' :
                                    'bg-gray-700 ring-gray-600'
                                }`}>
                                    {isCurrent ? <CircleDot className="w-8 h-8 text-white" /> : <step.icon className="w-8 h-8 text-white" />}
                                </div>
                                <h3 className={`mt-3 font-semibold text-sm sm:text-base ${
                                    isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                                }`}>{step.name}</h3>
                            </div>
                        </li>
                    );
                })}
            </ol>
            <style>{`
                @keyframes pulse-fast {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.7;
                    }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

const CustomerOrderStatus: React.FC<CustomerOrderStatusProps> = ({ orderId, onComplete }) => {
    const { getCommandeById, getIngredientById } = useRestaurantData();
    const [commande, setCommande] = useState<Commande | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const fetchedCommande = await getCommandeById(orderId);
                if (fetchedCommande) {
                    setCommande(fetchedCommande);
                    if (fetchedCommande.statut === 'finalisee') {
                        return;
                    }
                } else {
                     setError('Impossible de trouver votre commande. Elle a peut-être été finalisée.');
                }
            } catch (e) {
                console.error(e);
                setError('Erreur lors de la récupération de votre commande.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
        const interval = setInterval(fetchOrder, 10000);

        return () => clearInterval(interval);
    }, [orderId, getCommandeById]);
    
    const orderStatus = useMemo(() => {
        if (!commande) return 'unknown';
        if (commande.statut === 'finalisee') return 'finalisee';
        if (commande.estado_cocina === 'listo') return 'listo';
        if (commande.estado_cocina === 'recibido') return 'recibido';
        if (commande.statut === 'pendiente_validacion') return 'pendiente';
        return 'unknown';
    }, [commande]);

    const total = useMemo(() => commande?.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0) || 0, [commande]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
                <p className="mt-4 text-lg text-white">Recherche de votre commande...</p>
            </div>
        );
    }
    
    if (error || !commande) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Oups !</h2>
                <p className="text-lg text-gray-300 mb-6">{error || 'Commande introuvable.'}</p>
                 <button onClick={onComplete} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl p-6 bg-black/60 backdrop-blur-sm rounded-lg text-white">
             {orderStatus === 'finalisee' ? (
                <div className="text-center">
                    <PartyPopper size={48} className="mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Votre commande est prête !</h2>
                    <p className="text-gray-300 max-w-lg mx-auto mb-2">Il ne reste plus qu'à attendre l'arrivée du domiciliario.</p>
                    <p className="text-gray-300 max-w-lg mx-auto mb-6">Merci de votre confiance.</p>
                    <button onClick={onComplete} className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-lg font-semibold">
                         Passer une nouvelle commande
                     </button>
                </div>
            ) : (
                <>
                    <h2 className="text-3xl md:text-4xl font-bold text-center" style={{ fontFamily: "'Lilita One', sans-serif" }}>Suivi de votre commande</h2>
                    <p className="mt-2 text-center text-lg text-gray-300">Temps d'attente estimé : 15-20 minutes</p>
                    
                    <div className="my-8 p-4 bg-black/20 rounded-lg">
                        <OrderStatusTimeline status={orderStatus} />
                    </div>

                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-center mb-4">Résumé de la commande</h3>
                        <div className="bg-white/10 p-4 rounded-md space-y-3 max-h-48 overflow-y-auto pr-2">
                             {commande.items.map(item => (
                                <div key={item.id} className="pb-2 border-b border-white/20 last:border-b-0">
                                    <div className="flex justify-between items-start text-sm">
                                        <p className="flex-grow"><span className="font-bold">{item.quantite}x</span> {item.produit.nom_produit}</p>
                                        <p className="font-semibold">{formatCOP(item.produit.prix_vente * item.quantite)}</p>
                                    </div>
                                    {(item.excluded_ingredients?.length || item.commentaire) && (
                                        <div className="mt-1 pl-5 text-xs text-gray-300">
                                            {item.excluded_ingredients && item.excluded_ingredients.length > 0 && (
                                                <p className="text-red-400">
                                                    <strong>Sans :</strong> {item.excluded_ingredients.map(id => getIngredientById(id)?.nom).filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                            {item.commentaire && (
                                                <p className="text-yellow-300 italic">
                                                    <strong>Note :</strong> "{item.commentaire}"
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold mt-3 pt-3 border-t border-white/30">
                            <span>Total</span>
                            <span>{formatCOP(total)}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerOrderStatus;