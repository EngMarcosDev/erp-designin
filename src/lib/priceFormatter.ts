export const sanitizePrice = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim().replace(",", "."));
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return fallback;
};

export const formatPrice = (
  value: unknown,
  options: { includeCurrency?: boolean; decimals?: number } = {},
): string => {
  const { includeCurrency = true, decimals = 2 } = options;
  const normalized = sanitizePrice(value, 0).toFixed(decimals).replace(".", ",");
  return includeCurrency ? `R$ ${normalized}` : normalized;
};

export const calculateTotal = (items: Array<{ price: unknown; quantity: unknown }>): number => {
  return items.reduce((acc, item) => {
    const price = sanitizePrice(item.price, 0);
    const quantity =
      typeof item.quantity === "number" && Number.isFinite(item.quantity)
        ? Math.max(0, item.quantity)
        : 0;
    return acc + price * quantity;
  }, 0);
};
