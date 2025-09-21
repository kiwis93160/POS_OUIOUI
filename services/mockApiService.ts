/*
 * =====================================================================================
 *  NOTE IMPORTANTE : SIMULATION DU SERVICE API
 * =====================================================================================
 *
 * Ce fichier simule une API backend à des fins de démonstration dans un environnement sans
 * serveur réel. Il utilise le `localStorage` du navigateur pour conserver les données, donnant l'impression
 * que les modifications sont sauvegardées de manière globale.
 *
 * --- LIMITATIONS DE CETTE SIMULATION ---
 * - Les données sont uniquement stockées dans le navigateur actuel de l'utilisateur. Elles ne sont PAS partagées entre différents
 *   ordinateurs ou utilisateurs.
 * - `localStorage` a des limites de taille et n'est pas adapté pour stocker de grandes quantités de données
 *   comme des images en haute résolution.
 *
 * --- TRANSITION VERS UN VRAI BACKEND DE PRODUCTION ---
 * Pour que cette application fonctionne sur internet pour plusieurs utilisateurs, vous remplaceriez la
 * logique de ce fichier par de véritables requêtes réseau (par exemple, en utilisant `fetch()`) vers votre serveur backend.
 * Le reste du code de l'application (composants, hooks) est conçu pour fonctionner sans
 * modifications, car il est découplé de cette couche de données.
 *
 * Exemple d'une vraie fonction `updateSiteAsset` :
 *
 *   async updateSiteAsset(assetKey: string, file: File): Promise<void> {
 *     const formData = new FormData();
 *     formData.append('image', file);
 *     formData.append('key', assetKey);
 *
 *     const response = await fetch('https://votre-api.com/assets', {
 *       method: 'POST',
 *       body: formData,
 *       // Inclure les en-têtes d'autorisation si nécessaire
 *     });
 *
 *     if (!response.ok) {
 *       throw new Error('Échec du téléchargement de l'image.');
 *     }
 *   }
 *
 * =====================================================================================
 */
import { db } from './mockDatabase';
import type { Ingredient, Produit, Recette, Vente, Achat, RecetteItem, IngredientPayload, ProduitPayload, Table, Commande, CommandeItem, KitchenOrderStatus, Categoria, Role, TablePayload, TimeEntry } from '../types';

const simulateNetwork = (delay = 200) => new Promise(res => setTimeout(res, delay));

// Helper pour lire un fichier et le convertir en une chaîne Base64 pour la simulation
const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

// Helper pour le nommage des commandes à emporter
const getNextTakeawayId = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const datePrefix = `${day}${month}${year}`;

    let lastOrderInfo;
    try {
        lastOrderInfo = JSON.parse(localStorage.getItem('lastTakeawayOrder') || '{}');
    } catch {
        lastOrderInfo = {};
    }

    let nextCounter = 1;
    if (lastOrderInfo.date === datePrefix) {
        nextCounter = lastOrderInfo.counter + 1;
    }

    try {
        localStorage.setItem('lastTakeawayOrder', JSON.stringify({ date: datePrefix, counter: nextCounter }));
    } catch (e) {
        console.error("Impossible d'enregistrer le compteur de commandes à emporter", e);
    }
    
    return `WEB-${datePrefix}-${nextCounter}`;
};


// --- Helpers pour la persistance de la session de commande ---
// La déshydratation supprime les objets Produit complets avant de sauvegarder.
const dehydrateCommande = (commande: Commande): any => {
    return {
        ...commande,
        items: commande.items.map(item => ({
            ...item,
            produit: undefined, // Supprimer l'objet produit
            produit_id: item.produit.id // Garder uniquement l'ID
        }))
    };
};

// L'hydratation restaure les objets Produit complets lors du chargement.
const hydrateCommande = (dehydratedCmd: any): Commande => {
    return {
        ...dehydratedCmd,
        items: dehydratedCmd.items.map((item: any) => ({
            ...item,
            produit: db.produits.find(p => p.id === item.produit_id)!
        }))
    };
};

