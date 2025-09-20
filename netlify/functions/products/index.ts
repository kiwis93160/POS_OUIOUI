import type { Produit, ProduitPayload, RecetteItem } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';
import { PRODUCT_SELECT, type ProductRow, mapProductRow } from '../_shared/products';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '../_shared/cloudinary';

export const config = { path: '/products' };

interface ProductCreatePayload {
    product: ProduitPayload;
    recipeItems: RecetteItem[];
}

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

const parsePayloadFromRequest = async (request: Request): Promise<{ payload: ProductCreatePayload; file: File | null }> => {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const productRaw = formData.get('product');
        const recipeItemsRaw = formData.get('recipeItems');
        const file = formData.get('image');

        if (typeof productRaw !== 'string' || typeof recipeItemsRaw !== 'string') {
            throw new Error('Invalid multipart form data');
        }

        const payload: ProductCreatePayload = {
            product: JSON.parse(productRaw) as ProduitPayload,
            recipeItems: JSON.parse(recipeItemsRaw) as RecetteItem[],
        };

        return { payload, file: file instanceof File ? file : null };
    }

    const body = await parseJson<ProductCreatePayload>(request);
    return { payload: body, file: null };
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('products: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    let payload: ProductCreatePayload;
    let file: File | null;
    try {
        const parsed = await parsePayloadFromRequest(request);
        payload = parsed.payload;
        file = parsed.file;
    } catch (error) {
        console.error('products: payload parsing failed', error);
        return badRequest('Invalid payload for product creation');
    }

    if (!payload.product || !payload.product.nom_produit || typeof payload.product.prix_vente !== 'number') {
        return badRequest('Missing required product fields');
    }

    if (!Array.isArray(payload.recipeItems)) {
        return badRequest('Invalid recipe items');
    }

    try {
        const { data: productInsert, error: insertError } = await supabase
            .from('produits')
            .insert({
                nom_produit: payload.product.nom_produit,
                prix_vente: payload.product.prix_vente,
                categoria_id: payload.product.categoria_id,
                estado: 'disponible',
            })
            .select('id')
            .maybeSingle();

        if (insertError || !productInsert) {
            console.error('products: Supabase insert error', insertError);
            return internalError('Unable to create product');
        }

        const produitId = productInsert.id as number;

        if (payload.recipeItems.length > 0) {
            const itemsToInsert = payload.recipeItems.map(item => ({
                produit_id: produitId,
                ingredient_id: item.ingredient_id,
                qte_utilisee: item.qte_utilisee,
            }));

            const { error: recipeError } = await supabase.from('recette_items').insert(itemsToInsert);
            if (recipeError) {
                console.error('products: failed to insert recipe items', recipeError);
                await supabase.from('produits').delete().eq('id', produitId);
                return internalError('Unable to save product recipe');
            }
        }

        if (file) {
            try {
                if (isCloudinaryConfigured()) {
                    const result = await uploadImageToCloudinary(file, { folder: 'products' });
                    await supabase
                        .from('produits')
                        .update({ image_base64: result.secure_url })
                        .eq('id', produitId);
                } else {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
                    await supabase
                        .from('produits')
                        .update({ image_base64: dataUrl })
                        .eq('id', produitId);
                }
            } catch (uploadError) {
                console.error('products: failed to upload product image', uploadError);
                return internalError('Product created but image upload failed');
            }
        }

        try {
            const produit = await loadProduct(produitId);
            return jsonResponse(produit, { status: 201 });
        } catch (fetchError) {
            console.error('products: failed to reload created product', fetchError);
            return internalError('Product created but could not be retrieved');
        }
    } catch (error) {
        console.error('products: unexpected error', error);
        return internalError();
    }
}
