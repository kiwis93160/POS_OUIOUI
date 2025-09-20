import type { Produit } from '../../../types';

export const PRODUCT_SELECT = 'id, nom_produit, prix_vente, categoria_id, estado, image_base64';

export interface ProductRow {
    id: number;
    nom_produit: string;
    prix_vente: number;
    categoria_id: number;
    estado: Produit['estado'];
    image_base64: string | null;
}

export const mapProductRow = (row: ProductRow): Produit => ({
    id: row.id,
    nom_produit: row.nom_produit,
    prix_vente: row.prix_vente,
    categoria_id: row.categoria_id,
    estado: row.estado,
    image_base64: row.image_base64 ?? undefined,
});
