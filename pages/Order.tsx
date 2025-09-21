import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import { Plus, X, Loader2, ArrowLeft, Utensils, Users, AlertTriangle, Send, Edit, Minus } from 'lucide-react';
import type { Produit, Commande, CommandeItem } from '../types';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const CustomizationModal: React.FC<{
    item: CommandeItem;
    onClose: () => void;
    onSave: (itemId: string, updates: { excluded_ingredients: number[], commentaire: string }) => void;
}> = ({ item, onClose, onSave }) => {
    const { getRecetteForProduit, getIngredientById } = useRestaurantData();
    const recette = getRecetteForProduit(item.produit.id);

    const [excludedIngredients, setExcludedIngredients] = useState<number[]>(item.excluded_ingredients || []);
    const [comment, setComment] = useState(item.commentaire || '');

    const handleIngredientToggle = (ingredientId: number) => {
        setExcludedIngredients(prev =>
            prev.includes(ingredientId)
                ? prev.filter(id => id !== ingredientId)
                : [...prev, ingredientId]
        );
    };

    const handleSave = () => {
        onSave(item.id, { excluded_ingredients: excludedIngredients, commentaire: comment });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold mb-2">Personalizar: {item.produit.nom_produit}</h2>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {recette && recette.items.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Ingredientes</h3>
                            <div className="space-y-2">
                                {recette.items.map(recetteItem => {
                                    const ingredient = getIngredientById(recetteItem.ingredient_id);
                                    if (!ingredient) return null;
                                    const isExcluded = excludedIngredients.includes(ingredient.id);
                                    return (
                                        <label key={ingredient.id} className="flex items-center p-2 rounded-md bg-gray-100 dark:bg-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!isExcluded}
                                                onChange={() => handleIngredientToggle(ingredient.id)}
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`ml-3 text-gray-800 dark:text-gray-200 ${isExcluded ? 'line-through' : ''}`}>
                                                {ingredient.nom}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Comentario adicional
                        </label>
                        <textarea
                            id="comment"
                            rows={3}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Ej: bien cocido, sin sal, etc."
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                </div>
            </Card>
        </div>
    );
};

const Order: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const navigate = useNavigate();
    const {
        produits, loading, getCommandeByTableId, updateCommande, sendOrderToKitchen,
        finaliserCommande, tables, productLowStockInfo,
        getIngredientById, cancelUnpaidCommande, categorias
    } = useRestaurantData();

    const [commande, setCommande] = useState<Commande | null>(null);
    const commandeRef = useRef<Commande | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState<CommandeItem | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

    const table = useMemo(() => tables.find(t => t.id === Number(tableId)), [tables, tableId]);
    
    useEffect(() => {
        commandeRef.current = commande;
    }, [commande]);

    // Gérer la récupération initiale et les mises à jour des données de la commande
    useEffect(() => {
        if (tableId) {
            const cmd = getCommandeByTableId(Number(tableId));
            if (cmd) {
                setCommande(cmd);
            } else if (!isFetching) {
                // Si la commande disparaît après le chargement initial, retourner au plan de salle
                navigate('/ventes');
            }
            
            if (isFetching) {
                setIsFetching(false);
            }
        }
    }, [tableId, getCommandeByTableId, navigate, isFetching]);

    // Gérer le nettoyage uniquement lors du démontage du composant
    useEffect(() => {
        return () => {
            // Utiliser la référence pour obtenir la commande la plus récente lors du nettoyage
            const currentCommande = commandeRef.current;
            if (currentCommande) {
                // Annuler la commande si elle n'a pas d'articles envoyés lorsque l'utilisateur quitte la page
                cancelUnpaidCommande(currentCommande.id);
            }
        };
    }, [cancelUnpaidCommande]); // `cancelUnpaidCommande` est stable, donc cet effet ne s'exécute qu'une seule fois

    const quantityInOrder = useMemo(() => {
        const itemMap = new Map<number, number>();
        if (commande) {
            for (const item of commande.items) {
                const currentQty = itemMap.get(item.produit.id) || 0;
                itemMap.set(item.produit.id, currentQty + item.quantite);
            }
        }
        return itemMap;
    }, [commande]);

    const handleUpdateCommande = async (updates: { items?: CommandeItem[], couverts?: number }) => {
        if (commande) {
            const updatedCommande = { ...commande, ...updates };
            setCommande(updatedCommande);
            try {
                await updateCommande(commande.id, updates);
            } catch (err) {
                setError("Error de sincronización.");
                // Re-fetch from context to get the true state
                if (tableId) {
                    const freshCmd = getCommandeByTableId(Number(tableId));
                    if(freshCmd) setCommande(freshCmd);
                }
            }
        }
    };

    const handleAddToCart = (produit: Produit) => {
        if (!commande) return;
    
        // Find an existing item for this product that has NO customizations and is not sent yet.
        const existingItem = commande.items.find(
            item =>
                item.produit.id === produit.id &&
                (!item.excluded_ingredients || item.excluded_ingredients.length === 0) &&
                (!item.commentaire || item.commentaire.trim() === '') &&
                item.estado === 'nuevo'
        );
    
        let newItems: CommandeItem[];
    
        if (existingItem) {
            // Increment quantity of existing item
            newItems = commande.items.map(item =>
                item.id === existingItem.id
                    ? { ...item, quantite: item.quantite + 1 }
                    : item
            );
        } else {
            // Add as a new item
            const newItem: CommandeItem = {
                id: `${produit.id}-${Date.now()}`,
                produit,
                quantite: 1,
                estado: 'nuevo',
            };
            newItems = [...commande.items, newItem];
        }
    
        handleUpdateCommande({ items: newItems });
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (!commande) return;
    
        const newItems = newQuantity <= 0 
            ? commande.items.filter(item => item.id !== itemId)
            : commande.items.map(item =>
                item.id === itemId
                    ? { ...item, quantite: newQuantity }
                    : item
            );
        
        handleUpdateCommande({ items: newItems });
    };

    const handleSaveCustomization = (itemId: string, updates: { excluded_ingredients: number[], commentaire: string }) => {
        if (!commande) return;
        handleUpdateCommande({ items: commande.items.map(item => item.id === itemId ? { ...item, ...updates } : item) });
    };

    const handleUpdateCouverts = (newCount: number) => {
        if (newCount > 0) handleUpdateCommande({ couverts: newCount });
    };

    const total = useMemo(() => commande?.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0) || 0, [commande]);
    const hasNewItems = useMemo(() => commande?.items.some(item => item.estado === 'nuevo') || false, [commande]);
    const isReadyButNotServed = commande?.estado_cocina === 'listo';

    const handleSendToKitchen = async () => {
        if (!commande || !hasNewItems) return;
        setIsSending(true);
        setError('');
        try {
            await sendOrderToKitchen(commande.id);
            navigate('/ventes');
        } catch (err: any) {
            setError(err.message || "Error al enviar a cocina.");
        } finally {
            setIsSending(false);
        }
    };

    const handleFinaliser = async () => {
        if (!commande || commande.items.length === 0 || hasNewItems || isReadyButNotServed) {
            if (hasNewItems) alert("Debe enviar todos los artículos a la cocina antes de finalizar.");
            if (isReadyButNotServed) alert("Debe marcar el pedido como 'Entregado' en el plano del salón antes de finalizar.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            await finaliserCommande(commande.id);
            navigate('/ventes');
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al finalizar.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const productsToDisplay = useMemo(() => {
        if (activeCategoryId === 'all') {
            const grouped = new Map<number, Produit[]>();
            produits.forEach(p => {
                const categoryProducts = grouped.get(p.categoria_id) || [];
                categoryProducts.push(p);
                grouped.set(p.categoria_id, categoryProducts);
            });

            return categorias
                .map(cat => ({
                    category: cat,
                    produits: (grouped.get(cat.id) || []).sort((a, b) => a.nom_produit.localeCompare(b.nom_produit))
                }))
                .filter(group => group.produits.length > 0);
        } else {
            const category = categorias.find(c => c.id === activeCategoryId);
            if (!category) return [];
            const categoryProducts = produits
                .filter(p => p.categoria_id === activeCategoryId)
                .sort((a, b) => a.nom_produit.localeCompare(b.nom_produit));

            return categoryProducts.length > 0 ? [{ category, produits: categoryProducts }] : [];
        }
    }, [produits, categorias, activeCategoryId]);

    if (loading || isFetching || !commande) return <div className="text-center p-8">Cargando el pedido...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
            {editingItem && <CustomizationModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveCustomization} />}
            <div className="lg:flex-1 flex flex-col">
                <div className="flex items-center mb-4 flex-shrink-0">
                    <button onClick={() => navigate('/ventes')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-4"><ArrowLeft /></button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Pedido - {table?.nom || `Mesa ${tableId}`}</h1>
                </div>
                <div className="mb-4 flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                         <button onClick={() => setActiveCategoryId('all')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategoryId === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Todos</button>
                        {categorias.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{cat.nom}</button>
                        ))}
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-6">
                        {productsToDisplay.map(({ category, produits: categoryProduits }) => (
                            <div key={category.id}>
                                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-3 sticky top-0 bg-gray-100 dark:bg-gray-900 py-2 z-10">{category.nom}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {categoryProduits.map(produit => {
                                        const quantity = quantityInOrder.get(produit.id) || 0;
                                        const isAgotado = produit.estado !== 'disponible';
                                        const lowStockInfo = productLowStockInfo.get(produit.id);
                                        
                                        return (
                                            <button
                                                key={produit.id}
                                                onClick={() => !isAgotado && handleAddToCart(produit)}
                                                disabled={isAgotado}
                                                className={`relative flex flex-col rounded-lg shadow-md text-white transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-yellow-400 h-40 overflow-hidden ${isAgotado ? 'cursor-not-allowed' : ''}`}
                                            >
                                                {produit.image_base64 ? (
                                                    <img src={produit.image_base64} alt={produit.nom_produit} className="absolute inset-0 w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="absolute inset-0 w-full h-full bg-gray-400 dark:bg-gray-600"></div>
                                                )}
                                                <div className={`absolute inset-0 w-full h-full flex flex-col p-2 justify-between ${isAgotado ? 'bg-black/70' : 'bg-black/50'}`}>
                                                    {quantity > 0 && (
                                                        <span className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white shadow-lg z-10">
                                                            {quantity}
                                                        </span>
                                                    )}
                                                    
                                                    <div className="flex-grow flex items-center justify-center p-1">
                                                        <span className="font-bold text-lg text-center leading-tight drop-shadow-md">{produit.nom_produit}</span>
                                                    </div>

                                                    <div className="flex-shrink-0 w-full text-center">
                                                        {isAgotado ? (
                                                            <span className="font-extrabold uppercase text-xl text-red-400 tracking-wider">Agotado</span>
                                                        ) : (
                                                            <>
                                                                <span className="font-semibold text-md text-white/90 drop-shadow">{formatCOP(produit.prix_vente)}</span>
                                                                {lowStockInfo && (
                                                                    <div className="flex items-center justify-center text-yellow-300 text-xs mt-1" title={`Bajo stock: ${lowStockInfo.join(', ')}`}>
                                                                        <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                                                                        <span className="truncate font-semibold">{lowStockInfo.join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Card className="lg:w-1/3 xl:w-1/4 flex flex-col h-full">
                <h2 className="text-2xl font-bold flex items-center mb-2 flex-shrink-0"><Utensils className="mr-2" /> Pedido</h2>

                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-4 flex-shrink-0">
                    <span className="font-semibold flex items-center"><Users size={18} className="mr-2" /> Cubiertos</span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleUpdateCouverts(commande.couverts - 1)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"><Minus size={16} /></button>
                        <span className="font-bold text-lg w-8 text-center">{commande.couverts}</span>
                        <button onClick={() => handleUpdateCouverts(commande.couverts + 1)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"><Plus size={16} /></button>
                    </div>
                </div>
                
                {isReadyButNotServed && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-md text-sm mb-4 flex items-start flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>El pedido está listo. Por favor, márquelo como "Entregado" en el plano del salón antes de finalizar.</span>
                    </div>
                )}

                {error && <p className="bg-red-100 text-red-700 p-2 rounded-md text-sm mb-4 flex-shrink-0">{error}</p>}

                <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                    {commande.items.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center mt-8">El pedido está vacío.</p>
                    ) : (
                        <div className="space-y-2">
                            {commande.items.map(item => {
                                const isSent = item.estado === 'enviado';
                                return (
                                    <div key={item.id} className={`p-2 rounded-md ${isSent ? 'bg-gray-200 dark:bg-gray-800 opacity-70' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 pr-2">
                                                <p className="font-semibold text-sm">{item.produit.nom_produit}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatCOP(item.produit.prix_vente * item.quantite)}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {isSent ? (
                                                    <span className="font-bold text-lg w-12 text-center">{item.quantite}x</span>
                                                ) : (
                                                    <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-0.5">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite - 1)}
                                                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                                                            aria-label="Reducir cantidad"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="font-bold text-sm w-6 text-center">{item.quantite}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantite + 1)}
                                                            className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"
                                                            aria-label="Aumentar cantidad"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setEditingItem(item)}
                                                    disabled={isSent}
                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Personalizar item"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {(item.excluded_ingredients?.length || item.commentaire) && (
                                            <div className="mt-1 pl-1 text-xs">
                                                {item.excluded_ingredients && item.excluded_ingredients.length > 0 && (
                                                    <p className="text-red-600 dark:text-red-400">
                                                        <strong>Sin:</strong> {item.excluded_ingredients.map(id => getIngredientById(id)?.nom).filter(Boolean).join(', ')}
                                                    </p>
                                                )}
                                                {item.commentaire && (
                                                    <p className="text-yellow-800 dark:text-yellow-300 italic">"{item.commentaire}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t dark:border-gray-700 flex-shrink-0">
                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>{formatCOP(total)}</span>
                    </div>
                    <button onClick={handleSendToKitchen} disabled={isSending || !hasNewItems} className="w-full flex justify-center items-center py-3 px-4 mb-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
                        {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="flex items-center"><Send size={18} className="mr-2" /> Enviar a Cocina</div>}
                    </button>
                    <button 
                        onClick={handleFinaliser} 
                        disabled={isSubmitting || commande.items.length === 0 || hasNewItems || isReadyButNotServed} 
                        className="w-full flex justify-center items-center py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed" 
                        title={
                            hasNewItems ? "Debe enviar todos los artículos a la cocina" : 
                            isReadyButNotServed ? "Debe marcar el pedido como 'Entregado' primero" : ""
                        }
                    >
                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar y Pagar'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default Order;