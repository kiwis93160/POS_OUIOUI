import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import type { Produit, Recette, RecetteItem, ProduitPayload } from '../types';
import { Edit, Trash2, PlusCircle, Loader2, AlertTriangle, CheckCircle, XCircle, Clock, Tag, X, Camera, UtensilsCrossed } from 'lucide-react';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

interface ProduitWithCost extends Produit {
    cost: number;
    margin: number;
}

const CategoryManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { categorias, addCategory, deleteCategory } = useRestaurantData();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setIsAdding(true);
        try {
            await addCategory(newCategoryName.trim());
            setNewCategoryName('');
        } catch (error) {
            alert("Error al añadir la categoría.");
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleDeleteCategory = async (id: number, name: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la categoría "${name}"?`)) {
            try {
                await deleteCategory(id);
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center"><Tag className="mr-2"/>Gestionar Categorías</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>
                <div className="space-y-3">
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="Nombre de la nueva categoría"
                            className="flex-grow rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                        <button type="submit" disabled={isAdding} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle size={16}/>}
                        </button>
                    </form>
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 rounded-md border p-2 dark:border-gray-700">
                        {categorias.map(cat => (
                            <div key={cat.id} className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                                <span>{cat.nom}</span>
                                <button onClick={() => handleDeleteCategory(cat.id, cat.nom)} className="ml-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                                    <XCircle size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
                </div>
            </Card>
        </div>
    );
};


const ProductStatusModal: React.FC<{
    produit: ProduitWithCost;
    onClose: () => void;
    onSave: (productId: number, status: Produit['estado']) => Promise<void>;
}> = ({ produit, onClose, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async (status: Produit['estado']) => {
        setIsSaving(true);
        try {
            await onSave(produit.id, status);
        } catch(e) {
            alert("Error al guardar el estado.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const buttonClasses = "w-full text-left p-3 rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-wait";
    const activeClasses = "bg-blue-100 dark:bg-blue-900/50 font-semibold text-blue-800 dark:text-blue-300";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-sm">
                <h2 className="text-xl font-bold mb-2">Estado de: {produit.nom_produit}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Seleccione el estado de disponibilidad del producto.</p>
                <div className="space-y-3">
                     <button onClick={() => handleSave('disponible')} disabled={isSaving} className={`${buttonClasses} ${produit.estado === 'disponible' ? activeClasses : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <CheckCircle size={20} className="mr-3 text-green-500" /> Disponible
                    </button>
                    <button onClick={() => handleSave('agotado_temporal')} disabled={isSaving} className={`${buttonClasses} ${produit.estado === 'agotado_temporal' ? activeClasses : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <Clock size={20} className="mr-3 text-orange-500" /> Agotado (hasta fin del servicio)
                    </button>
                     <button onClick={() => handleSave('agotado_indefinido')} disabled={isSaving} className={`${buttonClasses} ${produit.estado === 'agotado_indefinido' ? activeClasses : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <XCircle size={20} className="mr-3 text-red-500" /> Agotado (indefinido)
                    </button>
                </div>
                 <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
                </div>
            </Card>
        </div>
    )
};

const ProductModal: React.FC<{
    produit: ProduitWithCost | null,
    recette: Recette | null,
    mode: 'add' | 'edit',
    onClose: () => void,
    onSave: (payload: ProduitPayload, items: RecetteItem[], imageFile: File | null, deleteImage: boolean, id?: number) => Promise<void>
}> = ({ produit, recette, mode, onClose, onSave }) => {
    const { ingredients, getIngredientById, categorias } = useRestaurantData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [nomProduit, setNomProduit] = useState('');
    const [prixVente, setPrixVente] = useState(0);
    const [categoriaId, setCategoriaId] = useState<number | string>('');
    const [editedItems, setEditedItems] = useState<RecetteItem[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [deleteImage, setDeleteImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newIngredientId, setNewIngredientId] = useState('');
    const [newIngredientQty, setNewIngredientQty] = useState(0.1);
    
    const inputClasses = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm";

    useEffect(() => {
        if (mode === 'edit' && produit) {
            setNomProduit(produit.nom_produit);
            setPrixVente(produit.prix_vente);
            setCategoriaId(produit.categoria_id);
            setEditedItems(recette?.items || []);
            setImagePreview(produit.image_base64 || null);
        } else {
            setNomProduit('');
            setPrixVente(0);
            setCategoriaId(categorias.length > 0 ? categorias[0].id : '');
            setEditedItems([]);
            setImagePreview(null);
        }
        setImageFile(null);
        setDeleteImage(false);
    }, [produit, recette, mode, categorias]);
    
    const isFormValid = useMemo(() => {
        return nomProduit.trim() !== '' && !!categoriaId && prixVente > 0;
    }, [nomProduit, categoriaId, prixVente]);


    const handleItemChange = (id: number, qty: number) => setEditedItems(items => items.map(i => i.ingredient_id === id ? { ...i, qte_utilisee: Math.max(0, qty) } : i));
    const handleRemoveItem = (id: number) => setEditedItems(items => items.filter(i => i.ingredient_id !== id));
    
    const handleAddItem = () => {
        const id = parseInt(newIngredientId, 10);
        if (id && newIngredientQty > 0 && !editedItems.some(item => item.ingredient_id === id)) {
            setEditedItems(current => [...current, { ingredient_id: id, qte_utilisee: newIngredientQty }]);
            setNewIngredientId('');
            setNewIngredientQty(0.1);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setDeleteImage(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setDeleteImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = async () => {
        if (!isFormValid) return;
        setIsSaving(true);
        try {
            const payload: ProduitPayload = {
                nom_produit: nomProduit,
                prix_vente: prixVente,
                categoria_id: Number(categoriaId),
            };
            await onSave(payload, editedItems, imageFile, deleteImage, produit?.id);
            onClose();
        } catch (error) {
            alert("Error al guardar la receta.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const availableIngredients = useMemo(() => {
        const currentIds = new Set(editedItems.map(item => item.ingredient_id));
        return ingredients.filter(ing => !currentIds.has(ing.id));
    }, [ingredients, editedItems]);

    const totalCost = useMemo(() => {
        return editedItems.reduce((total, item) => {
            const ingredient = getIngredientById(item.ingredient_id);
            return total + (ingredient ? ingredient.prix_unitaire * item.qte_utilisee : 0);
        }, 0);
    }, [editedItems, getIngredientById]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                    {mode === 'edit' ? `Modificar: ${produit?.nom_produit}` : 'Añadir un nuevo producto'}
                </h2>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b dark:border-gray-700 pb-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-2">Imagen del Producto</label>
                             <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative group">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <button onClick={handleRemoveImage} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"><Trash2 size={20} /></button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Camera size={48} />
                                        <p className="text-xs mt-1">Sin imagen</p>
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full">
                                Cambiar imagen...
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>
                         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium">Nombre del Producto</label>
                                <input type="text" value={nomProduit} onChange={e => setNomProduit(e.target.value)} className={inputClasses} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Categoría</label>
                                <select value={categoriaId} onChange={e => setCategoriaId(Number(e.target.value))} className={inputClasses} required>
                                    <option value="" disabled>Seleccionar...</option>
                                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nom}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Precio de Venta (COP)</label>
                                <input type="number" value={prixVente} onChange={e => setPrixVente(parseFloat(e.target.value))} className={inputClasses} required min="0"/>
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 pt-2">Composición de la Receta</h3>
                    
                    <div className="hidden md:block">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-2 border-b dark:border-gray-600">
                            <div className="col-span-2">Ingrediente</div>
                            <div className="text-center">Cantidad</div>
                            <div className="text-right">Costo</div>
                            <div className="text-right">Acción</div>
                        </div>
                        {editedItems.map(item => {
                            const ingredient = getIngredientById(item.ingredient_id);
                            if (!ingredient) return null;
                            const itemCost = ingredient.prix_unitaire * item.qte_utilisee;
                            return (
                                <div key={item.ingredient_id} className="grid grid-cols-5 gap-2 items-center py-1">
                                    <span className="col-span-2 font-medium text-gray-800 dark:text-gray-200">{ingredient.nom}</span>
                                    <div className="flex items-center justify-center">
                                        <input type="number" value={item.qte_utilisee} onChange={e => handleItemChange(item.ingredient_id, parseFloat(e.target.value))} className="w-20 text-center rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm" step="0.01"/>
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{ingredient.unite}</span>
                                    </div>
                                    <span className="text-right text-gray-600 dark:text-gray-300">{formatCOP(itemCost)}</span>
                                    <div className="text-right">
                                        <button onClick={() => handleRemoveItem(item.ingredient_id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 md:hidden">
                       {editedItems.map(item => {
                            const ingredient = getIngredientById(item.ingredient_id);
                            if (!ingredient) return null;
                            return (
                                <div key={item.ingredient_id} className="p-2 border rounded-md dark:border-gray-700">
                                    <p className="font-semibold">{ingredient.nom}</p>
                                    <div className="flex items-center justify-between mt-1">
                                         <div className="flex items-center">
                                            <input type="number" value={item.qte_utilisee} onChange={e => handleItemChange(item.ingredient_id, parseFloat(e.target.value))} className="w-16 text-center rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm" step="0.01" />
                                            <span className="ml-2 text-xs">{ingredient.unite}</span>
                                        </div>
                                        <button onClick={() => handleRemoveItem(item.ingredient_id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /> Eliminar</button>
                                    </div>
                                </div>
                            )
                       })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center pt-4 border-t dark:border-gray-600">
                        <div className="md:col-span-2">
                             <select value={newIngredientId} onChange={e => setNewIngredientId(e.target.value)} className={inputClasses}>
                                <option value="">Seleccionar un ingrediente...</option>
                                {availableIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.nom}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-center">
                            <input type="number" value={newIngredientQty} onChange={e => setNewIngredientQty(parseFloat(e.target.value))} className="w-20 text-center rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm sm:text-sm" step="0.01" min="0.01" />
                        </div>
                        <div className="md:col-span-2 text-right">
                            <button onClick={handleAddItem} className="flex items-center justify-center ml-auto px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm w-full md:w-auto">
                                <PlusCircle size={16} className="mr-1" /> Añadir
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t dark:border-gray-600">
                    <div className="text-lg font-bold text-gray-800 dark:text-white mb-2 md:mb-0">Costo Total: <span className="text-blue-600 dark:text-blue-400">{formatCOP(totalCost)}</span></div>
                    <div className="flex space-x-2">
                         <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                         <button type="button" onClick={handleSave} disabled={isSaving || !isFormValid} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 flex items-center">
                           {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Guardar
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};


const Products: React.FC = () => {
    const { produits, loading, getProduitCost, getRecetteForProduit, updateRecette, addProduct, updateProduct, deleteProduct, productLowStockInfo, updateProductStatus, getCategoriaById, updateProductImage, currentUserRole } = useRestaurantData();
    const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; produit: ProduitWithCost | null }>({ isOpen: false, mode: 'add', produit: null });
    const [statusModalProduct, setStatusModalProduct] = useState<ProduitWithCost | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    const isEditor = currentUserRole?.permissions['/produits'] === 'editor';

    const productsWithCost = useMemo((): ProduitWithCost[] => {
        return produits.map(p => {
            const cost = getProduitCost(p.id);
            const margin = p.prix_vente > 0 ? ((p.prix_vente - cost) / p.prix_vente) * 100 : 0;
            return { ...p, cost, margin };
        });
    }, [produits, getProduitCost]);

    const handleOpenModal = (mode: 'add' | 'edit', produit: ProduitWithCost | null = null) => setModalState({ isOpen: true, mode, produit });
    const handleCloseModal = () => setModalState({ isOpen: false, mode: 'add', produit: null });

    const handleSave = async (payload: ProduitPayload, items: RecetteItem[], imageFile: File | null, deleteImage: boolean, id?: number) => {
        let productId = id;

        if (modalState.mode === 'edit' && productId) {
            await updateProduct(productId, payload);
            await updateRecette(productId, items);
        } else {
            const newProduct = await addProduct(payload, items, imageFile || undefined);
            productId = newProduct.id;
            if (imageFile) return; 
        }

        if (productId) {
            if (imageFile) {
                await updateProductImage(productId, imageFile);
            } else if (deleteImage) {
                await updateProductImage(productId, null);
            }
        }
    };

    const handleDelete = async (produit: ProduitWithCost) => {
        if (window.confirm(`¿Está seguro de que desea eliminar "${produit.nom_produit}"?`)) {
            try {
                await deleteProduct(produit.id);
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        }
    };
    
    const handleSaveStatus = async (productId: number, status: Produit['estado']) => {
        await updateProductStatus(productId, status);
        setStatusModalProduct(null);
    };
    
    const getStatusInfo = (status: Produit['estado']) => {
        switch (status) {
            case 'agotado_temporal': return { text: 'Agotado (Servicio)', color: 'bg-orange-500 text-white', icon: <Clock size={12} /> };
            case 'agotado_indefinido': return { text: 'Agotado', color: 'bg-red-500 text-white', icon: <XCircle size={12} /> };
            default: return { text: 'Disponible', color: 'bg-green-500 text-white', icon: <CheckCircle size={12} /> };
        }
    };

    const selectedRecette = modalState.produit ? getRecetteForProduit(modalState.produit.id) : null;

    if (loading) return <div className="text-center p-8">Cargando productos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Productos y Recetas</h1>
                {isEditor && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 w-full sm:w-auto">
                            <Tag className="w-5 h-5 mr-2" />
                            Gestionar Categorías
                        </button>
                        <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Añadir producto
                        </button>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsWithCost.map((p) => {
                    const lowStockInfo = productLowStockInfo.get(p.id);
                    const statusInfo = getStatusInfo(p.estado);
                    const category = getCategoriaById(p.categoria_id);
                    return (
                        <Card key={p.id} className={`flex flex-col ${p.estado !== 'disponible' ? 'opacity-60' : ''}`}>
                            <div className="relative aspect-square w-full -mt-6 -mx-6 mb-4">
                                {p.image_base64 ? (
                                    <img src={p.image_base64} alt={p.nom_produit} className="w-full h-full object-cover rounded-t-xl" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-t-xl flex items-center justify-center">
                                        <UtensilsCrossed className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {isEditor ? (
                                        <button onClick={() => setStatusModalProduct(p)} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-transform hover:scale-105 shadow-lg ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            {statusInfo.text}
                                        </button>
                                    ) : (
                                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shadow-lg ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            {statusInfo.text}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-grow">
                                <p className="text-xs font-semibold text-blue-500 dark:text-blue-400">{category?.nom || 'Sin categoría'}</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <span>{p.nom_produit}</span>
                                    {lowStockInfo && (
                                        <div className="ml-2" title={`Bajo stock: ${lowStockInfo.join(', ')}`}>
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                    )}
                                </h3>
                                
                                <div className="flex justify-between items-baseline my-2">
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCOP(p.prix_vente)}</p>
                                    <p className={`font-bold ${p.margin < 60 ? 'text-orange-500' : 'text-green-500'}`}>{Math.round(p.margin)} % Margen</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Costo: {formatCOP(p.cost)}</p>
                            </div>
                            
                            {isEditor && (
                                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end space-x-2">
                                    <button onClick={() => handleOpenModal('edit', p)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-blue-500" title="Modificar"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(p)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-red-500" title="Eliminar"><Trash2 size={18}/></button>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
            
            {modalState.isOpen && (
                <ProductModal
                    produit={modalState.produit}
                    recette={selectedRecette}
                    mode={modalState.mode}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
            {statusModalProduct && (
                <ProductStatusModal
                    produit={statusModalProduct}
                    onClose={() => setStatusModalProduct(null)}
                    onSave={handleSaveStatus}
                />
            )}
            {isCategoryModalOpen && (
                <CategoryManagerModal onClose={() => setIsCategoryModalOpen(false)} />
            )}
        </div>
    );
};

export default Products;