const saveCommandesToSession = () => {
    try {
        const dehydratedCommandes = db.commandes.map(dehydrateCommande);
        sessionStorage.setItem('activeCommandes', JSON.stringify(dehydratedCommandes));
    } catch (e) {
        console.error("Impossible d'enregistrer les commandes dans la session de stockage", e);
    }
};

const loadCommandesFromSession = () => {
    try {
        const storedCommandes = sessionStorage.getItem('activeCommandes');
        if (storedCommandes) {
            const dehydratedCommandes = JSON.parse(storedCommandes);
            db.commandes = dehydratedCommandes.map(hydrateCommande).filter((cmd: Commande) => 
                cmd.items.every(item => item.produit) // S'assurer que tous les produits existent encore
            );
        }
    } catch (e) {
        console.error("Impossible de charger les commandes depuis la session de stockage", e);
    }
};


// --- Helpers pour la persistance des images du site (simulation de base de données) ---
const saveSiteAssetsToStorage = () => {
    try {
        localStorage.setItem('siteAssets', JSON.stringify(db.siteAssets));
    } catch (e) {
        console.error("Impossible d'enregistrer les images du site dans le stockage local", e);
    }
};

const loadSiteAssetsFromStorage = () => {
    try {
        const storedAssets = localStorage.getItem('siteAssets');
        if (storedAssets) {
            db.siteAssets = JSON.parse(storedAssets);
        }
    } catch (e) {
        console.error("Impossible de charger les images du site depuis le stockage local", e);
    }
};

// Charger les données persistantes lors de l'initialisation du module
loadCommandesFromSession();
loadSiteAssetsFromStorage();


// --- Helpers pour les calculs de stock ---
const calculateStock = (ingredient: Omit<Ingredient, 'stock_actuel' | 'prix_unitaire'>): number => {
    return ingredient.lots.reduce((sum, lot) => sum + lot.quantite_restante, 0);
};

const calculateWeightedAveragePrice = (ingredient: Omit<Ingredient, 'stock_actuel' | 'prix_unitaire'>): number => {
    const totalStock = calculateStock(ingredient);
    if (totalStock === 0) return 0;

    const totalCost = ingredient.lots.reduce((sum, lot) => sum + (lot.quantite_restante * lot.prix_unitaire_achat), 0);
    return Math.round(totalCost / totalStock);
};

const updateIngredientComputedData = (ingredientId: number) => {
    const ingredientDB = db.ingredients.find(i => i.id === ingredientId);
    if (ingredientDB) {
        const currentStock = calculateStock(ingredientDB);
        
        if (currentStock > 0) {
            const price = calculateWeightedAveragePrice(ingredientDB);
            (ingredientDB as Ingredient).last_known_price = price;
        }

        const isBelowMinimum = currentStock <= ingredientDB.stock_minimum;
        if (isBelowMinimum && !ingredientDB.date_below_minimum) {
            ingredientDB.date_below_minimum = new Date().toISOString();
        } else if (!isBelowMinimum && ingredientDB.date_below_minimum) {
            delete ingredientDB.date_below_minimum;
        }
    }
};

const getComputedIngredients = (): Ingredient[] => {
    return db.ingredients.map(ing => {
        const stock_actuel = calculateStock(ing);
        let prix_unitaire: number;

        if (stock_actuel > 0) {
            prix_unitaire = calculateWeightedAveragePrice(ing);
        } else {
            prix_unitaire = (ing as Ingredient).last_known_price || 0;
        }
        return {
            ...ing,
            stock_actuel: stock_actuel,
            prix_unitaire: prix_unitaire,
        };
    });
};

