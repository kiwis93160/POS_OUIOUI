import type { Ingredient, Produit, Recette, Vente, Achat, RecetteItem, IngredientPayload, ProduitPayload, Table, Commande, CommandeItem, Categoria, Role, TablePayload, TimeEntry } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// Allow overriding the functions base path so that the application can run both
// on Netlify and in local development environments that proxy the functions server.
const API_BASE_URL = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE ?? '/.netlify/functions';

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
        const errorBody = await response.text();
        if (errorBody) {
            let message = errorBody;
            try {
                const parsedError = JSON.parse(errorBody) as { message?: string };
                if (parsedError.message) {
                    message = parsedError.message;
                }
            } catch {
                // Ignore JSON parse errors and fall back to raw body text.
            }
            throw new Error(message || response.statusText || 'API error');
        }
        throw new Error(response.statusText || 'API error');
    }

    const contentType = response.headers.get('content-type') ?? '';
    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();

    if (!trimmedBody) {
        return null as T;
    }

    try {
        return JSON.parse(trimmedBody) as T;
    } catch (parseError) {
        if (contentType.includes('application/json')) {
            throw new Error(`Failed to parse JSON response: ${(parseError as Error).message}`);
        }
        throw new Error(`Expected JSON response but received content-type: ${contentType || 'unknown'}`);
    }
};

// Helper for file uploads (FormData)
const apiFetchFormData = async <T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'File upload failed' }));
        throw new Error(errorData.message || `API error: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
};

export const api = {
    // --- Core Data Getters ---
    getIngredients: (): Promise<Ingredient[]> => apiFetch('/data/ingredients'),
    getProduits: (): Promise<Produit[]> => apiFetch('/data/products'),
    getRecettes: (): Promise<Recette[]> => apiFetch('/data/recipes'),
    getVentes: (): Promise<Vente[]> => apiFetch('/data/sales'),
    getAchats: (): Promise<Achat[]> => apiFetch('/data/purchases'),
    getCategories: (): Promise<Categoria[]> => apiFetch('/data/categories'),
    getTables: (): Promise<Table[]> => apiFetch('/data/tables'),
    getActiveCommandes: (): Promise<Commande[]> => apiFetch('/commandes/active'),
    getSiteAssets: async (): Promise<Record<string, string>> => {
        const siteAssetsTable = import.meta.env.VITE_SUPABASE_SITE_ASSETS_TABLE as string | undefined;
        if (isSupabaseConfigured() && siteAssetsTable) {
            try {
                const client = getSupabaseClient();
                const { data, error } = await client.from(siteAssetsTable).select('key, value');
                if (error) {
                    console.warn('Supabase site asset query failed, falling back to Netlify function.', error);
                } else if (data) {
                    const rows = data as Array<{ key: string; value: string }>;
                    return rows.reduce<Record<string, string>>((acc, row) => {
                        acc[row.key] = row.value;
                        return acc;
                    }, {});
                }
            } catch (error) {
                console.warn('Supabase site asset lookup failed, falling back to Netlify function.', error);
            }
        }
        return apiFetch('/data/site-assets');
    },
    
    // --- Site Editor ---
    updateSiteAsset: (assetKey: string, data: File | string): Promise<void> => {
        if (typeof data === 'string') {
            return apiFetch('/site-assets', { method: 'PUT', body: JSON.stringify({ key: assetKey, data }) });
        }
        const formData = new FormData();
        formData.append('key', assetKey);
        formData.append('image', data);
        return apiFetchFormData('/site-assets', formData, 'PUT');
    },

    // --- Auth & Roles ---
    getRoles: (): Promise<Role[]> => apiFetch('/roles'),
    saveRoles: (newRoles: Role[]): Promise<void> => apiFetch('/roles', { method: 'POST', body: JSON.stringify(newRoles) }),
    loginWithPin: (pin: string): Promise<Role | null> => apiFetch('/auth-login', { method: 'POST', body: JSON.stringify({ pin }) }),

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
    addProduct: (payload: ProduitPayload, items: RecetteItem[], imageFile?: File): Promise<Produit> => {
        if (imageFile) {
            const formData = new FormData();
            formData.append('product', JSON.stringify(payload));
            formData.append('recipeItems', JSON.stringify(items));
            formData.append('image', imageFile);
            return apiFetchFormData('/products', formData);
        }
        return apiFetch('/products', { method: 'POST', body: JSON.stringify({ product: payload, recipeItems: items }) });
    },
    updateProduct: (id: number, payload: ProduitPayload): Promise<Produit> => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    updateProductImage: (productId: number, imageFile: File | null): Promise<Produit> => {
        if (!imageFile) {
            return apiFetch(`/products/${productId}/image`, { method: 'DELETE' });
        }
        const formData = new FormData();
        formData.append('image', imageFile);
        return apiFetchFormData(`/products/${productId}/image`, formData, 'PUT');
    },
    updateProductStatus: (productId: number, status: Produit['estado']): Promise<Produit> => apiFetch(`/products/${productId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteProduct: (id: number): Promise<void> => apiFetch(`/products/${id}`, { method: 'DELETE' }),

    // --- Management - Categories ---
    addCategory: (nom: string): Promise<Categoria> => apiFetch('/categories', { method: 'POST', body: JSON.stringify({ nom }) }),
    deleteCategory: (id: number): Promise<void> => apiFetch(`/categories/${id}`, { method: 'DELETE' }),

    // --- Management - Tables ---
    addTable: (data: TablePayload): Promise<void> => apiFetch('/tables', { method: 'POST', body: JSON.stringify(data) }),
    updateTable: (id: number, data: Omit<TablePayload, 'id'>): Promise<void> => apiFetch(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTable: (id: number): Promise<void> => apiFetch(`/tables/${id}`, { method: 'DELETE' }),

    // --- Staff management ---
    getTimeEntries: (): Promise<TimeEntry[]> => apiFetch('/time-tracking/entries'),
};
