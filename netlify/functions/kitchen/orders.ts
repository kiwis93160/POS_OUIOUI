import type { Commande } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';
import { COMMANDE_SELECT, type CommandeRow, mapCommandeRow } from '../_shared/commandes';

export const config = { path: '/kitchen/orders' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('kitchen/orders: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from<CommandeRow>('commandes')
            .select(COMMANDE_SELECT)
            .in('statut', ['en_cours', 'pendiente_validacion'])
            .order('date_creation', { ascending: true });

        if (error) {
            console.error('kitchen/orders: Supabase query error', error);
            return internalError('Unable to retrieve kitchen orders');
        }

        const commandes: Commande[] = (data ?? []).map(mapCommandeRow);
        return jsonResponse(commandes);
    } catch (error) {
        console.error('kitchen/orders: unexpected error', error);
        return internalError();
    }
}
