type MacroEvent = {
  name: string;
  date: string;
};

const FOMC_2026: MacroEvent[] = [
  { name: "FOMC Meeting", date: "2026-01-27" },
  { name: "FOMC Meeting", date: "2026-03-17" },
  { name: "FOMC Meeting", date: "2026-04-28" },
  { name: "FOMC Meeting", date: "2026-06-16" },
  { name: "FOMC Meeting", date: "2026-07-28" },
  { name: "FOMC Meeting", date: "2026-09-22" },
  { name: "FOMC Meeting", date: "2026-11-03" },
  { name: "FOMC Meeting", date: "2026-12-15" }
];

const CPI_2026: MacroEvent[] = [
  { name: "US CPI", date: "2026-01-15" },
  { name: "US CPI", date: "2026-02-18" },
  { name: "US CPI", date: "2026-03-18" },
  { name: "US CPI", date: "2026-04-10" },
  { name: "US CPI", date: "2026-05-13" },
  { name: "US CPI", date: "2026-06-10" },
  { name: "US CPI", date: "2026-07-15" },
  { name: "US CPI", date: "2026-08-12" },
  { name: "US CPI", date: "2026-09-10" },
  { name: "US CPI", date: "2026-10-15" },
  { name: "US CPI", date: "2026-11-12" },
  { name: "US CPI", date: "2026-12-10" }
];

const PPI_2026: MacroEvent[] = [
  { name: "US PPI", date: "2026-01-16" },
  { name: "US PPI", date: "2026-02-19" },
  { name: "US PPI", date: "2026-03-19" },
  { name: "US PPI", date: "2026-04-14" },
  { name: "US PPI", date: "2026-05-14" },
  { name: "US PPI", date: "2026-06-11" },
  { name: "US PPI", date: "2026-07-16" },
  { name: "US PPI", date: "2026-08-13" },
  { name: "US PPI", date: "2026-09-11" },
  { name: "US PPI", date: "2026-10-16" },
  { name: "US PPI", date: "2026-11-13" },
  { name: "US PPI", date: "2026-12-11" }
];

const ALL_EVENTS = [...FOMC_2026, ...CPI_2026, ...PPI_2026].sort((a, b) =>
  a.date.localeCompare(b.date)
);

function diffInDays(fromDate: Date, toDate: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / dayMs);
}

export function getNextMacroEvent(referenceDate: Date) {
  const current = new Date(referenceDate.toISOString().slice(0, 10));
  const next =
    ALL_EVENTS.find((event) => new Date(event.date).getTime() >= current.getTime()) ??
    ALL_EVENTS[ALL_EVENTS.length - 1];

  const days = diffInDays(current, new Date(next.date));
  const score = days <= 4 ? 0 : days <= 7 ? 8 : days <= 14 ? 14 : 20;
  const severity = days <= 4 ? "黑窗日期" : days <= 7 ? "事件窗口" : "常规观察";

  return {
    ...next,
    days,
    score,
    severity
  };
}
