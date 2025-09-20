import type { TablePayload } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';

export const config = { path: '/tables/:id' };

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const idParam = url.pathname.split('/').pop();
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
        return badRequest('Invalid table id');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('tables/:id: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    if (request.method === 'PUT') {
        let payload: Omit<TablePayload, 'id'>;
        try {
            payload = await parseJson<Omit<TablePayload, 'id'>>(request);
        } catch (error) {
            return badRequest('Invalid JSON body');
        }

        if (!payload.nom || typeof payload.capacite !== 'number') {
            return badRequest('Missing required table fields');
        }

        try {
            const { data, error } = await supabase
                .from('tables')
                .update({
                    nom: payload.nom,
                    capacite: payload.capacite,
                })
                .eq('id', id)
                .select('id, nom, capacite, statut')
                .maybeSingle();

            if (error) {
                console.error('tables/:id: Supabase update error', error);
                return internalError('Unable to update table');
            }

            return jsonResponse(data ?? null);
        } catch (error) {
            console.error('tables/:id: unexpected update error', error);
            return internalError();
        }
    }

    if (request.method === 'DELETE') {
        try {
            const { error } = await supabase.from('tables').delete().eq('id', id);
            if (error) {
                console.error('tables/:id: Supabase delete error', error);
                return internalError('Unable to delete table');
            }
            return new Response(null, { status: 204 });
        } catch (error) {
            console.error('tables/:id: unexpected delete error', error);
            return internalError();
        }
    }

    return methodNotAllowed(['PUT', 'DELETE']);
}
