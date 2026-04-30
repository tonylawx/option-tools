export type Locale = "zh" | "en";

export function normalizeLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "zh";
}

export const uiCopy = {
  zh: {
    pageTitle: "卖出看跌期权可行性报告",
    searchLabel: "美股标的",
    searchPlaceholder: "输入代码或公司名，例如 AAPL / Tesla",
    loading: "加载中...",
    searching: "搜索中...",
    searchLoadError: "长桥标的池加载失败，请检查本地 LONGBRIDGE_ACCESS_TOKEN 是否有效。",
    reportLoadError: "长桥行情拉取失败，请检查凭证、权限或标的代码。",
    installBannerTitle: "iPhone 添加到桌面",
    installBannerBody: "在 Safari 点分享按钮，再选“添加到主屏幕”，就能像 App 一样打开。",
    reportTab: "可行性报告",
    calculatorTab: "年化收益计算器",
    vciTitle: "波动率综合指数 [VCI]",
    marketTitle: "市场趋势",
    ticker: "标的",
    ma120: "MA 120",
    status: "状态",
    distance: "距离",
    score: "评分",
    supportTitle: "支撑位分析",
    keySupport: "关键支撑位",
    supportMetaLeft: "支撑位来源：近周期低点 + 斐波那契回撤",
    supportMetaRight: "越接近关键支撑，卖方缓冲越薄",
    recentLows: "近期低点",
    price: "价格",
    fib: "斐波那契",
    eventTitle: "重要事件",
    eventHint: "宏观事件与个股财报都属于卖出窗口过滤，临近时应降低仓位或直接回避。",
    eventNone: "近期没有重要事件",
    eventMacro: "宏观事件",
    eventEarnings: "财报窗口",
    eventImpact: "黑窗影响评分",
    macroLabel: "宏观",
    earningsTitle: "个股财报",
    earningsNext: "下一次财报",
    earningsRecent: "最近公告",
    calculatorKicker: "基于现金担保卖 Put 的简化收益测算",
    calculatorTitle: "期权年化收益计算器",
    calculatorSubtitle: "快速估算权利金收入、占用保证金与年化收益率",
    calculatorInputs: "输入参数",
    calculatorResults: "结果",
    shortPutMode: "卖 Put",
    shortCallMode: "卖 Call",
    premiumLabel: "权利金 / Premium",
    strikeLabel: "行权价 / Strike",
    daysLabel: "到期天数 / Days",
    contractsLabel: "张数 / Contracts",
    premiumIncomeLabel: "总权利金",
    collateralLabel: "占用资金",
    simpleReturnLabel: "区间收益率",
    annualizedReturnLabel: "年化收益率",
    breakevenLabel: "盈亏平衡价",
    calculatorAssumptionTitle: "说明",
    calculatorAssumptionBody: "默认按现金担保卖 Put 计算：占用资金 = 行权价 × 100 × 张数，不含手续费与滑点。",
    calculatorAssumptionBodyCall: "默认按备兑卖 Call 计算：占用名义仓位 = 行权价 × 100 × 张数，不含手续费与滑点。"
  },
  en: {
    pageTitle: "Sell Put Feasibility Report",
    searchLabel: "US Stock",
    searchPlaceholder: "Enter ticker or company, e.g. AAPL / Tesla",
    loading: "Loading...",
    searching: "Searching...",
    searchLoadError: "Security list failed to load.",
    reportLoadError: "Report failed to load.",
    installBannerTitle: "Add to Home Screen",
    installBannerBody: "In Safari, tap Share and then Add to Home Screen to launch it like an app.",
    reportTab: "Feasibility Report",
    calculatorTab: "Annualized Yield",
    vciTitle: "Volatility Composite Index [VCI]",
    marketTitle: "Market Trend",
    ticker: "Ticker",
    ma120: "MA 120",
    status: "Status",
    distance: "Distance",
    score: "Score",
    supportTitle: "Support Map",
    keySupport: "Key Support",
    supportMetaLeft: "Support source: recent lows + Fibonacci retracement",
    supportMetaRight: "Less cushion when price gets closer to support",
    recentLows: "Recent Lows",
    price: "Price",
    fib: "Fibonacci",
    eventTitle: "Key Events",
    eventHint: "Macro events and company earnings both matter for short-window risk. Reduce size or avoid selling when they are close.",
    eventNone: "No nearby key events",
    eventMacro: "Macro Event",
    eventEarnings: "Earnings Window",
    eventImpact: "Blackout impacts score",
    macroLabel: "Macro",
    earningsTitle: "Earnings",
    earningsNext: "Next Earnings",
    earningsRecent: "Latest Filing",
    calculatorKicker: "A simplified model for cash-secured short puts",
    calculatorTitle: "Option Annualized Yield Calculator",
    calculatorSubtitle: "Quickly estimate premium income, collateral usage, and annualized return",
    calculatorInputs: "Inputs",
    calculatorResults: "Results",
    shortPutMode: "Short Put",
    shortCallMode: "Short Call",
    premiumLabel: "Premium",
    strikeLabel: "Strike",
    daysLabel: "Days to Expiry",
    contractsLabel: "Contracts",
    premiumIncomeLabel: "Premium Income",
    collateralLabel: "Collateral",
    simpleReturnLabel: "Period Return",
    annualizedReturnLabel: "Annualized Return",
    breakevenLabel: "Breakeven",
    calculatorAssumptionTitle: "Assumption",
    calculatorAssumptionBody: "Assumes a cash-secured short put: collateral = strike × 100 × contracts, excluding fees and slippage.",
    calculatorAssumptionBodyCall: "Assumes a covered short call: notional exposure = strike × 100 × contracts, excluding fees and slippage."
  }
} as const;