const calculateIngredientNeeds = (items: CommandeItem[]): Map<number, number> => {
    const needs = new Map<number, number>();
    for (const item of items) {
        const recette = db.recettes.find(r => r.produit_id === item.produit.id);
        if (!recette) continue;
        
        const excluded = new Set(item.excluded_ingredients || []);

        for (const recItem of recette.items) {
             if (excluded.has(recItem.ingredient_id)) continue;
            const currentNeed = needs.get(recItem.ingredient_id) || 0;
            needs.set(recItem.ingredient_id, currentNeed + (recItem.qte_utilisee * item.quantite));
        }
    }
    return needs;
};

const deductStock = (ingredientId: number, quantity: number) => {
    const ingredientDB = db.ingredients.find(i => i.id === ingredientId);
    if (ingredientDB) {
        let quantiteADeduire = quantity;
        ingredientDB.lots.sort((a, b) => new Date(a.date_achat).getTime() - new Date(b.date_achat).getTime());
        for (const lot of ingredientDB.lots) {
            if (quantiteADeduire <= 0) break;
            const quantiteAPrendre = Math.min(quantiteADeduire, lot.quantite_restante);
            lot.quantite_restante -= quantiteAPrendre;
            quantiteADeduire -= quantiteAPrendre;
        }
    }
    updateIngredientComputedData(ingredientId);
};

const returnStock = (ingredientId: number, quantity: number) => {
    const ingredientDB = db.ingredients.find(i => i.id === ingredientId);
    if (ingredientDB && ingredientDB.lots.length > 0) {
        let quantiteARetourner = quantity;
        ingredientDB.lots.sort((a, b) => new Date(b.date_achat).getTime() - new Date(a.date_achat).getTime());
        for (const lot of ingredientDB.lots) {
            if (quantiteARetourner <= 0) break;
            const spaceAvailable = lot.quantite_initiale - lot.quantite_restante;
            const quantiteAAjouter = Math.min(quantiteARetourner, spaceAvailable);
            lot.quantite_restante += quantiteAAjouter;
            quantiteARetourner -= quantiteAAjouter;
        }
        if (quantiteARetourner > 0 && ingredientDB.lots.length > 0) {
            ingredientDB.lots[0].quantite_restante += quantiteARetourner;
        }
    }
    updateIngredientComputedData(ingredientId);
};

