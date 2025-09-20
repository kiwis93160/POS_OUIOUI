import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, methodNotAllowed } from '../_shared/response';

export const config = { path: '/categories/:id' };

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'DELETE') {
        return methodNotAllowed(['DELETE']);
    }

    const url = new URL(request.url);
    const idParam = url.pathname.split('/').pop();
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
        return badRequest('Invalid category id');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('categories/:id: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
            console.error('categories/:id: Supabase delete error', error);
            return internalError('Unable to delete category');
        }
        return new Response(null, { status: 204 });
    } catch (error) {
        console.error('categories/:id: unexpected error', error);
        return internalError();
    }
}
