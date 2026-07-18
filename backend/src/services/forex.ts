import { logger } from '../lib/logger';
const LOCAL_CURRENCY = 'EUR';

let ratesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export async function convertToLocal(
  amount: number,
  fromCurrency: string
): Promise<{ localAmount: number; localCurrency: string } | null> {
  if (!amount || !fromCurrency || fromCurrency === LOCAL_CURRENCY) return null;

  try {
    const rate = await getRate(fromCurrency, LOCAL_CURRENCY);
    if (!rate) return null;

    return {
      localAmount: Math.round(amount * rate * 100) / 100,
      localCurrency: LOCAL_CURRENCY,
    };
  } catch (err) {
    logger.warn({ err }, 'Forex conversion failed');
    return null;
  }
}

async function getRate(from: string, to: string): Promise<number | null> {
  const now = Date.now();

  if (ratesCache && now - ratesCache.timestamp < CACHE_TTL && ratesCache.rates[`${from}${to}`]) {
    return ratesCache.rates[`${from}${to}`];
  }

  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
  const res = await fetch(url, { redirect: 'follow' });

  if (!res.ok) {
    // Cache a rough estimate if API fails
    return getFallbackRate(from, to);
  }

  const data = await res.json() as { rates: Record<string, number> };
  const rate = data.rates?.[to];

  if (rate) {
    ratesCache = {
      rates: { ...(ratesCache?.rates || {}), [`${from}${to}`]: rate },
      timestamp: now,
    };
    return rate;
  }

  return getFallbackRate(from, to);
}

function getFallbackRate(from: string, to: string): number | null {
  // Rough estimates for common pairs (updated periodically)
  const fallbacks: Record<string, number> = {
    USD_EUR: 0.92,
    GBP_EUR: 1.17,
    CHF_EUR: 1.03,
    JPY_EUR: 0.0061,
    CAD_EUR: 0.67,
    AUD_EUR: 0.61,
  };

  return fallbacks[`${from}_${to}`] || null;
}
