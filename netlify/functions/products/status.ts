import type { Produit } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { PRODUCT_SELECT, type ProductRow, mapProductRow } from '../_shared/products';

export const config = { path: '/products/:id/status' };

interface StatusPayload {
    status: Produit['estado'];
}

const loadProduct = async (id: number): Promise<Produit> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from<ProductRow>('produits')
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error('Product not found');
    }
    return mapProductRow(data);
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'PATCH') {
        return methodNotAllowed(['PATCH']);
    }

    const url = new URL(request.url);
    const idParam = url.pathname.split('/').slice(-2)[0];
    const produitId = Number(idParam);

    if (!produitId || Number.isNaN(produitId)) {
        return badRequest('Invalid product id');
    }

    let payload: StatusPayload;
    try {
        payload = await parseJson<StatusPayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    if (!payload.status) {
        return badRequest('Missing product status');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('products/:id/status: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { error } = await supabase
            .from('produits')
            .update({ estado: payload.status })
            .eq('id', produitId);
        if (error) {
            console.error('products/:id/status: Supabase update error', error);
            return internalError('Unable to update product status');
        }

        const produit = await loadProduct(produitId);
        return jsonResponse(produit);
    } catch (error) {
        console.error('products/:id/status: unexpected error', error);
        return internalError();
    }
}
