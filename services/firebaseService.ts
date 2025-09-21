
import { Produit, Categoria, Ingredient, Recette, Vente, Achat, Table, Commande, Role, IngredientPayload, ProduitPayload, RecetteItem, CommandeItem, CommandePayload, TablePayload } from '../types';

// --- Import de la configuration Firebase centralisée ---
import { db } from "../src/firebaseConfig"; // IMPORTANT: Utilise la nouvelle configuration
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, runTransaction } from "firebase/firestore";

const RESTAURANT_ID = "ouiouitacos_main";

// =====================================================================================
// SERVICE DE DONNÉES : LECTURE
// =====================================================================================
const fetchData = async <T>(collectionName: string): Promise<T[]> => {
    const q = collection(db, `restaurants/${RESTAURANT_ID}/${collectionName}`);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
};

export const getProducts = () => fetchData<Produit>('products');
export const getCategories = () => fetchData<Categoria>('categories');
export const getIngredients = () => fetchData<Ingredient>('ingredients');
export const getRecettes = () => fetchData<Recette>('recettes');
export const getVentes = () => fetchData<Vente>('ventes');
export const getAchats = () => fetchData<Achat>('achats');
export const getTables = () => fetchData<Table>('tables');
export const getCommandes = () => fetchData<Commande>('commandes');
export const getRoles = () => fetchData<Role>('roles');


// =====================================================================================
// SERVICE DE DONNÉES : ÉCRITURE
// =====================================================================================

// --- Ingrédients, Produits, Catégories, Recettes ---
export const addIngredient = (payload: IngredientPayload) => addDoc(collection(db, `restaurants/${RESTAURANT_ID}/ingredients`), { ...payload, stock_actuel: 0, prix_unitaire_moyen: 0, lots: [] });
export const updateIngredient = (id: string, payload: Partial<IngredientPayload>) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/ingredients`, id), payload);
export const deleteIngredient = (id: string) => deleteDoc(doc(db, `restaurants/${RESTAURANT_ID}/ingredients`, id));
export const addCategory = (nom: string) => addDoc(collection(db, `restaurants/${RESTAURANT_ID}/categories`), { nom });
export const deleteCategory = (id: string) => deleteDoc(doc(db, `restaurants/${RESTAURANT_ID}/categories`, id));
export const updateRecette = (produitId: string, items: RecetteItem[]) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/recettes`, produitId), { items });
export const updateProductStatus = (productId: string, status: Produit['estado']) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/products`, productId), { estado: status });

export const addProduct = async (payload: ProduitPayload, items: RecetteItem[]): Promise<Produit> => {
    const batch = writeBatch(db);
    const productRef = doc(collection(db, `restaurants/${RESTAURANT_ID}/products`));
    
    // Crée le nouveau produit
    const newProduct = { ...payload, id: productRef.id };
    batch.set(productRef, newProduct);
    
    // Crée la recette associée
    const recetteRef = doc(db, `restaurants/${RESTAURANT_ID}/recettes`, productRef.id);
    batch.set(recetteRef, { produit_id: productRef.id, items });
    
    await batch.commit();
    return newProduct as Produit;
};

export const updateProduct = (id: string, payload: Partial<ProduitPayload>) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/products`, id), payload);

export const deleteProduct = async (id: string): Promise<void> => {
    const batch = writeBatch(db);
    batch.delete(doc(db, `restaurants/${RESTAURANT_ID}/products`, id));
    batch.delete(doc(db, `restaurants/${RESTAURANT_ID}/recettes`, id));
    await batch.commit();
};

// --- Commandes ---
export const getCommandeById = async (id: string): Promise<Commande | null> => {
    const commandeDoc = await getDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, id));
    return commandeDoc.exists() ? { ...commandeDoc.data(), id: commandeDoc.id } as Commande : null;
}

export const createCommande = async (tableId: number, couverts: number): Promise<Commande> => {
    const newCommandeData: CommandePayload = {
        table_id: tableId,
        couverts,
        items: [],
        statut: 'en_cours',
        date_creation: serverTimestamp(),
        total: 0,
        numero: 1, // Logique de numéro à affiner
    };
    const commandesCol = collection(db, `restaurants/${RESTAURANT_ID}/commandes`);
    const docRef = await addDoc(commandesCol, newCommandeData);
    return { ...newCommandeData, id: docRef.id } as Commande;
};

export const updateCommande = (commandeId: string, updates: { items?: CommandeItem[], couverts?: number, total?: number }) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), updates as { [x: string]: any });
export const sendOrderToKitchen = (commandeId: string) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), { estado_cocina: 'recibido', date_envoi_cuisine: serverTimestamp() });
export const markOrderAsReady = (commandeId: string) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), { estado_cocina: 'listo', date_listo_cuisine: serverTimestamp() });
export const acknowledgeOrderReady = (commandeId: string) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), { estado_cocina: 'servido' });
export const cancelEmptyCommande = (commandeId: string) => deleteDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId));
export const markCommandeAsPaid = (commandeId: string) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), { statut: 'payee' });
export const cancelUnpaidCommande = (commandeId: string) => updateDoc(doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId), { statut: 'annulee' });

export const finaliserCommande = async (commandeId: string): Promise<void> => {
    await runTransaction(db, async (transaction) => {
        const commandeRef = doc(db, `restaurants/${RESTAURANT_ID}/commandes`, commandeId);
        const commandeSnap = await transaction.get(commandeRef);
        if (!commandeSnap.exists()) { throw new Error("La commande n'existe pas!"); }
        const commandeData = commandeSnap.data() as Commande;
        const ventesCol = collection(db, `restaurants/${RESTAURANT_ID}/ventes`);
        const timestamp = serverTimestamp();
        commandeData.items.forEach(item => {
            const venteData = { produit_id: item.produit.id, quantite: item.quantite, prix_total_vente: item.produit.prix_vente * item.quantite, date_vente: timestamp, commande_id: commandeId };
            transaction.set(doc(ventesCol), venteData);
        });
        transaction.update(commandeRef, { statut: 'terminee' });
    });
};

// --- Tables ---
export const addTable = (data: TablePayload) => addDoc(collection(db, `restaurants/${RESTAURANT_ID}/tables`), data);
export const updateTable = (id: string, data: Partial<TablePayload>) => updateDoc(doc(db, `restaurants/${RESAURANT_ID}/tables`, id), data);
export const deleteTable = (id: string) => deleteDoc(doc(db, `restaurants/${RESTAURANT_ID}/tables`, id));

// --- Achats ---
export const recordAchat = (ingredient_id: string, quantite: number, prix: number) => addDoc(collection(db, `restaurants/${RESTAURANT_ID}/achats`), { ingredient_id, quantite, prix_total: prix, date_achat: serverTimestamp() });

// --- Authentification et Rôles ---
export const loginWithPin = async (pin: string): Promise<Role | null> => {
    const roles = await getRoles();
    return roles.find(r => r.pin === pin) || null;
};

export const saveRoles = async (newRoles: Role[]): Promise<void> => {
    const batch = writeBatch(db);
    const rolesCol = collection(db, `restaurants/${RESTAURANT_ID}/roles`);
    // Supprimer les anciens rôles?
    newRoles.forEach(role => {
        const roleRef = doc(rolesCol, role.id);
        batch.set(roleRef, role);
    });
    await batch.commit();
}
