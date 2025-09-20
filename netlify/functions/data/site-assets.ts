import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/site-assets' };

interface SiteAssetRow {
    key: string;
    value: string;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/site-assets: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const tableName = process.env.SUPABASE_SITE_ASSETS_TABLE ?? process.env.VITE_SUPABASE_SITE_ASSETS_TABLE ?? 'site_assets';
        const { data, error } = await supabase.from<SiteAssetRow>(tableName).select('key, value');

        if (error) {
            console.error('data/site-assets: Supabase query error', error);
            return internalError('Unable to retrieve site assets');
        }

        const assets = (data ?? []).reduce<Record<string, string>>((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        return jsonResponse(assets);
    } catch (error) {
        console.error('data/site-assets: unexpected error', error);
        return internalError();
    }
}
