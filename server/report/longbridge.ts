import { pathToFileURL } from "node:url";
import path from "node:path";
import type { SecuritySearchResult } from "@/server/report/types";

type LongbridgeModule = typeof import("longbridge");
type QuoteContext = Awaited<ReturnType<LongbridgeModule["QuoteContext"]["new"]>>;
type HttpClient = InstanceType<LongbridgeModule["HttpClient"]>;

export type FinanceCalendarType = "macrodata" | "report" | "financial" | "dividend" | "ipo" | "closed";

export type FinanceCalendarInfo = {
  content?: string;
  counter_id?: string;
  counter_name?: string;
  date?: string;
  datetime?: string;
  ext?: {
    financial_report?: {
      market_time?: string;
      period?: string;
      period_type?: string;
    };
  };
  id?: string;
  market?: string;
  star?: number;
  type?: FinanceCalendarType;
};

export type FinanceCalendarDay = {
  count?: number;
  date: string;
  infos?: FinanceCalendarInfo[];
};

const NO_ADJUST = 0;
const DAY_PERIOD = 14;
const INTRADAY_SESSION = 0;
const US_MARKET = 1;
const OVERNIGHT_CATEGORY = 0;

let longbridgeModulePromise: Promise<LongbridgeModule> | null = null;
let quoteContextPromise: Promise<QuoteContext> | null = null;
let httpClientPromise: Promise<HttpClient> | null = null;
let usSecuritiesPromise: Promise<SecuritySearchResult[]> | null = null;
let lastGoodUSSecurities: SecuritySearchResult[] | null = null;

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureLongbridgeEnv() {
  process.env.LONGBRIDGE_APP_KEY ??= process.env.LONGPORT_APP_KEY;
  process.env.LONGBRIDGE_APP_SECRET ??= process.env.LONGPORT_APP_SECRET;
  process.env.LONGBRIDGE_ACCESS_TOKEN ??= process.env.LONGPORT_ACCESS_TOKEN;
  process.env.LONGBRIDGE_LANGUAGE ??= process.env.LONGPORT_LANGUAGE;
}

async function getLongbridgeModule() {
  if (!longbridgeModulePromise) {
    longbridgeModulePromise = (async () => {
      try {
        return await import("longbridge");
      } catch {
        const fallbacks = [
          path.resolve(process.cwd(), "node_modules/.bun/node_modules/longbridge/index.js"),
          path.resolve(process.cwd(), "node_modules/.bun/longbridge@4.0.5/node_modules/longbridge/index.js")
        ];

        for (const fallbackPath of fallbacks) {
          try {
            return await import(pathToFileURL(fallbackPath).href);
          } catch {
            // Try next fallback path.
          }
        }

        throw new Error("Unable to resolve longbridge module");
      }
    })();
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
    })().catch((error) => {
      quoteContextPromise = null;
      throw error;
    });
  }

  return quoteContextPromise;
}

async function getHttpClient() {
  if (!httpClientPromise) {
    httpClientPromise = (async () => {
      ensureLongbridgeEnv();
      const { HttpClient } = await getLongbridgeModule();
      return HttpClient.fromApikeyEnv();
    })().catch((error) => {
      httpClientPromise = null;
      throw error;
    });
  }

  return httpClientPromise;
}

async function withRetry<T>(task: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(250 * attempt);
      }
    }
  }

  throw lastError;
}

function buildQuery(params: Record<string, string | number | boolean | string[] | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, item);
      }
      continue;
    }

    search.append(key, String(value));
  }

  return search.toString();
}

function asCalendarDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function symbolToCounterIdCandidates(symbol: string) {
  const trimmed = symbol.trim().toUpperCase();
  const parts = trimmed.split(".");

  if (parts.length < 2) {
    return [trimmed];
  }

  const market = parts.at(-1)!;
  const code = parts.slice(0, -1).join(".");

  if (code.startsWith(".")) {
    return [`IX/${market}/${code.slice(1)}`];
  }

  if (market === "US") {
    return [`ETF/${market}/${code}`, `ST/${market}/${code}`];
  }

  return [`ST/${market}/${code}`];
}

export async function getFinanceCalendar(params: {
  date: string;
  dateEnd: string;
  count?: number;
  offset?: number;
  next?: boolean;
  types: FinanceCalendarType[];
  counterIds?: string[];
  markets?: string[];
  star?: string[];
}) {
  const client = await getHttpClient();
  const path = `/v1/quote/finance_calendar?${buildQuery({
    date: params.date,
    date_end: params.dateEnd,
    count: params.count ?? 200,
    offset: params.offset ?? 0,
    next: params.next ?? true,
    "types[]": params.types,
    "counter_ids[]": params.counterIds,
    "markets[]": params.markets,
    "star[]": params.star
  })}`;

  return client.request("get", path) as Promise<{
    date: string;
    list: FinanceCalendarDay[];
    next_date?: string;
    result?: Record<string, unknown>;
  }>;
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
      const securities = await withRetry(async () => {
        const ctx = await getQuoteContext();
        return ctx.securityList(US_MARKET, OVERNIGHT_CATEGORY);
      });

      const normalized = securities.map((security) => ({
        symbol: security.symbol,
        name: security.nameEn || security.nameCn || security.nameHk || security.symbol
      }));

      lastGoodUSSecurities = normalized;
      return normalized;
    })().catch((error) => {
      usSecuritiesPromise = null;
      if (lastGoodUSSecurities) {
        return lastGoodUSSecurities;
      }
      throw error;
    });
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
