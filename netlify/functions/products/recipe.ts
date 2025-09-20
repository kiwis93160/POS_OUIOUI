import type { Recette, RecetteItem } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';

export const config = { path: '/products/:id/recipe' };

interface RecipePayload {
    items: RecetteItem[];
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'PUT') {
        return methodNotAllowed(['PUT']);
    }

    const url = new URL(request.url);
    const idParam = url.pathname.split('/').slice(-2)[0];
    const produitId = Number(idParam);

    if (!produitId || Number.isNaN(produitId)) {
        return badRequest('Invalid product id');
    }

    let payload: RecipePayload;
    try {
        payload = await parseJson<RecipePayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    if (!Array.isArray(payload.items)) {
        return badRequest('Invalid recipe items');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('products/:id/recipe: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { error: deleteError } = await supabase.from('recette_items').delete().eq('produit_id', produitId);
        if (deleteError) {
            console.error('products/:id/recipe: failed to clear existing recipe', deleteError);
            return internalError('Unable to update recipe');
        }

        if (payload.items.length > 0) {
            const itemsToInsert = payload.items.map(item => ({
                produit_id: produitId,
                ingredient_id: item.ingredient_id,
                qte_utilisee: item.qte_utilisee,
            }));
            const { error: insertError } = await supabase.from('recette_items').insert(itemsToInsert);
            if (insertError) {
                console.error('products/:id/recipe: failed to insert recipe items', insertError);
                return internalError('Unable to update recipe');
            }
        }

        const recette: Recette = {
            produit_id: produitId,
            items: payload.items,
        };
        return jsonResponse(recette);
    } catch (error) {
        console.error('products/:id/recipe: unexpected error', error);
        return internalError();
    }
}
