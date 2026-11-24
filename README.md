# LAB6 — API REST Node.js et MySQL

API de gestion des produits et des catégories avec Express et MySQL. Ce projet constitue un LAB6 séparé : il ne modifie pas le LAB5.

## Fonctionnalités

- CRUD des produits et des catégories.
- Recherche, filtres, pagination et tri des produits.
- Création transactionnelle d'un produit avec une catégorie existante ou nouvelle.
- Validation des données, requêtes SQL paramétrées et gestion centralisée des erreurs.
- Refus de la suppression d'une catégorie liée à des produits par l'API.

## Prérequis et installation

Node.js LTS (version 20 ou supérieure), npm, MySQL Server, MySQL Workbench et Postman sont nécessaires. Le [guide de pratique](GUIDE_PRATIQUE.md) détaille les installations, les commandes PowerShell, Postman et le dépannage.

1. Dans MySQL Workbench, exécuter `sql/create_database.sql`, puis une seule fois `sql/seed_data.sql`. Créer un utilisateur disposant des droits nécessaires sur `lab_product` uniquement.
2. À la racine du dépôt, copier `.env.example` vers `.env` et renseigner les identifiants locaux MySQL. Ne jamais publier `.env`.
3. Dans PowerShell :

   ```powershell
   cd "C:\Users\monsi\Documents\Labs\lab6-node-mysql"
   npm ci
   npm start
   ```

4. L'API est disponible à `http://localhost:3000`. Un mode de développement avec redémarrage automatique est proposé par `npm run dev`. Arrêter le serveur avec `Ctrl+C`.
5. Importer `postman/LAB6-MySQL.postman_collection.json` dans Postman et suivre les requêtes dans l'ordre.

Le dossier indiqué correspond à la copie locale prévue pour ce poste ; adapter le chemin si le dépôt a été cloné ailleurs.

## Endpoints

| Méthode | URL | Rôle |
|---|---|---|
| GET | `/api/products` | Lister les produits |
| GET | `/api/products/:id` | Lire un produit |
| POST | `/api/products` | Créer un produit |
| PUT | `/api/products/:id` | Remplacer les données d'un produit |
| DELETE | `/api/products/:id` | Supprimer un produit |
| GET | `/api/products/search` | Rechercher et paginer |
| POST | `/api/products/with-category` | Créer un produit avec sa catégorie |
| GET, POST | `/api/categories` | Lister ou créer des catégories |
| GET, PUT, DELETE | `/api/categories/:id` | Lire, modifier ou supprimer une catégorie |

Exemple de création : `{"name":"Casque audio","price":59.99,"category_id":1}`. La catégorie peut être omise ou `null`. Pour la transaction, utiliser `{"name":"Clavier","price":49.99,"categoryName":"Accessoires"}` sans `category_id`.

La recherche accepte `name`, `minPrice`, `maxPrice`, `categoryId`, `limit` (1 à 100, 10 par défaut), `offset` (0 par défaut) et `sort` (`id`, `name` ou `price`, par défaut `name`). Exemple : `/api/products/search?minPrice=0&maxPrice=100&limit=5&offset=0&sort=price`. Le tri est croissant. Les valeurs MySQL `DECIMAL` peuvent apparaître sous forme de chaînes dans les réponses JSON.

Les codes principaux sont `200`, `201`, `204`, `400`, `404`, `409` et `500`. Une catégorie liée entraîne `409` lors d'une suppression par l'API. La contrainte SQL du sujet reste `ON DELETE SET NULL` : une suppression effectuée directement en SQL ne passe pas par cette règle métier.

## Organisation

`src/routes` définit les routes ; `src/controllers` gère HTTP ; `src/services` applique les règles métier ; `src/repositories` exécute les requêtes ; `src/config` configure le pool ; `src/middlewares` centralise validation et erreurs. `sql`, `postman` et `test` contiennent les scripts, la collection et les tests.

## Tests

```powershell
npm test
```

Les tests automatisés simulent les accès à MySQL : ils ne remplacent pas une démonstration avec un serveur MySQL réel. Le [rapport](RAPPORT_LAB6.md) contient les éléments à compléter après réalisation.
