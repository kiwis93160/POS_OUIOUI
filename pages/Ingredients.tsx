import React, { useState, useEffect, useMemo } from 'react';
import { useRestaurantData } from '../hooks/useRestaurantData';
import Card from '../components/ui/Card';
import { PackagePlus, Loader2, List, PlusCircle, Trash2, Edit } from 'lucide-react';
import type { Ingredient, IngredientPayload, Unite } from '../types';
import { Unite as UniteEnum } from '../types';

const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value));

const ReapprovisionnementModal: React.FC<{
    ingredient: Ingredient,
    onClose: () => void,
    onAchat: (ingredientId: number, quantite: number, prix: number) => Promise<void>
}> = ({ ingredient, onClose, onAchat }) => {
    const [quantite, setQuantite] = useState(0);
    const [prix, setPrix] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantite > 0 && prix > 0) {
            setIsSubmitting(true);
            try {
                await onAchat(ingredient.id, quantite, prix);
                onClose();
            } catch (error) {
                alert("Error al registrar la compra.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Card className="w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Reabastecer: {ingredient.nom}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad Comprada ({ingredient.unite})</label>
                        <input type="number" value={quantite} onChange={e => setQuantite(parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ej: 10" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio Total (COP)</label>
                        <input type="number" value={prix} onChange={e => setPrix(parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ej: 50000" required />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Guardar compra
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const IngredientDetailsModal: React.FC<{
    ingredient: Ingredient,
    onClose: () => void
}> = ({ ingredient, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Detalle de lotes para: {ingredient.nom}</h2>
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha de compra</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cant. Comprada</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cant. Restante</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Precio de compra / {ingredient.unite}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {ingredient.lots.length > 0 ? (
                                [...ingredient.lots].sort((a,b) => new Date(b.date_achat).getTime() - new Date(a.date_achat).getTime()).map((lot, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 text-sm">{new Date(lot.date_achat).toLocaleDateString('es-ES')}</td>
                                    <td className="px-4 py-2 text-sm">{Math.round(lot.quantite_initiale)} {ingredient.unite}</td>
                                    <td className="px-4 py-2 text-sm">{Math.round(lot.quantite_restante)} {ingredient.unite}</td>
                                    <td className="px-4 py-2 text-sm">{formatCOP(lot.prix_unitaire_achat)}</td>
                                </tr>
                            ))) : (
                                <tr><td colSpan={4} className="text-center py-4">No hay lotes en inventario.</td></tr>
                            )
                            }
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
                </div>
            </Card>
        </div>
    );
};

const IngredientModal: React.FC<{
    ingredient: Ingredient | null;
    onClose: () => void;
    onSave: (payload: IngredientPayload, id?: number) => Promise<void>;
}> = ({ ingredient, onClose, onSave }) => {
    const [nom, setNom] = useState('');
    const [unite, setUnite] = useState<Unite>(UniteEnum.KG);
    const [stockMinimum, setStockMinimum] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (ingredient) {
            setNom(ingredient.nom);
            setUnite(ingredient.unite);
            setStockMinimum(ingredient.stock_minimum);
        } else {
            setNom('');
            setUnite(UniteEnum.KG);
            setStockMinimum(0);
        }
    }, [ingredient]);
    
    const isFormValid = useMemo(() => {
        return nom.trim() !== '' && stockMinimum >= 0;
    }, [nom, stockMinimum]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsSubmitting(true);
        try {
            await onSave({ nom, unite, stock_minimum: stockMinimum }, ingredient?.id);
            onClose();
        } catch (error) {
            alert("Error al guardar el ingrediente.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClasses = "mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Card className="w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{ingredient ? "Modificar" : "Añadir"} un ingrediente</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nombre</label>
                        <input type="text" value={nom} onChange={e => setNom(e.target.value)} className={inputClasses} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Unidad</label>
                        <select value={unite} onChange={e => setUnite(e.target.value as Unite)} className={inputClasses}>
                            {Object.values(UniteEnum).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Umbral Mínimo de Inventario</label>
                        <input type="number" value={stockMinimum} onChange={e => setStockMinimum(parseFloat(e.target.value))} className={inputClasses} required min="0" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSubmitting || !isFormValid} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                           {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Guardar
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const Ingredients: React.FC = () => {
    const { ingredients, loading, addAchat, addIngredient, updateIngredient, deleteIngredient, currentUserRole } = useRestaurantData();
    const [ingredientForReappro, setIngredientForReappro] = useState<Ingredient | null>(null);
    const [ingredientForDetails, setIngredientForDetails] = useState<Ingredient | null>(null);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isEditor = currentUserRole?.permissions['/ingredients'] === 'editor';

    if (loading) return <div className="text-center p-8">Cargando ingredientes...</div>;

    const handleOpenEditModal = (ingredient: Ingredient | null) => {
        setEditingIngredient(ingredient);
        setIsEditModalOpen(true);
    };

    const handleSaveIngredient = async (payload: IngredientPayload, id?: number) => {
        if (id) {
            await updateIngredient(id, payload);
        } else {
            await addIngredient(payload);
        }
    };

    const handleDeleteIngredient = async (id: number, name: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el ingrediente "${name}"?`)) {
            try {
                await deleteIngredient(id);
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Ingredientes</h1>
                {isEditor && (
                    <button onClick={() => handleOpenEditModal(null)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full md:w-auto justify-center">
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Añadir ingrediente
                    </button>
                )}
            </div>
            <Card>
                <div className="overflow-x-auto">
                    {/* Pour les écrans larges */}
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inventario Actual</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Umbral Mínimo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio Unitario (Promedio)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {ingredients.map((ingredient) => {
                                const isLowStock = ingredient.stock_actuel <= ingredient.stock_minimum;
                                return (
                                    <tr key={ingredient.id} className={isLowStock ? 'bg-yellow-100 dark:bg-yellow-900/50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ingredient.nom}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'font-bold text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                            {Math.round(ingredient.stock_actuel)} {ingredient.unite}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{Math.round(ingredient.stock_minimum)} {ingredient.unite}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCOP(ingredient.prix_unitaire)} / {ingredient.unite}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-4">
                                                <button onClick={() => setIngredientForDetails(ingredient)} title="Detalles de lotes" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                                    <List className="w-5 h-5" />
                                                </button>
                                                {isEditor && (
                                                    <>
                                                        <button onClick={() => setIngredientForReappro(ingredient)} title="Reabastecer" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                            <PackagePlus className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleOpenEditModal(ingredient)} title="Modificar" className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteIngredient(ingredient.id, ingredient.nom)} title="Eliminar" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {/* Pour les petits écrans */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {ingredients.map((ingredient) => {
                             const isLowStock = ingredient.stock_actuel <= ingredient.stock_minimum;
                             return (
                                <div key={ingredient.id} className={`p-4 rounded-lg shadow ${isLowStock ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-white dark:bg-gray-800'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ingredient.nom}</h3>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => setIngredientForDetails(ingredient)} title="Detalles de lotes" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><List size={18}/></button>
                                            {isEditor && (
                                                <>
                                                    <button onClick={() => setIngredientForReappro(ingredient)} title="Reabastecer" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><PackagePlus size={18}/></button>
                                                    <button onClick={() => handleOpenEditModal(ingredient)} title="Modificar" className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"><Edit size={18}/></button>
                                                    <button onClick={() => handleDeleteIngredient(ingredient.id, ingredient.nom)} title="Eliminar" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={18}/></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        <p className={isLowStock ? 'font-bold text-red-600 dark:text-red-400' : ''}><strong>Inventario Actual:</strong> {Math.round(ingredient.stock_actuel)} {ingredient.unite}</p>
                                        <p><strong>Umbral Mínimo:</strong> {Math.round(ingredient.stock_minimum)} {ingredient.unite}</p>
                                        <p><strong>Precio Promedio:</strong> {formatCOP(ingredient.prix_unitaire)} / {ingredient.unite}</p>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                </div>
            </Card>
            {ingredientForReappro && (
                <ReapprovisionnementModal 
                    ingredient={ingredientForReappro} 
                    onClose={() => setIngredientForReappro(null)}
                    onAchat={addAchat}
                />
            )}
             {ingredientForDetails && (
                <IngredientDetailsModal 
                    ingredient={ingredientForDetails} 
                    onClose={() => setIngredientForDetails(null)}
                />
            )}
            {isEditModalOpen && (
                <IngredientModal
                    ingredient={editingIngredient}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveIngredient}
                />
            )}
        </div>
    );
};

export default Ingredients;