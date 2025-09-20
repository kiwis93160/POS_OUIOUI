import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/commandes/:id/pay' };

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
        console.error('commandes/:id/pay: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { error } = await supabase
            .from('commandes')
            .update({ payment_status: 'paye' })
            .eq('id', commandeId);
        if (error) {
            console.error('commandes/:id/pay: Supabase update error', error);
            return internalError('Unable to mark commande as paid');
        }
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('commandes/:id/pay: unexpected error', error);
        return internalError();
    }
}
