/**
 * Vue Commande — montant saisi par le client, référence libre (contrôlée côté vendeur),
 * calcul automatique du récapitulatif, livraison, validation et soumission.
 */
window.SL = window.SL || {};

SL.checkoutView = (() => {
  const { $, $$, icon, setFieldError, setLoading } = SL.dom;
  const { format, validation: v, pricing, productService, orderService, paymentService } = SL;

  const state = {
    countries: [],
    methods: [],
    shippingId: 'relay',
    touched: new Set(),
    submitting: false,
    lastSubtotal: null
  };

  let form, onConfirmed;
  /** Champs par id (les attributs name sont ceux envoyés à Netlify). */
  const field = (id) => document.getElementById(id);

  /* =========================================================
     Règles des champs
     ========================================================= */
  const country = () => $('#country').value || 'FR';
  const zone = () => (state.countries.find((c) => c.code === country()) || { zone: 'FR' }).zone;

  const FIELD_RULES = {
    amount: v.amount,
    orderRef: v.orderRef,
    tiktok: v.tiktok,
    firstName: v.name('Le prénom'),
    lastName: v.name('Le nom'),
    email: v.email,
    phone: (val) => v.phone(val, country()),
    address1: v.address,
    postalCode: (val) => v.postalCode(val, country()),
    city: v.name('La ville'),
    country: v.required('Le pays')
  };

  const validateField = (name, show = true) => {
    const input = field(name);
    const message = FIELD_RULES[name](input.value);
    if (show) setFieldError(input, message);
    return message;
  };

  /* =========================================================
     Commande saisie
     ========================================================= */
  /** Montant en centimes si valide, sinon 0. */
  const amountCents = () => (v.amount(field('amount').value) ? 0 : v.parseAmount(field('amount').value));

  const orderInfo = () => ({
    amount: amountCents(),
    reference: field('orderRef').value.trim(),
    article: field('article').value.trim(),
    tiktok: field('tiktok').value.trim().replace(/^@/, '')
  });

  /** Lignes au format attendu par le calcul des totaux. */
  const pricedLines = () => {
    const o = orderInfo();
    return o.amount ? [{ reference: o.reference, name: o.article, unitPrice: o.amount, quantity: 1 }] : [];
  };

  /* =========================================================
     Livraison
     ========================================================= */
  function renderShipping() {
    const container = $('#shipping-options');
    const subtotal = amountCents();
    const focusedId = document.activeElement?.closest?.('#shipping-options') ? document.activeElement.id : null;

    const current = state.methods.find((m) => m.id === state.shippingId);
    if (current && !pricing.shippingQuote(current, zone(), subtotal).available) state.shippingId = null;

    container.innerHTML = state.methods.map((m) => {
      const q = pricing.shippingQuote(m, zone(), subtotal);
      const checked = m.id === state.shippingId;
      const priceHtml = !q.available ? '<span class="option__text"><span>Indisponible</span></span>'
        : q.free ? `<s>${format.price(q.base)}</s><span class="free">Offerte</span>`
        : format.price(q.price);
      return `
        <label class="option${checked ? ' is-checked' : ''}${!q.available ? ' is-disabled' : ''}" for="ship-${m.id}">
          <input type="radio" name="shipping" id="ship-${m.id}" value="${m.id}" ${checked ? 'checked' : ''} ${!q.available ? 'disabled' : ''}>
          <span class="option__icon" aria-hidden="true">${icon(m.icon)}</span>
          <span class="option__text"><strong>${format.escape(m.name)}</strong><span>${format.escape(m.description)}</span></span>
          <span class="option__price">${priceHtml}</span>
        </label>`;
    }).join('');

    if (focusedId) document.getElementById(focusedId)?.focus();
  }

  function bindShipping() {
    const container = $('#shipping-options');
    container.addEventListener('change', (e) => {
      if (e.target.name !== 'shipping') return;
      state.shippingId = e.target.value;
      $('#shipping-error').hidden = true;
      renderShipping();
      renderTotals();
    });
  }

  function validateShipping(show) {
    const method = state.methods.find((m) => m.id === state.shippingId);
    let message = '';
    if (!method) message = 'Choisissez un mode de livraison.';
    if (show) {
      const el = $('#shipping-error');
      el.textContent = message;
      el.hidden = !message;
    }
    return message;
  }

  /* =========================================================
     Récapitulatif — recalculé à chaque frappe
     ========================================================= */
  function renderTotals() {
    const o = orderInfo();
    const lines = pricedLines();
    const method = state.methods.find((m) => m.id === state.shippingId) || null;
    const t = pricing.computeTotals({ lines, shippingMethod: method, zone: zone() });

    if (state.lastSubtotal !== t.subtotal) { state.lastSubtotal = t.subtotal; renderShipping(); }

    $('#summary-lines').innerHTML = o.amount ? `
      <li class="sline">
        <span class="sline__ref">${format.escape(o.reference || 'Réf. ?')}</span>
        <span class="sline__qty">${format.escape(o.article || 'Commande live')}${o.tiktok ? ` <span>· @${format.escape(o.tiktok)}</span>` : ''}</span>
        <span class="sline__total">${format.price(o.amount)}</span>
      </li>` : '';
    $('#summary-empty').hidden = Boolean(o.amount);

    $('#sum-subtotal').textContent = format.price(t.subtotal);
    $('#sum-shipping').textContent = !lines.length ? '—'
      : t.shipping === null ? 'À choisir' : t.shipping === 0 ? 'Offerte' : format.price(t.shipping);

    const totalText = format.price(t.total);
    const totalEl = $('#sum-total');
    if (totalEl.textContent !== totalText) {
      totalEl.textContent = totalText;
      totalEl.classList.remove('bump'); void totalEl.offsetWidth; totalEl.classList.add('bump');
    }
    $$('[data-submit-amount]').forEach((el) => { el.textContent = lines.length ? totalText : ''; });

    const fs = $('#free-ship');
    if (lines.length && method && t.freeFrom !== null) {
      fs.hidden = false;
      $('#free-ship-text').innerHTML = t.shippingFree
        ? '<strong>Livraison offerte</strong> sur votre commande.'
        : `Plus que <strong>${format.price(t.freeShippingRemaining)}</strong> pour profiter de la livraison offerte.`;
      $('#free-ship-bar').style.width = `${Math.min(100, (t.subtotal / t.freeFrom) * 100)}%`;
    } else {
      fs.hidden = true;
    }
    return t;
  }

  /* =========================================================
     Validation globale et soumission
     ========================================================= */
  function validateTerms(show) {
    const input = $('#terms');
    const message = input.checked ? '' : 'Veuillez accepter les conditions générales de vente.';
    if (show) {
      const el = $('#terms-error');
      el.textContent = message;
      el.hidden = !message;
      if (message) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'terms-error'); }
      else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
    }
    return message;
  }

  function validateAll() {
    const errors = [];
    Object.keys(FIELD_RULES).forEach((name) => {
      state.touched.add(name);
      if (validateField(name)) errors.push(field(name));
    });
    if (validateShipping(true)) errors.push($('#shipping-options input:not(:disabled)') || $('#shipping-options'));
    if (validateTerms(true)) errors.push($('#terms'));
    return errors;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;

    const alert = $('#form-alert');
    const errors = validateAll();
    if (errors.length) {
      alert.textContent = `${errors.length === 1 ? 'Un élément est à corriger' : `${errors.length} éléments sont à corriger`} avant de confirmer votre commande.`;
      alert.hidden = false;
      const first = errors[0];
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => first.focus({ preventScroll: true }), 350);
      return;
    }
    alert.hidden = true;

    const btns = $$('[data-submit]');
    state.submitting = true;
    btns.forEach((b) => setLoading(b, true, 'Préparation…'));

    try {
      const method = state.methods.find((m) => m.id === state.shippingId);
      const totals = renderTotals();
      const data = Object.fromEntries(['firstName', 'lastName', 'email', 'phone', 'address1', 'address2', 'postalCode', 'city', 'country']
        .map((id) => [id, field(id).value]));
      const payload = orderService.buildPayload({
        order: orderInfo(),
        customer: data,
        address: data,
        shipping: { methodId: method.id }
      });

      if (paymentService.mode() !== 'demo') {
        // Production : POST payload → backend → clientSecret (Elements) ou URL (Checkout).
        throw new Error('Intégration Stripe à raccorder au backend (voir js/services/payment-service.js).');
      }

      // Animation de paiement (en production : passer la confirmation Stripe en 2e argument)
      await SL.anim.paymentSequence(`${format.price(totals.total)} · Carte bancaire`);
      const order = orderService.createDemoOrder(payload, {
        lines: pricedLines(),
        totals,
        shippingName: method.name
      });

      // Envoi Netlify Forms en arrière-plan (hors file://), SANS recharger la page :
      // la soumission part en AJAX, puis on enchaîne en douceur sur la page de remerciement
      // (plus de form.submit() qui coupait l'animation par un rechargement complet).
      // Les champs de carte n'ont pas d'attribut name : ils ne sont jamais envoyés.
      if (location.protocol !== 'file:') {
        fillHiddenFields(order, method);
        try {
          await fetch(form.getAttribute('action') || '/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(new FormData(form)).toString()
          });
        } catch { /* hors ligne ou serveur local : la commande reste accessible via le suivi */ }
      }

      resetForm();
      onConfirmed(order);
      setTimeout(SL.anim.closePayment, 50);
    } catch (err) {
      console.error(err);
      SL.anim.closePayment();
      alert.textContent = 'Une erreur est survenue lors de la préparation de la commande. Réessayez dans un instant.';
      alert.hidden = false;
    } finally {
      state.submitting = false;
      btns.forEach((b) => setLoading(b, false));
    }
  }

  /** Renseigne les champs cachés envoyés à Netlify (valeurs calculées). */
  function fillHiddenFields(order, method) {
    const d = new Date(order.createdAt);
    const pad = (n) => String(n).padStart(2, '0');
    const set = (name, value) => { form.querySelector(`input[type="hidden"][name="${name}"]`).value = value; };
    set('numero_commande', order.orderNumber);
    set('date_commande', `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
    set('mode_livraison', method.name);
    set('frais_livraison', order.totals.shipping === 0 ? 'Offerte' : format.price(order.totals.shipping));
    set('total_a_payer', format.price(order.totals.total));
  }

  function resetForm() {
    form.reset();
    $('#country').value = 'FR';
    state.touched.clear();
    state.shippingId = 'relay';
    state.lastSubtotal = null;
    Object.keys(FIELD_RULES).forEach((name) => setFieldError(field(name), ''));
    $$('.is-valid', form).forEach((el) => el.classList.remove('is-valid'));
    $('#terms-error').hidden = true;
    renderTotals();
  }

  /* =========================================================
     Initialisation
     ========================================================= */
  function bindFields() {
    Object.keys(FIELD_RULES).forEach((name) => {
      const input = field(name);
      input.addEventListener('blur', () => {
        if (input.value.trim() || state.touched.has(name)) {
          state.touched.add(name);
          validateField(name);
        }
      });
      input.addEventListener('input', () => {
        if (state.touched.has(name)) validateField(name);
      });
    });

    // Le récapitulatif suit la saisie en temps réel
    ['amount', 'orderRef', 'article', 'tiktok'].forEach((name) =>
      field(name).addEventListener('input', renderTotals));

    // Montant : n'accepte que chiffres et séparateur, puis se formate (49,9 → 49,90)
    const amount = field('amount');
    amount.addEventListener('input', () => {
      const clean = amount.value.replace(/[^\d.,]/g, '');
      if (clean !== amount.value) amount.value = clean;
    });
    amount.addEventListener('blur', () => {
      const cents = v.parseAmount(amount.value);
      if (cents !== null) amount.value = (cents / 100).toFixed(2).replace('.', ',');
      renderTotals();
    });

    $('#country').addEventListener('change', () => {
      ['phone', 'postalCode'].forEach((n) => { if (state.touched.has(n)) validateField(n); });
      state.lastSubtotal = null;
      renderTotals();
      validateShipping(!$('#shipping-error').hidden);
    });

    $('#terms').addEventListener('change', () => { if (!$('#terms-error').hidden) validateTerms(true); });
  }

  async function init({ onConfirmed: cb }) {
    form = $('#checkout-form');
    onConfirmed = cb;

    const [countries, methods] = await Promise.all([
      productService.getCountries(),
      productService.getShippingMethods()
    ]);
    state.countries = countries;
    state.methods = methods;

    $('#country').innerHTML = countries.map((c) => `<option value="${c.code}">${format.escape(c.name)}</option>`).join('');

    bindShipping();
    bindFields();
    form.addEventListener('submit', onSubmit);
    renderTotals();
  }

  return { init };
})();
