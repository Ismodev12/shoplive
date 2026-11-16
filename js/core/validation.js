/**
 * Validation — fonctions pures, sans accès au DOM.
 * Chaque règle renvoie un message d'erreur (string) ou '' si la valeur est valide.
 * À dupliquer côté serveur : la validation client n'est qu'un confort d'utilisation.
 */
window.SL = window.SL || {};

SL.validation = (() => {
  const EMAIL_RE = /^[^\s@"'<>()[\],;:]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;
  const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]*$/u;

  /** Indicatifs et formats nationaux acceptés pour les pays livrés. */
  const PHONE_RULES = {
    FR: { dial: '33', national: /^0[1-9]\d{8}$/, intl: /^[1-9]\d{8}$/ },
    BE: { dial: '32', national: /^0\d{8,9}$/, intl: /^\d{8,9}$/ },
    LU: { dial: '352', national: /^\d{6,9}$/, intl: /^\d{6,9}$/ },
    DE: { dial: '49', national: /^0\d{6,13}$/, intl: /^\d{6,13}$/ },
    ES: { dial: '34', national: /^[6-9]\d{8}$/, intl: /^[6-9]\d{8}$/ },
    IT: { dial: '39', national: /^[03]\d{5,10}$/, intl: /^[03]\d{5,10}$/ },
    NL: { dial: '31', national: /^0\d{9}$/, intl: /^\d{9}$/ },
    PT: { dial: '351', national: /^[29]\d{8}$/, intl: /^[29]\d{8}$/ }
  };

  const POSTAL_RULES = {
    FR: { re: /^(?:0[1-9]|[1-8]\d|9[0-8])\d{3}$/, example: '75001' },
    BE: { re: /^[1-9]\d{3}$/, example: '1000' },
    LU: { re: /^(?:L-?)?\d{4}$/i, example: '1009' },
    DE: { re: /^\d{5}$/, example: '10115' },
    ES: { re: /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, example: '28001' },
    IT: { re: /^\d{5}$/, example: '00118' },
    NL: { re: /^[1-9]\d{3} ?[A-Z]{2}$/i, example: '1011 AB' },
    PT: { re: /^\d{4}-\d{3}$/, example: '1000-001' }
  };

  const trim = (v) => String(v ?? '').trim();

  const required = (label) => (value) => trim(value) ? '' : `${label} est obligatoire.`;

  const name = (label) => (value) => {
    const v = trim(value);
    if (!v) return `${label} est obligatoire.`;
    if (v.length < 2) return `${label} doit contenir au moins 2 caractères.`;
    if (!NAME_RE.test(v)) return `${label} contient des caractères non autorisés.`;
    return '';
  };

  const email = (value) => {
    const v = trim(value);
    if (!v) return 'L\'adresse e-mail est obligatoire.';
    if (!EMAIL_RE.test(v)) return 'Adresse e-mail invalide (ex. : nom@exemple.fr).';
    return '';
  };

  /** Téléphone : format national du pays de livraison, ou international (+XX…). */
  const phone = (value, countryCode = 'FR') => {
    const raw = trim(value);
    if (!raw) return 'Le numéro de téléphone est obligatoire.';
    if (!/^[+\d\s().-]+$/.test(raw)) return 'Le numéro ne doit contenir que des chiffres.';
    const digits = raw.replace(/[\s().-]/g, '');
    const rule = PHONE_RULES[countryCode];

    if (digits.startsWith('+') || digits.startsWith('00')) {
      const intl = digits.replace(/^(\+|00)/, '');
      if (rule && intl.startsWith(rule.dial) && rule.intl.test(intl.slice(rule.dial.length))) return '';
      // Autre indicatif : contrôle générique E.164
      if (!(rule && intl.startsWith(rule.dial)) && /^[1-9]\d{7,14}$/.test(intl)) return '';
      return 'Numéro de téléphone invalide.';
    }
    if (rule && rule.national.test(digits)) return '';
    return countryCode === 'FR'
      ? 'Numéro invalide (ex. : 06 12 34 56 78 ou +33 6 12 34 56 78).'
      : 'Numéro invalide : utilisez le format international (ex. : +32 470 12 34 56).';
  };

  const postalCode = (value, countryCode = 'FR') => {
    const v = trim(value);
    if (!v) return 'Le code postal est obligatoire.';
    const rule = POSTAL_RULES[countryCode];
    if (rule && !rule.re.test(v)) return `Code postal invalide (ex. : ${rule.example}).`;
    return '';
  };

  const address = (value) => {
    const v = trim(value);
    if (!v) return 'L\'adresse est obligatoire.';
    if (v.length < 5) return 'Adresse trop courte : précisez le numéro et la rue.';
    return '';
  };

  const message = (value) => {
    const v = trim(value);
    if (!v) return 'Le message est obligatoire.';
    if (v.length < 15) return 'Votre message est un peu court (15 caractères minimum).';
    return '';
  };

  const orderNumber = (value) => {
    const v = trim(value).toUpperCase();
    if (!v) return 'Le numéro de commande est obligatoire.';
    if (!/^SL-[A-Z0-9]{4,8}-[A-Z0-9]{4}$/.test(v)) return 'Format attendu : SL-XXXXXX-XXXX.';
    return '';
  };

  /** Montant saisi (« 49,90 », « 49.9 », « 49 ») → centimes entiers, ou null si illisible. */
  const parseAmount = (value) => {
    const v = trim(value).replace(/\s|€/g, '').replace(',', '.');
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(v)) return null;
    return Math.round(parseFloat(v) * 100);
  };

  const amount = (value) => {
    if (!trim(value)) return 'Le montant est obligatoire.';
    const cents = parseAmount(value);
    if (cents === null) return 'Montant invalide (ex. : 49,90).';
    if (cents < 100) return 'Le montant minimum est de 1,00 €.';
    if (cents > 1000000) return 'Le montant maximum est de 10 000 €.';
    return '';
  };

  /** Référence libre : la correspondance avec le montant est vérifiée par le vendeur. */
  const orderRef = (value) => {
    const v = trim(value);
    if (!v) return 'La référence de la commande est obligatoire.';
    return '';
  };

  const tiktok = (value) => {
    const v = trim(value).replace(/^@/, '');
    if (!v) return 'Le pseudo TikTok est obligatoire.';
    if (!/^[A-Za-z0-9._]{2,24}$/.test(v)) return 'Pseudo invalide : lettres, chiffres, points et _ uniquement.';
    return '';
  };

  return { required, name, email, phone, postalCode, address, message, orderNumber, amount, parseAmount, orderRef, tiktok, POSTAL_RULES };
})();