export function translateActionLabel(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "开仓") return "Open";
    if (label === "谨慎") return "Cautious";
    if (label === "回避") return "Avoid";
  }

  return label;
}

export function translateTrendLabel(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "均线上方") return "Above MA";
    if (label === "均线下方") return "Below MA";
  }

  return label;
}

export function translateSeverity(label: string, locale: Locale) {
  if (locale === "en") {
    if (label === "常规观察") return "Routine Watch";
    if (label === "事件窗口") return "Event Window";
    if (label === "黑窗期") return "Blackout";
  }

  return label;
}

export function translateVciConclusion(label: string, locale: Locale) {
  if (locale === "en") {
    return label
      .replace("适合开仓", "Good to Sell")
      .replace("观望", "Watch")
      .replace("回避", "Avoid");
  }

  return label;
}

export function getVciHint(label: string, locale: Locale) {
  const copy = {
    zh: {
      IVR: "隐含波动率排名：当前 VIX 在 52 周的百分位。越高 = 权利金越丰厚",
      VIX: "恐慌指数(取反)：VIX 越低(>15) = 市场越平静 = 越适合卖 Put",
      VVIX: "VIX 的波动率：越低 = 波动率环境越稳定 = 卖期权越安全",
      TS: "期限结构：VIX3M 减 VIX。正值(正向结构) = 正常市场 = 对卖方有利"
    },
    en: {
      IVR: "Implied vol rank: current VIX percentile within the past 52 weeks. Higher = richer premium",
      VIX: "Fear index (inverse): lower VIX, while still above 15, means calmer markets and a better short-put setup",
      VVIX: "Volatility of VIX: lower = a steadier vol regime = safer for option sellers",
      TS: "Term structure: VIX3M minus VIX. Positive values (contango) imply a normal market and favor sellers"
    }
  } as const;

  return copy[locale][label as keyof typeof copy.zh] ?? "";
}

export function reportKicker(locale: Locale) {
  return locale === "en"
    ? "This report is a quantitative framework for options only, not investment advice."
    : "本策略仅作为期权量化思路，不作为投资建议。";
}

export function actionLabelFromStars(stars: number, locale: Locale) {
  const label = stars >= 4 ? "开仓" : stars === 3 ? "谨慎" : "回避";
  return translateActionLabel(label, locale);
}

export function vciConclusionLabel(vci: number, locale: Locale) {
  const label = vci > 0.6 ? "适合开仓" : vci < 0.4 ? "回避" : "观望";
  return locale === "en"
    ? vci > 0.6
      ? "Good to Sell"
      : vci < 0.4
        ? "Avoid"
        : "Watch"
    : label;
}

export function supportCommentary(supportDistance: number, locale: Locale) {
  if (supportDistance >= 7) {
    return locale === "en"
      ? "Price still has some cushion above key lows, so deeper OTM strikes remain worth screening."
      : "价格离关键低点仍有缓冲，适合继续筛选更深虚值行权价。";
  }

  return locale === "en"
    ? "Price is not far from key lows, so the seller's margin of safety looks thinner."
    : "价格距离关键低点不远，卖方安全垫偏薄。";
}

export function formatMarketDate(date: Date, locale: Locale) {
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
  const weekday = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    timeZone: "America/New_York",
    weekday: "long"
  }).format(date);

  return `${year}-${month}-${day} ${weekday}`;
}

export function formatCountdown(days: number, locale: Locale) {
  if (locale === "en") {
    if (days === 0) return "Today";
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
  }

  if (days === 0) return "今天";
  if (days < 0) return `已过 ${Math.abs(days)} 天`;
  return `还有 ${days} 天`;
}

export function eventShortLabel(kind: "fomc" | "cpi" | "ppi", locale: Locale) {
  if (locale === "en") {
    if (kind === "fomc") return "FOMC";
    if (kind === "cpi") return "CPI";
    return "PPI";
  }

  if (kind === "fomc") return "FOMC";
  if (kind === "cpi") return "CPI";
  return "PPI";
}

export function earningsEventLabel(locale: Locale) {
  return locale === "en" ? "Earnings" : "财报";
}

export function formatFiscalQuarterEarningsTitle(raw: string | null, locale: Locale) {
  if (!raw) {
    return locale === "en" ? "Earnings" : "财报";
  }

  const match = raw.match(/^Q([1-4])(\d{4})$/);
  if (!match) {
    return locale === "en" ? raw : `${raw}财报`;
  }

  const [, quarter, year] = match;
  return locale === "en" ? `${year} Q${quarter} Earnings` : `${year}年Q${quarter}财报`;
}

export function translateEventName(name: string, locale: Locale) {
  if (locale === "en") {
    return name;
  }

  if (name === "FOMC Meeting") return "FOMC 会议";
  if (name === "US CPI") return "美国 CPI";
  if (name === "US PPI") return "美国 PPI";
  return name;
}
