/**
 * Returns a function that formats a numeric price for display.
 * Whole amounts drop the decimals (18 → "$18"), others keep two ("$18.50").
 * An invalid currency code falls back to "18.50 XYZ" instead of throwing.
 */
export function createPriceFormatter({ locale = 'en-US', currency = 'USD' } = {}) {
  const formatters = new Map();

  function formatterFor(whole) {
    if (!formatters.has(whole)) {
      const digits = whole ? 0 : 2;
      let formatter;
      try {
        formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });
      } catch {
        const plain = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });
        formatter = { format: (value) => `${plain.format(value)} ${currency}`.trim() };
      }
      formatters.set(whole, formatter);
    }
    return formatters.get(whole);
  }

  return function formatPrice(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    return formatterFor(Number.isInteger(value)).format(value);
  };
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
