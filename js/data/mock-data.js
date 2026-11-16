/**
 * DONNÉES DE DÉMONSTRATION — à remplacer par le backend.
 * Tous les montants sont exprimés en CENTIMES (entiers) pour éviter les erreurs d'arrondi.
 * Ces données ne sont lues que par les services (js/services/*), jamais directement par l'interface.
 */
window.SL = window.SL || {};

SL.mockData = Object.freeze({
  catalog: [
    { reference: 'A101', name: 'Pull col roulé en maille', unitPrice: 3900, stock: 12 },
    { reference: 'A102', name: 'Cardigan oversize côtelé', unitPrice: 4590, stock: 6 },
    { reference: 'B204', name: 'Jean droit taille haute', unitPrice: 4990, stock: 20 },
    { reference: 'B215', name: 'Pantalon large en lin', unitPrice: 3590, stock: 3 },
    { reference: 'C330', name: 'Chemise en popeline', unitPrice: 2990, stock: 15 },
    { reference: 'C342', name: 'Blouse fluide imprimée', unitPrice: 2490, stock: 9 },
    { reference: 'D410', name: 'Sac cabas en cuir grainé', unitPrice: 8900, stock: 4 },
    { reference: 'D455', name: 'Ceinture en cuir lisse', unitPrice: 1990, stock: 25 },
    { reference: 'E512', name: 'Baskets cuir blanc', unitPrice: 6990, stock: 8 },
    { reference: 'F600', name: 'Foulard en soie', unitPrice: 2290, stock: 0 }
  ],

  /** Pays livrés et zone tarifaire associée. */
  countries: [
    { code: 'FR', name: 'France', zone: 'FR' },
    { code: 'BE', name: 'Belgique', zone: 'EU' },
    { code: 'LU', name: 'Luxembourg', zone: 'EU' },
    { code: 'DE', name: 'Allemagne', zone: 'EU' },
    { code: 'ES', name: 'Espagne', zone: 'EU' },
    { code: 'IT', name: 'Italie', zone: 'EU' },
    { code: 'NL', name: 'Pays-Bas', zone: 'EU' },
    { code: 'PT', name: 'Portugal', zone: 'EU' }
  ],

  /** Modes de livraison. `prices` par zone ; `null` = indisponible dans la zone. */
  shippingMethods: [
    {
      id: 'home',
      name: 'Livraison à domicile',
      description: '2 à 4 jours ouvrés, remise contre signature',
      icon: 'truck',
      prices: { FR: 590, EU: 990 },
      freeFrom: 15000
    },
    {
      id: 'relay',
      name: 'Point relais',
      description: '3 à 5 jours ouvrés, retrait dans un point relais proche de chez vous',
      icon: 'store',
      prices: { FR: 390, EU: 690 },
      freeFrom: 15000
    },
    {
      id: 'express',
      name: 'Express 24 h',
      description: 'Commande avant 13 h, livrée le lendemain',
      icon: 'package',
      prices: { FR: 1290, EU: null },
      freeFrom: null
    }
  ],

  /** Commande de démonstration consultable dans « Suivre ma commande ». */
  demoOrders: [
    {
      orderNumber: 'SL-DEMO-2048',
      email: 'demo@shoplive.fr',
      createdAt: '2026-11-12T14:32:00.000Z',
      status: 'shipped',
      lines: [
        { reference: 'B204', name: 'Jean droit taille haute', unitPrice: 4990, quantity: 1 },
        { reference: 'D455', name: 'Ceinture en cuir lisse', unitPrice: 1990, quantity: 2 }
      ],
      shipping: { name: 'Livraison à domicile', price: 590 },
      totals: { subtotal: 8970, shipping: 590, total: 9560 },
      isDemo: true
    }
  ],

  faq: [
    {
      q: 'Où trouver la référence d\'un article ?',
      a: 'La référence et le prix sont annoncés à l\'oral et affichés à l\'écran pendant le live. Saisissez le montant, la référence et votre pseudo TikTok : nous vérifions ensuite la correspondance avant l\'expédition.'
    },
    {
      q: 'Puis-je commander plusieurs articles en une seule fois ?',
      a: 'Oui. Indiquez le montant total annoncé et la référence de commande communiquée pendant le live. Vous pouvez préciser les articles dans le champ « Article commandé ».'
    },
    {
      q: 'Comment le prix est-il calculé ?',
      a: 'Le récapitulatif additionne automatiquement le montant saisi et les frais de livraison. Chaque commande est ensuite contrôlée par notre équipe avec la référence indiquée.'
    },
    {
      q: 'Quels moyens de paiement acceptez-vous ?',
      a: 'Nous acceptons exclusivement les cartes bancaires : Carte Bancaire (CB), Visa, Mastercard et American Express. Le paiement est traité par notre prestataire certifié PCI-DSS ; vos données de carte ne transitent jamais par nos serveurs.'
    },
    {
      q: 'Quels sont les délais et frais de livraison ?',
      a: 'En France : point relais 3,90 € (3 à 5 jours), domicile 5,90 € (2 à 4 jours), express 24 h 12,90 €. Livraison en point relais ou à domicile offerte dès 150 € d\'achat. Des tarifs spécifiques s\'appliquent en Europe.'
    },
    {
      q: 'Comment suivre ma commande ?',
      a: 'Rendez-vous dans « Suivre ma commande » et indiquez votre numéro de commande ainsi que l\'adresse e-mail utilisée lors de l\'achat.'
    },
    {
      q: 'Puis-je retourner un article ?',
      a: 'Vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation. Contactez notre service client en précisant votre numéro de commande.'
    }
  ]
});
