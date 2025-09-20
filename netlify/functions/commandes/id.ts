import type { Commande, CommandeItem } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { COMMANDE_SELECT, type CommandeRow, mapCommandeRow } from '../_shared/commandes';

export const config = { path: '/commandes/:id' };

interface UpdateCommandePayload {
    items?: CommandeItem[];
    couverts?: number;
}

const loadCommande = async (id: string): Promise<Commande> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('commandes')
        .select(COMMANDE_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    const row = data as CommandeRow | null;
    if (!row) {
        throw new Error('Commande not found');
    }
    return mapCommandeRow(row);
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'PATCH') {
        return methodNotAllowed(['PATCH']);
    }

    const url = new URL(request.url);
    const idParam = url.pathname.split('/').pop();
    const commandeId = idParam ?? '';

    if (!commandeId) {
        return badRequest('Invalid commande id');
    }

    let payload: UpdateCommandePayload;
    try {
        payload = await parseJson<UpdateCommandePayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    const updateData: Record<string, unknown> = {};
    if (payload.items) {
        updateData.items = payload.items;
    }
    if (typeof payload.couverts === 'number') {
        updateData.couverts = payload.couverts;
    }

    if (Object.keys(updateData).length === 0) {
        return badRequest('No updates provided');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('commandes/:id: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { error } = await supabase.from('commandes').update(updateData).eq('id', commandeId);
        if (error) {
            console.error('commandes/:id: Supabase update error', error);
            return internalError('Unable to update commande');
        }

        const commande = await loadCommande(commandeId);
        return jsonResponse(commande);
    } catch (error) {
        console.error('commandes/:id: unexpected error', error);
        return internalError();
    }
}
