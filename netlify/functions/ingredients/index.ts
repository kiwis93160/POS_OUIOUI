import type { Ingredient, IngredientPayload } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { INGREDIENT_SELECT, type IngredientRow, mapIngredientRow } from '../_shared/ingredients';

export const config = { path: '/ingredients' };

const fetchIngredientById = async (id: number) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from<IngredientRow>('ingredients')
        .select(INGREDIENT_SELECT)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error('Ingredient not found');
    }

    return mapIngredientRow(data);
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let payload: IngredientPayload;
    try {
        payload = await parseJson<IngredientPayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    if (!payload.nom || !payload.unite || typeof payload.stock_minimum !== 'number') {
        return badRequest('Missing required ingredient fields');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('ingredients: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('ingredients')
            .insert({
                nom: payload.nom,
                unite: payload.unite,
                stock_minimum: payload.stock_minimum,
            })
            .select('id')
            .maybeSingle();

        if (error) {
            console.error('ingredients: Supabase insert error', error);
            return internalError('Unable to create ingredient');
        }

        if (!data) {
            return internalError('Ingredient creation failed');
        }

        let ingredient: Ingredient;
        try {
            ingredient = await fetchIngredientById(data.id as number);
        } catch (fetchError) {
            console.error('ingredients: failed to load created ingredient', fetchError);
            return internalError('Ingredient created but could not be retrieved');
        }

        return jsonResponse(ingredient, { status: 201 });
    } catch (error) {
        console.error('ingredients: unexpected error', error);
        return internalError();
    }
}
