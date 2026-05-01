"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import { OptionYieldCalculator } from "@/components/option-yield-calculator";
import { ReportPage } from "@/components/report-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SecuritySearchResult, SellPutReport } from "@/server/report/types";
import { HOSTNAME, LOCALE, SEARCH_BOOTSTRAP_QUERY, TAB, TabKey } from "@/shared/constants";
import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";
const PROD_API_BASE_URL = "https://api.optix.tonylaw.cc";
const SECURITIES_STORAGE_KEY = "optix-us-securities-cache";

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

  const results = securities.filter((security) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return (
      security.symbol.toLowerCase().includes(normalized) ||
      security.name.toLowerCase().includes(normalized) ||
      displaySymbol(security.symbol).toLowerCase().includes(normalized)
    );
  }).sort((a, b) => {
    const normalized = query.trim().toLowerCase();
    const aCode = displaySymbol(a.symbol).toLowerCase();
    const bCode = displaySymbol(b.symbol).toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    const rank = (code: string, name: string) => {
      if (code === normalized) return 0;
      if (code.startsWith(normalized)) return 1;
      if (name.startsWith(normalized)) return 2;
      if (code.includes(normalized)) return 3;
      return 4;
    };

    const byRank = rank(aCode, aName) - rank(bCode, bName);
    if (byRank !== 0) return byRank;

    const byCodeLength = aCode.length - bCode.length;
    if (byCodeLength !== 0) return byCodeLength;

    return aCode.localeCompare(bCode);
  }).slice(0, 20);

  function readCachedSecurities() {
    if (typeof window === "undefined") {
      return [] as SecuritySearchResult[];
    }

    try {
      const raw = window.localStorage.getItem(SECURITIES_STORAGE_KEY);
      if (!raw) {
        return [] as SecuritySearchResult[];
      }

      const parsed = JSON.parse(raw) as SecuritySearchResult[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [] as SecuritySearchResult[];
    }
  }

  function writeCachedSecurities(nextSecurities: SecuritySearchResult[]) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(SECURITIES_STORAGE_KEY, JSON.stringify(nextSecurities));
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

  return (
    <main className="px-4 py-3 sm:py-4">
      <section className="mx-auto max-w-[980px]">
        <IOSInstallBanner locale={locale} />

        <div className="mb-2.5 flex items-center gap-2">
          <div className="inline-flex min-w-0 flex-1 gap-1 rounded-full border border-app-line bg-white/82 p-1 shadow-app">
            <Button
              className={cn(
                "h-12 flex-1 px-4 text-sm sm:h-11",
                tab === TAB.REPORT ? "bg-app-navy text-white hover:bg-[#252848]" : "text-app-muted hover:bg-app-navy/6 hover:text-app-navy"
              )}
              variant="ghost"
              onClick={() => setTab(TAB.REPORT)}
            >
              {text.reportTab}
            </Button>
            <Button
              className={cn(
                "h-12 flex-1 px-4 text-sm sm:h-11",
                tab === TAB.CALCULATOR ? "bg-app-navy text-white hover:bg-[#252848]" : "text-app-muted hover:bg-app-navy/6 hover:text-app-navy"
              )}
              variant="ghost"
              onClick={() => setTab(TAB.CALCULATOR)}
            >
              {text.calculatorTab}
            </Button>
          </div>

          <div className="inline-flex shrink-0 gap-1 rounded-full border border-app-line bg-white/82 p-1 shadow-app">
            <Button
              className={cn(
                "h-12 min-w-12 px-3 text-sm sm:h-11",
                locale === LOCALE.ZH ? "bg-app-navy text-white hover:bg-[#252848]" : "text-app-muted hover:bg-app-navy/6 hover:text-app-navy"
              )}
              variant="ghost"
              onClick={() => setLocale(LOCALE.ZH)}
            >
              {text.localeZh}
            </Button>
            <Button
              className={cn(
                "h-12 min-w-12 px-3 text-sm sm:h-11",
                locale === LOCALE.EN ? "bg-app-navy text-white hover:bg-[#252848]" : "text-app-muted hover:bg-app-navy/6 hover:text-app-navy"
              )}
              variant="ghost"
              onClick={() => setLocale(LOCALE.EN)}
            >
              {text.localeEn}
            </Button>
          </div>
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
                <div className="absolute z-20 mt-2 grid w-full gap-1 rounded-[22px] border border-app-line bg-white/96 p-2 shadow-app backdrop-blur-sm">
                  {results.map((security) => (
                    <Button
                      key={security.symbol}
                      className="h-auto justify-start rounded-2xl px-4 py-3 text-left hover:bg-app-navy/6"
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
              ) : null}

              {searchError ? (
                <p className="mt-2 text-sm text-app-rose">{searchError}</p>
              ) : null}
              {reportError ? (
                <p className="mt-2 text-sm text-app-rose">{reportError}</p>
              ) : null}
            </div>

            {report ? <ReportPage report={report} compact locale={locale} /> : null}
          </>
        ) : (
          <OptionYieldCalculator locale={locale} />
        )}
      </section>
    </main>
  );
}
