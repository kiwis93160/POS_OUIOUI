import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { api } from '../services/mockApiService';
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
    
    submitTakeawayOrderForValidation: (items: CommandeItem[], customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }) => Promise<Commande>;
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
    updateProductImage: (productId: number, imageFile: File | null) => Promise<void>;
    updateProductStatus: (productId: number, status: Produit['estado']) => Promise<void>;
    deleteProduct: (id: number) => Promise<void>;
    addCategory: (nom: string) => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;
    
    updateSiteAsset: (key: keyof SiteAssets, data: File | string) => Promise<void>;
    addTable: (data: TablePayload) => Promise<void>;
    updateTable: (id: number, data: Omit<TablePayload, 'id'>) => Promise<void>;
    deleteTable: (id: number) => Promise<void>;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getSessionRole = (): string | null => {
    try {
        return sessionStorage.getItem('userRoleId');
    } catch (e) {
        console.error("Impossible de lire depuis la session de stockage", e);
    }
    return null;
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

    const fetchMenuData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ingData, prodData, recData, catData, assetsData] = await Promise.all([
                api.getIngredients(),
                api.getProduits(),
                api.getRecettes(),
                api.getCategories(),
                api.getSiteAssets(),
            ]);
            setIngredients(ingData);
            setProduits(prodData);
            setRecettes(recData);
            setCategorias(catData);
            setSiteAssets(assetsData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchData = useCallback(async (isInitial = false) => {
        if(isInitial) setLoading(true);
        setError(null);
        try {
            const [ingData, prodData, recData, venData, achData, tabData, kitData, catData, rolesData, assetsData, readyTakeawayData, pendingTakeawayData, activeCmdsData] = await Promise.all([
                api.getIngredients(),
                api.getProduits(),
                api.getRecettes(),
                api.getVentes(),
                api.getAchats(),
                api.getTables(),
                api.getKitchenOrders(),
                api.getCategories(),
                api.getRoles(),
                api.getSiteAssets(),
                api.getReadyTakeawayOrders(),
                api.getPendingTakeawayOrders(),
                api.getActiveCommandes(),
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
            setSiteAssets(assetsData);
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

    useEffect(() => {
        if (userRole) {
            fetchData(true);
        } else {
            // Pour les pages publiques qui ont besoin de données de menu, comme la commande client
            fetchMenuData();
        }
    }, [fetchData, userRole, fetchMenuData]);

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
            if (options.refresh) {
                await fetchData(false); 
            }
            return result;
        } catch (err) {
            console.error("Erreur API:", err);
            setError(err as Error);
            throw err;
        }
    }, [fetchData]);
    
    const login = useCallback(async (pin: string): Promise<Role | null> => {
        const role = await api.loginWithPin(pin);
        if (role) {
            try {
                sessionStorage.setItem('userRoleId', role.id);
                setUserRole(role.id);
                setCurrentUserRole(role);
                return role;
            } catch(e) {
                console.error("Impossible d'écrire dans la session de stockage", e);
                setUserRole(role.id);
                setCurrentUserRole(role);
                return role;
            }
        }
        return null;
    }, []);

    const logout = useCallback(() => {
        try {
            sessionStorage.removeItem('userRoleId');
        } catch(e) {
            console.error("Impossible de supprimer de la session de stockage", e);
        }
        setUserRole(null);
        setCurrentUserRole(null);
    }, []);

    const saveRoles = useCallback((newRoles: Role[]) => handleApiCall(() => api.saveRoles(newRoles)), [handleApiCall]);

    const authenticateAdmin = useCallback(async (pin: string): Promise<boolean> => {
        const adminRole = roles.find(r => r.id === 'admin');
        return !!adminRole && pin === adminRole.pin;
    }, [roles]);

    const getCommandeByTableId = useCallback((tableId: number): Commande | null => {
        const commande = activeCommandes.find(c => c.table_id === tableId && c.statut === 'en_cours');
        return commande ? { ...commande } : null;
    }, [activeCommandes]);

    const getCommandeById = useCallback((commandeId: string) => handleApiCall(() => api.getCommandeById(commandeId), { refresh: false }), [handleApiCall]);
    const createCommande = useCallback((tableId: number, couverts: number) => handleApiCall(() => api.createCommande(tableId, couverts)) as Promise<Commande>, [handleApiCall]);
    const updateCommande = useCallback((id, updates) => handleApiCall(() => api.updateCommande(id, updates)), [handleApiCall]);
    const sendOrderToKitchen = useCallback((id) => handleApiCall(() => api.sendOrderToKitchen(id)), [handleApiCall]);

    const finaliserCommande = useCallback((id: string) => handleApiCall(() => api.finaliserCommande(id)), [handleApiCall]);

    const cancelEmptyCommande = useCallback((id) => handleApiCall(() => api.cancelEmptyCommande(id), { refresh: true }), [handleApiCall]);
    const markCommandeAsPaid = useCallback((id: string) => handleApiCall(() => api.markCommandeAsPaid(id)), [handleApiCall]);
    const cancelUnpaidCommande = useCallback((id: string) => handleApiCall(() => api.cancelUnpaidCommande(id)), [handleApiCall]);
    const getKitchenOrders = useCallback(() => handleApiCall(api.getKitchenOrders, { refresh: false }), [handleApiCall]);
    const markOrderAsReady = useCallback((id) => handleApiCall(() => api.markOrderAsReady(id)), [handleApiCall]);
    const acknowledgeOrderReady = useCallback((id) => handleApiCall(() => api.acknowledgeOrderReady(id)), [handleApiCall]);
    
    const generateDailyReportData = useCallback(async (): Promise<DailyReportData> => {
        const now = new Date();
        let reportStartDate = new Date(now);
        reportStartDate.setHours(5, 0, 0, 0);

        if (now < reportStartDate) {
            reportStartDate.setDate(reportStartDate.getDate() - 1);
        }

        const todaysVentes = ventes.filter(v => {
            const saleDate = new Date(v.date_vente);
            return saleDate >= reportStartDate && saleDate <= now;
        });

        const allTimeEntries = await api.getTimeEntries();
        const relevantTimeEntries = allTimeEntries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= reportStartDate && entryDate <= now;
        });

        const findFirstLogin = (roleId: string) => {
            const roleEntries = relevantTimeEntries
                .filter(e => e.role_id === roleId)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return roleEntries.length > 0 ? new Date(roleEntries[0].timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : undefined;
        };

        const cocinaFirstLogin = findFirstLogin('cocina');
        const meseroFirstLogin = findFirstLogin('mesero');

        const totalSales = todaysVentes.reduce((sum, v) => sum + v.prix_total_vente, 0);
        const customerCount = new Set(todaysVentes.map(v => v.commande_id)).size;
        
        const productsSoldMap = new Map<number, number>();
        todaysVentes.forEach(v => {
            productsSoldMap.set(v.produit_id, (productsSoldMap.get(v.produit_id) || 0) + v.quantite);
        });

        const productsSoldByCategory = categorias.map(category => {
            const items: { productName: string, quantity: number }[] = [];
            produits.forEach(produit => {
                if (produit.categoria_id === category.id && productsSoldMap.has(produit.id)) {
                    items.push({
                        productName: produit.nom_produit,
                        quantity: productsSoldMap.get(produit.id)!
                    });
                }
            });
            return { categoryName: category.nom, items };
        }).filter(cat => cat.items.length > 0);
        
        const lowStockIngredientsList = ingredients.filter(i => i.stock_actuel <= i.stock_minimum);
        const lowStockIngredientsCount = lowStockIngredientsList.length;
        const lowStockIngredientsDetails = lowStockIngredientsList.map(i => ({ nom: i.nom, date_below_minimum: i.date_below_minimum }));

        return {
            generationDate: new Date().toLocaleString('es-ES'),
            totalSales,
            customerCount,
            productsSold: productsSoldByCategory,
            inventoryStatus: {
                lowStockIngredients: lowStockIngredientsCount,
                lowStockIngredientsDetails: lowStockIngredientsDetails,
            },
            staffActivity: {
                cocinaFirstLogin,
                meseroFirstLogin,
            }
        };
    }, [ventes, produits, categorias, ingredients]);

    const addAchat = useCallback((id, q, p) => handleApiCall(() => api.recordAchat(id, q, p)), [handleApiCall]);
    const updateRecette = useCallback((id, items) => handleApiCall(() => api.updateRecette(id, items)), [handleApiCall]);
    const addIngredient = useCallback((payload) => handleApiCall(() => api.addIngredient(payload)), [handleApiCall]);
    const updateIngredient = useCallback((id, payload) => handleApiCall(() => api.updateIngredient(id, payload)), [handleApiCall]);
    const deleteIngredient = useCallback((id) => handleApiCall(() => api.deleteIngredient(id)), [handleApiCall]);
    const addProduct = useCallback((payload, items, imageFile) => handleApiCall(() => api.addProduct(payload, items, imageFile)) as Promise<Produit>, [handleApiCall]);
    const updateProduct = useCallback((id, payload) => handleApiCall(() => api.updateProduct(id, payload)), [handleApiCall]);
    const updateProductImage = useCallback((id, file) => handleApiCall(() => api.updateProductImage(id, file)), [handleApiCall]);
    const updateProductStatus = useCallback((id, status) => handleApiCall(() => api.updateProductStatus(id, status)), [handleApiCall]);
    const deleteProduct = useCallback((id) => handleApiCall(() => api.deleteProduct(id)), [handleApiCall]);
    const addCategory = useCallback((nom: string) => handleApiCall(() => api.addCategory(nom)), [handleApiCall]);
    const deleteCategory = useCallback((id: number) => handleApiCall(() => api.deleteCategory(id)), [handleApiCall]);
    const updateSiteAsset = useCallback((key: keyof SiteAssets, data: File | string) => handleApiCall(() => api.updateSiteAsset(key as string, data)), [handleApiCall]);
    const addTable = useCallback((data: TablePayload) => handleApiCall(() => api.addTable(data)), [handleApiCall]);
    const updateTable = useCallback((id: number, data: Omit<TablePayload, 'id'>) => handleApiCall(() => api.updateTable(id, data)), [handleApiCall]);
    const deleteTable = useCallback((id: number) => handleApiCall(() => api.deleteTable(id)), [handleApiCall]);
    const submitTakeawayOrderForValidation = useCallback((items: CommandeItem[], customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }) => handleApiCall(() => api.submitTakeawayOrderForValidation(items, customerInfo)) as Promise<Commande>, [handleApiCall]);
    const validateAndSendTakeawayOrder = useCallback((id) => handleApiCall(() => api.validateAndSendTakeawayOrder(id)), [handleApiCall]);


    const getProduitCost = useCallback((produitId: number) => {
        const recette = recettes.find(r => r.produit_id === produitId);
        if (!recette) return 0;
        return recette.items.reduce((total, item) => {
            const ing = ingredients.find(i => i.id === item.ingredient_id);
            return total + (ing ? ing.prix_unitaire * item.qte_utilisee : 0);
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
        addProduct, updateProduct, deleteProduct, updateProductStatus, updateProductImage,
        addCategory, deleteCategory, updateSiteAsset,
        addTable, updateTable, deleteTable,
        refreshData: () => fetchData(true)
    }), [
        ingredients, produits, recettes, ventes, achats, tables, categorias, loading, error, kitchenOrders, readyTakeawayOrders, pendingTakeawayOrders, productLowStockInfo, siteAssets, activeCommandes,
        userRole, currentUserRole, roles,
        fetchData, getProduitCost, getRecetteForProduit, getIngredientById, getProduitById, getCategoriaById, generateDailyReportData,
        login, logout, authenticateAdmin, saveRoles, getCommandeByTableId, getCommandeById, createCommande, updateCommande, sendOrderToKitchen, finaliserCommande, cancelEmptyCommande, submitTakeawayOrderForValidation, validateAndSendTakeawayOrder, markCommandeAsPaid, cancelUnpaidCommande, getKitchenOrders, markOrderAsReady, acknowledgeOrderReady, addAchat, updateRecette, addIngredient, updateIngredient, deleteIngredient, addProduct, updateProduct, deleteProduct, updateProductStatus, updateProductImage, addCategory, deleteCategory, updateSiteAsset, addTable, updateTable, deleteTable
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