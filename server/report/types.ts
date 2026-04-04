export type ScoreDimension = {
  label: string;
  value: string;
  progress: number;
};

export type SecuritySearchResult = {
  symbol: string;
  name: string;
};

export type ImportantEventItem = {
  label: string;
  name: string;
  dateLabel: string;
  countdownLabel: string;
  severity: string;
  impactsScore: boolean;
};

export type SellPutReport = {
  symbol: string;
  header: {
    kicker: string;
    dateLine: string;
    starLine: string;
  };
  summary: {
    actionLabel: string;
  };
  score: {
    starScore: number;
    vci: number;
    trend: number;
  };
  vciItems: ScoreDimension[];
  vciConclusion: string;
  market: {
    symbolLabel: string;
    symbolLast: number;
    ma120: number;
    distanceToMa120: number;
    trendLabel: string;
  };
  support: {
    underlyingLast: number;
    keySupport: number;
    keySupportDistance: number;
    commentary: string;
    windows: Array<{
      label: string;
      low: number;
      distancePercent: number;
    }>;
    fibLevels: Array<{
      label: string;
      price: number;
      distancePercent: number;
    }>;
  };
  event: {
    name: string;
    dateLabel: string;
    countdownLabel: string;
    severity: string;
    items: ImportantEventItem[];
  };
  earnings: {
    nextDateLabel: string;
    countdownLabel: string;
    severity: string;
    latestFilingTitle: string;
    latestFilingDateLabel: string;
  };
};
