import { getLatestCboeClose } from "@/server/report/cboe";
import { getNextEarningsDate } from "@/server/report/earnings-calendar";
import { getMacroEvents, type MacroEvent } from "@/server/report/macro-calendar";
import {
  getDailyCandles,
  getLatestFiling,
  getQuotes,
  getTradingDays
} from "@/server/report/longbridge";
import type { SellPutReport } from "@/server/report/types";
import {
  actionLabelFromStars,
  earningsEventLabel,
  eventShortLabel,
  formatCountdown,
  formatFiscalQuarterEarningsTitle,
  formatMarketDate,
  Locale,
  reportKicker,
  supportCommentary,
  translateEventName,
  translateSeverity,
  translateTrendLabel
} from "@/shared/i18n";

type CandleLike = {
  close?: unknown;
  low?: unknown;
  high?: unknown;
};

type QuoteLike = {
  lastDone?: unknown;
  lastPrice?: unknown;
  timestamp?: unknown;
};

type SeverityKey = "routine" | "event_window" | "blackout";

function num(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  if (value && typeof value === "object" && "toString" in value) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function sma(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pctDistance(base: number, ref: number) {
  return ((base - ref) / ref) * 100;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function buildStarLine(stars: number) {
  return `${"★".repeat(stars)}${"☆".repeat(5 - stars)}`;
}

function starScoreFromTotal(total: number) {
  if (total >= 80) return 5;
  if (total >= 65) return 4;
  if (total >= 50) return 3;
  if (total >= 35) return 2;
  return 1;
}

function buildVci(vix: number, vixHistory: number[], vvix: number, vix3m: number) {
  const vixLow = Math.min(...vixHistory);
  const vixHigh = Math.max(...vixHistory);
  const ivr = vixHigh > vixLow ? ((vix - vixLow) / (vixHigh - vixLow)) * 100 : 0;
  const termStructure = vix3m - vix;

  const ivrProgress = clamp(ivr);
  const vixProgress =
    vix <= 15 ? clamp((vix / 15) * 60) :
    vix <= 25 ? clamp(100 - Math.abs(vix - 20) * 4) :
    vix <= 35 ? clamp(60 - (vix - 25) * 6) :
    0;
  const vvixProgress =
    vvix <= 80 ? 100 :
    vvix <= 90 ? clamp(100 - (vvix - 80) * 2) :
    vvix <= 110 ? clamp(80 - (vvix - 90) * 2.5) :
    vvix <= 140 ? clamp(30 - (vvix - 110)) :
    0;
  const tsProgress = termStructure >= 0 ? clamp(60 + termStructure * 8) : clamp(60 + termStructure * 18);

  const weightedScore =
    ivrProgress * 0.36 +
    vixProgress * 0.39 +
    vvixProgress * 0.17 +
    tsProgress * 0.08;

  const vci = weightedScore / 100;
  const conclusion = vci > 0.6 ? "适合开仓" : vci < 0.4 ? "回避" : "观望";

  return {
    vci,
    conclusion,
    items: [
      { label: "IVR", value: ivr.toFixed(1), progress: ivrProgress },
      { label: "VIX", value: vix.toFixed(1), progress: vixProgress },
      { label: "VVIX", value: vvix.toFixed(1), progress: vvixProgress },
      { label: "TS", value: termStructure.toFixed(1), progress: tsProgress }
    ]
  };
}

function scoreFromDistance(distance: number) {
  if (distance >= 2) return 20;
  if (distance >= 0) return 14;
  if (distance >= -3) return 6;
  return 0;
}

function startOfDay(date: Date) {
  return new Date(date.toISOString().slice(0, 10));
}

function marketIsoDate(date: Date) {
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric"
  }).format(date);
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    month: "2-digit"
  }).format(date);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    day: "2-digit"
  }).format(date);

  return `${year}-${month}-${day}`;
}

