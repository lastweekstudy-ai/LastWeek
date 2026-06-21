import { PLANS } from '../config/planLimits';

export const DEFAULT_PRE_REG_DISPLAY_PRICE = 4;
export const DEFAULT_PRE_REG_DISPLAY_VALUE = (PLANS.plus?.price || 9) * 12;

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const formatMoney = (value) => {
  const numeric = toPositiveNumber(value, 0);
  return `$${Number.isInteger(numeric) ? numeric.toFixed(0) : numeric.toFixed(2)}`;
};

export const getPreRegPricing = (settings = {}) => {
  const price = toPositiveNumber(
    settings?.preRegDisplayPrice ?? import.meta.env.VITE_PRE_REG_DISPLAY_PRICE,
    DEFAULT_PRE_REG_DISPLAY_PRICE
  );
  const value = toPositiveNumber(
    settings?.preRegDisplayValue ?? import.meta.env.VITE_PRE_REG_DISPLAY_VALUE,
    DEFAULT_PRE_REG_DISPLAY_VALUE
  );

  return {
    price,
    value,
    priceLabel: formatMoney(price),
    valueLabel: formatMoney(value),
  };
};
