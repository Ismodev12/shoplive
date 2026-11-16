/**
 * Configuration de la boutique.
 * Tout ce qui est éditorial / configurable se trouve ici : coordonnées,
 * réseaux sociaux, devise, source des données et paramètres Stripe.
 */
window.SL = window.SL || {};

SL.config = Object.freeze({
  storeName: 'SHOP LIVE',
  currency: 'EUR',
  locale: 'fr-FR',

  /**
   * Source des prix et des modes de livraison.
   *  - 'mock' : données de démonstration (js/data/mock-data.js)
   *  - 'api'  : votre backend (voir js/services/product-service.js)
   */
  dataSource: 'mock',
  api: {
    baseUrl: '',                       // ex. 'https://api.shoplive.fr'
    endpoints: {
      product: '/products/:reference', // GET  → { reference, name, unitPrice (centimes), stock }
      quote: '/checkout/quote',        // POST → total recalculé côté serveur
      createOrder: '/orders',          // POST → { orderNumber, clientSecret | checkoutUrl }
      trackOrder: '/orders/track',     // POST → statut de commande
      contact: '/contact'              // POST → envoi du message
    }
  },

  /** Stripe — à renseigner lors de l'intégration (clé PUBLIQUE uniquement). */
  stripe: {
    enabled: false,
    publishableKey: '',                // 'pk_live_…' / 'pk_test_…'
    mode: 'elements'                   // 'elements' (Payment Element intégré) ou 'checkout' (redirection)
  },

  contact: {
    email: 'contact@shoplive.fr',
    phone: '+33 1 84 80 00 00',
    hours: 'Du lundi au vendredi, de 9 h à 18 h'
  },

  /** Réseaux sociaux : laissez `url` vide pour masquer un réseau. */
  socials: [
    { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/' },
    { name: 'TikTok', icon: 'tiktok', url: 'https://www.tiktok.com/' },
    { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/' }
  ],

  order: {
    maxLines: 30,
    maxQuantityPerLine: 20
  }
});
