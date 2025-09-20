import type { Commande, CommandeItem } from '../../../types';
import { getSupabaseClient } from '../_shared/supabase';
import { badRequest, internalError, jsonResponse, methodNotAllowed } from '../_shared/response';
import { COMMANDE_SELECT, type CommandeRow, mapCommandeRow } from '../_shared/commandes';
import { isCloudinaryConfigured, uploadImageToCloudinary } from '../_shared/cloudinary';

export const config = { path: '/takeaway/submit' };

const loadCommande = async (id: string): Promise<Commande> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('commandes')
        .select(COMMANDE_SELECT)
        .eq('id', id)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    const row = data as CommandeRow | null;
    if (!row) {
        throw new Error('Commande not found');
    }
    return mapCommandeRow(row);
};

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
        return methodNotAllowed(['POST']);
    }

    let supabase;
    try {
        supabase = getSupabaseClient();
    } catch (error) {
        console.error('takeaway/submit: Supabase configuration error', error);
        return internalError('Server configuration error');
    }

    try {
        const formData = await request.formData();
        const itemsRaw = formData.get('items');
        const fullName = formData.get('fullName');
        const address = formData.get('address');
        const paymentMethod = formData.get('paymentMethod');
        const receipt = formData.get('receipt');

        if (typeof itemsRaw !== 'string' || typeof fullName !== 'string' || typeof address !== 'string' || typeof paymentMethod !== 'string') {
            return badRequest('Missing takeaway order fields');
        }

        const items = JSON.parse(itemsRaw) as CommandeItem[];
        if (!Array.isArray(items)) {
            return badRequest('Invalid commande items');
        }

        let receiptData: string | undefined;
        if (receipt instanceof File) {
            if (isCloudinaryConfigured()) {
                const result = await uploadImageToCloudinary(receipt, { folder: 'receipts' });
                receiptData = result.secure_url;
            } else {
                const buffer = Buffer.from(await receipt.arrayBuffer());
                receiptData = `data:${receipt.type};base64,${buffer.toString('base64')}`;
            }
        }

        const { data, error } = await supabase
            .from('commandes')
            .insert({
                table_id: null,
                couverts: 0,
                statut: 'pendiente_validacion',
                date_creation: new Date().toISOString(),
                items,
                estado_cocina: null,
                payment_status: 'impaye',
                customer_name: fullName,
                customer_address: address,
                payment_method: paymentMethod,
                receipt_image_base64: receiptData ?? null,
            })
            .select('id')
            .maybeSingle();

        if (error || !data) {
            console.error('takeaway/submit: Supabase insert error', error);
            return internalError('Unable to submit takeaway order');
        }

        const commande = await loadCommande(data.id as string);
        return jsonResponse(commande, { status: 201 });
    } catch (error) {
        console.error('takeaway/submit: unexpected error', error);
        return internalError();
    }
}
