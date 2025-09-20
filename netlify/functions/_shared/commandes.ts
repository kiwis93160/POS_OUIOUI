import type { Commande, CommandeItem } from '../../../types';

export const COMMANDE_SELECT =
    'id, table_id, items, statut, date_creation, couverts, estado_cocina, date_envoi_cuisine, date_listo_cuisine, date_servido, date_dernier_envoi_cuisine, payment_status, customer_name, customer_address, payment_method, receipt_image_base64';

export interface CommandeRow {
    id: string;
    table_id: number | null;
    items: CommandeItem[] | null;
    statut: Commande['statut'];
    date_creation: string;
    couverts: number | null;
    estado_cocina: Commande['estado_cocina'];
    date_envoi_cuisine: string | null;
    date_listo_cuisine: string | null;
    date_servido: string | null;
    date_dernier_envoi_cuisine: string | null;
    payment_status: Commande['payment_status'];
    customer_name: string | null;
    customer_address: string | null;
    payment_method: string | null;
    receipt_image_base64: string | null;
}

export const mapCommandeRow = (row: CommandeRow): Commande => ({
    id: row.id,
    table_id: row.table_id ?? 0,
    items: row.items ?? [],
    statut: row.statut,
    date_creation: row.date_creation,
    couverts: row.couverts ?? 0,
    estado_cocina: row.estado_cocina ?? null,
    date_envoi_cuisine: row.date_envoi_cuisine ?? undefined,
    date_listo_cuisine: row.date_listo_cuisine ?? undefined,
    date_servido: row.date_servido ?? undefined,
    date_dernier_envoi_cuisine: row.date_dernier_envoi_cuisine ?? undefined,
    payment_status: row.payment_status ?? 'impaye',
    customer_name: row.customer_name ?? undefined,
    customer_address: row.customer_address ?? undefined,
    payment_method: row.payment_method ?? undefined,
    receipt_image_base64: row.receipt_image_base64 ?? undefined,
});

export const calculateCommandeTotal = (commande: Commande): number =>
    commande.items.reduce((total, item) => total + item.produit.prix_vente * item.quantite, 0);
