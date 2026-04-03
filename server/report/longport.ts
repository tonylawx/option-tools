import type { SecuritySearchResult } from "@/server/report/types";

type LongportModule = typeof import("longport");
type QuoteContext = Awaited<ReturnType<LongportModule["QuoteContext"]["new"]>>;

const NO_ADJUST = 0;
const DAY_PERIOD = 14;
const INTRADAY_SESSION = 0;
const US_MARKET = 1;
const OVERNIGHT_CATEGORY = 0;

let longportModulePromise: Promise<LongportModule> | null = null;
let quoteContextPromise: Promise<QuoteContext> | null = null;
let usSecuritiesPromise: Promise<SecuritySearchResult[]> | null = null;

async function getLongportModule() {
  if (!longportModulePromise) {
    longportModulePromise = import("longport");
  }

  return longportModulePromise;
}

export async function getQuoteContext() {
  if (!quoteContextPromise) {
    quoteContextPromise = (async () => {
      const { Config, QuoteContext } = await getLongportModule();
      const config = Config.fromEnv();
      return QuoteContext.new(config);
    })();
  }

  return quoteContextPromise;
}

export async function getDailyCandles(symbol: string, count: number) {
  const ctx = await getQuoteContext();
  return ctx.candlesticks(
    symbol,
    DAY_PERIOD,
    count,
    NO_ADJUST,
    INTRADAY_SESSION
  );
}

export async function getQuotes(symbols: string[]) {
  const ctx = await getQuoteContext();
  return ctx.quote(symbols);
}

export async function getUSSecurities() {
  if (!usSecuritiesPromise) {
    usSecuritiesPromise = (async () => {
      const ctx = await getQuoteContext();
      const securities = await ctx.securityList(US_MARKET, OVERNIGHT_CATEGORY);

      return securities.map((security) => ({
        symbol: security.symbol,
        name: security.nameEn || security.nameCn || security.nameHk || security.symbol
      }));
    })();
  }

  return usSecuritiesPromise;
}

export async function searchUSSecurities(query: string) {
  const normalized = query.trim().toLowerCase();
  const securities = await getUSSecurities();

  if (!normalized) {
    return securities;
  }

  const symbolStarts = securities.filter((security) =>
    security.symbol.toLowerCase().startsWith(normalized)
  );
  const nameStarts = securities.filter((security) =>
    security.name.toLowerCase().startsWith(normalized) &&
    !symbolStarts.some((item) => item.symbol === security.symbol)
  );
  const contains = securities.filter((security) => {
    const haystack = `${security.symbol} ${security.name}`.toLowerCase();

    return (
      haystack.includes(normalized) &&
      !symbolStarts.some((item) => item.symbol === security.symbol) &&
      !nameStarts.some((item) => item.symbol === security.symbol)
    );
  });

  return [...symbolStarts, ...nameStarts, ...contains];
}
