import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/takeaway/validate/:id' };

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
        console.error('takeaway/validate: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    const now = new Date().toISOString();

    try {
        const { error } = await supabase
            .from('commandes')
            .update({ statut: 'en_cours', estado_cocina: 'recibido', date_envoi_cuisine: now, date_dernier_envoi_cuisine: now })
            .eq('id', commandeId);
        if (error) {
            console.error('takeaway/validate: Supabase update error', error);
            return internalError('Unable to validate takeaway order');
        }
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('takeaway/validate: unexpected error', error);
        return internalError();
    }
}
