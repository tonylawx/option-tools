"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import { OptionYieldCalculator } from "@/components/option-yield-calculator";
import { ReportPage } from "@/components/report-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { SecuritySearchResult, SellPutReport } from "@/server/report/types";
import { HOSTNAME, LOCALE, SEARCH_BOOTSTRAP_QUERY, TAB, TabKey } from "@/shared/constants";
import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";
const PROD_API_BASE_URL = "https://api.optix.tonylaw.cc";
const SECURITIES_STORAGE_KEY = "optix-us-securities-cache";
const SECURITIES_STORAGE_VERSION = 1;
const MIN_VALID_SECURITIES_CACHE_SIZE = 100;

function displaySymbol(symbol: string) {
  return symbol.replace(/\.US$/, "");
}

function normalizeSymbol(symbol?: string | null) {
  if (!symbol) {
    return DEFAULT_SYMBOL;
  }

  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) {
    return DEFAULT_SYMBOL;
  }

  return trimmed.endsWith(".US") ? trimmed : `${trimmed}.US`;
}

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === HOSTNAME.LOCALHOST) {
    return "http://localhost:3001";
  }

  return PROD_API_BASE_URL;
}

function ReportSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-app-navy/8 bg-[#fffaf2] shadow-app animate-pulse">
      <div className="bg-gradient-to-b from-app-navy to-[#252848] px-6 py-5">
        <div className="h-3 w-28 rounded-full bg-white/16" />
        <div className="mt-3 h-8 w-56 rounded-full bg-white/22" />
        <div className="mt-2 h-4 w-40 rounded-full bg-white/14" />
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="h-5 w-28 rounded-full bg-white/18" />
          <div className="h-7 w-24 rounded-full bg-white/22" />
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <div className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <div className="h-5 w-36 rounded-full bg-app-navy/8" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-3 w-12 rounded-full bg-app-navy/8" />
                    <div className="h-4 w-16 rounded-full bg-app-navy/10" />
                  </div>
                  <div className="h-2.5 flex-1 rounded-full bg-app-navy/8" />
                  <div className="h-3 w-8 rounded-full bg-app-navy/8" />
                </div>
                <div className="mt-2 h-3 w-40 rounded-full bg-app-navy/6" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-app-line pt-4">
            <div className="h-8 w-32 rounded-full bg-app-navy/10" />
            <div className="h-8 w-24 rounded-full bg-app-navy/10" />
          </div>
        </div>

        <div className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <div className="h-5 w-28 rounded-full bg-app-navy/8" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="h-4 w-16 rounded-full bg-app-navy/8" />
                <div className="h-4 w-20 rounded-full bg-app-navy/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-[18px] border border-app-navy/7 bg-white p-4">
        <div className="h-5 w-32 rounded-full bg-app-navy/8" />
        <div className="mt-3 h-6 w-56 rounded-full bg-app-navy/10" />
        <div className="mt-2 h-4 w-64 rounded-full bg-app-navy/6" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-32 rounded-full bg-app-navy/8" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((__, row) => (
                  <div key={row} className="h-8 rounded-xl bg-app-navy/6" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-[18px] border border-app-navy/7 bg-white p-4">
        <div className="h-5 w-24 rounded-full bg-app-navy/8" />
        <div className="mt-3 h-4 w-72 max-w-full rounded-full bg-app-navy/6" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-t border-app-navy/6 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-5 w-28 rounded-full bg-app-navy/10" />
                  <div className="h-4 w-36 rounded-full bg-app-navy/6" />
                </div>
                <div className="h-7 w-20 rounded-full bg-app-navy/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>(LOCALE.ZH);
  const [tab, setTab] = useState<TabKey>(TAB.REPORT);
  const [report, setReport] = useState<SellPutReport | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState(displaySymbol(DEFAULT_SYMBOL));
  const [securities, setSecurities] = useState<SecuritySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [reportError, setReportError] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const attemptedRemoteQueryRef = useRef<string>("");
  const activeRemoteQueryRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nextSymbol = normalizeSymbol(params.get("symbol"));
    const nextTab = params.get("tab") === TAB.CALCULATOR ? TAB.CALCULATOR : TAB.REPORT;
    setTab(nextTab);
    setSelectedSymbol(nextSymbol);
    setQuery(displaySymbol(nextSymbol));
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const rankedSecurities = securities.filter((security) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      security.symbol.toLowerCase().includes(normalizedQuery) ||
      security.name.toLowerCase().includes(normalizedQuery) ||
      displaySymbol(security.symbol).toLowerCase().includes(normalizedQuery)
    );
  }).sort((a, b) => {
    const aCode = displaySymbol(a.symbol).toLowerCase();
    const bCode = displaySymbol(b.symbol).toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const rank = (code: string, name: string) => {
      if (code === normalizedQuery) return 0;
      if (code.startsWith(normalizedQuery)) return 1;
      if (name.startsWith(normalizedQuery)) return 2;
      if (code.includes(normalizedQuery)) return 3;
      return 4;
    };

    const byRank = rank(aCode, aName) - rank(bCode, bName);
    if (byRank !== 0) return byRank;

    const byCodeLength = aCode.length - bCode.length;
    if (byCodeLength !== 0) return byCodeLength;

    return aCode.localeCompare(bCode);
  });

  const results = (() => {
    if (!normalizedQuery) {
      return rankedSecurities.slice(0, 20);
    }

    if (rankedSecurities.length >= 5) {
      return rankedSecurities.slice(0, 20);
    }

    const seen = new Set(rankedSecurities.map((security) => security.symbol));
    const fallback = securities.filter((security) => !seen.has(security.symbol)).slice(0, 5 - rankedSecurities.length);
    return [...rankedSecurities, ...fallback].slice(0, 20);
  })();

  function readCachedSecurities() {
    if (typeof window === "undefined") {
      return [] as SecuritySearchResult[];
    }

    try {
      const raw = window.localStorage.getItem(SECURITIES_STORAGE_KEY);
      if (!raw) {
        return [] as SecuritySearchResult[];
      }

      const parsed = JSON.parse(raw) as
        | SecuritySearchResult[]
        | { version?: number; data?: SecuritySearchResult[] };

      const nextResults = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data) && parsed.version === SECURITIES_STORAGE_VERSION
          ? parsed.data
          : [];

      return nextResults.length >= MIN_VALID_SECURITIES_CACHE_SIZE ? nextResults : [];
    } catch {
      return [] as SecuritySearchResult[];
    }
  }

  function writeCachedSecurities(nextSecurities: SecuritySearchResult[]) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        SECURITIES_STORAGE_KEY,
        JSON.stringify({
          version: SECURITIES_STORAGE_VERSION,
          data: nextSecurities
        })
      );
    } catch {
      // Ignore localStorage write failures.
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("symbol") === selectedSymbol && params.get("tab") === tab) {
      return;
    }

    params.set("symbol", selectedSymbol);
    params.set("tab", tab);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [selectedSymbol, tab]);

  useEffect(() => {
    let cancelled = false;

    async function loadReport(symbol: string) {
      setIsLoadingReport(true);
      setReportError("");

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/report?symbol=${encodeURIComponent(symbol)}&locale=${locale}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load report: ${response.status}`);
        }

        const nextReport = (await response.json()) as SellPutReport;
        if (!cancelled) {
          startTransition(() => {
            setReport(nextReport);
          });
        }
      } catch {
        if (!cancelled) {
          setReport(null);
          setReportError(uiCopy[locale].reportLoadFailure);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReport(false);
        }
      }
    }

    void loadReport(selectedSymbol);

    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, locale]);

  useEffect(() => {
    const cached = readCachedSecurities();
    if (cached.length > 0) {
      setSecurities(cached);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    async function loadSecurities() {
      setIsSearching(true);
      setSearchError("");
      attemptedRemoteQueryRef.current = SEARCH_BOOTSTRAP_QUERY;
      activeRemoteQueryRef.current = SEARCH_BOOTSTRAP_QUERY;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/securities`, {
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load securities: ${response.status}`);
        }

        const nextResults = (await response.json()) as SecuritySearchResult[];
        if (!cancelled) {
          setSecurities(nextResults);
          writeCachedSecurities(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSecurities([]);
          setSearchError(uiCopy[locale].securitiesLoadFailure);
        }
        attemptedRemoteQueryRef.current = "";
        activeRemoteQueryRef.current = "";
      } finally {
        if (!cancelled && activeRemoteQueryRef.current === SEARCH_BOOTSTRAP_QUERY) {
          setIsSearching(false);
          activeRemoteQueryRef.current = "";
        }
      }
    }

    void loadSecurities();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setIsSearching(false);
      attemptedRemoteQueryRef.current = "";
      activeRemoteQueryRef.current = "";
      return;
    }

    if (results.length > 0) {
      setIsSearching(false);
      activeRemoteQueryRef.current = "";
      return;
    }

    if (attemptedRemoteQueryRef.current === normalized) {
      return;
    }

    let cancelled = false;

    async function refreshSecurities() {
      setIsSearching(true);
      setSearchError("");
      attemptedRemoteQueryRef.current = normalized;
      activeRemoteQueryRef.current = normalized;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/securities`, {
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to load securities: ${response.status}`);
        }

        const nextResults = (await response.json()) as SecuritySearchResult[];
        if (!cancelled) {
          setSecurities(nextResults);
          writeCachedSecurities(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSearchError(uiCopy[locale].securitiesLoadFailure);
        }
        attemptedRemoteQueryRef.current = "";
        activeRemoteQueryRef.current = "";
      } finally {
        if (!cancelled && activeRemoteQueryRef.current === normalized) {
          setIsSearching(false);
          activeRemoteQueryRef.current = "";
        }
      }
    }

    void refreshSecurities();

    return () => {
      cancelled = true;
    };
  }, [locale, query, results.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  function chooseSecurity(security: SecuritySearchResult) {
    setSelectedSymbol(security.symbol);
    setQuery(displaySymbol(security.symbol));
    setOpen(false);
  }

  const text = uiCopy[locale];
  const searchStatusText = isLoadingReport
    ? text.loading
    : isSearching
      ? text.searching
      : report
        ? displaySymbol(report.symbol)
        : "--";
  const showSearchClear = isSearchFocused && Boolean(query) && !isLoadingReport && !isSearching;
  const tabOptions = [
    { value: TAB.REPORT, label: text.reportTab },
    { value: TAB.CALCULATOR, label: text.calculatorTab }
  ] as const;
  const localeOptions = [
    { value: LOCALE.ZH, label: text.localeZh },
    { value: LOCALE.EN, label: text.localeEn }
  ] as const;

  return (
    <main className="px-4 py-3 sm:py-4">
      <section className="mx-auto max-w-[980px]">
        <IOSInstallBanner locale={locale} />

        <div className="mb-2.5 flex items-center gap-2">
          <SegmentedControl
            className="min-w-0 flex-1"
            itemClassName="flex-1"
            onValueChange={(value) => setTab(value as TabKey)}
            options={tabOptions}
            value={tab}
          />
          <SegmentedControl
            className="shrink-0"
            itemClassName="min-w-12 px-3"
            onValueChange={(value) => setLocale(value as Locale)}
            options={localeOptions}
            value={locale}
          />
        </div>

        {tab === TAB.REPORT ? (
          <>
            <div ref={boxRef} className="relative mb-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="symbol-search" className="text-xs font-medium tracking-[0.08em] text-app-muted uppercase">
                  {text.searchLabel}
                </label>
              </div>

              <div className="rounded-[22px] border border-app-line bg-white/86 p-2 shadow-app backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-[18px] bg-[#fcfbf8] px-4 py-3">
                  <Input
                    id="symbol-search"
                    className="min-w-0 flex-1 text-lg font-semibold"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setOpen(true);
                    }}
                    onFocus={() => {
                      setOpen(true);
                      setIsSearchFocused(true);
                    }}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder={text.searchPlaceholder}
                    unstyled
                    autoComplete="off"
                  />
                  <div className="flex shrink-0 items-center justify-end">
                    {showSearchClear ? (
                      <Button
                        className="size-7 rounded-full bg-app-navy/8 p-0 text-base leading-none text-app-muted hover:bg-app-navy/12"
                        variant="ghost"
                        size="icon"
                        aria-label={text.clearInput}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuery("");
                          setOpen(true);
                        }}
                      >
                        ×
                      </Button>
                    ) : (
                      <div className="text-right text-sm font-medium text-app-muted">
                        {searchStatusText}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {open && results.length > 0 ? (
                <div className="absolute z-20 mt-2 w-full rounded-[22px] border border-app-line bg-white/96 p-2 shadow-app backdrop-blur-sm">
                  <div className="h-[320px] max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-1">
                      {results.map((security) => (
                        <Button
                          key={security.symbol}
                          className="min-h-15 h-auto w-full justify-start rounded-2xl px-4 py-3 text-left hover:bg-app-navy/6"
                          variant="ghost"
                          onClick={() => chooseSecurity(security)}
                        >
                          <div className="grid gap-0.5">
                            <strong className="text-sm text-app-navy">{displaySymbol(security.symbol)}</strong>
                            <span className="text-xs text-app-muted">{security.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {searchError ? (
                <p className="mt-2 text-sm text-app-rose">{searchError}</p>
              ) : null}
              {reportError ? (
                <p className="mt-2 text-sm text-app-rose">{reportError}</p>
              ) : null}
            </div>

            {report ? <ReportPage report={report} compact locale={locale} /> : null}
            {!report && isLoadingReport ? <ReportSkeleton /> : null}
          </>
        ) : (
          <OptionYieldCalculator locale={locale} />
        )}
      </section>
    </main>
  );
}
