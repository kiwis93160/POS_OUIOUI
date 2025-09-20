import { Ingredient, Produit, Recette, Vente, Achat, Unite, Table, Commande, Categoria, Role, PermissionLevel, TablePayload, TimeEntry } from '../types';
import { defaultImageAssets } from '../components/ImageAssets';

type IngredientDB = Omit<Ingredient, 'stock_actuel' | 'prix_unitaire'>;

// --- INGRÉDIENTS ENRICHIS ---
let ingredients: IngredientDB[] = [
    // Pizzeria
    { id: 1, nom: "Tomate", unite: Unite.KG, stock_minimum: 5, lots: [{ quantite_initiale: 20, quantite_restante: 18, prix_unitaire_achat: 11250, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 2, nom: "Mozzarella", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 10, quantite_restante: 8, prix_unitaire_achat: 45000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 3, nom: "Harina T55", unite: Unite.KG, stock_minimum: 10, lots: [{ quantite_initiale: 50, quantite_restante: 45, prix_unitaire_achat: 5400, date_achat: "2023-10-24T10:00:00Z" }] },
    { id: 4, nom: "Albahaca", unite: Unite.UNITE, stock_minimum: 5, lots: [{ quantite_initiale: 15, quantite_restante: 12, prix_unitaire_achat: 6750, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 5, nom: "Aceite de oliva", unite: Unite.L, stock_minimum: 2, lots: [{ quantite_initiale: 8, quantite_restante: 7, prix_unitaire_achat: 36000, date_achat: "2023-10-22T10:00:00Z" }] },
    // Hamburguesas
    { id: 6, nom: "Carne molida", unite: Unite.KG, stock_minimum: 3, lots: [{ quantite_initiale: 12, quantite_restante: 10, prix_unitaire_achat: 67500, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 7, nom: "Pan de Hamburguesa", unite: Unite.UNITE, stock_minimum: 10, lots: [{ quantite_initiale: 40, quantite_restante: 30, prix_unitaire_achat: 2250, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 8, nom: "Lechuga", unite: Unite.UNITE, stock_minimum: 3, lots: [{ quantite_initiale: 8, quantite_restante: 5, prix_unitaire_achat: 4500, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 9, nom: "Papas Fritas (congeladas)", unite: Unite.KG, stock_minimum: 5, lots: [{ quantite_initiale: 25, quantite_restante: 22, prix_unitaire_achat: 13500, date_achat: "2023-10-23T10:00:00Z" }] },
    { id: 10, nom: "Queso Cheddar", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 55000, date_achat: "2023-10-24T10:00:00Z" }] },
    // Platos adicionales
    { id: 11, nom: "Pechuga de Pollo", unite: Unite.KG, stock_minimum: 4, lots: [{ quantite_initiale: 15, quantite_restante: 12, prix_unitaire_achat: 38000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 12, nom: "Filete de Pescado (Corvina)", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 8, quantite_restante: 6, prix_unitaire_achat: 42000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 13, nom: "Arroz", unite: Unite.KG, stock_minimum: 10, lots: [{ quantite_initiale: 30, quantite_restante: 25, prix_unitaire_achat: 4000, date_achat: "2023-10-20T10:00:00Z" }] },
    { id: 14, nom: "Pan baguette", unite: Unite.UNITE, stock_minimum: 5, lots: [{ quantite_initiale: 20, quantite_restante: 15, prix_unitaire_achat: 3000, date_achat: "2023-10-26T10:00:00Z" }] },
    // Bebidas
    { id: 15, nom: "Limón", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 3500, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 16, nom: "Azúcar", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 10, quantite_restante: 9, prix_unitaire_achat: 4500, date_achat: "2023-10-20T10:00:00Z" }] },
    { id: 17, nom: "Café en grano", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 3, quantite_restante: 2, prix_unitaire_achat: 60000, date_achat: "2023-10-15T10:00:00Z" }] },
    { id: 18, nom: "Coca-Cola (lata)", unite: Unite.UNITE, stock_minimum: 12, lots: [{ quantite_initiale: 48, quantite_restante: 30, prix_unitaire_achat: 2500, date_achat: "2023-10-24T10:00:00Z" }] },
    // Postres
    { id: 19, nom: "Huevo", unite: Unite.UNITE, stock_minimum: 12, lots: [{ quantite_initiale: 30, quantite_restante: 20, prix_unitaire_achat: 500, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 20, nom: "Chocolate semi-amargo", unite: Unite.KG, stock_minimum: 0.5, lots: [{ quantite_initiale: 2, quantite_restante: 1.5, prix_unitaire_achat: 70000, date_achat: "2023-10-22T10:00:00Z" }] },
    { id: 21, nom: "Crema de Leche", unite: Unite.L, stock_minimum: 1, lots: [{ quantite_initiale: 4, quantite_restante: 3, prix_unitaire_achat: 15000, date_achat: "2023-10-25T10:00:00Z" }] },
    // Nouveaux ingrédients
    { id: 22, nom: "Cebolla", unite: Unite.KG, stock_minimum: 4, lots: [{ quantite_initiale: 15, quantite_restante: 14, prix_unitaire_achat: 3000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 23, nom: "Ajo", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 2, quantite_restante: 1.8, prix_unitaire_achat: 10000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 24, nom: "Pimiento Rojo", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 5, quantite_restante: 4.5, prix_unitaire_achat: 7000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 25, nom: "Salmón", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 8, quantite_restante: 7, prix_unitaire_achat: 85000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 26, nom: "Mantequilla", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 4, quantite_restante: 3.5, prix_unitaire_achat: 25000, date_achat: "2023-10-24T10:00:00Z" }] },
    { id: 27, nom: "Ron Blanco", unite: Unite.L, stock_minimum: 1, lots: [{ quantite_initiale: 6, quantite_restante: 5, prix_unitaire_achat: 55000, date_achat: "2023-10-20T10:00:00Z" }] },
    { id: 28, nom: "Hierbabuena", unite: Unite.UNITE, stock_minimum: 3, lots: [{ quantite_initiale: 10, quantite_restante: 8, prix_unitaire_achat: 2000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 29, nom: "Tocineta", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 48000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 30, nom: "Pasta para Lasaña", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 15000, date_achat: "2023-10-22T10:00:00Z" }] },
    { id: 31, nom: "Queso Mascarpone", unite: Unite.KG, stock_minimum: 0.5, lots: [{ quantite_initiale: 3, quantite_restante: 2, prix_unitaire_achat: 90000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 32, nom: "Bizcochos Savoiardi", unite: Unite.KG, stock_minimum: 0.5, lots: [{ quantite_initiale: 2, quantite_restante: 1.5, prix_unitaire_achat: 22000, date_achat: "2023-10-23T10:00:00Z" }] },
    { id: 33, nom: "Agua con gas", unite: Unite.L, stock_minimum: 2, lots: [{ quantite_initiale: 12, quantite_restante: 10, prix_unitaire_achat: 4000, date_achat: "2023-10-24T10:00:00Z" }] },
    // Encore plus d'ingrédients
    { id: 34, nom: "Champiñones", unite: Unite.KG, stock_minimum: 2, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 18000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 35, nom: "Jamón", unite: Unite.KG, stock_minimum: 3, lots: [{ quantite_initiale: 10, quantite_restante: 8, prix_unitaire_achat: 35000, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 36, nom: "Piña", unite: Unite.UNITE, stock_minimum: 3, lots: [{ quantite_initiale: 10, quantite_restante: 7, prix_unitaire_achat: 4000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 37, nom: "Pimentón Verde", unite: Unite.KG, stock_minimum: 1, lots: [{ quantite_initiale: 4, quantite_restante: 3, prix_unitaire_achat: 6000, date_achat: "2023-10-26T10:00:00Z" }] },
    { id: 38, nom: "Leche", unite: Unite.L, stock_minimum: 4, lots: [{ quantite_initiale: 12, quantite_restante: 10, prix_unitaire_achat: 3800, date_achat: "2023-10-25T10:00:00Z" }] },
    { id: 39, nom: "Helado de Vainilla", unite: Unite.L, stock_minimum: 1, lots: [{ quantite_initiale: 5, quantite_restante: 4, prix_unitaire_achat: 25000, date_achat: "2023-10-23T10:00:00Z" }] }
];

// --- CATÉGORIES ET PRODUITS ÉLARGIS ---
let categorias: Categoria[] = [
    { id: 2, nom: "Entradas" },
    { id: 1, nom: "Platos Principales" },
    { id: 3, nom: "Postres" },
    { id: 4, nom: "Bebidas" }
];

let produits: Produit[] = [
    // Entradas
    { id: 1, nom_produit: "Bruschetta de Tomate", prix_vente: 18000, estado: 'disponible', categoria_id: 2 },
    { id: 10, nom_produit: "Papas Cheddar y Tocineta", prix_vente: 25000, estado: 'disponible', categoria_id: 2, image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARKSURBVCHhe3drS0tRFMfxt+kH6ENICwVpG/WlAl3YpYvoG7SiCO7cFF1ERFEUq7qQgoqKIIp/oDAqF2I1i845M8/M3Dm5M/fA54U/N2fuzNkz537MOUhISEhISEhISEhISEhISEgQEK3t7W2h3W6Xj8ej1Gq18nK5tEajUf+Y/sD7/f7d3d2ldrs1s9lMFxcX+vj4UK/X+0/mD1in0xkaGhpSgUDg/v5+ub6+Jh6P55/MP2BpaWmR0Wj06elpEokEVigUkMvl0Gq1/jP9AVqtVhIJBJRSqXQPx6NQKNDv918afwYhISEhISEhISEhISEhAQI2Njb29vbUavVyu12a3d3d4VCIUulUtvb27PZbJb7+/s1Go1sNpvVajUWi8VsNptisZharZY8Hk+j0ag4HOYfWC6XsyUIAsFAINBqtVKr1VKr1SKRSJBKpZDL5WCxWCiVSggEAsRiMQaDAY1Gg1AohFarxXQ6xWAwwOfzQSgUQigUgsFgQCQSQSgUglwuh1wuh0AgsDSr+wO/hISEhISEhISEhISEhAQI2J+fny1EIpGbm5sUCoVkMpmkUql4PJ7S6XQ2m00AODg4oNPpJBqNfnp6OsvlslQqlRQKBTg4OKDRaHQ+ny8SiWQqlXJ/f1/u7u6Ew2Fms1kqlUoul4vBYNDf35+lUim1Wk0mk0ksFjM8PJzVajU6nQ4A7O7upmazSbfbxWKxaLfbSbfbhaRSmVQqFcPhkEQiESgUUiYnJzM8PJzFYtHtdtNv9x8sISEhISEhISEhISEhISEhgaX8iQcEBwcHlEql/CgUiu7u7sTjcQoGg/p8PkqlUgKBQN+fPoA0Fm+hYjAYbG9vj8fj0Wg0IhKJhMNhgsHg/f19gsHgcDhUFEUhISEhISEhISEhISEhISEhAQI2h4eHVCqVpFJJrVbL4XAoFArJ5XJJpVJEIpFERUaDAaPRiMFgQCqVQigUQigUQq/XQ6/XQ6/Xw+fzSafTfR4f7w8SEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIS6j93Dymivm0Q/S9ZAAAAAElFTkSuQmCC' },
    { id: 15, nom_produit: "Champiñones al Ajillo", prix_vente: 23000, estado: 'disponible', categoria_id: 2 },
    // Platos Principales
    { id: 2, nom_produit: "Pizza Margherita", prix_vente: 54000, estado: 'disponible', categoria_id: 1, image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQCSURBVCHhe3ftS1tRFMfxp4yX0F4IKSkIBvWHIqigLqKLIDqLrqKLsogoKuuiIqguIkI3qShCRhFBkU8k8w+01R/S0q3p+Trl/JLLlDPXG+cC54U/d+/cuXPud8+de+45ZJKJJJJJJJJJJJJJJJLMU2xubmZ5eVnOnz+fX8+ePcvs7Ozc3d2VlpaW2tra+O3t7eW/J2t7e1t2dnbkcrlkZWVFgsFgampq4nt7e8u/J+ubn5/PzMxMCgaDFBQUUK/XF+l0WoFAgEqlcn9/v2QymWw2myQSCWq1+uTkZCkUCrlcLoFAIDc3N1JSUujr65Pl5WWpVCo+Pj7u7OwQCAQYGxtTbDbb3t6eYrFYrVZLSkoK6XQ6OTmZyclJzMnJodfrZWhoiJmZmdzAwACRSIRwOPz4+Lg0Go2JiQkymUwwGDw8PFxQUACDwSAejxOJRJSens7S0hJBEAgEAmRkZHDt7e2i0WgMBgNBEAgGg6TT6cRiMcPDwxkNBiwWi1AoxNLSkhgfH+d0OoVCIdnZ2bFCoTBk7s/IyEgtLS0Kh8NKSkpycXFRqVTS1dUlk8lks9mUSqXE4vH4+HgymUwqlUp2dnaUSqXk83lKpbL8/HyBQKBMJmNsbKzNZlMul1NcXByLxRKJRCKRSPj6+hKJRHR0dJBIJFRVVZFMJpPJZBwOh0ajkclkOjs7U6lUDAaDMJlMVlZWlJaWIpPJBgcHiUQilZWVBIPBHx8fMpmM7u7ucnJyQq1WU1NTEwqFUKvVVCpVIpFwOp3s7OxoNptUKpVMJnNwcCCTycRiMfPz88ViMbPZTGtra3Nzc0UiEYfDoVKpODs7Y2RkhJaWFqKioigUCtnZ2VFUVERFRQVZWVkkEgkKhUJ2djZeXl44OjrS2tqKlpYWjEYjJpNJTU2NzM3Nef36NRcXFxwOh7m5Od7e3rS1tZGcnExGRgbV1dUcHR1xcnKiUqkkEgnMZnMymUzpdMrJyQkxMTGcnZ1ZWFhgaGiItrY2nZ2deHt7E4vF7O/vk0gkUKlUhoaGVFRUkJGRgcFgQDAYZGlpycXFBYPBoNPpjI2N0d/fTyQS2d/f5+/vT3p6OnV1daWkpJDP5zOZTMFgMJlMEolEFRUVRCIRExMTVCqVSCTC39+fwWCQnJyMm5sbFxcX/Pz8KC4uxsPDIyMjI+LxOMlkEofDoVKpNDc3R6PRGBkZoaqqimQySTAYpKWlRUFBAWNjYwoKCtjc3FBZWUnpdDI0NETf3h739vaMj49zfn7Ox8eHzMxMhoaGNDQ0oNfr8fb2pru7G7PZjNlsxu/vb0VFRezt7RkaGqK/v5+uri5GR0dpbm6mubkZb29vbm5uWFhYMDc3p7m5GWNjY/T39zM8PKRQKNDr9fT39+Pv749UKkUgECCRSExNTdHX14eXlxcHBwesra0ZGRnR0tLCxsYGY2NjBgaGWFtbY3h4yMnJCRcXFxISEoiJiSEtLQ1fX1+cnZ0ZHBzk7OyMhYUFJSUlJDMzQ15eHr29vSwvL9PX10cvLy8rKysMDAwQCAQITEykv7+fwcFBWlpa6Ovro6uri62tLSsrKxwOh6enp7y9vVVXV+Pr68vS0hIHBwcsLCwwMjKiubkZf39/fHx8aGlp4ezsjJeXFwMDA3x8fFhZWdHU1ERGRgb19fWMj49LSkry9va2tLRkfn6eSqUSCAQYGxtTbDbb3t6eYrFYrVZLSkoK6XQ6OTmZyclJcnKy+Pj4uLOzg0AgQGNjI4vFgsPh4OHh4bW1Ff9cJJJJJJLI/8gfYW/YvQf+FfQAAAABJRU5ErkJggg==' },
    { id: 3, nom_produit: "Hamburguesa Clásica", prix_vente: 67500, estado: 'disponible', categoria_id: 1, image_base64: 'data:image/png;base64,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' },
    { id: 4, nom_produit: "Pollo a la Plancha con Arroz", prix_vente: 45000, estado: 'disponible', categoria_id: 1 },
    { id: 5, nom_produit: "Pescado del Día", prix_vente: 58000, estado: 'agotado_temporal', categoria_id: 1 },
    { id: 11, nom_produit: "Lasaña Boloñesa", prix_vente: 52000, estado: 'disponible', categoria_id: 1 },
    { id: 12, nom_produit: "Salmón a la Plancha", prix_vente: 65000, estado: 'disponible', categoria_id: 1 },
    { id: 16, nom_produit: "Pizza Hawaiana", prix_vente: 58000, estado: 'disponible', categoria_id: 1 },
    // Postres
    { id: 6, nom_produit: "Mousse de Chocolate", prix_vente: 22000, estado: 'disponible', categoria_id: 3 },
    { id: 13, nom_produit: "Tiramisú", prix_vente: 24000, estado: 'disponible', categoria_id: 3 },
    { id: 17, nom_produit: "Malteada de Vainilla", prix_vente: 16000, estado: 'disponible', categoria_id: 3 },
    // Bebidas
    { id: 7, nom_produit: "Limonada Natural", prix_vente: 12000, estado: 'disponible', categoria_id: 4, image_base64: 'data:image/png;base64,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' },
    { id: 14, nom_produit: "Mojito", prix_vente: 28000, estado: 'disponible', categoria_id: 4 },
    { id: 18, nom_produit: "Jugo de Piña", prix_vente: 11000, estado: 'disponible', categoria_id: 4 }
];

let recettes: Recette[] = [
    { produit_id: 1, items: [{ ingredient_id: 14, qte_utilisee: 0.2 }, { ingredient_id: 1, qte_utilisee: 0.1 }, { ingredient_id: 4, qte_utilisee: 0.05 }, { ingredient_id: 5, qte_utilisee: 0.01 }] },
    { produit_id: 2, items: [{ ingredient_id: 3, qte_utilisee: 0.250 }, { ingredient_id: 1, qte_utilisee: 0.150 }, { ingredient_id: 2, qte_utilisee: 0.100 }, { ingredient_id: 4, qte_utilisee: 0.1 }, { ingredient_id: 5, qte_utilisee: 0.02 }] },
    { produit_id: 3, items: [{ ingredient_id: 6, qte_utilisee: 0.180 }, { ingredient_id: 7, qte_utilisee: 1 }, { ingredient_id: 1, qte_utilisee: 0.050 }, { ingredient_id: 8, qte_utilisee: 0.2 }, { ingredient_id: 9, qte_utilisee: 0.150 }, { ingredient_id: 10, qte_utilisee: 0.05 }] },
    { produit_id: 4, items: [{ ingredient_id: 11, qte_utilisee: 0.220 }, { ingredient_id: 13, qte_utilisee: 0.150 }, { ingredient_id: 8, qte_utilisee: 0.1 }] },
    { produit_id: 5, items: [{ ingredient_id: 12, qte_utilisee: 0.200 }, { ingredient_id: 9, qte_utilisee: 0.150 }, { ingredient_id: 15, qte_utilisee: 0.1 }] },
    { produit_id: 6, items: [{ ingredient_id: 20, qte_utilisee: 0.1 }, { ingredient_id: 21, qte_utilisee: 0.15 }, { ingredient_id: 19, qte_utilisee: 1 }, { ingredient_id: 16, qte_utilisee: 0.05 }] },
    { produit_id: 7, items: [{ ingredient_id: 15, qte_utilisee: 0.2 }, { ingredient_id: 16, qte_utilisee: 0.05 }] },
    { produit_id: 8, items: [{ ingredient_id: 17, qte_utilisee: 0.02 }] },
    { produit_id: 9, items: [{ ingredient_id: 18, qte_utilisee: 1 }] },
    // Nouvelles recettes
    { produit_id: 10, items: [{ ingredient_id: 9, qte_utilisee: 0.250 }, { ingredient_id: 10, qte_utilisee: 0.100 }, { ingredient_id: 29, qte_utilisee: 0.080 }] },
    { produit_id: 11, items: [{ ingredient_id: 30, qte_utilisee: 0.150 }, { ingredient_id: 6, qte_utilisee: 0.150 }, { ingredient_id: 1, qte_utilisee: 0.200 }, { ingredient_id: 2, qte_utilisee: 0.100 }, { ingredient_id: 22, qte_utilisee: 0.100 }] },
    { produit_id: 12, items: [{ ingredient_id: 25, qte_utilisee: 0.220 }, { ingredient_id: 13, qte_utilisee: 0.150 }, { ingredient_id: 5, qte_utilisee: 0.02 }, { ingredient_id: 15, qte_utilisee: 0.05 }] },
    { produit_id: 13, items: [{ ingredient_id: 31, qte_utilisee: 0.100 }, { ingredient_id: 32, qte_utilisee: 0.080 }, { ingredient_id: 19, qte_utilisee: 1 }, { ingredient_id: 16, qte_utilisee: 0.05 }, { ingredient_id: 17, qte_utilisee: 0.01 }] },
    { produit_id: 14, items: [{ ingredient_id: 27, qte_utilisee: 0.060 }, { ingredient_id: 15, qte_utilisee: 0.1 }, { ingredient_id: 16, qte_utilisee: 0.03 }, { ingredient_id: 28, qte_utilisee: 0.2 }, { ingredient_id: 33, qte_utilisee: 0.150 }] },
    // Encore plus de recettes
    { produit_id: 15, items: [{ ingredient_id: 34, qte_utilisee: 0.150 }, { ingredient_id: 23, qte_utilisee: 0.02 }, { ingredient_id: 5, qte_utilisee: 0.03 }, { ingredient_id: 14, qte_utilisee: 0.1 }] },
    { produit_id: 16, items: [{ ingredient_id: 3, qte_utilisee: 0.250 }, { ingredient_id: 1, qte_utilisee: 0.150 }, { ingredient_id: 2, qte_utilisee: 0.100 }, { ingredient_id: 35, qte_utilisee: 0.080 }, { ingredient_id: 36, qte_utilisee: 0.1 }] },
    { produit_id: 17, items: [{ ingredient_id: 39, qte_utilisee: 0.200 }, { ingredient_id: 38, qte_utilisee: 0.150 }, { ingredient_id: 16, qte_utilisee: 0.02 }] },
    { produit_id: 18, items: [{ ingredient_id: 36, qte_utilisee: 0.25 }] },
];

let achats: Achat[] = [];

// --- DONNÉES POS ---
type TableDB = Pick<Table, 'id' | 'nom' | 'capacite'>;

let tables: TableDB[] = [
    { id: 1, nom: "Mesa 1", capacite: 2 },
    { id: 2, nom: "Mesa 2", capacite: 4 },
    { id: 3, nom: "Mesa 3", capacite: 4 },
    { id: 4, nom: "Mesa 4", capacite: 6 },
    { id: 5, nom: "Barra 1", capacite: 1 },
    { id: 6, nom: "Barra 2", capacite: 1 },
    { id: 7, nom: "Terraza 1", capacite: 4 },
    { id: 8, nom: "Terraza 2", capacite: 2 },
    { id: 99, nom: "Para Llevar", capacite: 1 },
];

// --- COMMANDES ACTIVES DE DÉMONSTRATION ---
const now = new Date();

// AMÉLIORATION : Filtrer les commandes pour s'assurer que tous les produits existent,
// prévenant ainsi les erreurs si un produit est supprimé de la liste.
// FIX: The function was expecting a single command object but was being called with an array. The type has been updated to expect an array.
const robustCommandes = (commandesList: Array<Omit<Commande, 'items'> & { items: Array<Omit<Commande['items'][0], 'produit'> & { produit_id: number }> }>) => {
    return commandesList.map(cmd => {
        const validItems = cmd.items
            .map(item => {
                const produit = produits.find(p => p.id === item.produit_id);
                if (!produit) {
                    console.warn(`Produit ID ${item.produit_id} introuvable pour la commande ${cmd.id}. L'article sera ignoré.`);
                    return null;
                }
                return { ...item, produit };
            })
            .filter(Boolean); // Supprimer les articles nuls (produit non trouvé)
        
        return { ...cmd, items: validItems as Commande['items'] };
    });
};

let commandes: Commande[] = robustCommandes([
    // Commande servie, table 1
    {
        id: `cmd-${now.getTime() - 1800000}-1`,
        table_id: 1,
        couverts: 2,
        items: [
            { id: `item-10-${now.getTime() - 1800000}`, produit_id: 11, quantite: 2, estado: 'enviado', date_envoi: new Date(now.getTime() - 1800000).toISOString() }
        ],
        statut: 'en_cours',
        date_creation: new Date(now.getTime() - 1800000).toISOString(),
        date_envoi_cuisine: new Date(now.getTime() - 1800000).toISOString(),
        date_dernier_envoi_cuisine: new Date(now.getTime() - 1800000).toISOString(),
        date_listo_cuisine: new Date(now.getTime() - 900000).toISOString(),
        date_servido: new Date(now.getTime() - 840000).toISOString(),
        estado_cocina: 'servido',
        payment_status: 'impaye'
    },
    // Commande en cours, table 2
    {
        id: `cmd-${now.getTime() - 300000}-2`,
        table_id: 2,
        couverts: 3,
        items: [
            { id: `item-1-${now.getTime() - 300000}`, produit_id: 2, quantite: 1, estado: 'enviado', date_envoi: new Date(now.getTime() - 300000).toISOString() },
            { id: `item-2-${now.getTime() - 300000}`, produit_id: 7, quantite: 2, estado: 'enviado', date_envoi: new Date(now.getTime() - 300000).toISOString() },
            { id: `item-3-${now.getTime()}`, produit_id: 6, quantite: 1, estado: 'nuevo' }
        ],
        statut: 'en_cours',
        date_creation: new Date(now.getTime() - 300000).toISOString(),
        date_envoi_cuisine: new Date(now.getTime() - 300000).toISOString(),
        date_dernier_envoi_cuisine: new Date(now.getTime() - 300000).toISOString(),
        estado_cocina: 'recibido',
        payment_status: 'impaye'
    },
    // Commande nouvelle, table 3
    {
        id: `cmd-${now.getTime() - 120000}-3`,
        table_id: 3,
        couverts: 2,
        items: [
            { id: `item-8-${now.getTime() - 100000}`, produit_id: 14, quantite: 1, estado: 'nuevo' },
            { id: `item-9-${now.getTime() - 90000}`, produit_id: 10, quantite: 1, estado: 'nuevo' }
        ],
        statut: 'en_cours',
        date_creation: new Date(now.getTime() - 120000).toISOString(),
        estado_cocina: null,
        payment_status: 'impaye'
    },
    // Commande prête, table 7
    {
        id: `cmd-${now.getTime() - 900000}-7`,
        table_id: 7,
        couverts: 2,
        items: [
            { id: `item-4-${now.getTime() - 900000}`, produit_id: 3, quantite: 2, estado: 'enviado', date_envoi: new Date(now.getTime() - 900000).toISOString() }
        ],
        statut: 'en_cours',
        date_creation: new Date(now.getTime() - 900000).toISOString(),
        date_envoi_cuisine: new Date(now.getTime() - 900000).toISOString(),
        date_dernier_envoi_cuisine: new Date(now.getTime() - 900000).toISOString(),
        date_listo_cuisine: new Date(now.getTime() - 120000).toISOString(),
        estado_cocina: 'listo',
        payment_status: 'impaye'
    },
    // Commandes à emporter
    {
        id: `WEB-${now.toISOString().slice(0, 10).replace(/-/g, '')}-1`,
        table_id: 99,
        items: [
            { id: `item-5-${now.getTime() - 600000}`, produit_id: 2, quantite: 1, estado: 'nuevo', commentaire: "Mucha albahaca por favor" },
            { id: `item-6-${now.getTime() - 600000}`, produit_id: 7, quantite: 2, estado: 'nuevo' }
        ],
        statut: 'pendiente_validacion',
        date_creation: new Date(now.getTime() - 600000).toISOString(),
        couverts: 1,
        estado_cocina: null,
        payment_status: 'impaye',
        customer_name: "Cliente Web",
        customer_address: "Calle Falsa 123",
        payment_method: "Transferencia",
        receipt_image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGpSURBVHhe7dExAQAAAMKg9U/tbwagAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg3wASxgAByyve3AAAAABJRU5ErkJggg==',
    },
     {
        id: `WEB-${now.toISOString().slice(0, 10).replace(/-/g, '')}-2`,
        table_id: 99,
        items: [
            { id: `item-7-${now.getTime() - 1200000}`, produit_id: 4, quantite: 1, estado: 'enviado', date_envoi: new Date(now.getTime() - 1200000).toISOString() }
        ],
        statut: 'en_cours',
        date_creation: new Date(now.getTime() - 1200000).toISOString(),
        couverts: 1,
        date_envoi_cuisine: new Date(now.getTime() - 1200000).toISOString(),
        date_dernier_envoi_cuisine: new Date(now.getTime() - 1200000).toISOString(),
        date_listo_cuisine: new Date(now.getTime() - 300000).toISOString(),
        estado_cocina: 'listo',
        payment_status: 'impaye',
        customer_name: "Cliente Recoge",
        customer_address: "Recoge en local",
        payment_method: "Transferencia"
    },
    // etc...
]);


// --- GÉNÉRATION DE VENTES HISTORIQUES AMÉLIORÉE ---
let ventes: Vente[] = [];
const generateMockSales = () => {
    // Calculer le coût de chaque produit une seule fois pour la performance
    const productCosts = new Map<number, number>();
    produits.forEach(p => {
        const recette = recettes.find(r => r.produit_id === p.id);
        if (recette) {
            const cost = recette.items.reduce((sum, item) => {
                const ing = ingredients.find(i => i.id === item.ingredient_id);
                // Utiliser le premier lot comme prix de référence pour la simulation
                const price = ing?.lots[0]?.prix_unitaire_achat || 0;
                return sum + (price * item.qte_utilisee);
            }, 0);
            productCosts.set(p.id, cost);
        }
    });

    const generatedVentes: Vente[] = [];
    const today = new Date();

    for (let i = 0; i < 60; i++) { // Générer 60 jours de données
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const dailyOrders = Math.floor(Math.random() * 15) + 8; // 8 à 22 commandes par jour
        for (let j = 0; j < dailyOrders; j++) {
            const dateStr = new Date(date.getTime() - Math.random() * 1000 * 3600 * 12).toISOString();
            
            const isTakeaway = Math.random() < 0.25;
            let commandeId: string;
            let table_nom: string;

            if (isTakeaway) {
                const tDay = String(date.getDate()).padStart(2, '0');
                const tMonth = String(date.getMonth() + 1).padStart(2, '0');
                const tYear = date.getFullYear();
                commandeId = `WEB-${tDay}${tMonth}${tYear}-${j}`;
                table_nom = "Para Llevar";
            } else {
                 commandeId = `cmd-demo-${i}-${j}`;
                 table_nom = `Mesa ${Math.floor(Math.random() * 8) + 1}`;
            }

            const dateObj = new Date(dateStr);
            const sentToKitchenTime = new Date(dateObj.getTime() + (Math.random() * 5 * 60000));
            const serviceDurationMinutes = 4 + Math.random() * 41;
            const servedTime = new Date(sentToKitchenTime.getTime() + (serviceDurationMinutes * 60000));

            const itemsInOrder = Math.floor(Math.random() * 4) + 1;
            for (let k = 0; k < itemsInOrder; k++) {
                // AMÉLIORATION : S'assurer que le produit choisi a bien une recette et un coût.
                const availableProducts = produits.filter(p => productCosts.has(p.id));
                if (availableProducts.length === 0) continue; // Skip if no products have recipes

                const produit = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                
                const cout = productCosts.get(produit.id) || 0;
                const prix = produit.prix_vente;
                const quantite = Math.floor(Math.random() * 2) + 1;

                generatedVentes.push({
                    id: `vente-${i}-${j}-${k}`,
                    commande_id: commandeId,
                    produit_id: produit.id,
                    quantite: quantite,
                    date_vente: dateStr,
                    prix_total_vente: Math.round(quantite * prix),
                    cout_total_calcule: Math.round(quantite * cout),
                    benefice_calcule: Math.round(quantite * (prix - cout)),
                    table_nom: table_nom,
                    date_envoi_cuisine: sentToKitchenTime.toISOString(),
                    date_servido: servedTime.toISOString()
                });
            }
        }
    }
    return generatedVentes;
};

ventes = generateMockSales();


// --- DONNÉES DE RÔLE UTILISATEUR ---
const allEditor: { [path: string]: PermissionLevel } = {
    '/': 'editor',
    '/ingredients': 'editor',
    '/produits': 'editor',
    '/ventes': 'editor',
    '/commande/:tableId': 'editor',
    '/cocina': 'editor',
    '/historique': 'editor',
    '/rapports': 'editor',
    '/site-editor': 'editor',
    '/para-llevar': 'editor',
};

const allNone: { [path: string]: PermissionLevel } = {
    '/': 'none',
    '/ingredients': 'none',
    '/produits': 'none',
    '/ventes': 'none',
    '/commande/:tableId': 'none',
    '/cocina': 'none',
    '/historique': 'none',
    '/rapports': 'none',
    '/site-editor': 'none',
    '/para-llevar': 'none',
};

let roles: Role[] = [
    {
        id: 'admin',
        name: 'Administrador',
        pin: '004789',
        permissions: { ...allEditor }
    },
    {
        id: 'cocina',
        name: 'Cocina',
        pin: '004799',
        permissions: {
            ...allNone,
            '/cocina': 'editor',
            '/ingredients': 'editor',
            '/produits': 'readonly',
        }
    },
    {
        id: 'mesero',
        name: 'Mesero',
        pin: '004777',
        permissions: {
            ...allNone,
            '/ventes': 'editor',
            '/commande/:tableId': 'editor',
            '/para-llevar': 'editor',
            '/cocina': 'readonly',
        }
    }
];

// DONNÉES POUR L'ÉDITEUR DE SITE
let siteAssets = { ...defaultImageAssets };

// DONNÉES DE POINTAGE
const nowDB = new Date();
const today5am = new Date(nowDB);
today5am.setHours(5, 0, 0, 0);

const yesterday5am = new Date(today5am);
yesterday5am.setDate(today5am.getDate() - 1);

let timeEntries: TimeEntry[] = [
    // Yesterday's entries
    { id: 't1', role_id: 'cocina', timestamp: new Date(yesterday5am.getTime() + 30 * 60000).toISOString(), type: 'in' }, // 5:30 AM yesterday
    { id: 't2', role_id: 'mesero', timestamp: new Date(yesterday5am.getTime() + 60 * 60000).toISOString(), type: 'in' }, // 6:00 AM yesterday
    
    // Today's entries
    { id: 't3', role_id: 'cocina', timestamp: new Date(today5am.getTime() + 25 * 60000).toISOString(), type: 'in' }, // 5:25 AM today
    { id: 't4', role_id: 'mesero', timestamp: new Date(today5am.getTime() + 55 * 60000).toISOString(), type: 'in' }, // 5:55 AM today
    { id: 't5', role_id: 'mesero', timestamp: new Date(today5am.getTime() + 120 * 60000).toISOString(), type: 'in' }, // 7:00 AM today (another waiter)
];

export const db = {
    ingredients,
    produits,
    recettes,
    ventes,
    achats,
    tables,
    commandes,
    categorias,
    roles,
    siteAssets,
    timeEntries,
};