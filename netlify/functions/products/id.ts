import type { Produit, ProduitPayload } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { PRODUCT_SELECT, type ProductRow, mapProductRow } from '../_shared/products';

export const config = { path: '/products/:id' };

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
    const url = new URL(request.url);
    const idParam = url.pathname.split('/').pop();
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
        return badRequest('Invalid product id');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('products/:id: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    if (request.method === 'PUT') {
        let payload: ProduitPayload;
        try {
            payload = await parseJson<ProduitPayload>(request);
        } catch (error) {
            return badRequest('Invalid JSON body');
        }

        if (!payload.nom_produit || typeof payload.prix_vente !== 'number') {
            return badRequest('Missing required product fields');
        }

        try {
            const { error } = await supabase
                .from('produits')
                .update({
                    nom_produit: payload.nom_produit,
                    prix_vente: payload.prix_vente,
                    categoria_id: payload.categoria_id,
                })
                .eq('id', id);

            if (error) {
                console.error('products/:id: Supabase update error', error);
                return internalError('Unable to update product');
            }

            try {
                const produit = await loadProduct(id);
                return jsonResponse(produit);
            } catch (fetchError) {
                console.error('products/:id: failed to reload product', fetchError);
                return internalError('Product updated but could not be retrieved');
            }
        } catch (error) {
            console.error('products/:id: unexpected update error', error);
            return internalError();
        }
    }

    if (request.method === 'DELETE') {
        try {
            const { error: recipeError } = await supabase.from('recette_items').delete().eq('produit_id', id);
            if (recipeError) {
                console.error('products/:id: failed to delete recipe items', recipeError);
            }
            const { error } = await supabase.from('produits').delete().eq('id', id);
            if (error) {
                console.error('products/:id: Supabase delete error', error);
                return internalError('Unable to delete product');
            }
            return new Response(null, { status: 204 });
        } catch (error) {
            console.error('products/:id: unexpected delete error', error);
            return internalError();
        }
    }

    return methodNotAllowed(['PUT', 'DELETE']);
}
