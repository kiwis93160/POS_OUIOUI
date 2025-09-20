import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/kitchen/ready/:id' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    const url = new URL(request.url);
    const commandeId = url.pathname.split('/').pop();

    if (!commandeId) {
        return jsonResponse({ message: 'Invalid commande id' }, { status: 400 });
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('kitchen/ready: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    const now = new Date().toISOString();

    try {
        const { error } = await supabase
            .from('commandes')
            .update({ estado_cocina: 'listo', date_listo_cuisine: now })
            .eq('id', commandeId);
        if (error) {
            console.error('kitchen/ready: Supabase update error', error);
            return internalError('Unable to mark commande as ready');
        }
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('kitchen/ready: unexpected error', error);
        return internalError();
    }
}
