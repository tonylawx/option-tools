export const LOCALE = {
  ZH: "zh",
  EN: "en"
} as const;

export type Locale = typeof LOCALE[keyof typeof LOCALE];

export const TAB = {
  REPORT: "report",
  CALCULATOR: "calculator"
} as const;

export type TabKey = typeof TAB[keyof typeof TAB];

export const OPTION_MODE = {
  PUT: "put",
  CALL: "call"
} as const;

export type OptionMode = typeof OPTION_MODE[keyof typeof OPTION_MODE];

export const ACTION_LABEL = {
  OPEN: "open",
  CAUTIOUS: "cautious",
  AVOID: "avoid"
} as const;

export type ActionLabel = typeof ACTION_LABEL[keyof typeof ACTION_LABEL];

export const TREND_LABEL = {
  ABOVE_MA: "above_ma",
  BELOW_MA: "below_ma"
} as const;

export type TrendLabel = typeof TREND_LABEL[keyof typeof TREND_LABEL];

export const SEVERITY = {
  ROUTINE: "routine",
  EVENT_WINDOW: "event_window",
  BLACKOUT: "blackout"
} as const;

export type SeverityKey = typeof SEVERITY[keyof typeof SEVERITY];

export const VCI_CONCLUSION = {
  GOOD_TO_SELL: "good_to_sell",
  WATCH: "watch",
  AVOID: "avoid"
} as const;

export type VciConclusion = typeof VCI_CONCLUSION[keyof typeof VCI_CONCLUSION];

export const MACRO_EVENT_KIND = {
  FOMC: "fomc",
  CPI: "cpi",
  PPI: "ppi"
} as const;

export type MacroEventKind = typeof MACRO_EVENT_KIND[keyof typeof MACRO_EVENT_KIND];

export const MARKET = {
  US: "US"
} as const;

export const HOSTNAME = {
  LOCALHOST: "localhost"
} as const;

export const FINANCE_CALENDAR_TYPE = {
  MACRODATA: "macrodata",
  REPORT: "report",
  FINANCIAL: "financial",
  DIVIDEND: "dividend",
  IPO: "ipo",
  CLOSED: "closed"
} as const;

export type FinanceCalendarType = typeof FINANCE_CALENDAR_TYPE[keyof typeof FINANCE_CALENDAR_TYPE];

export const SEARCH_BOOTSTRAP_QUERY = "__bootstrap__";
