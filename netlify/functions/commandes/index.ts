import type { Commande } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { COMMANDE_SELECT, type CommandeRow, mapCommandeRow } from '../_shared/commandes';

export const config = { path: '/commandes' };

interface CreateCommandePayload {
    tableId: number;
    couverts: number;
}

const loadCommandeById = async (id: string): Promise<Commande | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from<CommandeRow>('commandes')
        .select(COMMANDE_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data ? mapCommandeRow(data) : null;
};

export default async function handler(request: Request): Promise<Response> {
    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('commandes: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    if (request.method === 'GET') {
        const url = new URL(request.url);
        const tableIdParam = url.searchParams.get('tableId');
        const commandeId = url.searchParams.get('commandeId');

        try {
            if (commandeId) {
                const commande = await loadCommandeById(commandeId);
                return jsonResponse(commande);
            }

            if (tableIdParam) {
                const tableId = Number(tableIdParam);
                if (!tableId || Number.isNaN(tableId)) {
                    return badRequest('Invalid table id');
                }
                const { data, error } = await supabase
                    .from<CommandeRow>('commandes')
                    .select(COMMANDE_SELECT)
                    .eq('table_id', tableId)
                    .in('statut', ['en_cours', 'pendiente_validacion'])
                    .maybeSingle();
                if (error) {
                    console.error('commandes: failed to fetch by table id', error);
                    return internalError('Unable to retrieve commande');
                }
                return jsonResponse(data ? mapCommandeRow(data) : null);
            }

            return badRequest('Missing lookup parameters');
        } catch (error) {
            console.error('commandes: unexpected fetch error', error);
            return internalError();
        }
    }

    if (request.method === 'POST') {
        let payload: CreateCommandePayload;
        try {
            payload = await parseJson<CreateCommandePayload>(request);
        } catch (error) {
            return badRequest('Invalid JSON body');
        }

        if (!payload.tableId || typeof payload.couverts !== 'number') {
            return badRequest('Missing required fields');
        }

        const now = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('commandes')
                .insert({
                    table_id: payload.tableId,
                    couverts: payload.couverts,
                    statut: 'en_cours',
                    date_creation: now,
                    items: [],
                    estado_cocina: null,
                    payment_status: 'impaye',
                })
                .select('id')
                .maybeSingle();

            if (error || !data) {
                console.error('commandes: Supabase insert error', error);
                return internalError('Unable to create commande');
            }

            await supabase.from('tables').update({ statut: 'occupee', commande_id: data.id }).eq('id', payload.tableId);

            const commande = await loadCommandeById(data.id as string);
            return jsonResponse(commande, { status: 201 });
        } catch (error) {
            console.error('commandes: unexpected create error', error);
            return internalError();
        }
    }

    return methodNotAllowed(['GET', 'POST']);
}
