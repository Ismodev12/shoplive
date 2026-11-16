/**
 * OrderService — construction de la commande et suivi.
 *
 * Le client saisit le montant annoncé pendant le live et une référence libre.
 * IMPORTANT : le backend doit recontrôler ce montant face à la référence (côté vendeur)
 * et recalculer les frais de port avant de créer le paiement Stripe.
 *
 * Sans backend, la commande est enregistrée dans le navigateur
 * (localStorage, sans aucune donnée bancaire) pour alimenter la page de suivi.
 */
window.SL = window.SL || {};

SL.orderService = (() => {
  const STORAGE_KEY = 'shoplive.demoOrders';
  const isDemo = SL.config.dataSource !== 'api';

  /** Payload prêt pour POST /orders (backend). */
  function buildPayload({ order, customer, address, shipping }) {
    return {
      order: {
        amount: order.amount,          // centimes, saisi par le client — à vérifier côté vendeur
        reference: order.reference,
        article: order.article || null,
        tiktok: order.tiktok
      },
      customer: {
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim()
      },
      shippingAddress: {
        line1: address.address1.trim(),
        line2: address.address2.trim() || null,
        postalCode: address.postalCode.trim().toUpperCase(),
        city: address.city.trim(),
        country: address.country
      },
      shipping: { methodId: shipping.methodId },
      acceptedTerms: true
    };
  }

  /** Numéro fictif : SL-AAMMJJ-XXXX (alphabet sans caractères ambigus). */
  function generateOrderNumber(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint32Array(4);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    const suffix = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    return `SL-${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${suffix}`;
  }

  const readStore = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  };
  const writeStore = (orders) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(-100))); } catch { /* stockage indisponible */ }
  };

  /**
   * Démo : crée une commande locale. Aucun paiement, aucun e-mail.
   * En production, remplacer par : POST config.api.endpoints.createOrder avec `payload`.
   */
  function createDemoOrder(payload, display) {
    const order = {
      orderNumber: generateOrderNumber(),
      email: payload.customer.email,
      createdAt: new Date().toISOString(),
      status: 'paid',
      reference: payload.order.reference,
      customer: { firstName: payload.customer.firstName, lastName: payload.customer.lastName, tiktok: payload.order.tiktok },
      address: payload.shippingAddress,
      lines: display.lines.map((l) => ({ reference: l.reference, name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
      shipping: { name: display.shippingName, price: display.totals.shipping },
      totals: { subtotal: display.totals.subtotal, shipping: display.totals.shipping, total: display.totals.total },
      isDemo: true
    };
    writeStore([...readStore(), order]);
    return order;
  }

  /** Recherche (démo : navigateur + commande exemple). */
  async function findOrder(orderNumber, email) {
    const num = orderNumber.trim().toUpperCase();
    const mail = email.trim().toLowerCase();
    const all = [...SL.mockData.demoOrders, ...readStore()];
    return all.find((o) => o.orderNumber === num && o.email.toLowerCase() === mail) || null;
  }

  /**
   * Toutes les commandes passées depuis cet appareil, les plus récentes d'abord.
   * Backend : GET /orders pour le client identifié (session, e-mail ou pseudo TikTok).
   */
  /** Commande enregistrée sur cet appareil, par son numéro. */
  function getOrder(orderNumber) {
    return readStore().find((o) => o.orderNumber === orderNumber) || null;
  }

  async function listDeviceOrders() {
    return readStore().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Étapes affichées dans le suivi. */
  const STATUSES = [
    { id: 'received', short: 'Enregistrée', label: 'Commande enregistrée', hint: 'Nous avons bien reçu votre commande.' },
    { id: 'paid', short: 'Payée', label: 'Paiement validé', hint: 'Le paiement par carte a été accepté.' },
    { id: 'preparing', short: 'En préparation', label: 'En préparation', hint: 'Vos articles sont préparés avec soin.' },
    { id: 'shipped', short: 'Expédiée', label: 'Expédiée', hint: 'Votre colis est en route.' },
    { id: 'delivered', short: 'Livrée', label: 'Livrée', hint: 'Bonne réception !' }
  ];

  return { buildPayload, createDemoOrder, findOrder, getOrder, listDeviceOrders, generateOrderNumber, STATUSES, isDemo };
})();
