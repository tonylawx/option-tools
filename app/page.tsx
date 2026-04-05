"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import { OptionYieldCalculator } from "@/components/option-yield-calculator";
import { ReportPage } from "@/components/report-page";
import type { SecuritySearchResult, SellPutReport } from "@/server/report/types";
import { Locale, uiCopy } from "@/shared/i18n";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";
const PROD_API_BASE_URL = "https://api.optix.tonylaw.cc";
type TabKey = "report" | "calculator";

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

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }

  return PROD_API_BASE_URL;
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [tab, setTab] = useState<TabKey>("report");
  const [report, setReport] = useState<SellPutReport | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState(displaySymbol(DEFAULT_SYMBOL));
  const [securities, setSecurities] = useState<SecuritySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [reportError, setReportError] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nextSymbol = normalizeSymbol(params.get("symbol"));
    const nextTab = params.get("tab") === "calculator" ? "calculator" : "report";
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("symbol") === selectedSymbol) {
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
          setReportError("长桥行情拉取失败，请检查凭证、权限或标的代码。");
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
    let cancelled = false;

    async function loadSecurities() {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/search`, {
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? `Failed to search: ${response.status}`);
        }

        const nextResults = (await response.json()) as SecuritySearchResult[];
        if (!cancelled) {
          setSecurities(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSecurities([]);
          setSearchError("长桥标的池加载失败，请检查本地 LONGBRIDGE_ACCESS_TOKEN 是否有效。");
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void loadSecurities();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <main style={styles.shell}>
      <section style={styles.paper}>
        <IOSInstallBanner locale={locale} />
        <div style={styles.topBar}>
          <div style={styles.tabSwitch}>
            <button
              type="button"
              onClick={() => setTab("report")}
              style={tab === "report" ? { ...styles.tabButton, ...styles.tabButtonActive } : styles.tabButton}
            >
              {text.reportTab}
            </button>
            <button
              type="button"
              onClick={() => setTab("calculator")}
              style={tab === "calculator" ? { ...styles.tabButton, ...styles.tabButtonActive } : styles.tabButton}
            >
              {text.calculatorTab}
            </button>
          </div>
          <div style={styles.localeSwitch}>
            <button
              type="button"
              onClick={() => setLocale("zh")}
              style={locale === "zh" ? { ...styles.localeButton, ...styles.localeButtonActive } : styles.localeButton}
            >
              中
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              style={locale === "en" ? { ...styles.localeButton, ...styles.localeButtonActive } : styles.localeButton}
            >
              EN
            </button>
          </div>
        </div>

        {tab === "report" ? (
          <>
            <div ref={boxRef} style={styles.searchWrap}>
              <div style={styles.searchTopRow}>
                <label htmlFor="symbol-search" style={styles.searchLabel}>
                  {text.searchLabel}
                </label>
              </div>
              <div style={styles.searchBox}>
                <input
                  id="symbol-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder={text.searchPlaceholder}
                  style={styles.searchInput}
                  autoComplete="off"
                />
                <div style={styles.searchStatus}>
                  {isLoadingReport
                    ? text.loading
                    : isSearching
                      ? text.searching
                      : report
                        ? displaySymbol(report.symbol)
                        : "--"}
                </div>
              </div>

              {open && results.length > 0 ? (
                <div style={styles.dropdown}>
                  {results.map((security) => (
                    <button
                      key={security.symbol}
                      type="button"
                      onClick={() => chooseSecurity(security)}
                      style={styles.option}
                    >
                      <strong>{displaySymbol(security.symbol)}</strong>
                      <span style={styles.optionName}>{security.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {searchError ? (
                <p style={styles.errorText}>
                  {locale === "zh" ? searchError : text.searchLoadError}
                </p>
              ) : null}
              {reportError ? (
                <p style={styles.errorText}>
                  {locale === "zh" ? reportError : text.reportLoadError}
                </p>
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

const styles: Record<string, React.CSSProperties> = {
  shell: {
    padding: "14px 16px 20px"
  },
  paper: {
    maxWidth: 980,
    margin: "0 auto"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10
  },
  tabSwitch: {
    display: "inline-flex",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.82)",
    boxShadow: "var(--shadow)"
  },
  tabButton: {
    border: "none",
    background: "transparent",
    color: "var(--muted)",
    fontSize: 13,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  tabButtonActive: {
    background: "#1d2038",
    color: "#fff"
  },
  searchWrap: {
    position: "relative",
    marginBottom: 10
  },
  searchTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 6
  },
  searchLabel: {
    color: "var(--muted)",
    fontSize: 12
  },
  localeSwitch: {
    display: "inline-flex",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.78)"
  },
  localeButton: {
    border: "none",
    background: "transparent",
    color: "var(--muted)",
    fontSize: 12,
    padding: "5px 10px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  localeButtonActive: {
    background: "#1d2038",
    color: "#fff"
  },
  searchBox: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.82)",
    boxShadow: "var(--shadow)"
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--ink)",
    fontSize: 16,
    fontFamily: "inherit"
  },
  searchStatus: {
    alignSelf: "center",
    color: "var(--muted)",
    fontSize: 13,
    whiteSpace: "nowrap"
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    zIndex: 10,
    display: "grid",
    gap: 6,
    padding: 8,
    borderRadius: 18,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 18px 50px rgba(23, 29, 45, 0.16)",
    maxHeight: 240,
    overflowY: "auto"
  },
  option: {
    display: "grid",
    gap: 4,
    textAlign: "left",
    border: "none",
    borderRadius: 12,
    background: "transparent",
    padding: "10px 12px",
    color: "var(--ink)",
    cursor: "pointer"
  },
  optionName: {
    color: "var(--muted)",
    fontSize: 13
  },
  errorText: {
    margin: "10px 4px 0",
    color: "#b14d57",
    fontSize: 13
  }
};
