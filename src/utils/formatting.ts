const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD'
});

export const formatCurrency = (value: number | string | null | undefined) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  const normalized = Number.isFinite(parsed) ? (parsed as number) : 0;
  return currencyFormatter.format(normalized);
};
