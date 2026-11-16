# SHOP LIVE — frontend de commande

Checkout de live shopping : le client saisit le montant annoncé, la référence de commande, l'article (facultatif) et son pseudo TikTok. HTML5, CSS3 et JavaScript vanilla. Pas de framework ni de backend.

## Lancer le site

- Ouvrir `index.html` directement dans le navigateur (fonctionne en `file://`), **ou**
- lancer `node tools/serve.js` puis aller sur http://localhost:5173


## Structure

```
index.html                 Vues : commande, confirmation, suivi, FAQ, contact, pages légales (routeur #/…)
css/style.css              Design system (tokens), composants, responsive
js/config.js               Coordonnées, réseaux sociaux, source de données, Stripe
js/data/mock-data.js       Données FICTIVES : catalogue, livraison, points relais, FAQ
js/core/format.js          Formatage des prix (centimes → €), échappement HTML
js/core/validation.js      Règles de validation (pures, sans DOM)
js/core/pricing.js         Calcul des totaux (pur, en centimes)
js/services/product-service.js   Pays, modes de livraison, points relais (mock ou API)
js/services/order-service.js     Payload de commande, n° fictif, suivi
js/services/payment-service.js   Intégration Stripe Elements / Checkout (désactivée)
js/ui/animations.js        Écran d'ouverture (logo) et animation de paiement
js/ui/*.js, js/app.js      Interface, routeur
assets/                    Icônes couleur Fluent Emoji (MIT) + logos réseaux Simple Icons dans assets/icons/color, logo Shop Live (assets/brand : PNG transparent, version claire, icône/favicon), polices Bricolage Grotesque + Instrument Sans (OFL), logos cartes, icônes Lucide (ISC) + TikTok (Simple Icons)
tools/build-sprite.js      Régénère le sprite d'icônes inline dans index.html
```

## Raccorder le backend

1. `SL.config.dataSource = 'api'` et `SL.config.api.baseUrl`.
2. Remplacer `orderService.createDemoOrder` par un `POST /orders` avec `orderService.buildPayload(...)`.
3. Le payload contient le **montant saisi par le client** (`order.amount`, en centimes) et la référence :
   le serveur doit les contrôler côté vendeur et recalculer les frais de port avant de créer le paiement.

## Raccorder Stripe

Voir l'en-tête de `js/services/payment-service.js`. Le Payment Element se monte dans `#payment-element`
(`paymentMethodOrder: ['card']`). Le PaymentIntent ou la Checkout Session est créé côté serveur, avec le montant validé par le serveur.

## Version de démonstration

- Les champs de carte n'ont pas d'attribut name : ils ne sont ni lus, ni envoyés, ni enregistrés. À remplacer par Stripe avant la mise en ligne.
- Aucun paiement n'est effectué et aucun e-mail n'est envoyé.
- Les commandes de démonstration (sans donnée bancaire) sont gardées dans le `localStorage` du navigateur pour la page de suivi.
- Les pages légales sont des modèles : les passages surlignés sont à compléter.

## Netlify Forms

Les formulaires **commande** et **contact** sont déclarés en HTML (`data-netlify="true"` et champ caché `form-name`).
Netlify les détecte au déploiement : les envois apparaissent dans
*Site → Forms*.

- Champs envoyés (commande) : `montant`, `reference_commande`, `article_commande`, `pseudo_tiktok`, `prenom`, `nom`,
  `email`, `telephone`, `adresse`, `complement_adresse`, `code_postal`, `ville`, `pays`, `cgv_acceptees`, plus les
  valeurs calculées `numero_commande`, `date_commande`, `mode_livraison`, `frais_livraison`, `total_a_payer`.
- Champs envoyés (contact) : `nom`, `email`, `numero_commande`, `sujet`, `message`.
- **Les champs de carte n'ont pas d'attribut `name` : ils ne sont jamais envoyés.**
- L'envoi est une soumission HTML classique (POST vers `/index.html`) une fois le formulaire validé.
- En local, `node tools/serve.js` affiche dans le terminal les champs reçus, pour vérifier ce que Netlify recevra.
- Ouvert en `file://`, il n'y a pas d'envoi (pas de serveur).
