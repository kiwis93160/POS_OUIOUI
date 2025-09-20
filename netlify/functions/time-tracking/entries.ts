import type { TimeEntry } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/time-tracking/entries' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('time-tracking/entries: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('time-tracking/entries: Supabase query error', error);
            return internalError('Unable to retrieve time entries');
        }

        const rows = (data ?? []) as TimeEntry[];
        return jsonResponse(rows);
    } catch (error) {
        console.error('time-tracking/entries: unexpected error', error);
        return internalError();
    }
}
