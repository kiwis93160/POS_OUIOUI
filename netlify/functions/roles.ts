import { createClient } from '@supabase/supabase-js';
import type { Role } from '../../types';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_API_KEY;

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
    new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

const createSupabaseClient = () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase service credentials are not configured.');
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
        },
    });
};

const parseJson = async <T>(request: Request): Promise<T> => {
    try {
        return (await request.json()) as T;
    } catch (error) {
        throw new Error('Invalid JSON body');
    }
};

export default async function handler(request: Request): Promise<Response> {
    let supabase;
    try {
        supabase = createSupabaseClient();
    } catch (error) {
        console.error('roles: Supabase configuration error', error);
        return jsonResponse({ message: 'Server configuration error' }, { status: 500 });
    }

    if (request.method === 'GET') {
        const url = new URL(request.url);
        const pin = url.searchParams.get('pin');

        try {
            if (pin) {
                const { data, error } = await supabase
                    .from('roles')
                    .select('*')
                    .eq('pin', pin)
                    .maybeSingle();

                if (error) {
                    console.error('roles: Supabase query error (pin filter)', error);
                    return jsonResponse({ message: 'Unable to retrieve role' }, { status: 500 });
                }

                const role = data as Role | null;
                return jsonResponse(role ?? null);
            }

            const { data, error } = await supabase.from('roles').select('*');

            if (error) {
                console.error('roles: Supabase query error', error);
                return jsonResponse({ message: 'Unable to retrieve roles' }, { status: 500 });
            }

            const rolesData = (data ?? []) as Role[];
            return jsonResponse(rolesData);
        } catch (error) {
            console.error('roles: unexpected error', error);
            return jsonResponse({ message: 'Unexpected server error' }, { status: 500 });
        }
    }

    if (request.method === 'POST') {
        let roles: Role[];
        try {
            roles = await parseJson<Role[]>(request);
        } catch (error) {
            return jsonResponse({ message: 'Invalid JSON body' }, { status: 400 });
        }

        if (!Array.isArray(roles)) {
            return jsonResponse({ message: 'Invalid roles payload' }, { status: 400 });
        }

        try {
            const { data: existingRoles, error: readError } = await supabase.from('roles').select('id');
            if (readError) {
                console.error('roles: failed to read existing roles', readError);
                return jsonResponse({ message: 'Unable to save roles' }, { status: 500 });
            }

            const { error: upsertError } = await supabase.from('roles').upsert(roles, { onConflict: 'id' });
            if (upsertError) {
                console.error('roles: failed to upsert roles', upsertError);
                return jsonResponse({ message: 'Unable to save roles' }, { status: 500 });
            }

            const existingIds = new Set<string>(((existingRoles ?? []) as Array<{ id: string }>).map(role => role.id));
            const incomingIds = new Set<string>(roles.map(role => role.id));
            const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id));

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase.from('roles').delete().in('id', idsToDelete);
                if (deleteError) {
                    console.error('roles: failed to remove obsolete roles', deleteError);
                    return jsonResponse({ message: 'Unable to save roles' }, { status: 500 });
                }
            }

            return new Response(null, { status: 204 });
        } catch (error) {
            console.error('roles: unexpected error while saving', error);
            return jsonResponse({ message: 'Unexpected server error' }, { status: 500 });
        }
    }

    return jsonResponse(
        { message: 'Method Not Allowed' },
        {
            status: 405,
            headers: {
                Allow: 'GET, POST',
                'Content-Type': 'application/json',
            },
        }
    );
}
