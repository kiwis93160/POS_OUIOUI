import type { Achat } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/purchases' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/purchases: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('achats')
            .select('*')
            .order('date_achat', { ascending: false });

        if (error) {
            console.error('data/purchases: Supabase query error', error);
            return internalError('Unable to retrieve purchases');
        }

        const rows = (data ?? []) as Achat[];
        return jsonResponse(rows);
    } catch (error) {
        console.error('data/purchases: unexpected error', error);
        return internalError();
    }
}
