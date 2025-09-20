import type { Produit } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { internalError, jsonResponse, methodNotAllowed } from '../_shared/response';

export const config = { path: '/data/products' };

interface ProduitRow {
    id: number;
    nom_produit: string;
    prix_vente: number;
    categoria_id: number;
    estado: Produit['estado'];
    image_base64: string | null;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
        return methodNotAllowed(['GET']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('data/products: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const { data, error } = await supabase
            .from('produits')
            .select('id, nom_produit, prix_vente, categoria_id, estado, image_base64')
            .order('nom_produit', { ascending: true });

        if (error) {
            console.error('data/products: Supabase query error', error);
            return internalError('Unable to retrieve products');
        }

        const rows = (data ?? []) as ProduitRow[];
        const produits: Produit[] = rows.map(row => ({
            id: row.id,
            nom_produit: row.nom_produit,
            prix_vente: row.prix_vente,
            categoria_id: row.categoria_id,
            estado: row.estado,
            image_base64: row.image_base64 ?? undefined,
        }));

        return jsonResponse(produits);
    } catch (error) {
        console.error('data/products: unexpected error', error);
        return internalError();
    }
}
