export type PaymentTotalsInput = {
  amount: number | null | undefined;
  discount?: number | null | undefined;
  additionalPrice?: number | null | undefined;
  taxPercent?: number | null | undefined;
};

export type PaymentTotals = {
  baseAmount: number;
  discount: number;
  additionalPrice: number;
  taxableAmount: number;
  taxPercent: number;
  taxValue: number;
  total: number;
};

/**
 * Normalizes payment amounts so every consumer (invoice, WA message, midtrans)
 * uses the same calculation rules.
 */
export function calculatePaymentTotals({
  amount,
  discount = 0,
  additionalPrice = 0,
  taxPercent = 0,
}: PaymentTotalsInput): PaymentTotals {
  const safeAmount = Number.isFinite(Number(amount))
    ? Math.max(Math.floor(Number(amount)), 0)
    : 0;
  const safeDiscount = Number.isFinite(Number(discount))
    ? Math.max(Math.floor(Number(discount)), 0)
    : 0;
  const safeAdditionalPrice = Number.isFinite(Number(additionalPrice))
    ? Math.max(Math.floor(Number(additionalPrice)), 0)
    : 0;
  const safeTaxPercent = Number.isFinite(Number(taxPercent))
    ? Math.max(Number(taxPercent), 0)
    : 0;

  const taxableAmount = Math.max(
    safeAmount - safeDiscount + safeAdditionalPrice,
    0
  );
  const taxValue = Math.round((taxableAmount * safeTaxPercent) / 100);
  const total = taxableAmount + taxValue;

  return {
    baseAmount: safeAmount,
    discount: safeDiscount,
    additionalPrice: safeAdditionalPrice,
    taxableAmount,
    taxPercent: safeTaxPercent,
    taxValue,
    total,
  };
}
