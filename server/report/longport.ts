import {
  Config,
  NaiveDate,
  QuoteContext,
} from "longport";
import type { SecuritySearchResult } from "@/server/report/types";

const NO_ADJUST = 0;
const DAY_PERIOD = 14;
const INTRADAY_SESSION = 0;
const US_MARKET = 1;
const OVERNIGHT_CATEGORY = 0;

let quoteContextPromise: Promise<QuoteContext> | null = null;
let usSecuritiesPromise: Promise<SecuritySearchResult[]> | null = null;

export async function getQuoteContext() {
  if (!quoteContextPromise) {
    const config = Config.fromEnv();
    quoteContextPromise = QuoteContext.new(config);
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

export async function getOptionExpiryDates(symbol: string) {
  const ctx = await getQuoteContext();
  return ctx.optionChainExpiryDateList(symbol);
}

export async function getOptionChainByDate(symbol: string, expiryDate: unknown) {
  const ctx = await getQuoteContext();
  const [year, month, day] = String(expiryDate).split("-").map(Number);
  return ctx.optionChainInfoByDate(symbol, new NaiveDate(year, month, day));
}

export async function getOptionQuotes(symbols: string[]) {
  const ctx = await getQuoteContext();
  return ctx.optionQuote(symbols);
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
