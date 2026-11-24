# Guide pratique débutant — LAB6

## 1. Objectif et principe

L'API reçoit des requêtes HTTP depuis Postman, puis stocke ou lit les données dans MySQL. Le trajet est : **Postman → route → contrôleur → service → repository → MySQL**, puis la réponse JSON revient à Postman. Les produits peuvent appartenir à une catégorie.

Les exemples ci-dessous utilisent Windows, PowerShell et le dossier `C:\Users\monsi\Documents\Labs\lab6-node-mysql`. Aucun déploiement public de l'API n'est requis : GitHub héberge le code, pas automatiquement le serveur ou la base.

## 2. Vérifier les outils

Dans PowerShell :

```powershell
node --version
npm --version
git --version
```

Installer Node.js LTS depuis [nodejs.org](https://nodejs.org/) si les deux premières commandes ne fonctionnent pas, puis rouvrir PowerShell. Installer [MySQL Community Server et Workbench](https://dev.mysql.com/downloads/), et [Postman](https://www.postman.com/downloads/). Pendant l'installation de MySQL, conserver le mot de passe administrateur de façon sûre.

Si le dossier du projet n'existe pas encore, après publication du dépôt :

```powershell
New-Item -ItemType Directory -Force "C:\Users\monsi\Documents\Labs"
cd "C:\Users\monsi\Documents\Labs"
git clone https://github.com/IguidMnsf/lab6-node-mysql.git
cd "C:\Users\monsi\Documents\Labs\lab6-node-mysql"
```

Si le dossier existe déjà, ne pas recloner ni l'écraser : accéder directement au dossier. Le LAB5 reste dans son propre répertoire.

## 3. Préparer MySQL dans Workbench

1. Démarrer le service MySQL déjà installé, par exemple depuis le gestionnaire de services Windows, puis ouvrir MySQL Workbench.
2. Ouvrir la connexion locale administrateur avec son mot de passe. Il s'agit du compte autorisé à créer une base et un utilisateur, pas du futur compte de l'application.
3. Dans Workbench, ouvrir `sql/create_database.sql` depuis le dossier du projet avec **File > Open SQL Script**, puis exécuter le script entier avec l'icône éclair appropriée. Actualiser **Schemas** : la base `lab_product` doit apparaître.
4. Ouvrir et exécuter `sql/seed_data.sql` une seule fois dans une base de démonstration vide. Ce script insère trois catégories et trois produits ; une deuxième exécution peut provoquer une erreur de doublon.
5. Dans un nouvel onglet SQL, créer un utilisateur dédié en remplaçant le mot de passe d'exemple par une valeur personnelle :

   ```sql
   CREATE USER 'lab_user'@'localhost' IDENTIFIED BY 'RemplacerParUnMotDePasseLocal!';
   GRANT SELECT, INSERT, UPDATE, DELETE ON lab_product.* TO 'lab_user'@'localhost';
   ```

   Exécuter les instructions avec le compte administrateur. Si `lab_user` existe déjà, ne pas le supprimer ni modifier son mot de passe sans connaître son usage : employer un autre nom et le reporter dans `.env`. Ne pas accorder de droits sur toutes les bases.
6. Vérifier les données en sélectionnant les requêtes et en cliquant sur l'éclair :

   ```sql
   USE lab_product;
   SELECT * FROM categories;
   SELECT * FROM products;
   ```

**Attention :** `CREATE TABLE IF NOT EXISTS` ne modifie pas une table existante. Si `lab_product` sert déjà à un autre projet ou possède des tables différentes, ne pas l'effacer : utiliser une autre base après adaptation des scripts et de `DB_NAME`.

## 4. Configurer et lancer l'API

Dans PowerShell :

```powershell
cd "C:\Users\monsi\Documents\Labs\lab6-node-mysql"
Copy-Item .env.example .env
notepad .env
```

Dans le Bloc-notes, renseigner `DB_USER` et le même `DB_PASSWORD` que dans Workbench. Vérifier `DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME=lab_product` et `PORT=3000` ; adapter si nécessaire. Enregistrer et fermer le fichier. `.env` contient un secret local et ne doit pas être ajouté à Git ou à une capture.

Dans le même dossier :

```powershell
npm ci
npm start
```

Le message `API disponible sur http://localhost:3000` confirme que le serveur a réussi sa connexion initiale à MySQL. Laisser cette fenêtre ouverte. Dans une **deuxième** fenêtre PowerShell :

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/"
Invoke-RestMethod -Uri "http://localhost:3000/api/products"
```

Dans le navigateur, `http://localhost:3000/` doit aussi afficher un message JSON. Pour arrêter l'application, revenir à la première fenêtre et appuyer sur `Ctrl+C`.

## 5. Utiliser Postman pour la première fois

1. Vérifier que MySQL fonctionne et que l'API est toujours lancée dans la première fenêtre PowerShell.
2. Ouvrir Postman. Dans **Import**, choisir le fichier `postman\LAB6-MySQL.postman_collection.json` du dossier du projet et confirmer l'import.
3. Dans **Collections**, ouvrir **LAB6 - API produits MySQL**, puis la requête **1. Lister les categories**. Cliquer sur **Send**.
4. Dans la partie réponse, lire **Status: 200 OK** et le tableau JSON. L'URL `{{baseUrl}}` utilise la variable de collection `http://localhost:3000` : il ne s'agit pas d'une adresse GitHub.
5. Ouvrir **2. Creer une categorie**, puis **Send**. Le résultat attendu est `201 Created`. Le script de la collection enregistre automatiquement l'identifiant reçu dans `categoryId`.
6. Envoyer **3. Creer un produit**. L'onglet **Body > raw > JSON** contient son nom, son prix et `{{categoryId}}`. La réponse `201` contient un identifiant enregistré dans `productId`.
7. Envoyer ensuite les requêtes 4 à 11 dans l'ordre. La recherche doit répondre `200`, la suppression d'une catégorie encore liée `409`, les données invalides `400`, puis les suppressions finales `204` sans corps.
8. L'onglet **Test Results** indique si les codes attendus sont obtenus. Si les variables ne sont pas remplies, vérifier les réponses des étapes 2 et 3 et les relancer ; elles ne sont définies qu'après un statut `201`. Les créations modifient réellement la base.

Pour une requête manuelle : **New > HTTP**, choisir `GET`, saisir `http://localhost:3000/api/products`, puis **Send**. Pour un `POST`, choisir l'URL `/api/products`, **Body > raw > JSON** et saisir `{"name":"Casque audio","price":59.99,"category_id":1}` ; l'identifiant 1 doit exister. Postman ajoute normalement `Content-Type: application/json` en choisissant JSON ; sinon l'ajouter dans **Headers**.

Le scénario transactionnel réutilise la catégorie `Accessoires` si elle existe, ou la crée sinon. Les requêtes 10 et 11 ne suppriment que le produit et la catégorie créés aux étapes 2–3 ; le produit transactionnel reste dans la base.

## 6. Comprendre les résultats et les erreurs

| Résultat | Signification et action |
|---|---|
| `200` / `201` | Lecture ou modification réussie / création réussie |
| `204` | Suppression réussie, réponse vide |
| `400` | Données, identifiant ou catégorie invalides ; lire le JSON renvoyé |
| `404` | Route ou élément introuvable ; vérifier URL et identifiant |
| `409` | Catégorie en doublon ou catégorie liée à des produits ; choisir un nom différent ou supprimer/déplacer les produits liés |
| `500` | Erreur interne ; consulter le terminal sans diffuser de secrets |
| `Could not send request` / refus de connexion | Vérifier que le serveur Node fonctionne, l'URL et le port |
| `ECONNREFUSED` vers MySQL | Démarrer MySQL et vérifier `DB_HOST` et `DB_PORT` |
| `Access denied` | Vérifier le compte, son hôte, son mot de passe et ses droits sur la base |
| `Unknown database` / table absente | Exécuter le script de création sur la bonne instance et vérifier `DB_NAME` |
| `EADDRINUSE` | Le port API est occupé ; choisir un autre `PORT` dans `.env`, redémarrer et modifier `baseUrl` dans la collection |
| `npm` non reconnu | Installer Node.js LTS et rouvrir PowerShell |
| `npm ci` échoue | Vérifier l'accès au registre npm, la version de Node et le dossier contenant `package-lock.json` |

Ne pas désactiver la sécurité, supprimer une base ou arrêter un processus inconnu pour résoudre une erreur.

## 7. Captures pour le rapport

Effectuer les captures après chaque action réelle : Workbench avec les tables et données, terminal montrant le démarrage (sans `.env`), Postman `GET 200`, création `201`, recherche `200`, erreur de validation `400`, conflit `409` et suppression `204`. Sur GitHub, capturer la page du dépôt montrant le README et les dossiers. Ne montrer ni mot de passe, ni jeton, ni données personnelles.

Compléter `RAPPORT_LAB6.md` avec les résultats réellement observés et insérer les captures aux emplacements indiqués. Le dépôt GitHub est une preuve de publication du code ; une capture GitHub ne prouve pas à elle seule que l'API est déployée en ligne.

## 8. Publication de changements personnels

Depuis le dossier du projet :

```powershell
git status
git add README.md GUIDE_PRATIQUE.md RAPPORT_LAB6.md
git status
git commit -m "Documentation du LAB6"
git push origin main
```

Vérifier avant chaque commit que `.env`, mots de passe et captures sensibles ne figurent pas dans les fichiers suivis. Si d'autres fichiers ont été modifiés, les ajouter explicitement après vérification. Les commandes de commit nécessitent une identité Git configurée et une authentification GitHub fonctionnelle.
