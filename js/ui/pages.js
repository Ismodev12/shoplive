/**
 * Vues secondaires : confirmation, suivi, FAQ, contact, pages légales.
 */
window.SL = window.SL || {};

SL.pages = (() => {
  const { $, icon, setFieldError, setLoading, wait, toast } = SL.dom;
  const { format, validation: v, orderService, config, mockData } = SL;

  /* =========================================================
     Confirmation de commande
     ========================================================= */
  function renderConfirmation(order) {
    const el = $('#confirm');
    if (!order) {
      el.innerHTML = `<p class="notice notice--info">Aucune commande à afficher.</p>
        <div class="confirm__actions"><a class="btn btn--dark" href="#/">Passer une commande</a></div>`;
      return;
    }
    // Textes de la page de remerciement (simulation : à relier au statut réel du paiement Stripe)
    const date = new Date(order.createdAt);
    const pad = (n) => String(n).padStart(2, '0');
    const dateText = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const reference = order.reference || order.lines[0]?.reference || '—';

    el.innerHTML = `
      <div class="thanks">
        <div class="thanks__badge">${icon('hourglass')}</div>
        <h1 id="confirm-title">Merci pour votre commande&nbsp;!</h1>
        <p class="thanks__lead">Votre commande a bien été envoyée. ⏳ Veuillez patienter quelques minutes et valider l'opération dans l'application de votre banque.</p>

        <dl class="thanks__details">
          <div><dt>Référence de commande</dt><dd><strong>${format.escape(reference)}</strong></dd></div>
          <div><dt>N° de suivi</dt><dd><button type="button" class="thanks__copy" id="copy-order" title="Copier le numéro"><span id="order-number">${format.escape(order.orderNumber)}</span></button></dd></div>
          <div><dt>Date</dt><dd>${dateText}</dd></div>
          <div><dt>Transporteur</dt><dd>${format.escape(order.shipping.name)}</dd></div>
          <div class="thanks__total"><dt>Total payé</dt><dd><strong>${format.price(order.totals.total)}</strong></dd></div>
        </dl>

        <div class="thanks__actions">
          <a class="btn btn--primary btn--lg" href="#/suivi?n=${encodeURIComponent(order.orderNumber)}&e=${encodeURIComponent(order.email)}">${icon('package', 'btn__icon')} Suivre mes commandes</a>
          <a class="btn btn--outline btn--lg" href="#/">Retour à la boutique</a>
        </div>
      </div>`;

    $('#copy-order').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(order.orderNumber);
        toast('Numéro de commande copié');
      } catch {
        const range = document.createRange();
        range.selectNodeContents($('#order-number'));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        toast('Sélectionné : copiez avec Ctrl + C', 'info');
      }
    });
  }

  /* =========================================================
     Suivi de commande
     ========================================================= */
  function renderTrackResult(order) {
    const box = $('#track-result');
    if (!order) {
      box.innerHTML = `<div class="notice notice--error"><span>Aucune commande ne correspond à ce numéro et à cette adresse e-mail. Vérifiez votre saisie ou <a href="#/contact">contactez-nous</a>.</span></div>`;
      return;
    }
    const status = orderService.STATUSES.find((s) => s.id === order.status);

    box.innerHTML = `
      <div class="panel track">
        <div class="track__head">
          <div><h2>${format.escape(order.orderNumber)}</h2><p>Passée le ${format.date(order.createdAt)}</p></div>
          <span class="status-pill">${format.escape(status ? status.label : order.status)}</span>
        </div>
        <div class="track__items">
          <ul class="summary__lines">
            ${order.lines.map((l) => `
              <li class="sline">
                <span class="sline__ref">${format.escape(l.reference)}</span>
                <span class="sline__qty">${format.escape(l.name || 'Commande live')}${l.quantity > 1 ? ` <span>× ${l.quantity}</span>` : ''}</span>
                <span class="sline__total">${format.price(l.unitPrice * l.quantity)}</span>
              </li>`).join('')}
          </ul>
          <div class="track__total"><span>Total</span><span>${format.price(order.totals.total)}</span></div>
        </div>
      </div>`;
  }

  function initTracking() {
    const form = $('#track-form');
    const num = $('#trackNumber');
    const mail = $('#trackEmail');

    num.addEventListener('input', () => { num.value = num.value.toUpperCase(); if (num.hasAttribute('aria-invalid')) setFieldError(num, v.orderNumber(num.value)); });
    mail.addEventListener('input', () => { if (mail.hasAttribute('aria-invalid')) setFieldError(mail, v.email(mail.value)); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errN = v.orderNumber(num.value);
      const errM = v.email(mail.value);
      setFieldError(num, errN);
      setFieldError(mail, errM);
      if (errN || errM) { (errN ? num : mail).focus(); return; }

      const btn = $('#track-btn');
      setLoading(btn, true, 'Recherche…');
      $('#track-result').innerHTML = '';
      await wait(400);
      const order = await orderService.findOrder(num.value, mail.value);
      setLoading(btn, false);
      renderTrackResult(order);
      $('#track-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /** Pré-remplissage depuis la confirmation : #/suivi?n=…&e=… */
  /** Liste de toutes les commandes passées depuis cet appareil ; un clic affiche le détail. */
  async function renderTodayOrders() {
    const orders = await orderService.listDeviceOrders();
    const list = $('#today-list');
    $('#today-empty').hidden = orders.length > 0;
    $('#today-count').textContent = orders.length ? String(orders.length) : '';
    list.closest('.orders__wrap').hidden = orders.length === 0;
    const pad = (n) => String(n).padStart(2, '0');
    const dateTime = (iso) => {
      const d = new Date(iso);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    list.innerHTML = orders.map((o, i) => {
      const status = orderService.STATUSES.find((s) => s.id === o.status);
      const ref = o.reference || o.lines[0]?.reference || '—';
      return `
        <tr data-index="${i}" tabindex="0" title="Voir le détail de la commande">
          <td data-label="Référence"><strong>${format.escape(ref)}</strong></td>
          <td data-label="Date">${dateTime(o.createdAt)}</td>
          <td data-label="Prix total">${format.price(o.totals.total)}</td>
          <td data-label="Transporteur">${format.escape(o.shipping.name)}</td>
          <td data-label="Statut"><span class="status-pill">${format.escape(status ? status.short : o.status)}</span></td>
        </tr>`;
    }).join('');

    const open = (row) => {
      list.querySelectorAll('tr').forEach((r) => r.classList.toggle('is-active', r === row));
      const order = orders[Number(row.dataset.index)];
      $('#trackNumber').value = order.orderNumber;
      $('#trackEmail').value = order.email;
      renderTrackResult(order);
      $('#track-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    list.onclick = (e) => { const row = e.target.closest('tr[data-index]'); if (row) open(row); };
    list.onkeydown = (e) => {
      const row = e.target.closest('tr[data-index]');
      if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(row); }
    };
  }

  function prefillTracking(params) {
    renderTodayOrders();
    if (!params.get('n')) return;
    $('#trackNumber').value = params.get('n');
    $('#trackEmail').value = params.get('e') || '';
    $('#track-form').requestSubmit();
  }

  /* =========================================================
     FAQ
     ========================================================= */
  function initFaq() {
    $('#faq-list').innerHTML = mockData.faq.map((item, i) => `
      <details${i === 0 ? ' open' : ''}>
        <summary>${format.escape(item.q)}<span class="faq__plus" aria-hidden="true"></span></summary>
        <div class="faq__answer"><p>${format.escape(item.a)}</p></div>
      </details>`).join('');
  }

  /* =========================================================
     Contact
     ========================================================= */
  function initContact() {
    const { email, phone, hours } = config.contact;
    $('#contact-email').textContent = email;
    $('#contact-email').href = `mailto:${email}`;
    $('#contact-phone').textContent = phone;
    $('#contact-phone').href = `tel:${phone.replace(/\s/g, '')}`;
    $('#contact-hours').textContent = hours;

    const form = $('#contact-form');
    const rules = {
      cName: v.name('Le nom'),
      cEmail: v.email,
      cSubject: v.required('Le sujet'),
      cMessage: v.message
    };
    // Champs par id (les attributs name sont ceux envoyés à Netlify)
    const el = (id) => document.getElementById(id);
    const check = (id) => setFieldError(el(id), rules[id](el(id).value));
    Object.keys(rules).forEach((id) => {
      const input = el(id);
      input.addEventListener('blur', () => { if (input.value.trim()) check(id); });
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => { if (input.hasAttribute('aria-invalid')) check(id); });
    });

    form.addEventListener('submit', (e) => {
      const invalid = Object.keys(rules).filter((id) => {
        const msg = rules[id](el(id).value);
        setFieldError(el(id), msg);
        return msg;
      });
      const result = $('#contact-result');
      if (invalid.length) { e.preventDefault(); el(invalid[0]).focus(); result.innerHTML = ''; return; }

      // Formulaire valide : envoi HTML natif vers Netlify Forms (aucun preventDefault)
      if (location.protocol !== 'file:') {
        try { sessionStorage.setItem('shoplive.contactSent', '1'); } catch { /* indisponible */ }
        setLoading($('#contact-btn'), true, 'Envoi…');
        return;
      }

      // Ouverture locale du fichier (file://) : pas de serveur, on passe par la messagerie
      e.preventDefault();
      const subject = encodeURIComponent(`[SHOP LIVE] ${el('cSubject').value}${el('cOrder').value ? ' — ' + el('cOrder').value : ''}`);
      const body = encodeURIComponent(`${el('cMessage').value}\n\n${el('cName').value}\n${el('cEmail').value}`);
      const href = `mailto:${email}?subject=${subject}&body=${body}`;
      result.innerHTML = `<p class="notice notice--info">Votre messagerie va s'ouvrir avec votre message prérempli. Si rien ne s'ouvre, écrivez-nous à <a href="${format.escape(href)}">${format.escape(email)}</a>.</p>`;
      window.location.href = href;
    });
  }

  /** Message affiché au retour de l'envoi Netlify du formulaire de contact. */
  function showContactSent() {
    $('#contact-result').innerHTML = '<p class="notice notice--info"><strong>Merci, votre message a bien été envoyé.</strong> Notre équipe vous répond dans les meilleurs délais.</p>';
    $('#contact-result').scrollIntoView({ block: 'center' });
  }

  /* =========================================================
     Pages légales (modèles à compléter)
     ========================================================= */
  const todo = (t) => `<mark>${t}</mark>`;
  const LEGAL = {
    'mentions-legales': {
      title: 'Mentions légales',
      body: `
        <h2>Éditeur du site</h2>
        <p>SHOP LIVE — ${todo('forme juridique, capital social')}<br>Siège social : ${todo('adresse')}<br>RCS : ${todo('ville et numéro')} · TVA intracommunautaire : ${todo('numéro')}<br>Contact : ${config.contact.email}</p>
        <h2>Directeur de la publication</h2>
        <p>${todo('Nom et prénom')}</p>
        <h2>Hébergement</h2>
        <p>${todo('Nom, adresse et téléphone de l\'hébergeur')}</p>
        <h2>Propriété intellectuelle</h2>
        <p>L'ensemble des contenus de ce site (textes, logo, éléments graphiques) est la propriété exclusive de SHOP LIVE, sauf mention contraire. Toute reproduction sans autorisation est interdite.</p>`
    },
    cgv: {
      title: 'Conditions générales de vente',
      body: `
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent les ventes conclues sur le site SHOP LIVE à partir des références présentées lors des ventes en direct.</p>
        <h2>2. Prix</h2>
        <p>Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison précisés avant validation. Le prix appliqué est celui associé à la référence au moment de la commande.</p>
        <h2>3. Paiement</h2>
        <p>Le paiement s'effectue exclusivement par carte bancaire (CB, Visa, Mastercard, American Express) via un prestataire de paiement sécurisé. La commande est définitive après acceptation du paiement.</p>
        <h2>4. Livraison</h2>
        <p>Les délais indiqués sont donnés à titre indicatif à compter de la validation du paiement. ${todo('Préciser transporteurs et zones')}</p>
        <h2>5. Droit de rétractation</h2>
        <p>Conformément à l'article L221-18 du Code de la consommation, vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation.</p>
        <h2>6. Litiges</h2>
        <p>${todo('Médiateur de la consommation et juridiction compétente')}</p>`
    },
    confidentialite: {
      title: 'Politique de confidentialité',
      body: `
        <h2>Données collectées</h2>
        <p>Pour traiter votre commande, nous collectons : nom, prénom, adresse e-mail, téléphone et adresse de livraison.</p>
        <h2>Données bancaires</h2>
        <p>Vos données de carte sont saisies directement auprès de notre prestataire de paiement certifié PCI-DSS. SHOP LIVE n'y a jamais accès et ne les conserve pas.</p>
        <h2>Finalités et durée</h2>
        <ul><li>Gestion des commandes et de la livraison</li><li>Service client</li><li>Obligations comptables et légales</li></ul>
        <p>Durée de conservation : ${todo('à préciser')}.</p>
        <h2>Vos droits</h2>
        <p>Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour l'exercer : ${config.contact.email}. Vous pouvez également saisir la CNIL.</p>`
    }
  };

  function renderLegal(slug) {
    const page = LEGAL[slug];
    $('#legal').innerHTML = `
      <h1 id="legal-title">${page.title}</h1>
      ${page.body}`;
    document.title = `${page.title} — SHOP LIVE`;
  }

  return {
    renderConfirmation,
    initTracking,
    prefillTracking,
    showContactSent,
    renderTodayOrders,
    initFaq,
    initContact,
    renderLegal,
    legalSlugs: Object.keys(LEGAL)
  };
})();
