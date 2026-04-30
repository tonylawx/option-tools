import type { SellPutReport } from "@/server/report/types";
import {
  getVciHint,
  Locale,
  translateVciConclusion,
  uiCopy
} from "@/shared/i18n";

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

function percentColor(value: number): string {
  return value >= 0 ? "#1f9d63" : "#c85d68";
}

function starScoreColor(starScore: number): string {
  if (starScore <= 2) {
    return "#c85d68";
  }

  if (starScore === 3) {
    return "#c89a2d";
  }

  return "#1f9d63";
}

export function ReportPage({ report, compact = false, locale = "zh" }: Props) {
  const text = uiCopy[locale];
  const eventItems = report.event.items ?? [];
  const starColor = starScoreColor(report.score.starScore);

  return (
    <main style={compact ? styles.compactShell : styles.shell}>
      <section style={compact ? styles.compactPaper : styles.paper}>
        <section style={compact ? styles.compactHero : styles.hero}>
          <div style={styles.heroTop}>
            <p style={styles.heroKicker}>{report.header.kicker}</p>
            <h2 style={styles.heroTitle}>{displaySymbol(report.symbol)} {text.pageTitle}</h2>
            <p style={styles.heroDate}>{report.header.dateLine}</p>
            <div style={styles.stars}>
              <span style={{ ...styles.starText, color: starColor }}>{report.header.starLine}</span>
              <span style={{ ...styles.scoreText, color: starColor }}>
                {report.score.starScore}/5 {report.summary.actionLabel}
              </span>
            </div>
          </div>

          <div style={styles.metricsGrid}>
            <article style={styles.metricCard}>
              <h3 style={styles.cardTitle}>{text.vciTitle}</h3>
              {report.vciItems.map((item) => (
                <div key={item.label} style={styles.metricBlock}>
                  <div style={styles.metricRow}>
                    <div>
                      <p style={styles.metricLabel}>{item.label}</p>
                      <strong style={styles.metricValue}>{item.value}</strong>
                    </div>
                    <div style={styles.barWrap}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${item.progress}%`
                        }}
                      />
                    </div>
                    <span style={styles.weight}>{Math.round(item.progress)}</span>
                  </div>
                    <p style={styles.metricHintBottom}>{getVciHint(item.label, locale)}</p>
                </div>
              ))}
              <div style={styles.vciFooter}>
                <strong style={styles.vciValue}>VCI {fmt(report.score.vci, 3)}</strong>
                <span style={styles.vciCall}>{translateVciConclusion(report.vciConclusion, locale)}</span>
              </div>
            </article>

            <article style={styles.metricCard}>
              <h3 style={styles.cardTitle}>{text.marketTitle}</h3>
              <dl style={styles.detailList}>
                <div style={styles.detailItem}>
                  <dt>{displaySymbol(report.market.symbolLabel)}</dt>
                  <dd>${fmt(report.market.symbolLast)}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>{text.ma120}</dt>
                  <dd>${fmt(report.market.ma120)}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>{text.status}</dt>
                  <dd>{report.market.trendLabel}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>{text.distance}</dt>
                  <dd style={{ color: percentColor(report.market.distanceToMa120) }}>
                    {fmt(report.market.distanceToMa120, 2)}%
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <div style={styles.supportCard}>
            <div style={styles.supportHead}>
              <div>
                <p style={styles.supportKicker}>{displaySymbol(report.symbol)} {text.supportTitle}</p>
                <h3 style={styles.supportTitle}>{displaySymbol(report.symbol)} ${fmt(report.support.underlyingLast)}</h3>
              </div>
              <div style={styles.supportSide}>
                <strong style={styles.supportPrice}>
                  {text.keySupport} ${fmt(report.support.keySupport)}
                  <span style={{ ...styles.percentInline, color: percentColor(report.support.keySupportDistance) }}>
                    ({fmt(report.support.keySupportDistance, 1)}%)
                  </span>
                </strong>
                <span style={styles.supportHint}>{report.support.commentary}</span>
              </div>
            </div>
            {/*<div style={styles.supportMeta}>*/}
            {/*  <span>{text.supportMetaLeft}</span>*/}
            {/*  <span>{text.supportMetaRight}</span>*/}
            {/*</div>*/}
            <div style={styles.supportGrid}>
              <div>
                <div style={styles.supportHeaderRow}>
                  <span>{text.recentLows}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div style={styles.supportTable}>
                  {report.support.windows.map((window) => (
                    <div key={window.label} style={styles.supportRow}>
                      <span>{window.label}</span>
                      <span>${fmt(window.low)}</span>
                      <span style={{ color: percentColor(window.distancePercent) }}>
                        {fmt(window.distancePercent, 1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={styles.supportHeaderRow}>
                  <span>{text.fib}</span>
                  <span>{text.price}</span>
                  <span>{text.distance}</span>
                </div>
                <div style={styles.supportTable}>
                  {report.support.fibLevels.map((level) => (
                    <div key={level.label} style={styles.supportRow}>
                      <span>{level.label}</span>
                      <span>${fmt(level.price)}</span>
                      <span style={{ color: percentColor(level.distancePercent) }}>
                        {fmt(level.distancePercent, 1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.eventsCard}>
            <h3 style={styles.cardTitle}>{text.eventTitle}</h3>
            <p style={styles.eventHint}>{text.eventHint}</p>
            {eventItems.length > 0 ? (
              <div style={styles.eventsList}>
                {eventItems.map((item) => (
                  <div key={`${item.label}-${item.name}`} style={styles.eventListRow}>
                    <div style={styles.eventListMain}>
                      <strong style={styles.eventListTitle}>{item.name}</strong>
                      {item.impactsScore ? (
                        <span style={styles.eventImpact}>{text.eventImpact}</span>
                      ) : null}
                    </div>
                    <div style={styles.eventListSide}>
                      <span style={{ ...styles.earningsMeta, color: item.impactsScore ? "#c85d68" : "var(--muted)" }}>
                        {item.dateLabel} · {item.countdownLabel}
                      </span>
                      <span
                        style={{
                          ...styles.eventPill,
                          background: item.impactsScore ? "rgba(200, 93, 104, 0.12)" : "var(--soft-blue)",
                          color: item.impactsScore ? "#c85d68" : "#4f658c"
                        }}
                      >
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.eventEmpty}>{text.eventNone}</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    padding: "32px 16px 80px"
  },
  compactShell: {
    padding: 0
  },
  paper: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "48px clamp(20px, 4vw, 48px)",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 28,
    boxShadow: "var(--shadow)",
    backdropFilter: "blur(12px)"
  },
  compactPaper: {
    maxWidth: 980,
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-start",
    flexWrap: "wrap"
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--muted)"
  },
  title: {
    margin: "8px 0 10px",
    fontSize: "clamp(34px, 6vw, 56px)",
    lineHeight: 1.02
  },
  meta: {
    margin: 0,
    color: "var(--muted)"
  },
  badge: {
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid rgba(201, 169, 106, 0.35)",
    background: "rgba(201, 169, 106, 0.12)",
    color: "var(--navy)",
    fontWeight: 700
  },
  intro: {
    display: "grid",
    gap: 10,
    marginTop: 28,
    color: "#394150",
    lineHeight: 1.9
  },
  hero: {
    marginTop: 34,
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(29, 32, 56, 0.08)",
    background: "#fffaf2"
  },
  compactHero: {
    marginTop: 0,
    borderRadius: 24,
    overflow: "hidden",
    border: "1px solid rgba(29, 32, 56, 0.08)",
    background: "#fffaf2",
    boxShadow: "var(--shadow)"
  },
  heroTop: {
    padding: "18px 24px",
    background: "linear-gradient(180deg, #1d2038 0%, #252848 100%)",
    color: "white",
    textAlign: "center"
  },
  heroKicker: {
    margin: 0,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11
  },
  heroTitle: {
    margin: "4px 0",
    fontSize: 24
  },
  heroDate: {
    margin: 0,
    color: "#c9a96a",
    fontSize: 13
  },
  stars: {
    marginTop: 10,
    display: "flex",
    gap: 16,
    justifyContent: "center",
    alignItems: "baseline",
    flexWrap: "wrap"
  },
  starText: {
    color: "#ff7c84",
    letterSpacing: "0.2em"
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffd27c"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
    padding: 12
  },
  metricCard: {
    background: "white",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(29, 32, 56, 0.07)"
  },
  cardTitle: {
    margin: 0,
    fontSize: 16
  },
  metricRow: {
    display: "grid",
    gridTemplateColumns: "minmax(72px, 112px) 1fr 40px",
    gap: 12,
    alignItems: "center"
  },
  metricBlock: {
    marginTop: 10
  },
  metricLabel: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 11
  },
  metricHintBottom: {
    margin: "6px 0 0",
    color: "var(--muted)",
    fontSize: 10,
    lineHeight: 1.25
  },
  metricValue: {
    fontSize: 15
  },
  barWrap: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    background: "rgba(29, 32, 56, 0.08)"
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #e76e78 0%, #e8b05b 100%)"
  },
  weight: {
    color: "var(--muted)",
    fontSize: 11,
    textAlign: "right"
  },
  vciFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 18,
    paddingTop: 16,
    borderTop: "1px solid var(--line)",
    alignItems: "center",
    flexWrap: "wrap"
  },
  vciValue: {
    fontSize: 24,
    color: "var(--rose)"
  },
  vciCall: {
    color: "var(--amber)",
    fontWeight: 700
  },
  detailList: {
    margin: "12px 0 0",
    display: "grid",
    gap: 8,
    fontSize: 14
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18
  },
  supportCard: {
    margin: "0 12px 12px",
    background: "white",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(29, 32, 56, 0.07)"
  },
  supportHead: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    alignItems: "start"
  },
  supportKicker: {
    margin: 0,
    fontSize: 11,
    color: "#7b8db1"
  },
  supportTitle: {
    margin: "2px 0 0",
    fontSize: "clamp(15px, 4.6vw, 18px)",
    lineHeight: 1.15
  },
  supportSide: {
    display: "grid",
    gap: 8,
    textAlign: "left",
    justifyItems: "start"
  },
  supportPrice: {
    color: "var(--amber)",
    fontSize: "clamp(15px, 5vw, 18px)",
    lineHeight: 1.2
  },
  percentInline: {
    marginLeft: 6,
    fontSize: "clamp(12px, 4vw, 14px)",
    fontWeight: 700
  },
  supportHint: {
    color: "var(--muted)",
    maxWidth: 420,
    fontSize: 11,
    lineHeight: 1.55
  },
  supportTable: {
    marginTop: 8,
    display: "grid",
    gap: 6
  },
  supportGrid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10
  },
  supportMeta: {
    marginTop: 8,
    display: "grid",
    gap: 6,
    color: "var(--muted)",
    fontSize: 10,
    lineHeight: 1.5
  },
  supportHeaderRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.8fr)",
    gap: 8,
    color: "#8a7b52",
    fontSize: 10,
    fontWeight: 700
  },
  supportRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 0.8fr)",
    gap: 8,
    padding: "6px 0",
    borderTop: "1px solid var(--line)",
    fontSize: 12,
    alignItems: "center"
  },
  eventsCard: {
    margin: "0 12px 12px",
    background: "white",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(29, 32, 56, 0.07)"
  },
  eventHint: {
    margin: "6px 0 0",
    color: "var(--muted)",
    fontSize: 12,
    lineHeight: 1.5
  },
  eventsList: {
    marginTop: 12,
    display: "grid",
    gap: 10
  },
  eventListRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "12px 0",
    borderTop: "1px solid rgba(29, 32, 56, 0.06)"
  },
  eventListMain: {
    display: "grid",
    gap: 4
  },
  eventListTitle: {
    fontSize: 16,
    lineHeight: 1.25
  },
  eventImpact: {
    color: "#c85d68",
    fontSize: 12,
    fontWeight: 700
  },
  eventListSide: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  eventEmpty: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid rgba(29, 32, 56, 0.06)",
    color: "var(--muted)",
    fontSize: 13
  },
  earningsBlock: {
    display: "grid",
    gap: 8,
    padding: 12,
    borderRadius: 16,
    background: "rgba(244, 246, 252, 0.85)",
    border: "1px solid rgba(29, 32, 56, 0.06)"
  },
  eventBlockTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  eventPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--soft-blue)",
    color: "#4f658c",
    fontSize: 11
  },
  earningsLabel: {
    color: "#8a7b52",
    fontSize: 11,
    fontWeight: 700
  },
  earningsTitleText: {
    fontSize: 18,
    lineHeight: 1.2
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: 700
  },
  earningsMeta: {
    color: "var(--muted)",
    fontSize: 12
  },
  inlineMetaRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  },
  earningsFootnote: {
    color: "var(--muted)",
    fontSize: 12,
    lineHeight: 1.5
  },
  docSection: {
    marginTop: 38
  }
};
