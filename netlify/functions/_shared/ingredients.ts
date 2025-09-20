import type { Ingredient, IngredientLot } from '../../../types';

export const INGREDIENT_SELECT =
    'id, nom, unite, stock_minimum, stock_actuel, prix_unitaire, date_below_minimum, last_known_price, lots:ingredient_lots (quantite_initiale, quantite_restante, prix_unitaire_achat, date_achat)';

export interface IngredientRow {
    id: number;
    nom: string;
    unite: string;
    stock_minimum: number;
    stock_actuel: number | null;
    prix_unitaire: number | null;
    date_below_minimum: string | null;
    last_known_price: number | null;
    lots: IngredientLot[] | null;
}

export const mapIngredientRow = (row: IngredientRow): Ingredient => ({
    id: row.id,
    nom: row.nom,
    unite: row.unite as Ingredient['unite'],
    stock_minimum: row.stock_minimum,
    stock_actuel: row.stock_actuel ?? 0,
    prix_unitaire: row.prix_unitaire ?? 0,
    date_below_minimum: row.date_below_minimum ?? undefined,
    last_known_price: row.last_known_price ?? undefined,
    lots: row.lots ?? [],
});
