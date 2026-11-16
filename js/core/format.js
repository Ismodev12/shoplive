/**
 * Utilitaires de formatage et d'échappement.
 */
window.SL = window.SL || {};

SL.format = (() => {
  const money = new Intl.NumberFormat(SL.config.locale, { style: 'currency', currency: SL.config.currency });
  const date = new Intl.DateTimeFormat(SL.config.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const dateTime = new Intl.DateTimeFormat(SL.config.locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  /** Centimes (entier) → « 39,00 € » */
  const price = (cents) => money.format((Number(cents) || 0) / 100);

  /** Normalise une référence saisie : majuscules, sans espaces ni tirets superflus. */
  const reference = (value) => String(value || '').toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '').slice(0, 16);

  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  return {
    price,
    reference,
    escape,
    date: (iso) => date.format(new Date(iso)),
    dateTime: (iso) => dateTime.format(new Date(iso))
  };
})();
