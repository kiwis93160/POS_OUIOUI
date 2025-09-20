import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/commandes/:id/cancel-empty' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'DELETE') {
        return methodNotAllowed(['DELETE']);
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
        console.error('commandes/:id/cancel-empty: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('commandes')
            .select('table_id')
            .eq('id', commandeId)
            .maybeSingle();

        if (error) {
            console.error('commandes/:id/cancel-empty: Supabase lookup error', error);
            return internalError('Unable to cancel commande');
        }

        const { error: deleteError } = await supabase.from('commandes').delete().eq('id', commandeId);
        if (deleteError) {
            console.error('commandes/:id/cancel-empty: Supabase delete error', deleteError);
            return internalError('Unable to cancel commande');
        }

        if (data?.table_id) {
            await supabase.from('tables').update({ statut: 'libre', commande_id: null, couverts: null }).eq('id', data.table_id);
        }

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('commandes/:id/cancel-empty: unexpected error', error);
        return internalError();
    }
}
