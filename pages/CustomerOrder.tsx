import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurantData } from '../hooks/useRestaurantData';
import { ShoppingCart, ChefHat, Loader2, ArrowLeft, Edit, AlertTriangle, X, UploadCloud, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import type { Produit, CommandeItem, Commande, HistoricCommandeItem } from '../types';
import { customerOrderHistoryService } from '../services/customerOrderHistoryService';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const TAKEAWAY_TABLE_ID = 99;

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

const ReceiptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }) => Promise<void>;
    cart: CommandeItem[];
    total: number;
    isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, cart, total, isSubmitting }) => {
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setReceipt(file);
            const previewUrl = URL.createObjectURL(file);
            setReceiptPreview(previewUrl);
        }
    };
    
    useEffect(() => {
        // Nettoyer l'URL de l'aperçu pour éviter les fuites de mémoire
        return () => {
            if (receiptPreview) {
                URL.revokeObjectURL(receiptPreview);
            }
        };
    }, [receiptPreview]);

    const isFormValid = useMemo(() => {
        return fullName.trim() !== '' && address.trim() !== '' && paymentMethod === 'Transferencia' && receipt !== null;
    }, [fullName, address, paymentMethod, receipt]);
    
    const provisionalOrderId = useMemo(() => `WEB-${new Date().toISOString().slice(5, 16).replace(/[-T:]/g, '')}`, []);

    const handleShareAndSubmit = async () => {
        if (!isFormValid || isSubmitting || !receipt) return;
        
        let clipboardMessage = "Se adjuntó el comprobante de pago.";
        try {
            if (navigator.clipboard && navigator.clipboard.write && receipt) {
                const blob = receipt.slice(0, receipt.size, receipt.type);
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                clipboardMessage = "El comprobante de pago fue copiado. Por favor, péguelo en el chat.";
            }
        } catch (err) {
            console.error('Failed to copy image to clipboard:', err);
        }

        await onSubmit({ fullName, address, paymentMethod, receipt });

        const cartDetails = cart.map(item => `- ${item.quantite}x ${item.produit.nom_produit}`).join('\n');
        const message = `
Hola, quisiera confirmar el siguiente pedido para entrega:
*Pedido #${provisionalOrderId}*

*Cliente:* ${fullName}
*Dirección de Entrega:* ${address}
*Método de Pago:* ${paymentMethod}

*Resumen del Pedido:*
${cartDetails}

*TOTAL:* *${formatCOP(total)}*

*${clipboardMessage}*
¡Gracias!
        `.trim().replace(/\n\s*\n/g, '\n\n');

        const phoneNumber = '573226314841';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm flex flex-col" style={{ aspectRatio: '9 / 16', maxHeight: '90vh' }}>
                <div className="p-4 border-b dark:border-gray-700 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Comprobante de Pedido</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pedido #{provisionalOrderId}</p>
                </div>

                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    <div className="space-y-2">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between items-start text-sm">
                                <div className="flex-1 pr-2"><p className="font-semibold">{item.quantite}x {item.produit.nom_produit}</p></div>
                                <p className="font-mono">{formatCOP(item.produit.prix_vente * item.quantite)}</p>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-between items-baseline text-lg font-bold pt-2 border-t dark:border-gray-600">
                        <span>TOTAL:</span><span className="font-mono">{formatCOP(total)}</span>
                    </div>

                    <div className="space-y-3 pt-3 border-t dark:border-gray-600">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Apellido completo</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full text-sm p-2 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm" placeholder="Su nombre y apellido" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Dirección de entrega</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full text-sm p-2 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm" placeholder="Su dirección completa" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Tipo de pago</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full text-sm p-2 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm">
                                <option value="" disabled>Seleccionar...</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Efectivo" disabled>Efectivo - No Disponible por el momento</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Comprobante de Transferencia</label>
                            <label htmlFor="receipt-upload" className="mt-1 w-full text-sm p-2 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                {receiptPreview ? (
                                    <div className="relative">
                                        <img src={receiptPreview} alt="Aperçu du reçu" className="h-16 w-auto rounded" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-bold">Changer</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-8 h-8 text-gray-400" />
                                        <span className="text-xs text-center text-gray-500 dark:text-gray-400">Cliquer pour choisir un fichier</span>
                                    </>
                                )}
                            </label>
                            <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 mt-auto">
                     <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
                        Complete todos los campos para activar el botón.
                    </p>
                    <button onClick={handleShareAndSubmit} disabled={!isFormValid || isSubmitting} className="w-full flex justify-center items-center py-3 px-4 mb-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Compartir por WhatsApp y Enviar'}
                    </button>
                    <button onClick={onClose} disabled={isSubmitting} className="w-full text-center py-1 text-sm text-gray-600 dark:text-gray-300 hover:underline">
                        Volver y editar pedido
                    </button>
                </div>
            </div>
        </div>
    );
};


