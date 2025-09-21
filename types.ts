export enum Unite {
    KG = 'kg',
    L = 'L',
    UNITE = 'unidad'
}

export interface IngredientLot {
    quantite_initiale: number;
    quantite_restante: number;
    prix_unitaire_achat: number;
    date_achat: string;
}

export interface Ingredient {
    id: number;
    nom: string;
    unite: Unite;
    stock_minimum: number;
    stock_actuel: number;
    prix_unitaire: number;
    lots: IngredientLot[];
    date_below_minimum?: string;
    last_known_price?: number;
}

export type IngredientPayload = Pick<Ingredient, 'nom' | 'unite' | 'stock_minimum'>;

export interface Categoria {
    id: number;
    nom: string;
}

export interface Produit {
    id: number;
    nom_produit: string;
    prix_vente: number;
    categoria_id: number;
    estado: 'disponible' | 'agotado_temporal' | 'agotado_indefinido';
    image_base64?: string;
}

export type ProduitPayload = Pick<Produit, 'nom_produit' | 'prix_vente' | 'categoria_id'>;

export interface RecetteItem {
    ingredient_id: number;
    qte_utilisee: number;
}

export interface Recette {
    produit_id: number;
    items: RecetteItem[];
}

export interface Vente {
    id: string;
    commande_id: string;
    produit_id: number;
    quantite: number;
    date_vente: string;
    cout_total_calcule: number;
    benefice_calcule: number;
    prix_total_vente: number;
    table_nom?: string;
    date_envoi_cuisine?: string;
    date_servido?: string;
}

export interface Achat {
    id: string;
    ingredient_id: number;
    quantite_achetee: number;
    prix_total: number;
    date_achat: string;
}

export type TableStatus = 'libre' | 'occupee';

export interface Table {
    id: number;
    nom: string;
    capacite: number;
    statut: TableStatus;
    commandeId?: string;
    couverts?: number;
    totalCommande?: number;
    isReady?: boolean;
    readyTimestamp?: string;
    creationTimestamp?: string;
    sentToKitchenTimestamp?: string;
    kitchenStatus?: KitchenOrderStatus | null;
}

export type TablePayload = Pick<Table, 'id' | 'nom' | 'capacite'>;

export interface Modificateur {
    nom: string;
    valeur: string;
}

export interface CommandeItem {
    id: string;
    produit: Produit;
    quantite: number;
    modificateurs?: Modificateur[];
    commentaire?: string;
    excluded_ingredients?: number[];
    estado: 'nuevo' | 'enviado';
    date_envoi?: string;
}

export type CommandeStatus = 'en_cours' | 'finalisee' | 'pendiente_validacion';
export type KitchenOrderStatus = 'recibido' | 'listo' | 'servido';

export interface Commande {
    id: string;
    table_id: number;
    items: CommandeItem[];
    statut: CommandeStatus;
    date_creation: string;
    couverts: number;
    estado_cocina: KitchenOrderStatus | null;
    date_envoi_cuisine?: string;
    date_listo_cuisine?: string;
    date_servido?: string;
    date_dernier_envoi_cuisine?: string;
    payment_status: 'paye' | 'impaye';
    customer_name?: string;
    customer_address?: string;
    payment_method?: string;
    receipt_image_base64?: string;
}

export type PermissionLevel = 'editor' | 'readonly' | 'none';

export interface PagePermissions {
  [path: string]: PermissionLevel;
}

export interface Role {
  id: string; // e.g., 'admin', 'kitchen'
  name: string; // e.g., 'Administrador', 'Cocina'
  pin: string;
  permissions: PagePermissions;
}

export type UserRole = string | null;

export interface HistoricCommandeItem {
    produit: Produit;
    quantite: number;
    commentaire?: string;
    excluded_ingredients?: number[];
}

export interface HistoricCommande {
    id: string;
    date: string;
    items: HistoricCommandeItem[];
    total: number;
}

export interface TimeEntry {
  id: string;
  role_id: string;
  timestamp: string;
  type: 'in' | 'out';
}

export interface DailyReportData {
  generationDate: string;
  totalSales: number;
  customerCount: number;
  productsSold: Array<{
    categoryName: string;
    items: Array<{
      productName: string;
      quantity: number;
    }>;
  }>;
  inventoryStatus: {
    lowStockIngredients: number;
    lowStockIngredientsDetails: Array<{
      nom: string;
      date_below_minimum?: string;
    }>;
  };
  staffActivity: {
    cocinaFirstLogin?: string;
    meseroFirstLogin?: string;
  };
}