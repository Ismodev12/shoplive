/**
 * ProductService — unique point d'accès aux prix, stocks et options de livraison.
 *
 * L'interface ne connaît que ces méthodes asynchrones. Pour brancher le backend :
 *   1. SL.config.dataSource = 'api' et SL.config.api.baseUrl = '…'
 *   2. adapter `fromApi()` au format de réponse de votre serveur.
 * Aucune autre partie du code n'a besoin de changer.
 */
window.SL = window.SL || {};

SL.productService = (() => {
  const { config, mockData } = SL;

  /* ---------- Source : données de démonstration (lecture locale, aucune requête réseau) ---------- */
  const mockSource = {
    async getProduct(reference) {
      const product = mockData.catalog.find((p) => p.reference === reference);
      return product ? { ...product } : null;
    },
    async getCountries() { return mockData.countries.map((c) => ({ ...c })); },
    async getShippingMethods() { return mockData.shippingMethods.map((m) => ({ ...m, prices: { ...m.prices } })); },
    demoReferences() { return mockData.catalog.filter((p) => p.stock > 0).map((p) => p.reference); }
  };

  /* ---------- Source : backend (prêt, désactivé tant que dataSource !== 'api') ---------- */
  const apiUrl = (path, params = {}) =>
    config.api.baseUrl + path.replace(/:(\w+)/g, (_, k) => encodeURIComponent(params[k]));

  const fromApi = (json) => ({
    reference: json.reference,
    name: json.name,
    unitPrice: json.unitPrice, // centimes, fourni par le serveur
    stock: json.stock
  });

  const apiSource = {
    async getProduct(reference) {
      const res = await fetch(apiUrl(config.api.endpoints.product, { reference }), { headers: { Accept: 'application/json' } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return fromApi(await res.json());
    },
    // À implémenter selon votre API ; en attendant, mêmes valeurs que la démo.
    getCountries: mockSource.getCountries,
    getShippingMethods: mockSource.getShippingMethods,
    demoReferences: () => []
  };

  const source = config.dataSource === 'api' ? apiSource : mockSource;
  const cache = new Map();

  /**
   * Résout une référence.
   * @returns {Promise<{status:'found'|'not_found'|'out_of_stock'|'error', product?:Object}>}
   */
  async function lookup(rawReference) {
    const reference = SL.format.reference(rawReference);
    if (!reference) return { status: 'not_found' };
    try {
      if (!cache.has(reference)) cache.set(reference, await source.getProduct(reference));
      const product = cache.get(reference);
      if (!product) return { status: 'not_found' };
      if (product.stock <= 0) return { status: 'out_of_stock', product };
      return { status: 'found', product };
    } catch (err) {
      cache.delete(reference);
      console.error('[ProductService]', err);
      return { status: 'error' };
    }
  }

  return {
    lookup,
    getCountries: () => source.getCountries(),
    getShippingMethods: () => source.getShippingMethods(),
    demoReferences: () => source.demoReferences(),
    isDemo: config.dataSource !== 'api'
  };
})();
