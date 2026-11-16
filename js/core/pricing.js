/**
 * Calcul des montants — fonctions pures, en centimes.
 * Ce calcul sert UNIQUEMENT à l'affichage. Le montant réellement débité
 * doit être recalculé par le backend à partir des références (jamais transmis par le client).
 */
window.SL = window.SL || {};

SL.pricing = (() => {
  /** Prix d'un mode de livraison pour une zone, avant franchise. `null` si indisponible. */
  const shippingBasePrice = (method, zone) => {
    if (!method) return null;
    const p = method.prices[zone];
    return Number.isInteger(p) ? p : null;
  };

  /**
   * @param {Object} input
   * @param {Array<{unitPrice:number, quantity:number}>} input.lines  lignes résolues uniquement
   * @param {Object|null} input.shippingMethod
   * @param {string} input.zone
   */
  const computeTotals = ({ lines, shippingMethod, zone }) => {
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

    // Pas de frais de port tant que la commande est vide
    const base = itemCount > 0 ? shippingBasePrice(shippingMethod, zone) : null;
    const freeFrom = shippingMethod ? shippingMethod.freeFrom : null;
    const isFree = base !== null && freeFrom !== null && subtotal >= freeFrom;
    const shipping = base === null ? null : (isFree ? 0 : base);

    return {
      subtotal,
      itemCount,
      shipping,                    // null = aucun mode choisi / indisponible
      shippingBase: base,
      shippingFree: isFree,
      freeFrom,
      freeShippingRemaining: freeFrom !== null && !isFree ? Math.max(0, freeFrom - subtotal) : 0,
      total: subtotal + (shipping || 0)
    };
  };

  /** Prix affiché pour chaque option, compte tenu du sous-total courant. */
  const shippingQuote = (method, zone, subtotal) => {
    const base = shippingBasePrice(method, zone);
    if (base === null) return { available: false };
    const free = method.freeFrom !== null && subtotal >= method.freeFrom;
    return { available: true, base, price: free ? 0 : base, free };
  };

  return { computeTotals, shippingQuote };
})();
