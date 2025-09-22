
const admin = require('firebase-admin');

// =====================================================================================
//  PASO 1: CONFIGURACIÓN
// =====================================================================================
// Descargue su clave de cuenta de servicio JSON desde Firebase Console:
// Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada
// ¡¡¡IMPORTANTE!!!: Guarde el archivo en este directorio `scripts` y AGREGUE EL NOMBRE DEL ARCHIVO a su archivo `.gitignore`
// para evitar exponer sus claves secretas.
const serviceAccount = require('./ouioui-tacos-firebase-adminsdk-ab3j2-6035b5a28b.json'); // <-- REEMPLACE CON EL NOMBRE DE SU ARCHIVO

// El ID de su restaurante en la base de datos
const RESTAURANT_ID = "ouiouitacos_main";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log("Firebase Admin SDK inicializado.");
console.log(`Apuntando al ID de restaurante: ${RESTAURANT_ID}`);

// =====================================================================================
//  PASO 2: DATOS A POBLAR (Copiado de su archivo mockDatabase)
// =====================================================================================

const Unite = { KG: 'kg', L: 'L', UNITE: 'unidad' };

let ingredients = [
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
    // ... (El resto de sus datos de 'ingredients' va aquí)
];

let categorias = [
    { id: 2, nom: "Entradas" },
    { id: 1, nom: "Platos Principales" },
    { id: 3, nom: "Postres" },
    { id: 4, nom: "Bebidas" }
];

let produits = [
    // Entradas
    { id: 1, nom_produit: "Bruschetta de Tomate", prix_vente: 18000, estado: 'disponible', categoria_id: 2 },
    { id: 10, nom_produit: "Papas Cheddar y Tocineta", prix_vente: 25000, estado: 'disponible', categoria_id: 2, image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARKSURBVCHhe3drS0tRFMfxt+kH6ENICwVpG/WlAl3YpYvoG7SiCO7cFF1ERFEUq7qQgoqKIIp/oDAqF2I1i845M8/M3Dm5M/fA54U/N2fuzNkz537MOUhISEhISEhISEhISEhISEgQEK3t7W2h3W6Xj8ej1Gq18nK5tEajUf+Y/sD7/f7d3d2ldrs1s9lMFxcX+vj4UK/X+0/mD1in0xkaGhpSgUDg/v5+ub6+Jh6P55/MP2BpaWmR0Wj06elpEokEVigUkMvl0Gq1/jP9AVqtVhIJBJRSqXQPx6NQKNDv918afwYhISEhISEhISEhISEhAQI2Njb29vbUavVyu12a3d3d4VCIUulUtvb27PZbJb7+/s1Go1sNpvVajUWi8VsNptisZharZY8Hk+j0ag4HOYfWC6XsyUIAsFAINBqtVKr1VKr1SKRSJBKpZDL5WCxWCiVSggEAsRiMQaDAY1Gg1AohFarxXQ6xWAwwOfzQSgUQigUgsFgQCQSQSgUglwuh1wuh0AgsDSr+wO/hISEhISEhISEhISEhAQI2J+fny1EIpGbm5sUCoVkMpmkUql4PJ7S6XQ2m00AODg4oNPpJBqNfnp6OsvlslQqlRQKBTg4OKDRaHQ+ny8SiWQqlXJ/f1/u7u6Ew2Fms1kqlUoul4vBYNDf35+lUim1Wk0mk0ksFjM8PJzVajU6nQ4A7O7upmazSbfbxWKxaLfbSbfbhaRSmVQqFcPhkEQiESgUUiYnJzM8PJzFYtHtdtNv9x8sISEhISEhISEhISEhISEhgaX8iQcEBwcHlEql/CgUiu7u7sTjcQoGg/p8PkqlUgKBQN+fPoA0Fm+hYjAYbG9vj8fj0Wg0IhKJhMNhgsHg/f19gsHgcDhUFEUhISEhISEhISEhISEhISEhAQI2h4eHVCqVpFJJrVbL4XAoFArJ5XJJpVJEIpFERUaDAaPRiMFgQCqVQigUQigUQq/XQ6/XQ6/Xw+fzSafTfR4f7w8SEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhIS6j93Dymivm0Q/S9ZAAAAAElFTkSuQmCC' },
    // ... (El resto de sus datos de 'produits' va aquí)
];

let recettes = [
    { produit_id: 1, items: [{ ingredient_id: 14, qte_utilisee: 0.2 }, { ingredient_id: 1, qte_utilisee: 0.1 }, { ingredient_id: 4, qte_utilisee: 0.05 }, { ingredient_id: 5, qte_utilisee: 0.01 }] },
    { produit_id: 2, items: [{ ingredient_id: 3, qte_utilisee: 0.250 }, { ingredient_id: 1, qte_utilisee: 0.150 }, { ingredient_id: 2, qte_utilisee: 0.100 }, { ingredient_id: 4, qte_utilisee: 0.1 }, { ingredient_id: 5, qte_utilisee: 0.02 }] },
    // ... (El resto de sus datos de 'recettes' va aquí)
];

let tables = [
    { id: 1, nom: "Mesa 1", capacite: 2 },
    { id: 2, nom: "Mesa 2", capacite: 4 },
    // ... (El resto de sus datos de 'tables' va aquí)
];

let roles = [
    { id: 'admin', name: 'Administrador', pin: '004789', permissions: { /* ... */ } },
    { id: 'cocina', name: 'Cocina', pin: '004799', permissions: { /* ... */ } },
    // ... (El resto de sus datos de 'roles' va aquí)
];

// ... (Defina aquí el resto de sus conjuntos de datos: achats, commandes, etc.)


// =====================================================================================
//  PASO 3: LÓGICA DE POBLACIÓN
// =====================================================================================

const populateCollection = async (collectionName, data) => {
  console.log(`\nIniciando población para: ${collectionName}...`);
  const collectionRef = db.collection(`restaurants/${RESTAURANT_ID}/${collectionName}`);
  
  // Usar un lote para escribir todos los documentos a la vez para mayor eficiencia
  const batch = db.batch();

  data.forEach(item => {
    // Usar el 'id' numérico o de cadena de sus datos como el ID del documento en Firestore
    const docId = String(item.id); 
    const docRef = collectionRef.doc(docId);
    batch.set(docRef, item);
  });

  try {
    await batch.commit();
    console.log(`✅  Éxito: ${data.length} documentos escritos en '${collectionName}'.`);
  } catch (error) {
    console.error(`❌ Error al escribir en '${collectionName}':`, error);
  }
};

const main = async () => {
    console.log('*** INICIANDO EL SCRIPT DE POBLACIÓN DE LA BASE DE DATOS ***');
    console.log('ADVERTENCIA: Esto sobrescribirá los datos existentes en las colecciones de destino.');

    await populateCollection('ingredients', ingredients);
    await populateCollection('categories', categorias);
    await populateCollection('products', produits);
    await populateCollection('recettes', recettes);
    await populateCollection('tables', tables);
    await populateCollection('roles', roles);

    console.log('\n*** SCRIPT DE POBLACIÓN COMPLETADO ***');
};

main().catch(error => {
  console.error("Ha ocurrido un error inesperado:", error);
});
