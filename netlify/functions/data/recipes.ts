import type { Recette, RecetteItem } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/recipes' };

interface RecetteItemRow {
    produit_id: number;
    ingredient_id: number;
    qte_utilisee: number;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/recipes: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from<RecetteItemRow>('recette_items')
            .select('produit_id, ingredient_id, qte_utilisee')
            .order('produit_id', { ascending: true });

        if (error) {
            console.error('data/recipes: Supabase query error', error);
            return internalError('Unable to retrieve recipes');
        }

        const recettesMap = new Map<number, RecetteItem[]>();
        for (const row of data ?? []) {
            if (!recettesMap.has(row.produit_id)) {
                recettesMap.set(row.produit_id, []);
            }
            recettesMap.get(row.produit_id)!.push({
                ingredient_id: row.ingredient_id,
                qte_utilisee: row.qte_utilisee,
            });
        }

        const recettes: Recette[] = Array.from(recettesMap.entries()).map(([produitId, items]) => ({
            produit_id: produitId,
            items,
        }));

        return jsonResponse(recettes);
    } catch (error) {
        console.error('data/recipes: unexpected error', error);
        return internalError();
    }
}
