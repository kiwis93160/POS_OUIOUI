import type { IngredientPayload, Ingredient } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { INGREDIENT_SELECT, type IngredientRow, mapIngredientRow } from '../_shared/ingredients';

export const config = { path: '/ingredients/:id' };

const loadIngredient = async (id: number): Promise<Ingredient> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('ingredients')
        .select(INGREDIENT_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    const row = data as IngredientRow | null;
    if (!row) {
        throw new Error('Ingredient not found');
    }
    return mapIngredientRow(row);
};

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const idParam = url.pathname.split('/').pop();
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
        return badRequest('Invalid ingredient id');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('ingredients/:id: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    if (request.method === 'PUT') {
        let payload: IngredientPayload;
        try {
            payload = await parseJson<IngredientPayload>(request);
        } catch (error) {
            return badRequest('Invalid JSON body');
        }

        if (!payload.nom || !payload.unite || typeof payload.stock_minimum !== 'number') {
            return badRequest('Missing required ingredient fields');
        }

        try {
            const { error } = await supabase
                .from('ingredients')
                .update({
                    nom: payload.nom,
                    unite: payload.unite,
                    stock_minimum: payload.stock_minimum,
                })
                .eq('id', id);

            if (error) {
                console.error('ingredients/:id: Supabase update error', error);
                return internalError('Unable to update ingredient');
            }

            let ingredient: Ingredient;
            try {
                ingredient = await loadIngredient(id);
            } catch (fetchError) {
                console.error('ingredients/:id: failed to reload ingredient', fetchError);
                return internalError('Ingredient updated but could not be retrieved');
            }

            return jsonResponse(ingredient);
        } catch (error) {
            console.error('ingredients/:id: unexpected update error', error);
            return internalError();
        }
    }

    if (request.method === 'DELETE') {
        try {
            const { error } = await supabase.from('ingredients').delete().eq('id', id);
            if (error) {
                console.error('ingredients/:id: Supabase delete error', error);
                return internalError('Unable to delete ingredient');
            }
            return new Response(null, { status: 204 });
        } catch (error) {
            console.error('ingredients/:id: unexpected delete error', error);
            return internalError();
        }
    }

    return methodNotAllowed(['PUT', 'DELETE']);
}
