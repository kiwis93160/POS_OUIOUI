import type { Categoria } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/categories' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/categories: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('nom', { ascending: true });

        if (error) {
            console.error('data/categories: Supabase query error', error);
            return internalError('Unable to retrieve categories');
        }

        const rows = (data ?? []) as Categoria[];
        return jsonResponse(rows);
    } catch (error) {
        console.error('data/categories: unexpected error', error);
        return internalError();
    }
}
