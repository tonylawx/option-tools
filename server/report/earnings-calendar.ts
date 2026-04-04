type CachedEarnings = {
  date: Date | null;
  expiresAt: number;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, CachedEarnings>();

function extractYahooEarningsDate(html: string) {
  const normalized = html.replace(/\\"/g, "\"");

  if (!/Earnings Date/i.test(normalized)) {
    return null;
  }

  const trendMatch = normalized.match(/"earningsTrend":\{[\s\S]{0,6000}?"earningsDate":\[\{"raw":(\d+),"fmt":"(\d{4}-\d{2}-\d{2})"/);
  const fallbackMatch = normalized.match(/"earningsDate":\[\{"raw":(\d+),"fmt":"(\d{4}-\d{2}-\d{2})"/);
  const match = trendMatch ?? fallbackMatch;

  if (!match) {
    return null;
  }

  const timestamp = Number(match[1]);
  if (Number.isFinite(timestamp)) {
    return new Date(timestamp * 1000);
  }

  const parsed = new Date(match[2]);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getNextEarningsDate(symbol: string) {
  const ticker = symbol.replace(/\.US$/, "").toUpperCase();
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && cached.expiresAt > now) {
    return cached.date;
  }

  const response = await fetch(`https://finance.yahoo.com/quote/${ticker}`, {
    headers: {
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to load earnings page for ${ticker}: ${response.status}`);
  }

  const html = await response.text();
  const date = extractYahooEarningsDate(html);

  cache.set(ticker, {
    date,
    expiresAt: now + CACHE_TTL_MS
  });

  return date;
}
