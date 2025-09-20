import type { Categoria } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';

export const config = { path: '/categories' };

interface CategoryPayload {
    nom: string;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let payload: CategoryPayload;
    try {
        payload = await parseJson<CategoryPayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    if (!payload.nom || payload.nom.trim().length === 0) {
        return badRequest('Category name is required');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('categories: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('categories')
            .insert({ nom: payload.nom })
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('categories: Supabase insert error', error);
            return internalError('Unable to create category');
        }

        const category = data as Categoria | null;

        if (!category) {
            return internalError('Category creation failed');
        }

        return jsonResponse(category, { status: 201 });
    } catch (error) {
        console.error('categories: unexpected error', error);
        return internalError();
    }
}
