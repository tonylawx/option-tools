type CsvRow = Record<string, string>;

type CachedSeries = {
  expiresAt: number;
  rows: CsvRow[];
};

const cache = new Map<string, CachedSeries>();
const TTL_MS = 30 * 60 * 1000;

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((item) => item.trim());

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const values = line.split(",").map((item) => item.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

async function getCsvRows(url: string) {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rows;
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CBOE CSV: ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  cache.set(url, {
    expiresAt: Date.now() + TTL_MS,
    rows
  });

  return rows;
}

function getCloseField(row: CsvRow) {
  if ("CLOSE" in row) return row.CLOSE;
  if ("VVIX" in row) return row.VVIX;
  return "";
}

export async function getCboeSeries(url: string, limit?: number) {
  const rows = await getCsvRows(url);
  const series = rows
    .map((row) => ({
      date: row.DATE,
      close: Number(getCloseField(row))
    }))
    .filter((row) => Number.isFinite(row.close));

  return typeof limit === "number" ? series.slice(-limit) : series;
}

export async function getLatestCboeClose(url: string) {
  const series = await getCboeSeries(url, 1);
  const latest = series[series.length - 1];
  if (!latest) {
    throw new Error(`No CBOE data for ${url}`);
  }
  return latest;
}
