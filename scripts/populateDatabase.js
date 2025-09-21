// Un script autonome pour peupler et initialiser une base de données Firestore.

import admin from 'firebase-admin';
import { faker } from '@faker-js/faker';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const RESTAURANT_ID = 'ouiouitacos_main';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const serviceAccountRaw = readFileSync(path.join(__dirname, 'serviceAccountKey.json'));
    const serviceAccount = JSON.parse(serviceAccountRaw);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://POS_OUIOUI.firebaseio.com`
    });
} catch (e) {
    if (e.code === 'ENOENT') {
         console.error("ERREUR : Le fichier `serviceAccountKey.json` est manquant.");
    } else {
        console.error("ERREUR lors de l'initialisation de Firebase:", e);
    }
    process.exit(1);
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const BATCH_SIZE = 450;

// --- DONNÉES DE BASE ---
const baseData = {
    categories: [
        { id: "1", nom: 'Tacos' },
        { id: "2", nom: 'Accompagnements' },
        { id: "3", nom: 'Boissons' },
    ],
    ingredients: [
        { id: "101", nom: 'Tortilla de maïs', unite: 'pièce', stock_minimum: 50 },
        { id: "102", nom: 'Viande de bœuf hachée', unite: 'kg', stock_minimum: 5 },
        { id: "103", nom: 'Poulet mariné', unite: 'kg', stock_minimum: 5 },
        { id: "104", nom: 'Salade iceberg', unite: 'kg', stock_minimum: 1 },
        { id: "105", nom: 'Tomate', unite: 'kg', stock_minimum: 2 },
        { id: "106", nom: 'Oignon rouge', unite: 'kg', stock_minimum: 1 },
        { id: "107", nom: 'Fromage râpé', unite: 'kg', stock_minimum: 2 },
        { id: "108", nom: 'Sauce Salsa', unite: 'L', stock_minimum: 1 },
        { id: "109", nom: 'Guacamole', unite: 'kg', stock_minimum: 1 },
        { id: "110", nom: 'Frites', unite: 'kg', stock_minimum: 10 },
        { id: "111", nom: 'Coca-Cola', unite: 'L', stock_minimum: 5 },
        { id: "112", nom: 'Jus d\'orange', unite: 'L', stock_minimum: 3 }, // CORRIGÉ
    ],
    products: [
        { id: "1001", nom_produit: 'Taco au Bœuf', prix_vente: 8.5, categoria_id: "1", estado: 'disponible' },
        { id: "1002", nom_produit: 'Taco au Poulet', prix_vente: 8.0, categoria_id: "1", estado: 'disponible' },
        { id: "1003", nom_produit: 'Portion de Frites', prix_vente: 3.5, categoria_id: "2", estado: 'disponible' },
        { id: "1004", nom_produit: 'Coca-Cola (33cl)', prix_vente: 2.5, categoria_id: "3", estado: 'disponible' },
        { id: "1005", nom_produit: 'Jus d\'orange (25cl)', prix_vente: 3.0, categoria_id: "3", estado: 'disponible' }, // CORRIGÉ
    ],
    recettes: [
        { produit_id: "1001", items: [{ ingredient_id: "101", qte_utilisee: 2 }, { ingredient_id: "102", qte_utilisee: 0.15 }, { ingredient_id: "107", qte_utilisee: 0.05 }] },
        { produit_id: "1002", items: [{ ingredient_id: "101", qte_utilisee: 2 }, { ingredient_id: "103", qte_utilisee: 0.15 }, { ingredient_id: "104", qte_utilisee: 0.03 }] },
        { produit_id: "1003", items: [{ ingredient_id: "110", qte_utilisee: 0.25 }] },
        { produit_id: "1004", items: [{ ingredient_id: "111", qte_utilisee: 0.33 }] },
        { produit_id: "1005", items: [{ ingredient_id: "112", qte_utilisee: 0.25 }] },
    ],
    tables: [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `${i + 1}`, nom: `Table ${i + 1}`, capacite: faker.helpers.arrayElement([2, 4, 4, 6]) })),
        { id: "99", nom: 'À emporter', capacite: 99 }
    ],
    roles: [
      { id: 'admin', nom: 'Administrateur', pin: '1234' },
      { id: 'mesero', nom: 'Service en salle', pin: '5678' },
      { id: 'cocina', nom: 'Cuisine', pin: '9012' },
    ]
};

// --- LOGIQUE D'INITIALISATION ---
const initializeCollection = async (collectionName, data) => {
    const collectionRef = db.collection(`restaurants/${RESTAURANT_ID}/${collectionName}`);
    const snapshot = await collectionRef.limit(1).get();
    
    if (!snapshot.empty) {
        console.log(`- La collection "${collectionName}" contient déjà des données. Initialisation ignorée.`);
        return;
    }

    console.log(`- Initialisation de la collection "${collectionName}" avec ${data.length} documents...`);
    const batch = db.batch();
    data.forEach(item => {
        const docRef = collectionRef.doc(String(item.id));
        batch.set(docRef, item);
    });
    await batch.commit();
};

