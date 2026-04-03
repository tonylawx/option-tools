import type { SellPutReport } from "@/server/report/types";

type Props = {
  report: SellPutReport;
  compact?: boolean;
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

export function ReportPage({ report, compact = false }: Props) {
  return (
    <main style={compact ? styles.compactShell : styles.shell}>
      <section style={compact ? styles.compactPaper : styles.paper}>
        <section style={compact ? styles.compactHero : styles.hero}>
          <div style={styles.heroTop}>
            <p style={styles.heroKicker}>{report.header.kicker}</p>
            <h2 style={styles.heroTitle}>{displaySymbol(report.symbol)} 卖出看跌期权 每日报告</h2>
            <p style={styles.heroDate}>{report.header.dateLine}</p>
            <div style={styles.stars}>
              <span style={styles.starText}>{report.header.starLine}</span>
              <span style={styles.scoreText}>
                {report.score.starScore}/5 {report.summary.actionLabel}
              </span>
            </div>
          </div>

          <div style={styles.metricsGrid}>
            <article style={styles.metricCard}>
              <h3 style={styles.cardTitle}>波动率综合指数 [VCI]</h3>
              {report.vciItems.map((item) => (
                <div key={item.label} style={styles.metricRow}>
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
              ))}
              <div style={styles.vciFooter}>
                <strong style={styles.vciValue}>VCI {fmt(report.score.vci, 3)}</strong>
                <span style={styles.vciCall}>{report.vciConclusion}</span>
              </div>
            </article>

            <article style={styles.metricCard}>
              <h3 style={styles.cardTitle}>市场趋势</h3>
              <dl style={styles.detailList}>
                <div style={styles.detailItem}>
                  <dt>{displaySymbol(report.market.symbolLabel)}</dt>
                  <dd>${fmt(report.market.symbolLast)}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>MA 120</dt>
                  <dd>${fmt(report.market.ma120)}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>Status</dt>
                  <dd>{report.market.trendLabel}</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>Distance</dt>
                  <dd>{fmt(report.market.distanceToMa120, 2)}%</dd>
                </div>
                <div style={styles.detailItem}>
                  <dt>Score</dt>
                  <dd>{fmt(report.score.trend, 1)}</dd>
                </div>
              </dl>
            </article>
          </div>

          <div style={styles.supportCard}>
            <div style={styles.supportHead}>
              <div>
                <p style={styles.supportKicker}>{displaySymbol(report.symbol)} 支撑位分析</p>
                <h3 style={styles.supportTitle}>{displaySymbol(report.symbol)} ${fmt(report.support.underlyingLast)}</h3>
              </div>
              <div style={styles.supportSide}>
                <strong style={styles.supportPrice}>
                  关键支撑位 ${fmt(report.support.keySupport)}
                  <span style={{ ...styles.percentInline, color: percentColor(report.support.keySupportDistance) }}>
                    ({fmt(report.support.keySupportDistance, 1)}%)
                  </span>
                </strong>
                <span style={styles.supportHint}>{report.support.commentary}</span>
              </div>
            </div>
            <div style={styles.supportMeta}>
              <span>支撑位来源：近周期低点 + 斐波那契回撤</span>
              <span>越接近关键支撑，卖方缓冲越薄</span>
            </div>
            <div style={styles.supportGrid}>
              <div>
                <div style={styles.supportHeaderRow}>
                  <span>近期低点</span>
                  <span>价格</span>
                  <span>距离</span>
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
                  <span>斐波那契</span>
                  <span>价格</span>
                  <span>距离</span>
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
            <h3 style={styles.cardTitle}>宏观事件</h3>
            <div style={styles.eventRow}>
              <span>{report.event.name}</span>
              <span>{report.event.dateLabel}</span>
              <span>{report.event.countdownLabel}</span>
              <span style={styles.eventPill}>{report.event.severity}</span>
            </div>
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
    alignItems: "center",
    marginTop: 10
  },
  metricLabel: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 11
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
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap"
  },
  supportKicker: {
    margin: 0,
    fontSize: 11,
    color: "#7b8db1"
  },
  supportTitle: {
    margin: "2px 0 0",
    fontSize: 18
  },
  supportSide: {
    display: "grid",
    gap: 6,
    textAlign: "right"
  },
  supportPrice: {
    color: "var(--amber)"
  },
  percentInline: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 700
  },
  supportHint: {
    color: "var(--muted)",
    maxWidth: 240,
    fontSize: 12
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
    gap: 14
  },
  supportMeta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "var(--muted)",
    fontSize: 11,
    flexWrap: "wrap"
  },
  supportHeaderRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    color: "#8a7b52",
    fontSize: 11,
    fontWeight: 700
  },
  supportRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    padding: "6px 0",
    borderTop: "1px solid var(--line)",
    fontSize: 13
  },
  eventsCard: {
    margin: "0 12px 12px",
    background: "white",
    borderRadius: 18,
    padding: 14,
    border: "1px solid rgba(29, 32, 56, 0.07)"
  },
  eventRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1.2fr repeat(3, 1fr)",
    gap: 12,
    alignItems: "center"
  },
  eventPill: {
    justifySelf: "start",
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--soft-blue)",
    color: "#4f658c",
    fontSize: 11
  },
  docSection: {
    marginTop: 38
  }
};
