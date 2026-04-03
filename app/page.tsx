"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { ReportPage } from "@/components/report-page";
import type { SecuritySearchResult, SellPutReport } from "@/server/report/types";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";

function displaySymbol(symbol: string) {
  return symbol.replace(/\.US$/, "");
}

export default function Page() {
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
    let cancelled = false;

    async function loadReport(symbol: string) {
      setIsLoadingReport(true);
      setReportError("");

      try {
        const response = await fetch(`/api/report?symbol=${encodeURIComponent(symbol)}`, {
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
  }, [selectedSymbol]);

  useEffect(() => {
    let cancelled = false;

    async function loadSecurities() {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await fetch("/api/search", {
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
          setSearchError("长桥标的池加载失败，请检查本地 LONGPORT_ACCESS_TOKEN 是否有效。");
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

  return (
    <main style={styles.shell}>
      <section style={styles.paper}>
        <div ref={boxRef} style={styles.searchWrap}>
          <label htmlFor="symbol-search" style={styles.searchLabel}>
            美股标的
          </label>
          <div style={styles.searchBox}>
            <input
              id="symbol-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="输入代码或公司名，例如 AAPL / Tesla"
              style={styles.searchInput}
              autoComplete="off"
            />
            <div style={styles.searchStatus}>
              {isLoadingReport ? "加载中..." : isSearching ? "搜索中..." : report ? displaySymbol(report.symbol) : "--"}
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

          {searchError ? <p style={styles.errorText}>{searchError}</p> : null}
          {reportError ? <p style={styles.errorText}>{reportError}</p> : null}
        </div>

        {report ? <ReportPage report={report} compact /> : null}
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
  searchWrap: {
    position: "relative",
    marginBottom: 10
  },
  searchLabel: {
    display: "block",
    marginBottom: 6,
    color: "var(--muted)",
    fontSize: 12
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