const initializeBaseData = async () => {
    console.log('--- Vérification et initialisation des données de base ---');
    await initializeCollection('categories', baseData.categories);
    await initializeCollection('ingredients', baseData.ingredients.map(ing => ({...ing, stock_actuel: ing.stock_minimum * 5, lots: [], prix_unitaire_moyen: 0})) );
    await initializeCollection('products', baseData.products);
    await initializeCollection('recettes', baseData.recettes.map(r => ({...r, produit_id: r.produit_id})) );
    await initializeCollection('tables', baseData.tables);
    await initializeCollection('roles', baseData.roles);
    console.log('--- Initialisation des données de base terminée ---\n');
}

// --- LOGIQUE DE GÉNÉRATION ---
const getCollection = async (collectionName) => {
    const collectionPath = `restaurants/${RESTAURANT_ID}/${collectionName}`;
    const snapshot = await db.collection(collectionPath).get();
    if (snapshot.empty) {
        console.error(`ERREUR CRITIQUE : La collection "${collectionPath}" est vide.`);
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = (arr, min = 1, max = 5) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    const count = faker.number.int({ min, max: Math.min(max, shuffled.length) });
    return shuffled.slice(0, count);
};

const generateHistoricData = async () => {
    console.log('--- Début de la génération des données historiques (commandes, ventes...) ---');

    const [produits, ingredients, tables] = await Promise.all([
        getCollection('products'),
        getCollection('ingredients'),
        getCollection('tables')
    ]);

    if (!produits.length || !ingredients.length || !tables.length) {
        console.error('\nDonnées de base manquantes. Le script ne peut pas continuer.');
        process.exit(1);
    }
    
    console.log(`-> Données récupérées : ${produits.length} produits, ${ingredients.length} ingrédients, ${tables.length} tables.\n`);

    let batch = db.batch();
    let writeCounter = 0;

    const commitBatch = async (force = false) => {
        if (writeCounter >= BATCH_SIZE || (force && writeCounter > 0)) {
            const currentCount = writeCounter;
            await batch.commit();
            console.log(`   ...Lot de ${currentCount} opérations engagé avec succès.`);
            batch = db.batch();
            writeCounter = 0;
        }
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60);

    console.log(`Génération des données du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`);

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        console.log(`- Génération pour le ${day.toLocaleDateString('fr-FR')}`);
        const dailyOrders = faker.number.int({ min: 20, max: 55 });

        for (let i = 0; i < dailyOrders; i++) {
            const commandeDate = faker.date.between({ from: new Date(new Date(day).setHours(11, 30, 0, 0)), to: new Date(new Date(day).setHours(22, 0, 0, 0)) });
            const table = getRandomElement(tables.filter(t => t.id !== "99"));
            const items = [];
            let total = 0;
            const selectedProducts = getRandomSubset(produits.filter(p => p.estado === 'disponible'), 1, 6);

            for (const produit of selectedProducts) {
                const quantite = faker.number.int({ min: 1, max: 2 });
                items.push({ produit: { id: produit.id, nom_produit: produit.nom_produit, prix_vente: produit.prix_vente }, quantite, commentaire: '' });
                total += produit.prix_vente * quantite;
            }

            let statut = 'terminee';
            let estado_cocina = 'servido';
            if (day.toDateString() === endDate.toDateString() && Math.random() > 0.6) {
                statut = 'en_cours';
                estado_cocina = getRandomElement(['recibido', 'listo']);
            }

            const commandeRef = db.collection(`restaurants/${RESTAURANT_ID}/commandes`).doc();
            batch.set(commandeRef, { table_id: table.id, couverts: faker.number.int({ min: 1, max: table.capacite }), items, total: parseFloat(total.toFixed(2)), statut, estado_cocina, date_creation: admin.firestore.Timestamp.fromDate(commandeDate), numero: i + 1 });
            writeCounter++;

            if (statut === 'terminee') {
                const date_vente = new Date(commandeDate.getTime() + faker.number.int({ min: 900000, max: 2700000 }));
                for (const item of items) {
                    const venteRef = db.collection(`restaurants/${RESTAURANT_ID}/ventes`).doc();
                    batch.set(venteRef, { commande_id: commandeRef.id, produit_id: item.produit.id, quantite: item.quantite, prix_total_vente: parseFloat((item.produit.prix_vente * item.quantite).toFixed(2)), date_vente: admin.firestore.Timestamp.fromDate(date_vente) });
                    writeCounter++;
                }
            }
            await commitBatch();
        }

        if (day.getDay() % 3 === 0) {
            console.log(`  -> Simulation d'achats...`);
            const ingredientsToBuy = getRandomSubset(ingredients, 2, 5);
            for (const ingredient of ingredientsToBuy) {
                 const achatRef = db.collection(`restaurants/${RESTAURANT_ID}/achats`).doc();
                 batch.set(achatRef, { ingredient_id: ingredient.id, quantite: faker.number.int({ min: 1, max: 5 }), prix_total: parseFloat(faker.finance.amount(10, 80)), date_achat: admin.firestore.Timestamp.fromDate(day) });
                 writeCounter++;
                 await commitBatch();
            }
        }
    }

    await commitBatch(true);
    console.log('\n--- Génération des données historiques terminée avec succès! ---');
};

// --- SCRIPT PRINCIPAL ---
const main = async () => {
    await initializeBaseData();
    await generateHistoricData();
}

main().catch(error => {
    console.error("\nUne erreur grave est survenue lors de l'exécution du script:", error);
});
