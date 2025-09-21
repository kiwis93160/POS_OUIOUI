import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as firebaseService from '../services/firebaseService';
import type { Ingredient, Produit, Recette, Vente, Achat, RecetteItem, IngredientPayload, ProduitPayload, Table, Commande, CommandeItem, Categoria, UserRole, Role, TablePayload, DailyReportData, TimeEntry } from '../types';
import { defaultImageAssets } from '../components/ImageAssets';

type SiteAssets = typeof defaultImageAssets;

interface DataContextType {
    ingredients: Ingredient[];
    produits: Produit[];
    recettes: Recette[];
    ventes: Vente[];
    achats: Achat[];
    tables: Table[];
    categorias: Categoria[];
    kitchenOrders: Commande[];
    readyTakeawayOrders: Commande[];
    pendingTakeawayOrders: Commande[];
    activeCommandes: Commande[];
    siteAssets: SiteAssets;
    loading: boolean;
    error: Error | null;
    productLowStockInfo: Map<number, string[]>;
    
    userRole: UserRole;
    currentUserRole: Role | null;
    roles: Role[];
    login: (pin: string) => Promise<Role | null>;
    logout: () => void;
    saveRoles: (newRoles: Role[]) => Promise<void>;
    authenticateAdmin: (pin: string) => Promise<boolean>;

    getCommandeByTableId: (tableId: number) => Commande | null;
    getCommandeById: (commandeId: string) => Promise<Commande | null>;
    createCommande: (tableId: number, couverts: number) => Promise<Commande>;
    updateCommande: (commandeId: string, updates: { items?: CommandeItem[], couverts?: number }) => Promise<void>;
    sendOrderToKitchen: (commandeId: string) => Promise<void>;
    finaliserCommande: (commandeId: string) => Promise<void>;
    cancelEmptyCommande: (commandeId: string) => Promise<void>;
    
    submitTakeawayOrderForValidation: (items: CommandeItem[], customerInfo: any) => Promise<any>;
    validateAndSendTakeawayOrder: (commandeId: string) => Promise<void>;

    markCommandeAsPaid: (commandeId: string) => Promise<void>;
    cancelUnpaidCommande: (commandeId: string) => Promise<void>;

    getKitchenOrders: () => Promise<Commande[]>;
    markOrderAsReady: (commandeId: string) => Promise<void>;
    acknowledgeOrderReady: (commandeId: string) => Promise<void>;
    
    generateDailyReportData: () => Promise<DailyReportData>;