function currentMarketDate(date = new Date()) {
  return new Date(`${marketIsoDate(date)}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function diffInDays(fromDate: Date, toDate: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((startOfDay(toDate).getTime() - startOfDay(fromDate).getTime()) / dayMs);
}

function buildWindowSet(tradingDays: string[], eventDate: string, before: number, after: number) {
  const index = tradingDays.indexOf(eventDate);
  const dates = new Set<string>();

  if (index === -1) {
    return dates;
  }

  for (let offset = -before; offset <= after; offset += 1) {
    const tradingDate = tradingDays[index + offset];
    if (tradingDate) {
      dates.add(tradingDate);
    }
  }

  return dates;
}

function buildLeadingWindowSet(tradingDays: string[], eventDate: string, daysBefore: number) {
  const index = tradingDays.indexOf(eventDate);
  const dates = new Set<string>();

  if (index === -1) {
    return dates;
  }

  for (let offset = 1; offset <= daysBefore; offset += 1) {
    const tradingDate = tradingDays[index - offset];
    if (tradingDate) {
      dates.add(tradingDate);
    }
  }

  return dates;
}

function severityFromDays(days: number | null, blackout: boolean): SeverityKey {
  if (blackout) {
    return "blackout";
  }

  if (days !== null && days <= 7) {
    return "event_window";
  }

  return "routine";
}

function scoreFromEventDays(days: number | null, blackout: boolean) {
  if (blackout) return 0;
  if (days === null) return 20;
  if (days <= 3) return 8;
  if (days <= 7) return 14;
  return 20;
}

function nearestUpcomingEvent(events: MacroEvent[], referenceIsoDate: string) {
  return events.find((event) => event.date >= referenceIsoDate) ?? events[events.length - 1] ?? null;
}

export async function buildSellPutReport(symbol: string, locale: Locale = "zh"): Promise<SellPutReport> {
  const [quotes, symbolCandles, vixQuotes, vixCandles, vvixLatest, vix3mLatest, latestFiling, macroEvents, earningsSnapshot] =
    await Promise.all([
      getQuotes([symbol]),
      getDailyCandles(symbol, 140),
      getQuotes([".VIX.US"]),
      getDailyCandles(".VIX.US", 252),
      getLatestCboeClose("https://cdn.cboe.com/api/global/us_indices/daily_prices/VVIX_History.csv"),
      getLatestCboeClose("https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX3M_History.csv"),
      getLatestFiling(symbol),
      getMacroEvents(),
      getNextEarningsDate(symbol)
    ]);

  const mainQuote = (quotes as QuoteLike[])[0];
  const vixQuote = (vixQuotes as QuoteLike[])[0];
  if (!mainQuote) {
    throw new Error(`No quote returned for ${symbol}`);
  }
  if (!vixQuote) {
    throw new Error("No quote returned for .VIX.US");
  }

  const marketTimestamp = asDate(mainQuote.timestamp);
  if (!marketTimestamp) {
    throw new Error("Missing quote timestamp");
  }

  const reportTimestamp = new Date();
  const currentDate = currentMarketDate(reportTimestamp);
  const currentIsoDate = toIsoDate(currentDate);
  const severityMap = {
    routine: "常规观察",
    event_window: "事件窗口",
    blackout: "黑窗期"
  } as const;
  const macro = nearestUpcomingEvent(macroEvents, currentIsoDate);
  if (!macro) {
    throw new Error("No macro events available");
  }

  const tradingDays = await getTradingDays(toIsoDate(addDays(currentDate, -10)), toIsoDate(addDays(currentDate, 45)));

  const macroBlackoutDates = macroEvents.flatMap((event) => {
    if (event.kind === "fomc") {
      return [...buildWindowSet(tradingDays, event.date, 2, 2)];
    }

    return [...buildLeadingWindowSet(tradingDays, event.date, 1)];
  });
  const macroBlackout = new Set(macroBlackoutDates).has(currentIsoDate);
  const macroDays = diffInDays(currentDate, new Date(macro.date));
  const macroSeverityKey = severityFromDays(macroDays, macroBlackout);
  const macroScore = scoreFromEventDays(macroDays, macroBlackout);

  const earningsDate = earningsSnapshot?.date ?? null;
  const earningsQuarterLabel = formatFiscalQuarterEarningsTitle(earningsSnapshot?.fiscalQuarterLabel ?? null, locale);
  const earningsIsoDate = earningsDate ? toIsoDate(earningsDate) : null;
  const earningsBlackout =
    earningsIsoDate ? buildLeadingWindowSet(tradingDays, earningsIsoDate, 3).has(currentIsoDate) : false;
  const earningsDays = earningsDate ? diffInDays(currentDate, earningsDate) : null;
  const earningsSeverityKey = severityFromDays(earningsDays, earningsBlackout);
  const earningsScore = scoreFromEventDays(earningsDays, earningsBlackout);
  const importantEventItems = [
    ...macroEvents
      .filter((event) => {
        const days = diffInDays(currentDate, new Date(event.date));
        return days >= 0 && days <= 14;
      })
      .map((event) => {
        const days = diffInDays(currentDate, new Date(event.date));
        const blackout =
          event.kind === "fomc"
            ? buildWindowSet(tradingDays, event.date, 2, 2).has(currentIsoDate)
            : buildLeadingWindowSet(tradingDays, event.date, 1).has(currentIsoDate);
        const severityKey = severityFromDays(days, blackout);

        return {
          label: eventShortLabel(event.kind, locale),
          name: translateEventName(event.name, locale),
          dateLabel: event.date.slice(5).replace("-", "/"),
          countdownLabel: formatCountdown(days, locale),
          severity: translateSeverity(severityMap[severityKey], locale),
          impactsScore: blackout
        };
      }),
    ...(earningsIsoDate && earningsDays !== null && earningsDays >= 0 && earningsDays <= 14
      ? [{
          label: earningsEventLabel(locale),
          name: earningsQuarterLabel,
          dateLabel: earningsIsoDate.slice(5).replace("-", "/"),
          countdownLabel: formatCountdown(earningsDays, locale),
          severity: translateSeverity(severityMap[earningsSeverityKey], locale),
          impactsScore: earningsBlackout
        }]
      : [])
  ].sort((left, right) => left.dateLabel.localeCompare(right.dateLabel));

  const underlyingLast = num(mainQuote.lastDone ?? mainQuote.lastPrice);
  const vixLast = num(vixQuote.lastDone ?? vixQuote.lastPrice);
  const vvixLast = vvixLatest.close;
  const vix3mLast = vix3mLatest.close;
  const symbolSeries = (symbolCandles as CandleLike[]).map((candle) => num(candle.close)).filter(Boolean);
  const vixSeries = (vixCandles as CandleLike[]).map((candle) => num(candle.close)).filter(Boolean);
  if (symbolSeries.length < 120) {
    throw new Error("Not enough candlestick data for MA120");
  }
  if (vixSeries.length < 200) {
    throw new Error("Not enough candlestick data for VIX IVR");
  }

  const ma120 = sma(symbolSeries.slice(-120));
  const distanceToMa120 = pctDistance(underlyingLast, ma120);
  const trendScore = scoreFromDistance(distanceToMa120);
  const trendLabel = distanceToMa120 >= 0 ? "均线上方" : "均线下方";

  const supportBuckets = [20, 60, 120].map((days) => {
    const slice = (symbolCandles as CandleLike[]).slice(-days);
    const low = Math.min(...slice.map((candle) => num(candle.low, underlyingLast)));

    return {
      label: `${days}d`,
      low,
      distancePercent: pctDistance(underlyingLast, low)
    };
  });

  const keySupport = Math.min(...supportBuckets.map((bucket) => bucket.low));
  const supportDistance = pctDistance(underlyingLast, keySupport);
  const supportScore = Math.max(0, Math.min(20, 20 - Math.abs(supportDistance - 8)));
  const supportRangeHigh = Math.max(...(symbolCandles as CandleLike[]).slice(-120).map((candle) => num(candle.high, underlyingLast)));
  const supportRangeLow = Math.min(...(symbolCandles as CandleLike[]).slice(-120).map((candle) => num(candle.low, underlyingLast)));
  const fibLevels = [0.236, 0.382, 0.5, 0.618].map((ratio) => {
    const price = supportRangeLow + (supportRangeHigh - supportRangeLow) * ratio;
    return {
      label: `${(ratio * 100).toFixed(1)}%`,
      price,
      distancePercent: pctDistance(underlyingLast, price)
    };
  });

  const vciBlock = buildVci(vixLast, vixSeries, vvixLast, vix3mLast);
  const eventScore = Math.min(macroScore, earningsScore);
  const total = vciBlock.vci * 40 + trendScore + supportScore + eventScore;
  const cappedForBlackout = macroBlackout || earningsBlackout;
  const starScore = Math.min(starScoreFromTotal(total), cappedForBlackout ? 2 : 5);

  return {
    symbol,
    header: {
      kicker: reportKicker(locale),
      dateLine: formatMarketDate(reportTimestamp, locale),
      starLine: buildStarLine(starScore)
    },
    summary: {
      actionLabel: actionLabelFromStars(starScore, locale)
    },
    score: {
      starScore,
      vci: vciBlock.vci,
      trend: trendScore
    },
    vciItems: vciBlock.items,
    vciConclusion: `${vciBlock.vci.toFixed(3)} ${vciBlock.conclusion}`,
    market: {
      symbolLabel: symbol,
      symbolLast: underlyingLast,
      ma120,
      distanceToMa120,
      trendLabel: translateTrendLabel(trendLabel, locale)
    },
    support: {
      underlyingLast,
      keySupport,
      keySupportDistance: supportDistance,
      commentary: supportCommentary(supportDistance, locale),
      windows: supportBuckets,
      fibLevels
    },
    event: {
      name: translateEventName(macro.name, locale),
      dateLabel: macro.date.slice(5).replace("-", "/"),
      countdownLabel: formatCountdown(macroDays, locale),
      severity: translateSeverity(severityMap[macroSeverityKey], locale),
      items: importantEventItems
    },
    earnings: {
      title: earningsQuarterLabel,
      nextDateLabel: earningsIsoDate ? earningsIsoDate.slice(5).replace("-", "/") : (locale === "en" ? "Unavailable" : "暂不可用"),
      countdownLabel: earningsDays !== null ? formatCountdown(earningsDays, locale) : (locale === "en" ? "Unavailable" : "暂不可用"),
      severity: translateSeverity(severityMap[earningsSeverityKey], locale),
      latestFilingTitle: latestFiling?.title ?? (locale === "en" ? "Unavailable" : "暂不可用"),
      latestFilingDateLabel: latestFiling?.publishedAt
        ? latestFiling.publishedAt.toISOString().slice(5, 10).replace("-", "/")
        : (locale === "en" ? "N/A" : "暂无")
    }
  };
}
