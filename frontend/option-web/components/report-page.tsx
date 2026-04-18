import type { SellPutReport } from "@tonylaw/contracts/report";
import { getVciHint, type Locale, translateVciConclusion, uiCopy } from "@tonylaw/shared/i18n";

type Props = {
  report: SellPutReport;
  compact?: boolean;
  locale?: Locale;
};

function fmt(value: number, digits = 2) {
  return value.toFixed(digits);
}

function displaySymbol(symbol: string) {
  return symbol.replace(/\.US$/, "");
}

function percentClass(value: number) {
  return value >= 0 ? "text-[#1f9d63]" : "text-rose";
}

export function ReportPage({ report, compact = false, locale = "zh" }: Props) {
  const text = uiCopy[locale];
  const eventItems = report.event.items ?? [];

  return (
    <main className={compact ? "" : "px-4 pb-20 pt-8"}>
      <section className={compact ? "mx-auto max-w-[980px]" : "mx-auto max-w-[980px] rounded-[28px] border border-line bg-paper px-[clamp(20px,4vw,48px)] py-12 shadow-[var(--shadow-paper)] backdrop-blur-xl"}>
        <section className={`overflow-hidden rounded-3xl border border-[rgba(29,32,56,0.08)] bg-[#fffaf2] ${compact ? "shadow-[var(--shadow-paper)]" : "mt-8"}`}>
          <div className="bg-linear-to-b from-[#1d2038] to-[#252848] px-6 py-[18px] text-center text-white">
            <p className="m-0 text-[11px] text-white/70">{report.header.kicker}</p>
            <h2 className="my-1 text-2xl font-semibold">{displaySymbol(report.symbol)} {text.pageTitle}</h2>
            <p className="m-0 text-[13px] text-gold">{report.header.dateLine}</p>
            <div className="mt-2.5 flex flex-wrap items-baseline justify-center gap-4">
              <span className="tracking-[0.2em] text-[#ff7c84]">{report.header.starLine}</span>
              <span className="text-2xl font-bold text-[#ffd27c]">{report.score.starScore}/5 {report.summary.actionLabel}</span>
            </div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-2">
            <article className="rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
              <h3 className="m-0 text-base font-semibold">{text.vciTitle}</h3>
              {report.vciItems.map((item) => (
                <div key={item.label} className="mt-2.5">
                  <div className="grid grid-cols-[minmax(72px,112px)_1fr_40px] items-center gap-3">
                    <div>
                      <p className="m-0 text-[11px] text-muted">{item.label}</p>
                      <strong className="text-[15px]">{item.value}</strong>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(29,32,56,0.08)]">
                      <div className="h-full bg-linear-to-r from-[#e76e78] to-[#e8b05b]" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="text-right text-[11px] text-muted">{Math.round(item.progress)}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-[1.25] text-muted">{getVciHint(item.label, locale)}</p>
                </div>
              ))}
              <div className="mt-[18px] flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                <strong className="text-2xl text-rose">VCI {fmt(report.score.vci, 3)}</strong>
                <span className="font-bold text-amber">{translateVciConclusion(report.vciConclusion, locale)}</span>
              </div>
            </article>

            <article className="rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
              <h3 className="m-0 text-base font-semibold">{text.marketTitle}</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-4"><dt>{displaySymbol(report.market.symbolLabel)}</dt><dd>${fmt(report.market.symbolLast)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{text.ma120}</dt><dd>${fmt(report.market.ma120)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{text.status}</dt><dd>{report.market.trendLabel}</dd></div>
                <div className="flex justify-between gap-4"><dt>{text.distance}</dt><dd className={percentClass(report.market.distanceToMa120)}>{fmt(report.market.distanceToMa120, 2)}%</dd></div>
              </dl>
            </article>
          </div>

          <div className="mx-3 mb-3 rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="m-0 text-[11px] text-[#7b8db1]">{displaySymbol(report.symbol)} {text.supportTitle}</p>
                <h3 className="mt-0.5 text-lg font-semibold">{displaySymbol(report.symbol)} ${fmt(report.support.underlyingLast)}</h3>
              </div>
              <div className="grid gap-1.5 text-right">
                <strong className="text-amber">
                  {text.keySupport} ${fmt(report.support.keySupport)}
                  <span className={`ml-1.5 text-sm font-bold ${percentClass(report.support.keySupportDistance)}`}>
                    ({fmt(report.support.keySupportDistance, 1)}%)
                  </span>
                </strong>
                <span className="max-w-60 text-xs text-muted">{report.support.commentary}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-3 text-[11px] text-muted">
              <span>{text.supportMetaLeft}</span>
              <span>{text.supportMetaRight}</span>
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-bold text-[#8a7b52]">
                  <span>{text.recentLows}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div className="mt-2 grid gap-1.5">
                  {report.support.windows.map((window) => (
                    <div key={window.label} className="grid grid-cols-3 gap-3 border-t border-line py-1.5 text-[13px]">
                      <span>{window.label}</span>
                      <span>${fmt(window.low)}</span>
                      <span className={percentClass(window.distancePercent)}>{fmt(window.distancePercent, 1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-bold text-[#8a7b52]">
                  <span>{text.fib}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div className="mt-2 grid gap-1.5">
                  {report.support.fibLevels.map((level) => (
                    <div key={level.label} className="grid grid-cols-3 gap-3 border-t border-line py-1.5 text-[13px]">
                      <span>{level.label}</span>
                      <span>${fmt(level.price)}</span>
                      <span className={percentClass(level.distancePercent)}>{fmt(level.distancePercent, 1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-3 mb-3 rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
            <h3 className="m-0 text-base font-semibold">{text.eventTitle}</h3>
            <p className="mt-1.5 text-xs leading-6 text-muted">{text.eventHint}</p>
            {eventItems.length > 0 ? (
              <div className="mt-3 grid gap-2.5">
                {eventItems.map((item) => (
                  <div key={`${item.label}-${item.name}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(29,32,56,0.06)] py-3">
                    <div className="grid gap-1">
                      <strong className="text-base leading-5">{item.name}</strong>
                      {item.impactsScore ? <span className="text-xs font-bold text-rose">{text.eventImpact}</span> : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                      <span className={`text-xs ${item.impactsScore ? "text-rose" : "text-muted"}`}>{item.dateLabel} · {item.countdownLabel}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${item.impactsScore ? "bg-[rgba(200,93,104,0.12)] text-rose" : "bg-soft-blue text-[#4f658c]"}`}>
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 border-t border-[rgba(29,32,56,0.06)] pt-3 text-sm text-muted">{text.eventNone}</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
