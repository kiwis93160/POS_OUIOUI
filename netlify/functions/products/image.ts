import type { Produit } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed } from '../_shared/response';
import { PRODUCT_SELECT, type ProductRow, mapProductRow } from '../_shared/products';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '../_shared/cloudinary';

export const config = { path: '/products/:id/image' };

const loadProduct = async (id: number): Promise<Produit> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('produits')
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    const row = data as ProductRow | null;
    if (!row) {
        throw new Error('Product not found');
    }
    return mapProductRow(row);
};

export default async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const idParam = url.pathname.split('/').slice(-2)[0];
    const produitId = Number(idParam);

    if (!produitId || Number.isNaN(produitId)) {
        return badRequest('Invalid product id');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('products/:id/image: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    if (request.method === 'PUT') {
        const formData = await request.formData();
        const file = formData.get('image');

        if (!(file instanceof File)) {
            return badRequest('Missing product image file');
        }

        try {
            if (isCloudinaryConfigured()) {
                const result = await uploadImageToCloudinary(file, { folder: 'products' });
                const { error } = await supabase
                    .from('produits')
                    .update({ image_base64: result.secure_url })
                    .eq('id', produitId);
                if (error) {
                    console.error('products/:id/image: Supabase update error', error);
                    return internalError('Unable to update product image');
                }
            } else {
                const buffer = Buffer.from(await file.arrayBuffer());
                const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
                const { error } = await supabase
                    .from('produits')
                    .update({ image_base64: dataUrl })
                    .eq('id', produitId);
                if (error) {
                    console.error('products/:id/image: Supabase update error (base64)', error);
                    return internalError('Unable to update product image');
                }
            }

            const produit = await loadProduct(produitId);
            return jsonResponse(produit);
        } catch (error) {
            console.error('products/:id/image: unexpected error', error);
            return internalError();
        }
    }

    if (request.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('produits')
                .update({ image_base64: null })
                .eq('id', produitId);
            if (error) {
                console.error('products/:id/image: Supabase delete error', error);
                return internalError('Unable to remove product image');
            }
            const produit = await loadProduct(produitId);
            return jsonResponse(produit);
        } catch (error) {
            console.error('products/:id/image: unexpected delete error', error);
            return internalError();
        }
    }

    return methodNotAllowed(['PUT', 'DELETE']);
}
