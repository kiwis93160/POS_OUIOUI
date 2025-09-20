import type { Achat } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed, parseJson } from '../_shared/response';

export const config = { path: '/ingredients/purchase' };

interface PurchasePayload {
    ingredient_id: number;
    quantite_achetee: number;
    prix_total: number;
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let payload: PurchasePayload;
    try {
        payload = await parseJson<PurchasePayload>(request);
    } catch (error) {
        return badRequest('Invalid JSON body');
    }

    const { ingredient_id, quantite_achetee, prix_total } = payload;
    if (!ingredient_id || quantite_achetee <= 0 || prix_total <= 0) {
        return badRequest('Missing or invalid purchase fields');
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('ingredients/purchase: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    const now = new Date().toISOString();
    const prixUnitaire = prix_total / quantite_achetee;

    try {
        const { error: lotError } = await supabase.from('ingredient_lots').insert({
            ingredient_id,
            quantite_initiale: quantite_achetee,
            quantite_restante: quantite_achetee,
            prix_unitaire_achat: prixUnitaire,
            date_achat: now,
        });

        if (lotError) {
            console.error('ingredients/purchase: Supabase lot insert error', lotError);
            return internalError('Unable to record inventory lot');
        }

        const { data, error } = await supabase
            .from('achats')
            .insert({
                ingredient_id,
                quantite_achetee,
                prix_total,
                date_achat: now,
            })
            .select('*')
            .maybeSingle();

        if (error) {
            console.error('ingredients/purchase: Supabase achat insert error', error);
            return internalError('Unable to record purchase');
        }

        const achat = data as Achat | null;

        if (!achat) {
            return internalError('Purchase was not recorded');
        }

        return jsonResponse(achat, { status: 201 });
    } catch (error) {
        console.error('ingredients/purchase: unexpected error', error);
        return internalError();
    }
}
