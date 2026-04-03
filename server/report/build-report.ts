import { getFallbackReport } from "@/server/report/fallback";
import { getCboeSeries, getLatestCboeClose } from "@/server/report/cboe";
import { getNextMacroEvent } from "@/server/report/macro-calendar";
import {
  getDailyCandles,
  getQuotes
} from "@/server/report/longport";
import type { SellPutReport } from "@/server/report/types";

type CandleLike = {
  close?: unknown;
  low?: unknown;
  high?: unknown;
  timestamp?: unknown;
};

type QuoteLike = {
  symbol?: unknown;
  lastDone?: unknown;
  lastPrice?: unknown;
  timestamp?: unknown;
};

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

function formatMarketDate(date: Date) {
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
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long"
  }).format(date);

  return `${year}-${month}-${day} ${weekday}`;
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(date);
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

function actionLabelFromStars(stars: number) {
  if (stars >= 4) return "开仓";
  if (stars === 3) return "谨慎";
  if (stars === 2) return "回避";
  return "回避";
}

function buildVci(
  vix: number,
  vixHistory: number[],
  vvix: number,
  vix3m: number
) {
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

  let conclusion = "观望";
  if (vci > 0.6) conclusion = "适合开仓";
  else if (vci < 0.4) conclusion = "回避";

  return {
    vci,
    conclusion,
    items: [
      { label: "IVR", value: ivr.toFixed(1), progress: ivrProgress, weight: 0.36 },
      { label: "VIX", value: vix.toFixed(1), progress: vixProgress, weight: 0.39 },
      { label: "VVIX", value: vvix.toFixed(1), progress: vvixProgress, weight: 0.17 },
      { label: "TS", value: termStructure.toFixed(1), progress: tsProgress, weight: 0.08 }
    ]
  };
}

function scoreFromDistance(distance: number) {
  if (distance >= 2) return 20;
  if (distance >= 0) return 14;
  if (distance >= -3) return 6;
  return 0;
}

export async function buildSellPutReport(symbol: string): Promise<SellPutReport> {
  const fallback = getFallbackReport(symbol);
  const [quotes, symbolCandles, vixQuotes, vixCandles, vvixLatest, vix3mLatest] = await Promise.all([
    getQuotes([symbol]),
    getDailyCandles(symbol, 140),
    getQuotes([".VIX.US"]),
    getDailyCandles(".VIX.US", 252)
      ,
    getLatestCboeClose("https://cdn.cboe.com/api/global/us_indices/daily_prices/VVIX_History.csv"),
    getLatestCboeClose("https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX3M_History.csv")
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
    const high = Math.max(...slice.map((candle) => num(candle.high, underlyingLast)));
    const fibReference = low + (high - low) * 0.382;

    return {
      label: `${days}d`,
      low,
      distancePercent: pctDistance(underlyingLast, low),
      fibReference
    };
  });

  const keySupport = Math.min(...supportBuckets.map((bucket) => bucket.low));
  const supportDistance = pctDistance(underlyingLast, keySupport);
  const supportScore = Math.max(0, Math.min(20, 20 - Math.abs(supportDistance - 8)));
  const supportRangeHigh = Math.max(...(symbolCandles as CandleLike[]).slice(-120).map((candle) => num(candle.high, underlyingLast)));
  const supportRangeLow = Math.min(...(symbolCandles as CandleLike[]).slice(-120).map((candle) => num(candle.low, underlyingLast)));
  const fibPercents = [0.236, 0.382, 0.5, 0.618];
  const fibLevels = fibPercents.map((ratio) => {
    const price = supportRangeLow + (supportRangeHigh - supportRangeLow) * ratio;
    return {
      label: `${(ratio * 100).toFixed(1)}%`,
      price,
      distancePercent: pctDistance(underlyingLast, price)
    };
  });

  const vciBlock = buildVci(vixLast, vixSeries, vvixLast, vix3mLast);
  const macro = getNextMacroEvent(marketTimestamp);
  const total = vciBlock.vci * 40 + trendScore + supportScore + macro.score;
  const starScore = starScoreFromTotal(total);

  return {
    ...fallback,
    generatedAtLabel: formatGeneratedAt(marketTimestamp),
    header: {
      ...fallback.header,
      title: `${symbol} 卖出看跌期权 每日报告`,
      dateLine: formatMarketDate(marketTimestamp),
      starLine: buildStarLine(starScore)
    },
    summary: {
      ...fallback.summary,
      actionLabel: actionLabelFromStars(starScore),
      scope: `下面示例以 ${symbol} 作为重点研究对象。`
    },
    score: {
      total,
      starScore,
      vci: vciBlock.vci,
      trend: trendScore,
      support: supportScore,
      event: macro.score
    },
    vciItems: vciBlock.items,
    vciConclusion: `${vciBlock.vci.toFixed(3)} ${vciBlock.conclusion}`,
    market: {
      symbolLabel: symbol,
      symbolLast: underlyingLast,
      ma120,
      distanceToMa120,
      trendLabel
    },
    support: {
      underlyingLast,
      keySupport,
      keySupportDistance: supportDistance,
      commentary:
        supportDistance >= 7
          ? "价格离关键低点仍有缓冲，适合继续筛选更深虚值行权价。"
          : "价格距离关键低点不远，卖方安全垫偏薄。",
      windows: supportBuckets,
      fibLevels
    },
    event: {
      name: macro.name,
      dateLabel: macro.date.slice(5).replace("-", "/"),
      countdownLabel: `${macro.days} days`,
      severity: macro.severity
    },
    snapshotRows: [
      {
        dimension: "VCI",
        rawValue: vciBlock.vci.toFixed(3),
        score: `${(vciBlock.vci * 40).toFixed(1)} / 40`,
        status: `IVR ${vciBlock.items[0].value}，VIX ${vciBlock.items[1].value}，TS ${vciBlock.items[3].value}`
      },
      {
        dimension: "趋势",
        rawValue: `${symbol} ${distanceToMa120 >= 0 ? "高于" : "低于"} MA120 ${Math.abs(distanceToMa120).toFixed(2)}%`,
        score: `${trendScore.toFixed(1)} / 20`,
        status: trendLabel
      },
      {
        dimension: "支撑位",
        rawValue: `距支撑 ${supportDistance.toFixed(1)}%`,
        score: `${supportScore.toFixed(1)} / 20`,
        status: `关键支撑 $${keySupport.toFixed(2)}`
      },
      {
        dimension: "宏观",
        rawValue: `${macro.name} ${macro.days} 天后`,
        score: `${macro.score} / 20`,
        status: macro.severity
      }
    ]
  };
}
