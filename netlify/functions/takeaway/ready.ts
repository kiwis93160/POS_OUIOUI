import type { Commande } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';
import { COMMANDE_SELECT, type CommandeRow, mapCommandeRow } from '../_shared/commandes';

export const config = { path: '/takeaway/ready' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('takeaway/ready: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('commandes')
            .select(COMMANDE_SELECT)
            .eq('statut', 'en_cours')
            .is('table_id', null)
            .order('date_creation', { ascending: true });

        if (error) {
            console.error('takeaway/ready: Supabase query error', error);
            return internalError('Unable to retrieve takeaway orders');
        }

        const rows = (data ?? []) as CommandeRow[];
        const commandes: Commande[] = rows.map(mapCommandeRow);
        return jsonResponse(commandes);
    } catch (error) {
        console.error('takeaway/ready: unexpected error', error);
        return internalError();
    }
}
