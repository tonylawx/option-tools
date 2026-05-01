import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFinanceCalendar, type FinanceCalendarInfo } from "@/server/report/longbridge";
import { FINANCE_CALENDAR_TYPE, MACRO_EVENT_KIND, MARKET, SEVERITY, MacroEventKind, SeverityKey } from "@/shared/constants";

export type { MacroEventKind };

export type MacroEvent = {
  name: string;
  date: string;
  kind: MacroEventKind;
};

type CachedEvents = {
  events: MacroEvent[];
  expiresAt: number;
};

const FED_FOMC_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
const BLS_ICS_URL = "https://www.bls.gov/schedule/news_release/bls.ics";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const LONG_BRIDGE_MACRO_PATTERNS = {
  [MACRO_EVENT_KIND.CPI]: /CPI/i,
  [MACRO_EVENT_KIND.PPI]: /PPI|Producer Price/i,
  [MACRO_EVENT_KIND.FOMC]: /FOMC|Fed|美联储|联邦基金|利率决议/i
} as const;

let cache: CachedEvents | null = null;
let lastGoodEvents: MacroEvent[] | null = null;
const execFileAsync = promisify(execFile);

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

function asIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function diffInDays(fromDate: Date, toDate: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / dayMs);
}

function stripHtml(source: string) {
  return source
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function parseFomcEvents(html: string) {
  const text = stripHtml(html);
  const matches = Array.from(
    text.matchAll(/(\d{4})\s+FOMC Meetings([\s\S]*?)(?=(?:\d{4}\s+FOMC Meetings)|Future Year:|Note: A two-day meeting|$)/g)
  );

  const events: MacroEvent[] = [];

  for (const match of matches) {
    const year = Number(match[1]);
    const section = match[2];
    const entries = Array.from(
      section.matchAll(/([A-Za-z]{3,9})(?:\/([A-Za-z]{3,9}))?\s+(\d{1,2})-(\d{1,2})\*?/g)
    );

    for (const entry of entries) {
      const endMonthKey = (entry[2] ?? entry[1]).toLowerCase();
      const month = MONTH_INDEX[endMonthKey];
      const day = Number(entry[4]);

      if (!month || !Number.isFinite(day)) {
        continue;
      }

      events.push({
        name: MACRO_EVENT_KIND.FOMC,
        date: asIsoDate(year, month, day),
        kind: MACRO_EVENT_KIND.FOMC
      });
    }
  }

  return events;
}

function parseICSDate(raw: string) {
  const match = raw.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function unfoldICS(text: string) {
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseBlsEvents(ics: string) {
  const content = unfoldICS(ics);
  const blocks = content.split("BEGIN:VEVENT").slice(1);
  const events: MacroEvent[] = [];

  for (const block of blocks) {
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim() ?? "";
    const dtStart = block.match(/DTSTART(?:;[^:]+)?:(.+)/)?.[1]?.trim() ?? "";
    const date = parseICSDate(dtStart);

    if (!date) {
      continue;
    }

    if (summary.includes("Consumer Price Index")) {
      events.push({ name: MACRO_EVENT_KIND.CPI, date, kind: MACRO_EVENT_KIND.CPI });
      continue;
    }

    if (summary.includes("Producer Price Index")) {
      events.push({ name: MACRO_EVENT_KIND.PPI, date, kind: MACRO_EVENT_KIND.PPI });
    }
  }

  return events;
}

function dedupeEvents(events: MacroEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.kind}:${event.date}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseLongbridgeMacroKind(info: FinanceCalendarInfo): MacroEventKind | null {
  const content = info.content ?? "";

  if (LONG_BRIDGE_MACRO_PATTERNS[MACRO_EVENT_KIND.CPI].test(content)) {
    return MACRO_EVENT_KIND.CPI;
  }

  if (LONG_BRIDGE_MACRO_PATTERNS[MACRO_EVENT_KIND.PPI].test(content)) {
    return MACRO_EVENT_KIND.PPI;
  }

  if (LONG_BRIDGE_MACRO_PATTERNS[MACRO_EVENT_KIND.FOMC].test(content)) {
    return MACRO_EVENT_KIND.FOMC;
  }

  return null;
}

function parseLongbridgeMacroName(kind: MacroEventKind) {
  return kind;
}

async function getLongbridgeMacroEvents() {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + 365);

  const response = await getFinanceCalendar({
    date: startDate,
    dateEnd: endDate.toISOString().slice(0, 10),
    count: 1000,
    offset: 0,
    next: true,
    types: [FINANCE_CALENDAR_TYPE.MACRODATA],
    star: ["3"]
  });

  const events: MacroEvent[] = [];

  for (const day of response.list ?? []) {
    for (const info of day.infos ?? []) {
      if (info.market !== MARKET.US) {
        continue;
      }

      const kind = parseLongbridgeMacroKind(info);
      if (!kind) {
        continue;
      }

      events.push({
        name: parseLongbridgeMacroName(kind),
        date: day.date,
        kind
      });
    }
  }

  return events;
}

async function fetchText(url: string, label: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "option-tools/1.0"
    },
    cache: "no-store"
  });

  if (response.ok) {
    return response.text();
  }

  if ("Bun" in globalThis && url.includes("bls.gov")) {
    const helper = [
      "const url = process.argv[1];",
      "const response = await fetch(url, { headers: { 'user-agent': 'option-tools/1.0' }, cache: 'no-store' });",
      "if (!response.ok) throw new Error(String(response.status));",
      "process.stdout.write(await response.text());"
    ].join(" ");

    const { stdout } = await execFileAsync("node", ["--input-type=module", "-e", helper, url], {
      maxBuffer: 10 * 1024 * 1024
    });

    return stdout;
  }

  throw new Error(`Failed to load ${label}: ${response.status}`);
}

export async function getMacroEvents() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.events;
  }

  try {
    const [longbridgeEvents, fedHtml, blsIcs] = await Promise.all([
      getLongbridgeMacroEvents().catch(() => []),
      fetchText(FED_FOMC_URL, "FOMC calendar"),
      fetchText(BLS_ICS_URL, "BLS calendar")
    ]);
    const events = dedupeEvents([...longbridgeEvents, ...parseFomcEvents(fedHtml), ...parseBlsEvents(blsIcs)]).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (events.length === 0) {
      throw new Error("No official macro events parsed");
    }

    cache = {
      events,
      expiresAt: now + CACHE_TTL_MS
    };
    lastGoodEvents = events;
    return events;
  } catch (error) {
    if (lastGoodEvents) {
      return lastGoodEvents;
    }

    throw error;
  }
}

export async function getNextMacroEvent(referenceDate: Date) {
  const events = await getMacroEvents();
  const current = new Date(referenceDate.toISOString().slice(0, 10));
  const next =
    events.find((event) => new Date(event.date).getTime() >= current.getTime()) ??
    events[events.length - 1];

  const days = diffInDays(current, new Date(next.date));
  const score = days <= 4 ? 0 : days <= 7 ? 8 : days <= 14 ? 14 : 20;
  const severityKey: SeverityKey = days <= 4
    ? SEVERITY.BLACKOUT
    : days <= 7
      ? SEVERITY.EVENT_WINDOW
      : SEVERITY.ROUTINE;

  return {
    ...next,
    days,
    score,
    severityKey
  };
}
