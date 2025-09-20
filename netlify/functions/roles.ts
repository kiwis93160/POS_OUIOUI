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

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return jsonResponse(
            { message: 'Method Not Allowed' },
            {
                status: 405,
                headers: {
                    Allow: 'GET',
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    let supabase;
    try {
        supabase = createSupabaseClient();
    } catch (error) {
        console.error('roles: Supabase configuration error', error);
        return jsonResponse({ message: 'Server configuration error' }, { status: 500 });
    }

    const url = new URL(request.url);
    const pin = url.searchParams.get('pin');

    try {
        if (pin) {
            const { data, error } = await supabase
                .from<Role>('roles')
                .select('*')
                .eq('pin', pin)
                .maybeSingle();

            if (error) {
                console.error('roles: Supabase query error (pin filter)', error);
                return jsonResponse({ message: 'Unable to retrieve role' }, { status: 500 });
            }

            return jsonResponse(data ?? null);
        }

        const { data, error } = await supabase.from<Role>('roles').select('*');

        if (error) {
            console.error('roles: Supabase query error', error);
            return jsonResponse({ message: 'Unable to retrieve roles' }, { status: 500 });
        }

        return jsonResponse(data ?? []);
    } catch (error) {
        console.error('roles: unexpected error', error);
        return jsonResponse({ message: 'Unexpected server error' }, { status: 500 });
    }
}
