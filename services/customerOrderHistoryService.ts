import type { Commande, HistoricCommande, HistoricCommandeItem, Produit } from '../types';

const HISTORY_KEY = 'customerOrderHistory';

// S'assurer que les objets Produit sont "allégés" pour éviter de stocker des données inutiles
const sanitizeProduct = (produit: Produit): Produit => ({
    id: produit.id,
    nom_produit: produit.nom_produit,
    prix_vente: produit.prix_vente,
    categoria_id: produit.categoria_id,
    estado: produit.estado,
});


const formatCommandeForHistory = (commande: Commande): HistoricCommande => {
    const items: HistoricCommandeItem[] = commande.items.map(item => ({
        produit: sanitizeProduct(item.produit),
        quantite: item.quantite,
        commentaire: item.commentaire,
        excluded_ingredients: item.excluded_ingredients,
    }));
    
    const total = commande.items.reduce((sum, item) => sum + (item.produit.prix_vente * item.quantite), 0);
    
    return {
        id: commande.id,
        date: new Date().toISOString(),
        items: items,
        total: total,
    };
};


export const customerOrderHistoryService = {
    getHistory: (): HistoricCommande[] => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (e) {
            console.error("Impossible de lire l'historique des commandes", e);
            return [];
        }
    },
    
    saveOrder: (commande: Commande): void => {
        try {
            const history = customerOrderHistoryService.getHistory();
            const newHistoricOrder = formatCommandeForHistory(commande);
            // Ajouter la nouvelle commande au début et ne conserver que les 10 dernières
            const updatedHistory = [newHistoricOrder, ...history].slice(0, 10);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("Impossible d'enregistrer la commande dans l'historique", e);
        }
    }
};
