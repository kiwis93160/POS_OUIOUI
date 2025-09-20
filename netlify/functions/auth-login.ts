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
    if (request.method !== 'POST') {
        return jsonResponse(
            { message: 'Method Not Allowed' },
            {
                status: 405,
                headers: {
                    Allow: 'POST',
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    let pin: unknown;
    try {
        const payload = await request.json();
        pin = payload?.pin;
    } catch (error) {
        console.error('auth-login: failed to parse request body', error);
        return jsonResponse({ message: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof pin !== 'string' || pin.trim().length === 0) {
        return jsonResponse({ message: 'PIN is required' }, { status: 400 });
    }

    let supabase;
    try {
        supabase = createSupabaseClient();
    } catch (error) {
        console.error('auth-login: Supabase configuration error', error);
        return jsonResponse({ message: 'Server configuration error' }, { status: 500 });
    }

    try {
        const { data, error } = await supabase
            .from<Role>('roles')
            .select('*')
            .eq('pin', pin)
            .maybeSingle();

        if (error) {
            console.error('auth-login: Supabase query error', error);
            return jsonResponse({ message: 'Unable to complete authentication' }, { status: 500 });
        }

        return jsonResponse(data ?? null);
    } catch (error) {
        console.error('auth-login: unexpected error', error);
        return jsonResponse({ message: 'Unexpected server error' }, { status: 500 });
    }
}
