import type { Ingredient, Produit, Recette, Vente, Achat, RecetteItem, IngredientPayload, ProduitPayload, Table, Commande, CommandeItem, Categoria, Role, TablePayload } from '../types';

// In a Netlify setup, this would point to the serverless functions path.
// For local dev, you'd proxy this path to your function server.
const API_BASE_URL = '/.netlify/functions';

// A helper function to streamline JSON fetch requests and handle errors.
const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    // Handle cases where the response might be empty (e.g., DELETE, PUT with no content)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json() as Promise<T>;
    }
    return Promise.resolve(undefined as unknown as T);
};

// Helper for file uploads (FormData)
const apiFetchFormData = async <T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> => {
     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: method,
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'File upload failed' }));
        throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}

export const api = {
    // --- Core Data Getters ---
    getIngredients: (): Promise<Ingredient[]> => apiFetch('/data/ingredients'),
    getProduits: (): Promise<Produit[]> => apiFetch('/data/products'),
    getRecettes: (): Promise<Recette[]> => apiFetch('/data/recipes'),
    getVentes: (): Promise<Vente[]> => apiFetch('/data/sales'),
    getAchats: (): Promise<Achat[]> => apiFetch('/data/purchases'),
    getCategories: (): Promise<Categoria[]> => apiFetch('/data/categories'),
    getTables: (): Promise<Table[]> => apiFetch('/data/tables'),
    getSiteAssets: async (): Promise<any> => apiFetch('/data/site-assets'),
    
    // --- Site Editor ---
    updateSiteAsset: (assetKey: string, data: File | string): Promise<void> => {
        if (typeof data === 'string') {
            return apiFetch('/site-assets', { method: 'POST', body: JSON.stringify({ key: assetKey, data }) });
        }
        const formData = new FormData();
        formData.append('key', assetKey);
        formData.append('image', data);
        return apiFetchFormData('/site-assets', formData);
    },

    // --- Auth & Roles ---
    getRoles: (): Promise<Role[]> => apiFetch('/roles'),
    saveRoles: (newRoles: Role[]): Promise<void> => apiFetch('/roles', { method: 'POST', body: JSON.stringify(newRoles) }),
    loginWithPin: (pin: string): Promise<Role | null> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),

    // --- POS - Commande ---
    getCommandeByTableId: (tableId: number): Promise<Commande | null> => apiFetch(`/commandes?tableId=${tableId}`),
    getCommandeById: (commandeId: string): Promise<Commande | null> => apiFetch(`/commandes?commandeId=${commandeId}`),
    createCommande: (tableId: number, couverts: number): Promise<Commande> => apiFetch('/commandes', { method: 'POST', body: JSON.stringify({ tableId, couverts }) }),
    updateCommande: (commandeId: string, updates: { items?: CommandeItem[], couverts?: number }): Promise<Commande> => apiFetch(`/commandes/${commandeId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    finaliserCommande: (commandeId: string): Promise<void> => apiFetch(`/commandes/${commandeId}/finalize`, { method: 'POST' }),
    markCommandeAsPaid: (commandeId: string): Promise<void> => apiFetch(`/commandes/${commandeId}/pay`, { method: 'POST' }),
    cancelUnpaidCommande: (commandeId: string): Promise<void> => apiFetch(`/commandes/${commandeId}/cancel-unpaid`, { method: 'POST' }),
    cancelEmptyCommande: (commandeId: string): Promise<void> => apiFetch(`/commandes/${commandeId}/cancel-empty`, { method: 'DELETE' }),

    // --- POS - Kitchen ---
    sendOrderToKitchen: (commandeId: string): Promise<Commande> => apiFetch(`/kitchen/send/${commandeId}`, { method: 'POST' }),
    getKitchenOrders: (): Promise<Commande[]> => apiFetch('/kitchen/orders'),
    markOrderAsReady: (commandeId: string): Promise<void> => apiFetch(`/kitchen/ready/${commandeId}`, { method: 'POST' }),
    acknowledgeOrderReady: (commandeId: string): Promise<void> => apiFetch(`/kitchen/acknowledge/${commandeId}`, { method: 'POST' }),

    // --- POS - Takeaway ---
    getReadyTakeawayOrders: (): Promise<Commande[]> => apiFetch('/takeaway/ready'),
    getPendingTakeawayOrders: (): Promise<Commande[]> => apiFetch('/takeaway/pending'),
    submitTakeawayOrderForValidation: (items: CommandeItem[], customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }): Promise<Commande> => {
        const formData = new FormData();
        formData.append('items', JSON.stringify(items));
        formData.append('fullName', customerInfo.fullName);
        formData.append('address', customerInfo.address);
        formData.append('paymentMethod', customerInfo.paymentMethod);
        formData.append('receipt', customerInfo.receipt);
        return apiFetchFormData('/takeaway/submit', formData);
    },
    validateAndSendTakeawayOrder: (commandeId: string): Promise<Commande> => apiFetch(`/takeaway/validate/${commandeId}`, { method: 'POST' }),

    // --- Management - Ingredients ---
    recordAchat: (ingredient_id: number, quantite_achetee: number, prix_total: number): Promise<Achat> => apiFetch('/ingredients/purchase', { method: 'POST', body: JSON.stringify({ ingredient_id, quantite_achetee, prix_total }) }),
    addIngredient: (payload: IngredientPayload): Promise<Ingredient> => apiFetch('/ingredients', { method: 'POST', body: JSON.stringify(payload) }),
    updateIngredient: (id: number, payload: IngredientPayload): Promise<Ingredient> => apiFetch(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteIngredient: (id: number): Promise<void> => apiFetch(`/ingredients/${id}`, { method: 'DELETE' }),
    
    // --- Management - Products ---
    updateRecette: (produit_id: number, newItems: RecetteItem[]): Promise<Recette> => apiFetch(`/products/${produit_id}/recipe`, { method: 'PUT', body: JSON.stringify({ items: newItems }) }),
    addProduct: (payload: ProduitPayload, items: RecetteItem[]): Promise<Produit> => apiFetch('/products', { method: 'POST', body: JSON.stringify({ product: payload, recipeItems: items }) }),
    updateProduct: (id: number, payload: ProduitPayload): Promise<Produit> => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    updateProductStatus: (productId: number, status: Produit['estado']): Promise<Produit> => apiFetch(`/products/${productId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteProduct: (id: number): Promise<void> => apiFetch(`/products/${id}`, { method: 'DELETE' }),

    // --- Management - Categories ---
    addCategory: (nom: string): Promise<Categoria> => apiFetch('/categories', { method: 'POST', body: JSON.stringify({ nom }) }),
    deleteCategory: (id: number): Promise<void> => apiFetch(`/categories/${id}`, { method: 'DELETE' }),

    // --- Management - Tables ---
    addTable: (data: TablePayload): Promise<void> => apiFetch('/tables', { method: 'POST', body: JSON.stringify(data) }),
    updateTable: (id: number, data: Omit<TablePayload, 'id'>): Promise<void> => apiFetch(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTable: (id: number): Promise<void> => apiFetch(`/tables/${id}`, { method: 'DELETE' }),
};