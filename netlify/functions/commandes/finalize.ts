import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/commandes/:id/finalize' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const commandeId = segments[segments.length - 2];

    if (!commandeId) {
        return jsonResponse({ message: 'Invalid commande id' }, { status: 400 });
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('commandes/:id/finalize: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    const now = new Date().toISOString();

    try {
        const { data, error } = await supabase
            .from('commandes')
            .update({
                statut: 'finalisee',
                estado_cocina: 'servido',
                date_servido: now,
                date_dernier_envoi_cuisine: now,
            })
            .eq('id', commandeId)
            .select('table_id')
            .maybeSingle();

        if (error) {
            console.error('commandes/:id/finalize: Supabase update error', error);
            return internalError('Unable to finalize commande');
        }

        if (data?.table_id) {
            await supabase
                .from('tables')
                .update({ statut: 'libre', commande_id: null, couverts: null })
                .eq('id', data.table_id);
        }

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('commandes/:id/finalize: unexpected error', error);
        return internalError();
    }
}
