export type ScoreDimension = {
  label: string;
  value: string;
  progress: number;
  weight: number;
};

export type SecuritySearchResult = {
  symbol: string;
  name: string;
};

export type SellPutReport = {
  symbol: string;
  generatedAtLabel: string;
  regionLabel: string;
  header: {
    kicker: string;
    title: string;
    dateLine: string;
    starLine: string;
  };
  summary: {
    actionLabel: string;
    lead: string;
    context: string;
    method: string;
    scope: string;
  };
  score: {
    total: number;
    starScore: number;
    vci: number;
    trend: number;
    support: number;
    event: number;
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
      fibReference: number;
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
  };
  gradeGuide: Array<{
    range: string;
    grade: string;
    meaning: string;
    action: string;
  }>;
  snapshotRows: Array<{
    dimension: string;
    rawValue: string;
    score: string;
    status: string;
  }>;
  documentation: {
    why: string[];
    dimensions: Array<{
      title: string;
      body: string;
      bullets: string[];
    }>;
    limitations: string[];
    usage: string[];
  };
};