const CustomerOrder: React.FC = () => {
    const { 
        produits, categorias, loading, submitTakeawayOrderForValidation, 
        getIngredientById, productLowStockInfo
    } = useRestaurantData();
    const navigate = useNavigate();
    const [cart, setCart] = useState<CommandeItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
    const [editingItem, setEditingItem] = useState<CommandeItem | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    useEffect(() => {
        try {
            const reorderData = sessionStorage.getItem('reorder');
            if (reorderData) {
                const historicItems: HistoricCommandeItem[] = JSON.parse(reorderData);
                const newCartItems: CommandeItem[] = historicItems.map(historicItem => ({
                    id: `${historicItem.produit.id}-${Date.now()}-${Math.random()}`,
                    produit: historicItem.produit,
                    quantite: historicItem.quantite,
                    estado: 'nuevo',
                    commentaire: historicItem.commentaire,
                    excluded_ingredients: historicItem.excluded_ingredients,
                }));
                setCart(newCartItems);
                sessionStorage.removeItem('reorder');
            }
        } catch (e) {
            console.error("Erreur lors de la tentative de re-commande :", e);
            sessionStorage.removeItem('reorder');
        }
    }, []);

    const handleAddToCart = (produit: Produit) => {
        const newItem: CommandeItem = { id: `${produit.id}-${Date.now()}`, produit, quantite: 1, estado: 'nuevo', commentaire: '', excluded_ingredients: [] };
        setCart(prevCart => [...prevCart, newItem]);
    };
    
    const handleRemoveItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleSaveCustomization = (itemId: string, updates: { excluded_ingredients: number[], commentaire: string }) => {
        setCart(cart.map(item => item.id === itemId ? { ...item, ...updates } : item));
        setEditingItem(null);
    };
    
    const total = useMemo(() => cart.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0), [cart]);

    const totalQuantityPerProduct = useMemo(() => {
        const quantities = new Map<number, number>();
        cart.forEach(item => {
            quantities.set(item.produit.id, (quantities.get(item.produit.id) || 0) + item.quantite);
        });
        return quantities;
    }, [cart]);

    const handleSubmitOrder = async (customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }) => {
        if (cart.length === 0) return;
        setIsSubmitting(true);
        try {
            const itemsForCommande = cart.map(item => ({ ...item, estado: 'nuevo' as 'nuevo' }));
            const newCommande = await submitTakeawayOrderForValidation(itemsForCommande, customerInfo);

            if (newCommande && newCommande.id) {
                customerOrderHistoryService.saveOrder({ ...newCommande, items: itemsForCommande });
                sessionStorage.setItem('customerOrderId', newCommande.id);
                navigate('/login');
            } else {
                throw new Error("La création de la commande a échoué.");
            }
        } catch (error) {
            console.error("Erreur lors de la confirmation de la commande :", error);
            alert("Désolé, une erreur est survenue. Veuillez réessayer.");
            setIsSubmitting(false);
        }
    };

    const filteredProduits = useMemo(() => {
        if (activeCategoryId === 'all') return produits.filter(p => p.estado === 'disponible');
        return produits.filter(p => p.categoria_id === activeCategoryId && p.estado === 'disponible');
    }, [produits, activeCategoryId]);

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
            {editingItem && (
                <CustomizationModal 
                    item={editingItem} 
                    onClose={() => setEditingItem(null)} 
                    onSave={handleSaveCustomization}
                />
            )}
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                onSubmit={handleSubmitOrder}
                cart={cart}
                total={total}
                isSubmitting={isSubmitting}
            />
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <ChefHat size={32} className="text-blue-500" />
                        <h1 className="text-2xl font-bold ml-3 text-gray-800 dark:text-white">Commander en Ligne</h1>
                    </div>
                    <button onClick={() => navigate('/login')} className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500">
                         <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                    </button>
                </div>
            </header>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3">
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                             <button onClick={() => setActiveCategoryId('all')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategoryId === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Tous</button>
                            {categorias.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategoryId === cat.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{cat.nom}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProduits.map(produit => {
                             const quantity = totalQuantityPerProduct.get(produit.id) || 0;
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

                <div className="lg:w-1/3">
                    <div className="sticky top-24">
                        <Card>
                            <h2 className="text-2xl font-bold flex items-center mb-4"><ShoppingCart className="mr-2"/> Votre Commande</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                                {cart.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">Votre panier est vide.</p>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                            <div className="flex items-center">
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.produit.nom_produit}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatCOP(item.produit.prix_vente)}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button onClick={() => setEditingItem(item)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-2" title="Personalizar">
                                                        <Edit size={16} />
                                                    </button>
                                                     <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 hover:text-red-700 ml-2" title="Eliminar">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            {(item.excluded_ingredients?.length || item.commentaire) && (
                                                <div className="mt-1 pl-2 text-xs border-l-2 border-gray-200 dark:border-gray-600">
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
                                    ))
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t dark:border-gray-700">
                                <div className="flex justify-between items-center text-xl font-bold mb-4">
                                    <span>Total:</span>
                                    <span>{formatCOP(total)}</span>
                                </div>
                                <button onClick={() => setIsReceiptModalOpen(true)} disabled={isSubmitting || cart.length === 0} className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar Pedido'}
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerOrder;