    addAchat: (ingredient_id: number, quantite: number, prix: number) => Promise<void>;
    getProduitCost: (produitId: number) => number;
    getRecetteForProduit: (produitId: number) => Recette | undefined;
    getIngredientById: (id: number) => Ingredient | undefined;
    getProduitById: (id: number) => Produit | undefined;
    getCategoriaById: (id: number) => Categoria | undefined;
    updateRecette: (produitId: number, items: RecetteItem[]) => Promise<void>;
    addIngredient: (payload: IngredientPayload) => Promise<void>;
    updateIngredient: (id: number, payload: IngredientPayload) => Promise<void>;
    deleteIngredient: (id: number) => Promise<void>;
    addProduct: (payload: ProduitPayload, items: RecetteItem[], imageFile?: File) => Promise<Produit>;
    updateProduct: (id: number, payload: ProduitPayload) => Promise<void>;
    updateProductStatus: (productId: number, status: Produit['estado']) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    addCategory: (nom: string) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    
    addTable: (data: TablePayload) => Promise<void>;
    updateTable: (id: number, data: Omit<TablePayload, 'id'>) => Promise<void>;
    deleteTable: (id: number) => Promise<void>;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getSessionRole = (): string | null => {
    try { return sessionStorage.getItem('userRoleId'); } catch (e) { return null; }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [recettes, setRecettes] = useState<Recette[]>([]);
    const [ventes, setVentes] = useState<Vente[]>([]);
    const [achats, setAchats] = useState<Achat[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [kitchenOrders, setKitchenOrders] = useState<Commande[]>([]);
    const [readyTakeawayOrders, setReadyTakeawayOrders] = useState<Commande[]>([]);
    const [pendingTakeawayOrders, setPendingTakeawayOrders] = useState<Commande[]>([]);
    const [activeCommandes, setActiveCommandes] = useState<Commande[]>([]);
    const [siteAssets, setSiteAssets] = useState<SiteAssets>(defaultImageAssets);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(getSessionRole());
    const [roles, setRoles] = useState<Role[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
    const [productLowStockInfo, setProductLowStockInfo] = useState<Map<number, string[]>>(new Map());

    const fetchData = useCallback(async (isInitial = false) => {
        if(isInitial) setLoading(true);
        setError(null);
        try {
            const [ingData, prodData, recData, venData, achData, tabData, kitData, catData, rolesData, assetsData, readyTakeawayData, pendingTakeawayData, activeCmdsData] = await Promise.all([
                firebaseService.getIngredients(),
                firebaseService.getProducts(),
                firebaseService.getRecettes(),
                firebaseService.getVentes(),
                firebaseService.getAchats(),
                firebaseService.getTables(),
                firebaseService.getKitchenOrders(),
                firebaseService.getCategories(),
                firebaseService.getRoles(),
                firebaseService.getSiteAssets(),
                firebaseService.getReadyTakeawayOrders(),
                firebaseService.getPendingTakeawayOrders(),
                firebaseService.getActiveCommandes(),
            ]);
            setIngredients(ingData);
            setProduits(prodData);
            setRecettes(recData);
            setVentes(venData);
            setAchats(achData);
            setTables(tabData);
            setKitchenOrders(kitData);
            setCategorias(catData);
            setRoles(rolesData);
            setSiteAssets(assetsData as SiteAssets);
            setReadyTakeawayOrders(readyTakeawayData);
            setPendingTakeawayOrders(pendingTakeawayData);
            setActiveCommandes(activeCmdsData);
            
            const sessionRoleId = getSessionRole();
            if (sessionRoleId) {
                const user = rolesData.find(r => r.id === sessionRoleId);
                setCurrentUserRole(user || null);
            }
        } catch (err) {
            setError(err as Error);
        } finally {
            if(isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(true); }, [fetchData]);

    useEffect(() => {
        if (userRole && roles.length > 0) {
            const role = roles.find(r => r.id === userRole);
            setCurrentUserRole(role || null);
        } else {
            setCurrentUserRole(null);
        }
    }, [userRole, roles]);

    useEffect(() => {
        if (!ingredients.length || !recettes.length || !produits.length) return;
        const lowStockMap = new Map<number, string[]>();
        for (const produit of produits) {
            const recette = recettes.find(r => r.produit_id === produit.id);
            if (!recette) continue;
            const lowStockIngredientsForProduct: string[] = [];
            for (const item of recette.items) {
                const ingredient = ingredients.find(i => i.id === item.ingredient_id);
                if (ingredient && ingredient.stock_actuel <= ingredient.stock_minimum) {
                    lowStockIngredientsForProduct.push(ingredient.nom);
                }
            }
            if (lowStockIngredientsForProduct.length > 0) {
                lowStockMap.set(produit.id, lowStockIngredientsForProduct);
            }
        }
        setProductLowStockInfo(lowStockMap);
    }, [ingredients, recettes, produits]);

    const handleApiCall = useCallback(async (apiCall: () => Promise<any>, options: { refresh: boolean } = { refresh: true }) => {
        try {
            const result = await apiCall();
            if (options.refresh) { await fetchData(false); }
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [fetchData]);
    
    const login = useCallback(async (pin: string): Promise<Role | null> => {
        const role = await firebaseService.loginWithPin(pin, roles);
        if (role) {
            try {
                sessionStorage.setItem('userRoleId', role.id);
                setUserRole(role.id);
                setCurrentUserRole(role);
            } catch(e) {
                console.error(e);
            }
        }
        return role;
    }, [roles]);

    const logout = useCallback(() => {
        try { sessionStorage.removeItem('userRoleId'); } catch(e) { console.error(e); }
        setUserRole(null);
        setCurrentUserRole(null);
    }, []);

    const saveRoles = useCallback((newRoles: Role[]) => handleApiCall(() => firebaseService.saveRoles(newRoles)), [handleApiCall]);
    const authenticateAdmin = useCallback(async (pin: string): Promise<boolean> => {
        const adminRole = roles.find(r => r.id === 'admin');
        return !!adminRole && pin === adminRole.pin;
    }, [roles]);

    const getCommandeByTableId = useCallback((tableId: number) => activeCommandes.find(c => c.table_id === tableId && c.statut === 'en_cours') || null, [activeCommandes]);
    const getCommandeById = useCallback((id: string) => handleApiCall(() => firebaseService.getCommandeById(id), { refresh: false }), [handleApiCall]);

    const createCommande = useCallback((tableId: number, couverts: number) => handleApiCall(() => firebaseService.createCommande(tableId, couverts)) as Promise<Commande>, [handleApiCall]);
    const updateCommande = useCallback((id: string, updates: any) => handleApiCall(() => firebaseService.updateCommande(id, updates)), [handleApiCall]);
    const sendOrderToKitchen = useCallback((id: string) => handleApiCall(() => firebaseService.sendOrderToKitchen(id)), [handleApiCall]);
    const finaliserCommande = useCallback((id: string) => handleApiCall(() => firebaseService.finaliserCommande(id)), [handleApiCall]);
    const cancelEmptyCommande = useCallback((id: string) => handleApiCall(() => firebaseService.cancelEmptyCommande(id)), [handleApiCall]);
    const markOrderAsReady = useCallback((id: string) => handleApiCall(() => firebaseService.markOrderAsReady(id)), [handleApiCall]);
    const acknowledgeOrderReady = useCallback((id: string) => handleApiCall(() => firebaseService.acknowledgeOrderReady(id)), [handleApiCall]);
    const markCommandeAsPaid = useCallback((id: string) => handleApiCall(() => firebaseService.markCommandeAsPaid(id)), [handleApiCall]);
    const cancelUnpaidCommande = useCallback((id: string) => handleApiCall(() => firebaseService.cancelUnpaidCommande(id)), [handleApiCall]);

    const getKitchenOrders = useCallback(() => handleApiCall(firebaseService.getKitchenOrders, { refresh: false }), [handleApiCall]);
    
    const addAchat = useCallback((id: number, q: number, p: number) => handleApiCall(() => firebaseService.recordAchat(id, q, p)), [handleApiCall]);
    const updateRecette = useCallback((id: number, items: RecetteItem[]) => handleApiCall(() => firebaseService.updateRecette(id, items)), [handleApiCall]);
    
    const addIngredient = useCallback((payload: IngredientPayload) => handleApiCall(() => firebaseService.addIngredient(payload)), [handleApiCall]);
    const updateIngredient = useCallback((id: number, payload: IngredientPayload) => handleApiCall(() => firebaseService.updateIngredient(id, payload)), [handleApiCall]);
    const deleteIngredient = useCallback((id: number) => handleApiCall(() => firebaseService.deleteIngredient(id)), [handleApiCall]);

    const addProduct = useCallback((payload: ProduitPayload, items: RecetteItem[]) => handleApiCall(() => firebaseService.addProduct(payload, items)), [handleApiCall]);
    const updateProduct = useCallback((id: number, payload: ProduitPayload) => handleApiCall(() => firebaseService.updateProduct(id, payload)), [handleApiCall]);
    const deleteProduct = useCallback((id: number) => handleApiCall(() => firebaseService.deleteProduct(id)), [handleApiCall]);
    const updateProductStatus = useCallback((id: number, status: Produit['estado']) => handleApiCall(() => firebaseService.updateProductStatus(id, status)), [handleApiCall]);

    const addCategory = useCallback((nom: string) => handleApiCall(() => firebaseService.addCategory(nom)), [handleApiCall]);
    const deleteCategory = useCallback((id: number) => handleApiCall(() => firebaseService.deleteCategory(id)), [handleApiCall]);

    const addTable = useCallback((data: TablePayload) => handleApiCall(() => firebaseService.addTable(data)), [handleApiCall]);
    const updateTable = useCallback((id: number, data: Omit<TablePayload, 'id'>) => handleApiCall(() => firebaseService.updateTable(id, data)), [handleApiCall]);
    const deleteTable = useCallback((id: number) => handleApiCall(() => firebaseService.deleteTable(id)), [handleApiCall]);

    const submitTakeawayOrderForValidation = useCallback((items: CommandeItem[], customerInfo: any) => handleApiCall(() => firebaseService.submitTakeawayOrderForValidation(items, customerInfo)), [handleApiCall]);
    const validateAndSendTakeawayOrder = useCallback((id: string) => handleApiCall(() => firebaseService.validateAndSendTakeawayOrder(id)), [handleApiCall]);

    const generateDailyReportData = useCallback(async (): Promise<DailyReportData> => {
        // Cette fonction doit maintenant être implémentée côté serveur (par ex. Cloud Function)
        // car elle nécessite des aggrégations complexes sur les ventes et les logs.
        console.warn("La génération de rapports doit être migrée vers une fonction backend.");
        return {} as DailyReportData; 
    }, []);

    const getProduitCost = useCallback((produitId: number) => {
        const recette = recettes.find(r => r.produit_id === produitId);
        if (!recette) return 0;
        return recette.items.reduce((total, item) => {
            const ing = ingredients.find(i => i.id === item.ingredient_id);
            return total + (ing ? (ing.prix_unitaire_moyen || 0) * item.qte_utilisee : 0);
        }, 0);
    }, [ingredients, recettes]);

    const getRecetteForProduit = useCallback((id: number) => recettes.find(r => r.produit_id === id), [recettes]);
    const getIngredientById = useCallback((id: number) => ingredients.find(i => i.id === id), [ingredients]);
    const getProduitById = useCallback((id: number) => produits.find(p => p.id === id), [produits]);
    const getCategoriaById = useCallback((id: number) => categorias.find(c => c.id === id), [categorias]);

    const value = useMemo(() => ({
        ingredients, produits, recettes, ventes, achats, tables, categorias, loading, error, kitchenOrders, readyTakeawayOrders, pendingTakeawayOrders, productLowStockInfo, siteAssets, activeCommandes,
        userRole, currentUserRole, roles, login, logout, authenticateAdmin, saveRoles,
        getCommandeByTableId, getCommandeById, createCommande, updateCommande, sendOrderToKitchen, finaliserCommande, cancelEmptyCommande,
        submitTakeawayOrderForValidation, validateAndSendTakeawayOrder,
        markCommandeAsPaid, cancelUnpaidCommande,
        getKitchenOrders, markOrderAsReady, acknowledgeOrderReady, generateDailyReportData,
        addAchat, getProduitCost, getRecetteForProduit, getIngredientById, getProduitById, getCategoriaById,
        updateRecette, addIngredient, updateIngredient, deleteIngredient,
        addProduct, updateProduct, deleteProduct, updateProductStatus, /* updateProductImage */
        addCategory, deleteCategory, /* updateSiteAsset */
        addTable, updateTable, deleteTable,
        refreshData: () => fetchData(true)
    }), [
        ingredients, produits, recettes, ventes, achats, tables, categorias, loading, error, kitchenOrders, readyTakeawayOrders, pendingTakeawayOrders, productLowStockInfo, siteAssets, activeCommandes,
        userRole, currentUserRole, roles,
        fetchData, getProduitCost, getRecetteForProduit, getIngredientById, getProduitById, getCategoriaById, generateDailyReportData,
        login, logout, authenticateAdmin, saveRoles, getCommandeByTableId, getCommandeById, createCommande, updateCommande, sendOrderToKitchen, finaliserCommande, cancelEmptyCommande, submitTakeawayOrderForValidation, validateAndSendTakeawayOrder, markCommandeAsPaid, cancelUnpaidCommande, getKitchenOrders, markOrderAsReady, acknowledgeOrderReady, addAchat, updateRecette, addIngredient, updateIngredient, deleteIngredient, addProduct, updateProduct, deleteProduct, updateProductStatus, addCategory, deleteCategory, addTable, updateTable, deleteTable
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useRestaurantData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useRestaurantData doit être utilisé à l\'intérieur d\'un DataProvider');
    }
    return context;
};