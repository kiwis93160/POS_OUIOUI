import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
    });
} else {
    console.warn(
        'Supabase environment variables are not defined. Netlify serverless functions will be used for data persistence.'
    );
}

export const isSupabaseConfigured = (): boolean => client !== null;

export const getSupabaseClient = (): SupabaseClient => {
    if (!client) {
        throw new Error(
            'Supabase client is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
        );
    }
    return client;
};
