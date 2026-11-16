/**
 * Petits utilitaires DOM partagés par les vues.
 */
window.SL = window.SL || {};

SL.dom = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  /** Icônes en couleur (fichiers image dans assets/icons/color/) ; les autres restent des pictos SVG. */
  const COLOR_ICONS = new Set(["circle-alert","circle-check","clock","copy","credit-card","facebook","info","instagram","lock","mail","package","phone","search","shield-check","shopping-bag","store","tiktok","truck","user"]);
  const icon = (name, cls = '') => COLOR_ICONS.has(name)
    ? `<img class="icon icon--img ${cls}" src="assets/icons/color/${name}.svg" alt="" width="18" height="18" aria-hidden="true">`
    : `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const debounce = (fn, ms) => {
    let t;
    const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    d.cancel = () => clearTimeout(t);
    return d;
  };

  /** Affiche / efface l'erreur d'un champ (accessibilité : aria-invalid + aria-describedby). */
  function setFieldError(input, message) {
    const field = input.closest('.field') || input.closest('.check')?.parentElement;
    const id = `err-${input.id}`;
    let el = document.getElementById(id);
    if (message) {
      if (!el) {
        el = document.createElement('p');
        el.className = 'field-error';
        el.id = id;
        const anchor = input.closest('.control') || input.closest('.check') || input;
        anchor.insertAdjacentElement('afterend', el);
      }
      el.textContent = message;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
      input.classList.remove('is-valid');
    } else {
      el?.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      if (input.value && input.type !== 'checkbox' && field) input.classList.add('is-valid');
    }
  }

  /** État de chargement d'un bouton. */
  function setLoading(btn, loading, label) {
    const labelEl = btn.querySelector('.btn__label');
    if (loading) {
      btn.dataset.label = labelEl.textContent;
      if (label) labelEl.textContent = label;
      btn.classList.add('is-loading');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
    } else {
      if (btn.dataset.label) labelEl.textContent = btn.dataset.label;
      btn.classList.remove('is-loading');
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
    }
  }

  /** Délai d'interface (transition visuelle uniquement, aucune requête). */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let toastTimer;
  function toast(message, iconName = 'circle-check') {
    const el = $('#toast');
    el.innerHTML = `${icon(iconName)}<span>${SL.format.escape(message)}</span>`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  return { $, $$, icon, debounce, setFieldError, setLoading, wait, toast };
})();
