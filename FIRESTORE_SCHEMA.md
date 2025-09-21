# Schéma de la base de données Cloud Firestore

Ce document définit la structure de la base de données NoSQL pour l'application OUIOUITACOS sur Cloud Firestore.

## Collections Principales

### 1. `restaurants`
Chaque document représente un restaurant unique. Cela permet à l'application d'être multi-tenant à l'avenir. Pour l'instant, nous n'aurons qu'un seul document.

-   **Document ID:** `ouiouitacos_main` (ou un autre identifiant unique)
-   **Champs:**
    -   `name`: "OUIOUITACOS"
    -   `address`: "123 Rue des Tacos, 75001 Paris"
    -   `phone`: "+33 1 23 45 67 89"
    -   ... autres informations sur le restaurant

*Toutes les autres collections principales seront des sous-collections de ce document pour un partitionnement logique des données.*

### 2. `restaurants/{restaurantId}/ingredients`
Contient tous les ingrédients disponibles.

-   **Document ID:** ID unique auto-généré
-   **Champs (basé sur `Ingredient`):**
    -   `nom`: (string) "Tomate"
    -   `unite`: (string) "kg" | "L" | "unidad"
    -   `stock_actuel`: (number) 10.5
    -   `stock_minimum`: (number) 2
    -   `prix_unitaire_moyen`: (number) (Calculé par Cloud Function)
    -   `date_below_minimum`: (timestamp | null)
    -   **Sous-collection: `lots`**
        -   **Document ID:** ID unique auto-généré
        -   **Champs (basé sur `IngredientLot`):**
            -   `quantite_initiale`: (number)
            -   `quantite_restante`: (number)
            -   `prix_unitaire_achat`: (number)
            -   `date_achat`: (timestamp)

### 3. `restaurants/{restaurantId}/products`
Contient tous les produits vendables.

-   **Document ID:** ID unique auto-généré
-   **Champs (basé sur `Produit`):**
    -   `nom_produit`: (string) "Tacos al Pastor"
    -   `prix_vente`: (number) 8.50
    -   `categoria_id`: (reference vers `categories/{categoryId}`)
    -   `estado`: (string) "disponible" | "agotado_temporal" | ...
    -   `image_url`: (string) (URL pointant vers Cloud Storage)
    -   **Sous-collection: `recette`**
        -   **Document ID:** ID de l'ingrédient (`ingredientId`)
        -   **Champs (basé sur `RecetteItem`):**
            -   `ingredient_ref`: (reference vers `ingredients/{ingredientId}`)
            -   `qte_utilisee`: (number)

### 4. `restaurants/{restaurantId}/categories`
Les catégories de produits.

-   **Document ID:** ID unique auto-généré
-   **Champs (basé sur `Categoria`):**
    -   `nom`: (string) "Tacos"

### 5. `restaurants/{restaurantId}/tables`
L'état du plan de salle.

-   **Document ID:** ID de la table (ex: "1", "2", "terrasse_1")
-   **Champs (basé sur `Table`):**
    -   `nom`: (string) "Table 1"
    -   `capacite`: (number) 4
    -   `statut`: (string) "libre" | "occupee"
    -   `commande_active_ref`: (reference vers `orders/{orderId}` | null)
    -   ... et autres champs pertinents de `Table`

### 6. `restaurants/{restaurantId}/orders`
La collection la plus active, contient toutes les commandes.

-   **Document ID:** ID unique auto-généré
-   **Champs (basé sur `Commande`):**
    -   `table_ref`: (reference vers `tables/{tableId}`)
    -   `statut`: (string) "en_cours" | "finalisee" | ...
    -   `estado_cocina`: (string | null) "recibido" | "listo" | "servido"
    -   `couverts`: (number)
    -   `payment_status`: (string) "paye" | "impaye"
    -   `date_creation`: (timestamp)
    -   ... et tous les timestamps pertinents
    -   **Sous-collection: `items`**
        -   **Document ID:** ID unique auto-généré
        -   **Champs (basé sur `CommandeItem`):**
            -   `produit_ref`: (reference vers `products/{productId}`)
            -   `quantite`: (number)
            -   `commentaire`: (string | null)
            -   `excluded_ingredients`: (array de references vers `ingredients/{ingredientId}`)

### 7. `restaurants/{restaurantId}/sales`
Collection d'archives pour les enregistrements financiers (les ventes). Les documents ici sont immuables.

-   **Document ID:** ID de la commande (`orderId`)
-   **Champs (basé sur `Vente`):**
    -   `commande_ref`: (reference vers `orders/{orderId}`)
    -   `date_vente`: (timestamp)
    -   `prix_total_vente`: (number)
    -   `cout_total_calcule`: (number)
    -   `benefice_calcule`: (number)
    -   `items_vendus`: (array d'objets `HistoricCommandeItem`) (dénormalisé pour les rapports)

### 8. `users` (Collection à la racine)
Gère les utilisateurs de l'application et leurs rôles. L'ID du document correspondra à l'UID de Firebase Authentication.

-   **Document ID:** `firebase_auth_uid`
-   **Champs:**
    -   `email`: (string) "serveur@ouiouitacos.com"
    -   `role`: (string) "waiter" | "admin" | "kitchen"
    -   `displayName`: (string) "Jean Serveur"
    -   `pin`: (string) (hash du PIN pour la connexion rapide)
