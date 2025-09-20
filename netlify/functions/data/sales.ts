import type { Vente } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/sales' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/sales: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('ventes')
            .select('*')
            .order('date_vente', { ascending: false });

        if (error) {
            console.error('data/sales: Supabase query error', error);
            return internalError('Unable to retrieve sales');
        }

        const rows = (data ?? []) as Vente[];
        return jsonResponse(rows);
    } catch (error) {
        console.error('data/sales: unexpected error', error);
        return internalError();
    }
}
