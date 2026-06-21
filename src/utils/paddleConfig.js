const VALID_PADDLE_ENVIRONMENTS = new Set(['sandbox', 'production']);

export const getPaddleEnvironment = () => {
  const rawEnvironment = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';

  const environment = String(rawEnvironment).trim().toLowerCase();
  return VALID_PADDLE_ENVIRONMENTS.has(environment) ? environment : 'sandbox';
};

export const getPaddleClientToken = () => {
  return import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '';
};

export const isMissingPaddlePrice = (priceId) => {
  return !priceId || priceId === 'pri_REPLACE_ME';
};