// --- API ---
export const api = {
    getIngredients: async (): Promise<Ingredient[]> => {
        await simulateNetwork();
        return getComputedIngredients();
    },
    getProduits: async (): Promise<Produit[]> => {
        await simulateNetwork();
        return [...db.produits];
    },
    getRecettes: async (): Promise<Recette[]> => {
        await simulateNetwork();
        return [...db.recettes];
    },
    getVentes: async (): Promise<Vente[]> => {
        await simulateNetwork();
        return [...db.ventes];
    },
    getAchats: async (): Promise<Achat[]> => {
        await simulateNetwork();
        return [...db.achats];
    },
    getCategories: async (): Promise<Categoria[]> => {
        await simulateNetwork();
        return [...db.categorias];
    },
    getSiteAssets: async (): Promise<typeof db.siteAssets> => {
        await simulateNetwork(50);
        return { ...db.siteAssets };
    },
    updateSiteAsset: async (assetKey: string, data: File | string): Promise<void> => {
        await simulateNetwork(typeof data === 'string' ? 300 : 1000); // Délai plus long pour le téléchargement de fichier
        if (assetKey in db.siteAssets) {
            let base64Data: string;
            if (typeof data === 'string') {
                base64Data = data;
            } else {
                // Si c'est un fichier, le convertir en Base64 pour la simulation
                base64Data = await readFileAsBase64(data);
            }
            (db.siteAssets as any)[assetKey] = base64Data;
            saveSiteAssetsToStorage();
        } else {
            throw new Error(`Asset key "${assetKey}" non trouvé.`);
        }
    },

    getRoles: async (): Promise<Role[]> => {
        await simulateNetwork();
        return JSON.parse(JSON.stringify(db.roles)); // retourner une copie profonde
    },
    saveRoles: async (newRoles: Role[]): Promise<void> => {
        await simulateNetwork(300);
        db.roles = JSON.parse(JSON.stringify(newRoles)); // la copie profonde prévient les problèmes de mutation
    },
    loginWithPin: async (pin: string): Promise<Role | null> => {
        await simulateNetwork(200);
        const role = db.roles.find(r => r.pin === pin);
        return role ? { ...role } : null;
    },

    // NOUVELLES FONCTIONS POS
    getTables: async (): Promise<Table[]> => {
        await simulateNetwork(50);
        return db.tables.map(t => {
            const commandeEnCours = db.commandes.find(c => c.table_id === t.id && c.statut === 'en_cours');

            const totalCommande = commandeEnCours
                ? commandeEnCours.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0)
                : 0;

            return {
                ...t,
                statut: commandeEnCours ? 'occupee' : 'libre',
                commandeId: commandeEnCours?.id,
                couverts: commandeEnCours?.couverts,
                totalCommande: commandeEnCours ? Math.round(totalCommande) : undefined,
                isReady: commandeEnCours?.estado_cocina === 'listo',
                readyTimestamp: commandeEnCours?.date_listo_cuisine,
                creationTimestamp: commandeEnCours?.date_creation,
                sentToKitchenTimestamp: commandeEnCours?.date_dernier_envoi_cuisine || commandeEnCours?.date_envoi_cuisine,
                kitchenStatus: commandeEnCours?.estado_cocina,
            };
        });
    },

    getActiveCommandes: async (): Promise<Commande[]> => {
        await simulateNetwork(50); // Rapide, car c'est une tâche de fond
        return db.commandes.filter(c => c.statut === 'en_cours');
    },

    getCommandeByTableId: async (tableId: number): Promise<Commande | null> => {
        await simulateNetwork(100);
        const commande = db.commandes.find(c => c.table_id === tableId && c.statut === 'en_cours');
        return commande ? { ...commande } : null;
    },
    
    getCommandeById: async (commandeId: string): Promise<Commande | null> => {
        await simulateNetwork(100);
        const commande = db.commandes.find(c => c.id === commandeId);
        return commande ? { ...commande } : null;
    },

    createCommande: async (tableId: number, couverts: number): Promise<Commande> => {
        await simulateNetwork(150);
        // Permettre plusieurs commandes à emporter simultanées (ID 99)
        if (tableId !== 99 && db.commandes.some(c => c.table_id === tableId && c.statut === 'en_cours')) {
            throw new Error("Ya hay un pedido en curso para esta mesa.");
        }
        
        const commandeId = tableId === 99 ? getNextTakeawayId() : `cmd-${Date.now()}-${tableId}`;

        const newCommande: Commande = {
            id: commandeId,
            table_id: tableId,
            items: [],
            statut: 'en_cours',
            date_creation: new Date().toISOString(),
            couverts: couverts,
            estado_cocina: null,
            payment_status: 'impaye',
        };
        db.commandes.push(newCommande);
        saveCommandesToSession();
        return { ...newCommande };
    },
    
    markCommandeAsPaid: async (commandeId: string): Promise<void> => {
        await simulateNetwork(500);
        const commande = db.commandes.find(c => c.id === commandeId);
        if (commande) {
            commande.payment_status = 'paye';
            saveCommandesToSession();
        } else {
            throw new Error("Pedido no encontrado para marcar como pagado.");
        }
    },

    cancelUnpaidCommande: async (commandeId: string): Promise<void> => {
        await simulateNetwork(50);
        const commandeIndex = db.commandes.findIndex(c => c.id === commandeId);
        if (commandeIndex > -1) {
            const commande = db.commandes[commandeIndex];
            // AMÉLIORATION : Ajout d'une vérification de sécurité. N'annulez pas si des articles ont été envoyés.
            const hasSentItems = commande.items.some(item => item.estado === 'enviado');
            if (commande.payment_status === 'impaye' && !hasSentItems) {
                const itemsToReturn = commande.items;
                const needs = calculateIngredientNeeds(itemsToReturn);
                for(const [ingredientId, quantity] of needs.entries()) {
                    returnStock(ingredientId, quantity);
                }
                db.commandes.splice(commandeIndex, 1);
                saveCommandesToSession();
            }
        }
    },

    updateCommande: async (commandeId: string, updates: { items?: CommandeItem[], couverts?: number }): Promise<Commande> => {
        await simulateNetwork(150);
        const commande = db.commandes.find(c => c.id === commandeId);
        if(!commande) throw new Error("Pedido no encontrado");

        const oldItems = JSON.parse(JSON.stringify(commande.items));
        const oldNeeds = calculateIngredientNeeds(oldItems);

        if (updates.items !== undefined) {
            commande.items = updates.items;
        }
        if (updates.couverts !== undefined) {
            commande.couverts = updates.couverts;
        }
        
        const newNeeds = calculateIngredientNeeds(commande.items);
        const allIngredientIds = new Set([...oldNeeds.keys(), ...newNeeds.keys()]);
        
        for (const id of allIngredientIds) {
            const oldQty = oldNeeds.get(id) || 0;
            const newQty = newNeeds.get(id) || 0;
            const delta = newQty - oldQty;

            if (delta > 0) {
                deductStock(id, delta);
            } else if (delta < 0) {
                returnStock(id, -delta);
            }
        }
        saveCommandesToSession();
        return { ...commande };
    },

    sendOrderToKitchen: async (commandeId: string): Promise<Commande> => {
        await simulateNetwork(300);
        const commande = db.commandes.find(c => c.id === commandeId);
        if(!commande) throw new Error("Pedido no encontrado");

        const itemsToSend = commande.items.filter(item => item.estado === 'nuevo');
        if (itemsToSend.length === 0) {
            return { ...commande };
        }
        
        const now = new Date().toISOString();

        if (!commande.date_envoi_cuisine) {
            commande.date_envoi_cuisine = now;
        }
        commande.date_dernier_envoi_cuisine = now; // Toujours mettre à jour la date du dernier envoi

        commande.estado_cocina = 'recibido'; // Remettre en 'recibido' pour la cuisine
        commande.date_listo_cuisine = undefined; // Effacer l'état prêt précédent
        commande.date_servido = undefined; // Effacer l'état servi précédent

        commande.items.forEach(item => {
            if(item.estado === 'nuevo') {
                item.estado = 'enviado';
                item.date_envoi = now; // Marquer chaque nouvel article avec la date d'envoi
            }
        });
        saveCommandesToSession();
        return { ...commande };
    },

    finaliserCommande: async (commandeId: string): Promise<void> => {
        await simulateNetwork(500);
        const commandeIndex = db.commandes.findIndex(c => c.id === commandeId);
        if (commandeIndex === -1) throw new Error("Pedido no encontrado");
        
        const commande = db.commandes[commandeIndex];

        // Si la commande n'a pas encore de date "servi", on considère que la finalisation
        // EST le moment où elle est servie. Cela garantit que la durée est toujours calculée.
        if (!commande.date_servido) {
            commande.date_servido = new Date().toISOString();
            commande.estado_cocina = 'servido'; // Mettre à jour l'état également pour la cohérence
        }
        
        const table = db.tables.find(t => t.id === commande.table_id);
        
        const dateVente = new Date().toISOString();
        const computedIngredients = getComputedIngredients();

        const calculateCost = (produitId: number): number => {
            const recette = db.recettes.find(r => r.produit_id === produitId);
            if (!recette) return 0;
            return Math.round(recette.items.reduce((total, item) => {
                const ing = computedIngredients.find(i => i.id === item.ingredient_id);
                return total + (ing ? ing.prix_unitaire * item.qte_utilisee : 0);
            }, 0));
        };

        for (const item of commande.items) {
            const coutUnitaire = calculateCost(item.produit.id);
            const newVente: Vente = {
                id: `vente-${Date.now()}-${item.produit.id}`,
                commande_id: commande.id,
                produit_id: item.produit.id,
                quantite: item.quantite,
                date_vente: dateVente,
                prix_total_vente: Math.round(item.produit.prix_vente * item.quantite),
                cout_total_calcule: Math.round(coutUnitaire * item.quantite),
                benefice_calcule: Math.round((item.produit.prix_vente - coutUnitaire) * item.quantite),
                table_nom: table?.nom || 'Desconocida',
                date_envoi_cuisine: commande.date_envoi_cuisine,
                date_servido: commande.date_servido,
            };
            db.ventes.unshift(newVente);
        }

        commande.statut = 'finalisee';
        saveCommandesToSession();
        // NE PAS SUPPRIMER LA COMMANDE POUR PERMETTRE LE SUIVI
        // db.commandes.splice(commandeIndex, 1);
    },

    // KDS Functions
    getKitchenOrders: async (): Promise<Commande[]> => {
        await simulateNetwork(100);
        return db.commandes.filter(c => c.estado_cocina === 'recibido');
    },

    getReadyTakeawayOrders: async (): Promise<Commande[]> => {
        await simulateNetwork(100);
        return db.commandes.filter(c => 
            c.table_id === 99 && // Para Llevar
            c.estado_cocina === 'listo' &&
            c.statut === 'en_cours'
        );
    },

    getPendingTakeawayOrders: async (): Promise<Commande[]> => {
        await simulateNetwork(100);
        return db.commandes.filter(c =>
            c.table_id === 99 &&
            c.statut === 'pendiente_validacion'
        ).sort((a,b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
    },

    submitTakeawayOrderForValidation: async (items: CommandeItem[], customerInfo: { fullName: string, address: string, paymentMethod: string, receipt: File }): Promise<Commande> => {
        await simulateNetwork(1000); // Délai plus long pour simuler le téléchargement de l'image
        
        const commandeId = getNextTakeawayId();
        const receiptBase64 = await readFileAsBase64(customerInfo.receipt);

        const newCommande: Commande = {
            id: commandeId,
            table_id: 99,
            items: items.map(item => ({...item, estado: 'nuevo'})),
            statut: 'pendiente_validacion',
            date_creation: new Date().toISOString(),
            couverts: 1,
            estado_cocina: null,
            payment_status: 'impaye',
            customer_name: customerInfo.fullName,
            customer_address: customerInfo.address,
            payment_method: customerInfo.paymentMethod,
            receipt_image_base64: receiptBase64,
        };
        
        const needs = calculateIngredientNeeds(items);
        for (const [ingredientId, quantity] of needs.entries()) {
            deductStock(ingredientId, quantity);
        }

        db.commandes.push(newCommande);
        saveCommandesToSession();
        return { ...newCommande };
    },

    validateAndSendTakeawayOrder: async (commandeId: string): Promise<Commande> => {
        await simulateNetwork(300);
        const commande = db.commandes.find(c => c.id === commandeId);
        if(!commande || commande.statut !== 'pendiente_validacion') {
            throw new Error("Pedido no encontrado o ya validado.");
        }
        
        commande.statut = 'en_cours';
        
        const now = new Date().toISOString();
        commande.date_envoi_cuisine = now;
        commande.date_dernier_envoi_cuisine = now;
        commande.estado_cocina = 'recibido';

        commande.items.forEach(item => {
            item.estado = 'enviado';
            item.date_envoi = now;
        });

        saveCommandesToSession();
        return { ...commande };
    },

    markOrderAsReady: async (commandeId: string): Promise<void> => {
        await simulateNetwork(200);
        const commande = db.commandes.find(c => c.id === commandeId);
        if (commande) {
            commande.estado_cocina = 'listo';
            commande.date_listo_cuisine = new Date().toISOString();
            saveCommandesToSession();
        }
    },
    
    acknowledgeOrderReady: async (commandeId: string): Promise<void> => {
        await simulateNetwork(100);
        const commande = db.commandes.find(c => c.id === commandeId);
        if (commande && commande.estado_cocina === 'listo') {
            commande.estado_cocina = 'servido';
            commande.date_servido = new Date().toISOString();
            saveCommandesToSession();
        }
    },

    recordAchat: async (ingredient_id: number, quantite_achetee: number, prix_total: number): Promise<Achat> => {
        await simulateNetwork();
        const ingredientDB = db.ingredients.find(i => i.id === ingredient_id);
        if (!ingredientDB) throw new Error("Ingrediente no encontrado");
        
        const prix_unitaire_achat = quantite_achetee > 0 ? Math.round(prix_total / quantite_achetee) : 0;
        ingredientDB.lots.push({
            quantite_initiale: quantite_achetee,
            quantite_restante: quantite_achetee,
            prix_unitaire_achat,
            date_achat: new Date().toISOString()
        });
        updateIngredientComputedData(ingredient_id);
        const newAchat: Achat = { id: `achat-${Date.now()}`, ingredient_id, quantite_achetee, prix_total: Math.round(prix_total), date_achat: new Date().toISOString() };
        db.achats.unshift(newAchat);
        return newAchat;
    },

    updateRecette: async (produit_id: number, newItems: RecetteItem[]): Promise<Recette> => {
        await simulateNetwork(300);
        const recette = db.recettes.find(r => r.produit_id === produit_id);
        if (!recette) throw new Error("Receta no encontrada");
        recette.items = newItems;
        return recette;
    },
    
    addIngredient: async (payload: IngredientPayload): Promise<Ingredient> => {
        await simulateNetwork();
        const newId = Math.max(...db.ingredients.map(i => i.id), 0) + 1;
        const newIngredient = { id: newId, ...payload, lots: [] };
        db.ingredients.push(newIngredient);
        return { ...newIngredient, stock_actuel: 0, prix_unitaire: 0 };
    },

    updateIngredient: async (id: number, payload: IngredientPayload): Promise<Ingredient> => {
        await simulateNetwork();
        const ingredient = db.ingredients.find(i => i.id === id);
        if (!ingredient) throw new Error("Ingrediente no encontrado");
        Object.assign(ingredient, payload);
        return { ...ingredient, stock_actuel: calculateStock(ingredient), prix_unitaire: calculateWeightedAveragePrice(ingredient) };
    },

    deleteIngredient: async (id: number): Promise<void> => {
        await simulateNetwork();
        
        const activeOrders = db.commandes.filter(c => c.statut !== 'finalisee');
        for (const order of activeOrders) {
            for (const item of order.items) {
                const recette = db.recettes.find(r => r.produit_id === item.produit.id);
                if (recette && recette.items.some(ri => ri.ingredient_id === id)) {
                     throw new Error("Este ingrediente forma parte de un producto en un pedido activo y no se puede eliminar.");
                }
            }
        }
        
        db.recettes.forEach(r => {
            r.items = r.items.filter(item => item.ingredient_id !== id);
        });

        db.ingredients = db.ingredients.filter(i => i.id !== id);
    },


    addProduct: async (payload: ProduitPayload, items: RecetteItem[], imageFile?: File): Promise<Produit> => {
        await simulateNetwork();
        const newId = Math.max(...db.produits.map(p => p.id), 0) + 1;
        const newProduit: Produit = { id: newId, ...payload, estado: 'disponible' };

        if (imageFile) {
            newProduit.image_base64 = await readFileAsBase64(imageFile);
        }

        db.produits.push(newProduit);
        db.recettes.push({ produit_id: newId, items });
        return newProduit;
    },

    updateProduct: async (id: number, payload: ProduitPayload): Promise<Produit> => {
        await simulateNetwork();
        const product = db.produits.find(p => p.id === id);
        if (!product) throw new Error("Producto no encontrado");
        Object.assign(product, payload);
        return product;
    },

    updateProductImage: async (productId: number, imageFile: File | null): Promise<Produit> => {
        await simulateNetwork(imageFile ? 800 : 200);
        const product = db.produits.find(p => p.id === productId);
        if (!product) throw new Error("Producto no encontrado");

        if (imageFile) {
            product.image_base64 = await readFileAsBase64(imageFile);
        } else {
            delete product.image_base64;
        }
        return { ...product };
    },

    updateProductStatus: async (productId: number, status: Produit['estado']): Promise<Produit> => {
        await simulateNetwork(200);
        const product = db.produits.find(p => p.id === productId);
        if (!product) throw new Error("Producto no encontrado");
        product.estado = status;
        return { ...product };
    },

    deleteProduct: async (id: number): Promise<void> => {
        await simulateNetwork();
        if (db.ventes.some(v => v.produit_id === id)) {
            throw new Error("Este producto ha sido vendido y no se puede eliminar.");
        }
        db.produits = db.produits.filter(p => p.id !== id);
        db.recettes = db.recettes.filter(r => r.produit_id !== id);
    },
    
    cancelEmptyCommande: async (commandeId: string): Promise<void> => {
        await simulateNetwork(50);
        const commandeIndex = db.commandes.findIndex(c => c.id === commandeId);
        if (commandeIndex > -1) {
            const commande = db.commandes[commandeIndex];
            if (commande.items.length === 0) {
                db.commandes.splice(commandeIndex, 1);
                saveCommandesToSession();
            }
        }
    },

    // Category Management
    addCategory: async (nom: string): Promise<Categoria> => {
        await simulateNetwork();
        const newId = Math.max(...db.categorias.map(c => c.id), 0) + 1;
        const newCategory = { id: newId, nom };
        db.categorias.push(newCategory);
        return newCategory;
    },

    deleteCategory: async (id: number): Promise<void> => {
        await simulateNetwork();
        if (db.produits.some(p => p.categoria_id === id)) {
            throw new Error("Esta categoría contiene productos y no se puede eliminar.");
        }
        db.categorias = db.categorias.filter(c => c.id !== id);
    },
    // Table Management
    addTable: async (data: TablePayload): Promise<void> => {
        await simulateNetwork(200);
        if (db.tables.some(t => t.id === data.id || t.nom.toLowerCase() === data.nom.toLowerCase())) {
            throw new Error("El número o nombre de la mesa ya existe.");
        }
        db.tables.push(data);
    },

    updateTable: async (id: number, data: Omit<TablePayload, 'id'>): Promise<void> => {
        await simulateNetwork(200);
        const table = db.tables.find(t => t.id === id);
        if (!table) {
            throw new Error("Mesa no encontrada.");
        }
        if (db.tables.some(t => t.id !== id && t.nom.toLowerCase() === data.nom.toLowerCase())) {
            throw new Error("Ya existe otra mesa con ese nombre.");
        }
        table.nom = data.nom;
        table.capacite = data.capacite;
    },

    getTimeEntries: async (): Promise<TimeEntry[]> => {
        await simulateNetwork(50);
        return [...db.timeEntries];
    },

    deleteTable: async (id: number): Promise<void> => {
        await simulateNetwork(300);
        const isOccupied = db.commandes.some(c => c.table_id === id && c.statut === 'en_cours');
        if (isOccupied) {
            throw new Error("No se puede eliminar una mesa con un pedido en curso.");
        }
        db.tables = db.tables.filter(t => t.id !== id);
    },
};