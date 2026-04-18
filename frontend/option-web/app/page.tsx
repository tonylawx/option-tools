"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { getAuthApiUrl } from "@tonylaw/auth/shared";
import { ChevronDown } from "lucide-react";
import { IOSInstallBanner } from "@/components/ios-install-banner";
import { OptionYieldCalculator } from "@/components/option-yield-calculator";
import { ReportPage } from "@/components/report-page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SecuritySearchResult, SellPutReport } from "@tonylaw/contracts/report";
import type { Locale } from "@tonylaw/shared/i18n";
import { uiCopy } from "@tonylaw/shared/i18n";

export const dynamic = "force-dynamic";

const DEFAULT_SYMBOL = "QQQ.US";
const PROD_API_BASE_URL = "https://api.tonylaw.cc/optix";
type TabKey = "report" | "calculator";
type Viewer = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

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
    return "http://localhost:3001/optix";
  }

  return PROD_API_BASE_URL;
}

export default function Page() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [tab, setTab] = useState<TabKey>("report");
  const [report, setReport] = useState<SellPutReport | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState(displaySymbol(DEFAULT_SYMBOL));
  const [securities, setSecurities] = useState<SecuritySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [reportError, setReportError] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

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

  const results = securities
    .filter((security) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return true;
      }

      return (
        security.symbol.toLowerCase().includes(normalized) ||
        security.name.toLowerCase().includes(normalized) ||
        displaySymbol(security.symbol).toLowerCase().includes(normalized)
      );
    })
    .sort((a, b) => {
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
    })
    .slice(0, 20);

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
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [selectedSymbol, tab]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewer() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include"
        });

        if (!response.ok) {
          if (!cancelled) {
            setViewer(null);
          }
          return;
        }

        const payload = (await response.json()) as { user?: Viewer | null };
        if (!cancelled) {
          setViewer(payload.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setViewer(null);
        }
      }
    }

    void loadViewer();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReport(symbol: string) {
      setIsLoadingReport(true);
      setReportError("");

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/report?symbol=${encodeURIComponent(symbol)}&locale=${locale}`, {
          cache: "no-store",
          credentials: "include"
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
        const response = await fetch(`${getApiBaseUrl()}/api/securities`, {
          cache: "no-store",
          credentials: "include"
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
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function chooseSecurity(security: SecuritySearchResult) {
    setSelectedSymbol(security.symbol);
    setQuery(displaySymbol(security.symbol));
    setOpen(false);
  }

  function handleSignOut() {
    const signOutUrl = new URL(`${getAuthApiUrl()}/api/public/auth/sign-out`);

    if (typeof window !== "undefined") {
      signOutUrl.searchParams.set("callbackUrl", window.location.href);
    }

    return signOutUrl.toString();
  }

  const text = uiCopy[locale];
  const viewerName = viewer?.name?.trim() || viewer?.email?.trim() || "Account";
  const signOutHref = handleSignOut();

  return (
    <main className="px-4 pb-5 pt-3">
      <section className="mx-auto max-w-[980px]">
        <IOSInstallBanner locale={locale} />

        <div className="theme-paper mb-3 overflow-hidden rounded-[28px] p-2 sm:p-2.5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              {viewer ? (
                <div className="relative min-w-0">
                  <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className="h-10 min-w-0 rounded-full border-line bg-white/72 px-2.5 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:bg-white/86"
                      >
                        <Avatar size="sm" className="bg-[rgba(29,32,56,0.08)]">
                          <AvatarFallback className="bg-[rgba(29,32,56,0.08)] text-[12px] font-semibold text-navy">
                            {viewerName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[110px] truncate text-[13px] font-semibold">{viewerName}</span>
                        <ChevronDown className={`size-3.5 text-muted transition ${accountOpen ? "rotate-180" : ""}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40 rounded-[16px] border-line bg-white/96">
                      <a
                        href={signOutHref}
                        className="block rounded-[12px] px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-[rgba(29,32,56,0.05)]"
                      >
                        {text.accountSignOut}
                      </a>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : <div />}

              <div className="inline-flex shrink-0 gap-1 rounded-full bg-[rgba(29,32,56,0.05)] p-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLocale("zh")}
                  className={`min-h-[36px] min-w-[44px] rounded-full px-3 py-1.5 text-[12px] font-medium ${locale === "zh" ? "bg-navy text-white hover:bg-navy" : "bg-transparent text-muted shadow-none hover:bg-[rgba(29,32,56,0.08)]"}`}
                >
                  中
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLocale("en")}
                  className={`min-h-[36px] min-w-[44px] rounded-full px-3 py-1.5 text-[12px] font-medium ${locale === "en" ? "bg-navy text-white hover:bg-navy" : "bg-transparent text-muted shadow-none hover:bg-[rgba(29,32,56,0.08)]"}`}
                >
                  EN
                </Button>
              </div>
            </div>

            <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-[22px] bg-[rgba(29,32,56,0.05)] p-1">
                <TabsTrigger
                  value="report"
                  className="min-h-[40px] rounded-[16px] px-3 py-2 text-[13px] font-medium data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-[0_10px_24px_rgba(29,32,56,0.22)]"
                >
                  {text.reportTab}
                </TabsTrigger>
                <TabsTrigger
                  value="calculator"
                  className="min-h-[40px] rounded-[16px] px-3 py-2 text-[13px] font-medium data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-[0_10px_24px_rgba(29,32,56,0.22)]"
                >
                  {text.calculatorTab}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {tab === "report" ? (
          <>
            <div ref={boxRef} className="relative mb-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="symbol-search" className="text-xs text-muted">{text.searchLabel}</label>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-line bg-white/80 px-3 py-2.5 shadow-[var(--shadow-paper)]">
                <Input
                  id="symbol-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder={text.searchPlaceholder}
                  autoComplete="off"
                  className="h-auto border-none bg-transparent px-0 py-0 text-base shadow-none focus-visible:ring-0"
                />
                <div className="self-center whitespace-nowrap text-[13px] text-muted">
                  {isLoadingReport ? text.loading : isSearching ? text.searching : report ? displaySymbol(report.symbol) : "--"}
                </div>
              </div>

              {open && results.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 grid max-h-60 gap-1.5 overflow-y-auto rounded-[18px] border border-line bg-white/95 p-2 shadow-[0_18px_50px_rgba(23,29,45,0.16)]">
                  {results.map((security) => (
                    <button
                      key={security.symbol}
                      type="button"
                      onClick={() => chooseSecurity(security)}
                      className="grid gap-1 rounded-xl px-3 py-2.5 text-left text-ink transition hover:bg-[rgba(40,73,129,0.06)]"
                    >
                      <strong>{displaySymbol(security.symbol)}</strong>
                      <span className="text-[13px] text-muted">{security.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {searchError ? <p className="mx-1 mt-2.5 text-[13px] text-[#b14d57]">{locale === "zh" ? searchError : text.searchLoadError}</p> : null}
              {reportError ? <p className="mx-1 mt-2.5 text-[13px] text-[#b14d57]">{locale === "zh" ? reportError : text.reportLoadError}</p> : null}
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
