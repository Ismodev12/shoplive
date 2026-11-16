/**
 * SHOP LIVE — point d'entrée : routeur par hash, navigation, pied de page.
 *
 * Routes : #/ (commande) · #/confirmation · #/suivi · #/faq · #/contact
 *          #/mentions-legales · #/cgv · #/confidentialite
 */
(() => {
  const { $, $$, icon } = SL.dom;
  const { pages, config } = SL;

  const TITLES = {
    commande: 'Passer commande',
    confirmation: 'Merci pour votre commande',
    suivi: 'Suivre ma commande',
    faq: 'Questions fréquentes',
    contact: 'Contact'
  };

  let lastOrder = null;

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { path: path || 'commande', params: new URLSearchParams(query) };
  }

  function show(viewName) {
    $$('.view').forEach((v) => { v.hidden = v.dataset.view !== viewName; });
  }

  function route() {
    let { path, params } = parseHash();
    const isLegal = pages.legalSlugs.includes(path);
    if (!isLegal && !TITLES[path]) path = 'commande';

    if (isLegal) {
      pages.renderLegal(path);
      show('legal');
    } else {
      if (path === 'confirmation') pages.renderConfirmation(lastOrder);
      if (path === 'suivi') pages.prefillTracking(params);
      show(path);
      document.title = `${TITLES[path]} — SHOP LIVE`;
    }

    // Lien actif
    $$('[data-route]').forEach((a) => {
      if (a.dataset.route === path) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    $('#main').focus({ preventScroll: true });
  }

  /* Pied de page */
  $('#footer-hours').textContent = `Vous pouvez joindre notre service client ${config.contact.hours.charAt(0).toLowerCase()}${config.contact.hours.slice(1)}.`;
  $('#socials').innerHTML = config.socials
    .filter((s) => s.url)
    .map((s) => `<li><a href="${SL.format.escape(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${SL.format.escape(s.name)}">${icon(s.icon)}</a></li>`)
    .join('');

  /* Initialisation des vues */
  pages.initTracking();
  pages.initFaq();
  pages.initContact();
  SL.checkoutView.init({
    onConfirmed(order) {
      lastOrder = order;
      location.hash = '#/confirmation';
    }
  });

  // Retour après l'envoi Netlify du formulaire de commande : on affiche le remerciement
  let pending = null;
  try { pending = sessionStorage.getItem('shoplive.pendingConfirmation'); sessionStorage.removeItem('shoplive.pendingConfirmation'); } catch { /* indisponible */ }
  if (pending) {
    lastOrder = SL.orderService.getOrder(pending);
    if (lastOrder) history.replaceState(null, '', location.pathname + '#/confirmation');
  }
  // Retour après l'envoi Netlify du formulaire de contact
  let contactSent = false;
  try { contactSent = sessionStorage.getItem('shoplive.contactSent') === '1'; sessionStorage.removeItem('shoplive.contactSent'); } catch { /* indisponible */ }
  if (contactSent) history.replaceState(null, '', location.pathname + '#/contact');

  window.addEventListener('hashchange', route);
  route();
  if (contactSent) pages.showContactSent();
})();
