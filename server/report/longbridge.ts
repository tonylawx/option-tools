import type { SecuritySearchResult } from "@/server/report/types";

type LongbridgeModule = typeof import("longbridge");
type QuoteContext = Awaited<ReturnType<LongbridgeModule["QuoteContext"]["new"]>>;

const NO_ADJUST = 0;
const DAY_PERIOD = 14;
const INTRADAY_SESSION = 0;
const US_MARKET = 1;
const OVERNIGHT_CATEGORY = 0;

let longbridgeModulePromise: Promise<LongbridgeModule> | null = null;
let quoteContextPromise: Promise<QuoteContext> | null = null;
let usSecuritiesPromise: Promise<SecuritySearchResult[]> | null = null;

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function ensureLongbridgeEnv() {
  process.env.LONGBRIDGE_APP_KEY ??= process.env.LONGPORT_APP_KEY;
  process.env.LONGBRIDGE_APP_SECRET ??= process.env.LONGPORT_APP_SECRET;
  process.env.LONGBRIDGE_ACCESS_TOKEN ??= process.env.LONGPORT_ACCESS_TOKEN;
  process.env.LONGBRIDGE_LANGUAGE ??= process.env.LONGPORT_LANGUAGE;
}

async function getLongbridgeModule() {
  if (!longbridgeModulePromise) {
    longbridgeModulePromise = import("longbridge");
  }

  return longbridgeModulePromise;
}

export async function getQuoteContext() {
  if (!quoteContextPromise) {
    quoteContextPromise = (async () => {
      ensureLongbridgeEnv();
      const { Config, QuoteContext } = await getLongbridgeModule();
      const config = Config.fromApikeyEnv();
      return QuoteContext.new(config);
    })();
  }

  return quoteContextPromise;
}

export async function getDailyCandles(symbol: string, count: number) {
  const ctx = await getQuoteContext();
  return ctx.candlesticks(symbol, DAY_PERIOD, count, NO_ADJUST, INTRADAY_SESSION);
}

export async function getQuotes(symbols: string[]) {
  const ctx = await getQuoteContext();
  return ctx.quote(symbols);
}

export async function getTradingDays(startDate: string, endDate: string) {
  const ctx = await getQuoteContext();
  const { NaiveDate } = await getLongbridgeModule();
  const allDays: string[] = [];

  for (let chunkStart = startDate; chunkStart <= endDate;) {
    const chunkEnd = addDays(chunkStart, 20) < endDate ? addDays(chunkStart, 20) : endDate;
    const [startYear, startMonth, startDay] = chunkStart.split("-").map(Number);
    const [endYear, endMonth, endDay] = chunkEnd.split("-").map(Number);
    const response = await ctx.tradingDays(
      US_MARKET,
      new NaiveDate(startYear, startMonth, startDay),
      new NaiveDate(endYear, endMonth, endDay)
    );

    allDays.push(...response.tradingDays.map((day) => day.toString()));
    chunkStart = addDays(chunkEnd, 1);
  }

  return [...new Set(allDays)];
}

export async function getLatestFiling(symbol: string) {
  const ctx = await getQuoteContext();
  const filings = await ctx.filings(symbol);
  return filings[0] ?? null;
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

  const symbolStarts = securities.filter((security) => security.symbol.toLowerCase().startsWith(normalized));
  const nameStarts = securities.filter(
    (security) =>
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
