import type { Ingredient } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';
import { INGREDIENT_SELECT, type IngredientRow, mapIngredientRow } from '../_shared/ingredients';

export const config = { path: '/data/ingredients' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/ingredients: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from<IngredientRow>('ingredients')
            .select(INGREDIENT_SELECT)
            .order('nom', { ascending: true });

        if (error) {
            console.error('data/ingredients: Supabase query error', error);
            return internalError('Unable to retrieve ingredients');
        }

        const ingredients: Ingredient[] = (data ?? []).map(mapIngredientRow);

        return jsonResponse(ingredients);
    } catch (error) {
        console.error('data/ingredients: unexpected error', error);
        return internalError();
    }
}
