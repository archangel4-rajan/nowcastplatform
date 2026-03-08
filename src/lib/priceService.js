// BTC Price Service — fetches from CoinGecko with caching

let cachedPrice = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

export async function fetchBTCPrice() {
  const now = Date.now();
  if (cachedPrice && now - cacheTimestamp < CACHE_TTL) {
    return cachedPrice;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    if (!response.ok) throw new Error('CoinGecko API error');
    const data = await response.json();
    const price = data?.bitcoin?.usd;
    if (price) {
      cachedPrice = price;
      cacheTimestamp = now;
    }
    return cachedPrice;
  } catch (err) {
    // Return cached price if available, otherwise null
    return cachedPrice || null;
  }
}

export function clearPriceCache() {
  cachedPrice = null;
  cacheTimestamp = 0;
}
