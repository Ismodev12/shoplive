/**
 * Animations : écran d'ouverture et séquence de paiement.
 */
window.SL = window.SL || {};

SL.anim = (() => {
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Écran d'ouverture : l'animation est en CSS ; on le retire du DOM à la fin (clic = passer). */
  function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const remove = () => splash.remove();
    let returning = false;
    try { returning = Boolean(sessionStorage.getItem('shoplive.pendingConfirmation') || sessionStorage.getItem('shoplive.contactSent')); } catch { /* indisponible */ }
    if (reduced() || returning) { remove(); return; }
    document.body.classList.add('is-locked');
    const done = () => {
      document.body.classList.remove('is-locked');
      setTimeout(remove, 400);
    };
    const timer = setTimeout(done, 2950);
    splash.addEventListener('click', () => {
      clearTimeout(timer);
      splash.classList.add('is-done');
      done();
    }, { once: true });
  }

  /**
   * Séquence visuelle de paiement (~3 s).
   * `task` est une promesse optionnelle (ex. confirmation Stripe) attendue avant le succès.
   */
  async function paymentSequence(amountText, task) {
    const overlay = document.getElementById('pay-overlay');
    const title = document.getElementById('pay-overlay-title');
    const bar = document.getElementById('pay-overlay-bar');
    const speed = reduced() ? 0.3 : 1;

    const setStep = (text, pct) => {
      title.textContent = text;
      title.classList.remove('swap'); void title.offsetWidth; title.classList.add('swap');
      bar.style.width = `${pct}%`;
    };

    overlay.classList.remove('is-success');
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = '';
    document.getElementById('pay-overlay-amount').textContent = amountText || '';
    overlay.hidden = false;
    document.body.classList.add('is-locked');

    setStep('Connexion sécurisée…', 30);
    await wait(950 * speed);
    setStep('Vérification du paiement…', 70);
    await Promise.all([wait(1000 * speed), task || Promise.resolve()]);
    overlay.classList.add('is-success');
    setStep('⏳ En cours de validation', 100);
    await wait(1100 * speed);
  }

  function closePayment() {
    document.getElementById('pay-overlay').hidden = true;
    document.body.classList.remove('is-locked');
  }

  return { initSplash, paymentSequence, closePayment };
})();

// Démarre au plus tôt (script en defer : le DOM est prêt)
SL.anim.initSplash();
