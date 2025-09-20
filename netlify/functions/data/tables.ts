import type { Table, TableStatus } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/tables' };

interface TableRow {
    id: number;
    nom: string;
    capacite: number;
    statut: string;
    commande_id: string | null;
    couverts: number | null;
    total_commande: number | null;
    is_ready: boolean | null;
    ready_timestamp: string | null;
    creation_timestamp: string | null;
    sent_to_kitchen_timestamp: string | null;
    kitchen_status: string | null;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/tables: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('tables')
            .select(
                'id, nom, capacite, statut, commande_id, couverts, total_commande, is_ready, ready_timestamp, creation_timestamp, sent_to_kitchen_timestamp, kitchen_status'
            )
            .order('id', { ascending: true });

        if (error) {
            console.error('data/tables: Supabase query error', error);
            return internalError('Unable to retrieve tables');
        }

        const rows = (data ?? []) as TableRow[];
        const tables: Table[] = rows.map(row => ({
            id: row.id,
            nom: row.nom,
            capacite: row.capacite,
            statut: (row.statut as TableStatus) ?? 'libre',
            commandeId: row.commande_id ?? undefined,
            couverts: row.couverts ?? undefined,
            totalCommande: row.total_commande ?? undefined,
            isReady: row.is_ready ?? undefined,
            readyTimestamp: row.ready_timestamp ?? undefined,
            creationTimestamp: row.creation_timestamp ?? undefined,
            sentToKitchenTimestamp: row.sent_to_kitchen_timestamp ?? undefined,
            kitchenStatus: row.kitchen_status as Table['kitchenStatus'],
        }));

        return jsonResponse(tables);
    } catch (error) {
        console.error('data/tables: unexpected error', error);
        return internalError();
    }
}
