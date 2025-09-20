import type { TablePayload } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';

export const config = { path: '/tables' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let payload: TablePayload;
    try {
        payload = await parseJson<TablePayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    if (!payload.id || !payload.nom || typeof payload.capacite !== 'number') {
        return badRequest('Missing required table fields');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('tables: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('tables')
            .insert({
                id: payload.id,
                nom: payload.nom,
                capacite: payload.capacite,
                statut: 'libre',
            })
            .select('id, nom, capacite, statut')
            .maybeSingle();

        if (error) {
            console.error('tables: Supabase insert error', error);
            return internalError('Unable to create table');
        }

        return jsonResponse(data, { status: 201 });
    } catch (error) {
        console.error('tables: unexpected error', error);
        return internalError();
    }
}
