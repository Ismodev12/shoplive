/**
 * PaymentService — couche d'intégration Stripe (cartes bancaires uniquement).
 *
 * Cette version frontend ne collecte AUCUNE donnée de carte : le conteneur
 * #payment-element affiche un aperçu inerte. Pour activer Stripe :
 *
 *  ▸ Stripe Elements (paiement intégré)
 *    1. <script src="https://js.stripe.com/v3/"></script> dans index.html
 *    2. SL.config.stripe = { enabled: true, publishableKey: 'pk_…', mode: 'elements' }
 *    3. Le backend crée un PaymentIntent (montant calculé côté serveur,
 *       payment_method_types: ['card']) et renvoie son client_secret.
 *    4. mount(clientSecret) puis confirm() ci-dessous.
 *
 *  ▸ Stripe Checkout (redirection)
 *    Le backend crée une Checkout Session et renvoie son URL :
 *    window.location.assign(session.url).
 */
window.SL = window.SL || {};

SL.paymentService = (() => {
  const { stripe: cfg } = SL.config;
  let stripe = null;
  let elements = null;

  const isEnabled = () => Boolean(cfg.enabled && cfg.publishableKey && window.Stripe);

  /** Monte le Payment Element Stripe dans #payment-element. */
  function mount(clientSecret, selector = '#payment-element') {
    if (!isEnabled()) return false;
    stripe = stripe || window.Stripe(cfg.publishableKey);
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'flat',
        variables: {
          colorPrimary: '#173D32', colorText: '#242824', colorBackground: '#FFFFFF',
          fontFamily: 'Manrope, Inter, system-ui, sans-serif', borderRadius: '12px'
        }
      }
    });
    const container = document.querySelector(selector);
    container.innerHTML = '';
    elements.create('payment', { paymentMethodOrder: ['card'], wallets: { applePay: 'never', googlePay: 'never' } }).mount(container);
    return true;
  }

  /** Confirme le paiement (3-D Secure géré par Stripe). */
  async function confirm(returnUrl) {
    if (!stripe || !elements) throw new Error('Stripe n\'est pas initialisé.');
    return stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
  }

  return {
    isEnabled,
    mount,
    confirm,
    /** 'demo' tant que Stripe n'est pas configuré. */
    mode: () => (isEnabled() ? cfg.mode : 'demo')
  };
})();
