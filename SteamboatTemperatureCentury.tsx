import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SteamboatTemperatureCentury.jsx
 *
 * Self-contained React component. No charting library required.
 * Data source: NOAA NCEI Daily Summaries, station USC00057936.
 *
 * Drop into a React/Vite/Next project and render:
 *   <SteamboatTemperatureCentury />
 */

const STATION = "USC00057936";
const START_YEAR = 1926;
const END_YEAR = 2025;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const SEASONS = {
  Annual: [1,2,3,4,5,6,7,8,9,10,11,12],
  Winter: [12,1,2],
  Spring: [3,4,5],
  Summer: [6,7,8],
  Fall: [9,10,11],
};

const METRICS = {
  mean: { label: "Mean temperature", short: "Mean", key: "mean" },
  high: { label: "Average daily high", short: "High", key: "high" },
  low:  { label: "Average daily low", short: "Low", key: "low" },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f1e8",
    color: "#171717",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "32px",
  },
  shell: { maxWidth: 1180, margin: "0 auto" },
  eyebrow: {
    fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
    fontWeight: 700, color: "#6d655a", marginBottom: 8
  },
  title: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 0.98,
    letterSpacing: "-0.045em", margin: 0, maxWidth: 880
  },
  dek: { fontSize: 17, lineHeight: 1.55, color: "#514b43", maxWidth: 760, marginTop: 18 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12, margin: "28px 0 18px"
  },
  card: {
    background: "rgba(255,255,255,.65)", border: "1px solid #d8d0c2",
    borderRadius: 14, padding: "14px 16px"
  },
  label: { fontSize: 11, color: "#70685e", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 },
  value: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 31, marginTop: 4 },
  controls: {
    display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end",
    padding: 16, background: "#171717", color: "#fff", borderRadius: 15,
    marginBottom: 16
  },
  control: { display: "grid", gap: 6, minWidth: 150 },
  controlLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "#bdb7ae", fontWeight: 700 },
  select: {
    appearance: "none", border: "1px solid #4a4a4a", background: "#252525",
    color: "#fff", borderRadius: 9, padding: "10px 34px 10px 11px", fontSize: 14
  },
  chartCard: {
    background: "#fffdfa", border: "1px solid #d8d0c2",
    borderRadius: 16, padding: "16px", boxShadow: "0 18px 50px rgba(49,39,25,.07)"
  },
  foot: { fontSize: 12, color: "#6d655a", lineHeight: 1.55, marginTop: 12 },
  panel: {
    background: "#fffdfa", border: "1px solid #d8d0c2",
    borderRadius: 16, padding: "20px 22px", marginTop: 16
  },
  panelHead: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    gap: 12, flexWrap: "wrap", marginBottom: 12
  },
  h2: {
    fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26,
    letterSpacing: "-0.02em", fontWeight: 400, margin: 0
  },
  panelNote: { fontSize: 12, color: "#70685e" },
  statRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 18, padding: "16px 0", borderTop: "1px solid #ece6dc", borderBottom: "1px solid #ece6dc"
  },
  statBig: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 28, marginTop: 6, lineHeight: 1.1 },
  statQual: { fontSize: 13, color: "#70685e" },
  sub: { fontSize: 12, color: "#70685e", marginTop: 6 },
  read: { fontSize: 15, lineHeight: 1.6, color: "#3f3a34", marginTop: 14, maxWidth: 780 },
  tableWrap: { overflowX: "auto", marginTop: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 620 },
  th: {
    textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em",
    color: "#70685e", fontWeight: 700, padding: "10px 12px 10px 0", borderBottom: "1px solid #d8d0c2"
  },
  td: { padding: "13px 12px 13px 0", borderBottom: "1px solid #ece6dc", verticalAlign: "top" },
  tdNum: {
    padding: "13px 12px 13px 0", borderBottom: "1px solid #ece6dc", verticalAlign: "top",
    fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 17, whiteSpace: "nowrap"
  },
  chip: {
    display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
    textTransform: "uppercase", padding: "4px 9px", borderRadius: 999,
    border: "1px solid #c9c1b3", color: "#3f3a34", whiteSpace: "nowrap"
  },
  chipQuiet: { borderColor: "#e2dacc", color: "#8a8278" },
  chipFlag: { borderColor: "#9b2c2c", color: "#9b2c2c" },
  caution: { fontSize: 12, color: "#9b2c2c", marginTop: 5 },
  caveat: {
    fontSize: 13, lineHeight: 1.65, color: "#5a544c", background: "#f5f1e8",
    border: "1px solid #e2dacc", borderRadius: 12, padding: "15px 17px", marginTop: 18
  },
  button: {
    border: "1px solid #4a4a4a", background: "#252525", color: "#fff",
    borderRadius: 9, padding: "10px 12px", cursor: "pointer"
  }
};

/**
 * Strict numeric parse for CSV cells.
 * Number("") and Number(" ") both return 0, which would silently record a
 * missing NOAA observation as a 0-degree reading. Anything blank or
 * non-numeric returns NaN so it is excluded by the Number.isFinite guards.
 */
function num(v) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (s === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function mean(values) {
  const good = values.filter(Number.isFinite);
  return good.length ? good.reduce((a,b) => a+b, 0) / good.length : null;
}

function regression(points) {
  const good = points.filter(d => Number.isFinite(d.value));
  if (good.length < 2) return { slope: 0, intercept: 0 };
  const x0 = good[0].year;
  const xs = good.map(d => d.year - x0);
  const ys = good.map(d => d.value);
  const xBar = mean(xs), yBar = mean(ys);
  const num = xs.reduce((s,x,i) => s + (x-xBar)*(ys[i]-yBar), 0);
  const den = xs.reduce((s,x) => s + (x-xBar)**2, 0);
  const slope = den ? num / den : 0;
  return { slope, intercept: yBar - slope*xBar, x0 };
}

function movingAverage(points, windowSize) {
  if (windowSize <= 1) return points.map(d => ({...d, smooth: d.value}));
  const half = Math.floor(windowSize / 2);
  return points.map((d, i) => {
    const slice = points.slice(Math.max(0, i-half), Math.min(points.length, i+half+1));
    return { ...d, smooth: mean(slice.map(x => x.value)) };
  });
}

function seasonYear(date, season) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  // Attribute December to the following winter so DJF stays together.
  return season === "Winter" && m === 12 ? y + 1 : y;
}

function csvToRows(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(x => x.replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const cells = [];
    let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') quoted = !quoted;
      else if (c === "," && !quoted) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    return Object.fromEntries(headers.map((h,i) => [h, cells[i] ?? ""]));
  });
}

async function fetchChunk(startYear, endYear) {
  const params = new URLSearchParams({
    dataset: "daily-summaries",
    stations: STATION,
    startDate: `${startYear}-01-01`,
    endDate: `${endYear}-12-31`,
    format: "csv",
    units: "standard",
    includeAttributes: "false",
    includeStationName: "true",
  });
  const url = `https://www.ncei.noaa.gov/access/services/data/v1?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NOAA request failed (${res.status})`);
  return csvToRows(await res.text());
}

/**
 * Local-first loading. Commit the NOAA export next to this page as
 * steamboat-daily.csv and it is used directly; the live NOAA request is
 * only attempted if the local file is missing, which is what happens on
 * hosts that block the cross-origin call.
 */
const LOCAL_DATA_URL = "./steamboat-daily.csv";

async function fetchLocal() {
  const res = await fetch(LOCAL_DATA_URL);
  if (!res.ok) throw new Error(`No local data file at ${LOCAL_DATA_URL} (${res.status}).`);
  const rows = csvToRows(await res.text());
  if (!rows.length) throw new Error(`Local data file at ${LOCAL_DATA_URL} is empty.`);
  if (!("TMAX" in rows[0]) || !("TMIN" in rows[0]) || !("DATE" in rows[0])) {
    throw new Error("Local data file is missing DATE, TMAX or TMIN columns.");
  }
  return rows;
}

async function fetchRemote() {
  const chunks = [];
  for (let y = START_YEAR; y <= END_YEAR; y += 10) {
    chunks.push(fetchChunk(y, Math.min(y + 9, END_YEAR)));
  }
  const parts = await Promise.all(chunks);
  return parts.flat();
}

async function fetchCentury() {
  try {
    return await fetchLocal();
  } catch (localErr) {
    try {
      return await fetchRemote();
    } catch (remoteErr) {
      throw new Error(`${localErr.message} Live NOAA request also failed: ${remoteErr.message}`);
    }
  }
}


// ---------------------------------------------------------------------------
// Detection statistics
//
// A single station cannot attribute warming to any cause. What it can do is
// test whether an observed trend is distinguishable from autocorrelated noise,
// and whether the warming carries the pattern greenhouse forcing predicts.
// Everything below is detection and consistency, not attribution.
// ---------------------------------------------------------------------------

const BASELINE_END = START_YEAR + 29;   // 1926-1955 reference period for extremes
const MIN_DAYS = 300;                   // annual coverage required for a year to count
const MIN_SEASON_DAYS = 75;             // seasonal coverage required (of ~90)
const SURROGATES = 4000;

function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/** Deterministic PRNG so the reported p-value does not jitter between renders. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function olsSlope(xs, ys) {
  const xBar = mean(xs), yBar = mean(ys);
  let sxx = 0, sxy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxx += (xs[i] - xBar) ** 2;
    sxy += (xs[i] - xBar) * (ys[i] - yBar);
  }
  const slope = sxx ? sxy / sxx : 0;
  return { slope, intercept: yBar - slope * xBar, sxx };
}

/**
 * OLS trend with a standard error widened for serial correlation, following the
 * effective-sample-size approach in Santer et al. (2000): annual temperatures are
 * not independent draws, so the naive interval is too narrow. The p-value is
 * empirical: how often does an AR(1) series with the same variance and lag-1
 * correlation but no underlying trend produce a slope this large by chance?
 */
function trendStats(points, iterations = SURROGATES) {
  const good = points.filter(d => Number.isFinite(d.value));
  const n = good.length;
  if (n < 12) return null;

  const x0 = good[0].year;
  const xs = good.map(d => d.year - x0);
  const ys = good.map(d => d.value);
  const { slope, intercept, sxx } = olsSlope(xs, ys);

  const resid = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const rBar = mean(resid);
  let numer = 0, denom = 0;
  for (let i = 1; i < n; i++) numer += (resid[i] - rBar) * (resid[i - 1] - rBar);
  for (let i = 0; i < n; i++) denom += (resid[i] - rBar) ** 2;
  const r1 = denom ? numer / denom : 0;

  // Negative autocorrelation does not inflate uncertainty; clamp to avoid it
  // shrinking the interval, and cap to keep nEff from collapsing.
  // The lag-1 estimate from OLS residuals is biased low; the Kendall/Marriott-Pope
  // correction below keeps the test from being too liberal on short records.
  const r1Adj = (r1 * (n - 1) + 1) / (n - 4);
  const phi = Math.min(0.95, Math.max(0, r1Adj));
  const nEff = Math.max(4, (n * (1 - phi)) / (1 + phi));
  const sse = resid.reduce((s, r) => s + r * r, 0);
  const se = Math.sqrt((sse / (nEff - 2)) / sxx);

  // Normal approximation to the t interval; nEff is comfortably above 30 for a
  // century of annual values, and the surrogate test is the headline anyway.
  const half = 1.96 * se;

  const sigma = Math.sqrt((sse / (n - 2)) * (1 - phi * phi));
  const rand = mulberry32(20260724);
  let atLeastAsLarge = 0;
  const surrogate = new Array(n);
  for (let k = 0; k < iterations; k++) {
    let prev = gaussian(rand) * (phi < 1 ? sigma / Math.sqrt(1 - phi * phi) : sigma);
    for (let i = 0; i < n; i++) {
      prev = phi * prev + sigma * gaussian(rand);
      surrogate[i] = prev;
    }
    if (Math.abs(olsSlope(xs, surrogate).slope) >= Math.abs(slope)) atLeastAsLarge++;
  }

  return {
    n,
    perDecade: slope * 10,
    ciLow: (slope - half) * 10,
    ciHigh: (slope + half) * 10,
    r1,
    nEff,
    p: atLeastAsLarge / iterations,
    iterations,
  };
}

/** Direction a diagnostic should move if greenhouse forcing dominates. */
function readTrend(stat, expected) {
  if (!stat) return { verdict: "no data", tone: "quiet" };
  const spansZero = stat.ciLow <= 0 && stat.ciHigh >= 0;
  if (spansZero) return { verdict: "inconclusive", tone: "quiet" };
  const sign = stat.perDecade > 0 ? 1 : -1;
  return sign === expected
    ? { verdict: "consistent", tone: "match" }
    : { verdict: "counter", tone: "flag" };
}

function fmtTrend(v, unit, kind) {
  if (!Number.isFinite(v)) return "\u2014";
  const suffix = kind === "count" ? " days" : `\u00b0${unit}`;
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}${suffix}`;
}

function fmtChance(p, iterations) {
  if (!Number.isFinite(p)) return "\u2014";
  if (p === 0) return `under 1 in ${iterations.toLocaleString()}`;
  if (p < 0.01) return `${(p * 100).toFixed(2)}%`;
  return `${(p * 100).toFixed(1)}%`;
}

function formatTemp(v, unit) {
  if (!Number.isFinite(v)) return "—";
  if (unit === "C") return `${((v - 32) * 5/9).toFixed(1)}°C`;
  return `${v.toFixed(1)}°F`;
}

function convert(v, unit) {
  if (!Number.isFinite(v)) return null;
  return unit === "C" ? (v - 32) * 5/9 : v;
}

export default function SteamboatTemperatureCentury() {
  const [raw, setRaw] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [metric, setMetric] = useState("mean");
  const [season, setSeason] = useState("Annual");
  const [unit, setUnit] = useState("F");
  const [smooth, setSmooth] = useState(10);
  const [fromYear, setFromYear] = useState(START_YEAR);
  const [toYear, setToYear] = useState(END_YEAR);
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let live = true;
    setStatus("loading");
    fetchCentury()
      .then(rows => {
        if (!live) return;
        setRaw(rows);
        setStatus("ready");
      })
      .catch(err => {
        if (!live) return;
        setError(err.message || "Unable to load NOAA data.");
        setStatus("error");
      });
    return () => { live = false; };
  }, []);

  const annual = useMemo(() => {
    const buckets = new Map();
    const allowed = new Set(SEASONS[season]);

    for (const row of raw) {
      if (!row.DATE) continue;
      const date = new Date(`${row.DATE}T00:00:00Z`);
      const month = date.getUTCMonth() + 1;
      if (!allowed.has(month)) continue;

      const year = seasonYear(date, season);
      if (year < START_YEAR || year > END_YEAR) continue;

      const tmax = num(row.TMAX);
      const tmin = num(row.TMIN);
      const dailyMean = Number.isFinite(tmax) && Number.isFinite(tmin) ? (tmax + tmin) / 2 : null;

      if (!buckets.has(year)) buckets.set(year, { highs: [], lows: [], means: [], days: 0 });
      const b = buckets.get(year);
      if (Number.isFinite(tmax)) b.highs.push(tmax);
      if (Number.isFinite(tmin)) b.lows.push(tmin);
      if (Number.isFinite(dailyMean)) b.means.push(dailyMean);
      b.days += 1;
    }

    return Array.from({length: END_YEAR - START_YEAR + 1}, (_,i) => {
      const year = START_YEAR + i;
      const b = buckets.get(year);
      return {
        year,
        high: b ? mean(b.highs) : null,
        low: b ? mean(b.lows) : null,
        mean: b ? mean(b.means) : null,
        days: b?.days || 0,
      };
    });
  }, [raw, season]);

  const series = useMemo(() => {
    const base = annual
      .filter(d => d.year >= fromYear && d.year <= toYear)
      .map(d => ({ year: d.year, value: convert(d[metric], unit), days: d.days }));
    return movingAverage(base, smooth);
  }, [annual, metric, unit, smooth, fromYear, toYear]);

  const stats = useMemo(() => {
    const valid = series.filter(d => Number.isFinite(d.value));
    if (!valid.length) return {};
    const reg = regression(valid);
    const warmest = valid.reduce((a,b) => b.value > a.value ? b : a);
    const coldest = valid.reduce((a,b) => b.value < a.value ? b : a);
    const firstDecade = valid.filter(d => d.year < valid[0].year + 10);
    const lastDecade = valid.filter(d => d.year > valid[valid.length-1].year - 10);
    return {
      average: mean(valid.map(d => d.value)),
      warmest,
      coldest,
      changePerCentury: reg.slope * 100,
      decadeShift: mean(lastDecade.map(d => d.value)) - mean(firstDecade.map(d => d.value)),
      reg,
    };
  }, [series]);

  const chart = useMemo(() => {
    const W = 1120, H = 500;
    const m = { top: 34, right: 26, bottom: 54, left: 68 };
    const valid = series.filter(d => Number.isFinite(d.value));
    if (!valid.length) return { W,H,m,valid:[], yTicks:[] };

    let yMin = Math.floor(Math.min(...valid.map(d => d.value)) / 5) * 5 - 2;
    let yMax = Math.ceil(Math.max(...valid.map(d => d.value)) / 5) * 5 + 2;
    if (yMax - yMin < 10) { yMin -= 5; yMax += 5; }

    const x = year => m.left + ((year - fromYear) / Math.max(1, toYear-fromYear)) * (W-m.left-m.right);
    const y = value => m.top + ((yMax-value)/(yMax-yMin))*(H-m.top-m.bottom);
    const path = valid.map((d,i) => `${i ? "L" : "M"} ${x(d.year).toFixed(2)} ${y(d.value).toFixed(2)}`).join(" ");
    const smoothPath = valid.filter(d => Number.isFinite(d.smooth))
      .map((d,i) => `${i ? "L" : "M"} ${x(d.year).toFixed(2)} ${y(d.smooth).toFixed(2)}`).join(" ");

    const reg = stats.reg || {slope:0, intercept:0, x0:fromYear};
    const regValue = yr => reg.intercept + reg.slope*(yr-reg.x0);
    const trendPath = `M ${x(fromYear)} ${y(regValue(fromYear))} L ${x(toYear)} ${y(regValue(toYear))}`;
    const yTicks = Array.from({length: 6}, (_,i) => yMin + i*(yMax-yMin)/5);
    const xStep = toYear-fromYear > 70 ? 20 : toYear-fromYear > 35 ? 10 : 5;
    const xTicks = [];
    for (let yr = Math.ceil(fromYear/xStep)*xStep; yr <= toYear; yr += xStep) xTicks.push(yr);

    return { W,H,m,valid,yMin,yMax,x,y,path,smoothPath,trendPath,yTicks,xTicks };
  }, [series, fromYear, toYear, stats]);

  // Daily records normalised once, independent of the season and range controls.
  const daily = useMemo(() => {
    const out = [];
    for (const row of raw) {
      const d = row.DATE;
      if (!d || d.length < 7) continue;
      const year = Number(d.slice(0, 4));
      const month = Number(d.slice(5, 7));
      if (!Number.isFinite(year) || year < START_YEAR || year > END_YEAR) continue;
      const tmax = num(row.TMAX);
      const tmin = num(row.TMIN);
      if (!Number.isFinite(tmax) && !Number.isFinite(tmin)) continue;
      out.push({ year, month, tmax, tmin });
    }
    return out;
  }, [raw]);

  // Detection: does the trend currently on screen survive a noise null?
  const detection = useMemo(() => trendStats(series), [series]);

  const detectionRead = useMemo(() => {
    if (!detection) return "";
    const dir = detection.perDecade >= 0 ? "warming" : "cooling";
    const chance = fmtChance(detection.p, detection.iterations);
    if (detection.p >= 0.05) {
      return `Over this window the ${dir} cannot be separated from ordinary year-to-year variability: a trend at least this large turned up in ${chance} of synthetic series built to contain no signal at all.`;
    }
    return `The ${dir} is larger than variability alone tends to produce. A trend at least this large appeared in ${chance} of synthetic series with the same variance and year-to-year persistence but no underlying signal. That is evidence the trend is real. It is not yet evidence of what caused it.`;
  }, [detection]);

  // Fingerprint: always computed on the full record, not the cropped range.
  const diagnostics = useMemo(() => {
    if (!daily.length) return null;
    const k = unit === "C" ? 5 / 9 : 1;   // trends are differences, so no offset

    const base = daily.filter(d => d.year <= BASELINE_END);
    const warmThreshold = percentile(base.map(d => d.tmax), 0.9);
    const coldThreshold = percentile(base.map(d => d.tmin), 0.1);

    const byYear = new Map();
    const bucket = y => {
      if (!byYear.has(y)) byYear.set(y, { maxes: [], mins: [], dtr: [], winter: [], summer: [], warm: 0, cold: 0, days: 0 });
      return byYear.get(y);
    };

    for (const d of daily) {
      const b = bucket(d.year);
      b.days += 1;
      if (Number.isFinite(d.tmax)) {
        b.maxes.push(d.tmax);
        if (Number.isFinite(warmThreshold) && d.tmax >= warmThreshold) b.warm += 1;
      }
      if (Number.isFinite(d.tmin)) {
        b.mins.push(d.tmin);
        if (Number.isFinite(coldThreshold) && d.tmin <= coldThreshold) b.cold += 1;
      }
      if (Number.isFinite(d.tmax) && Number.isFinite(d.tmin)) {
        b.dtr.push(d.tmax - d.tmin);
        const m = (d.tmax + d.tmin) / 2;
        if (d.month >= 6 && d.month <= 8) b.summer.push(m);
        if (d.month === 12) bucket(d.year + 1).winter.push(m);
        else if (d.month <= 2) b.winter.push(m);
      }
    }

    const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
    const build = (pick, minDays) => years.map(year => {
      const b = byYear.get(year);
      const enough = b && (minDays === MIN_DAYS ? b.days >= MIN_DAYS : true);
      return { year, value: enough ? pick(b) : null };
    });
    const seasonal = pick => years.map(year => {
      const b = byYear.get(year);
      const arr = b ? pick(b) : [];
      return { year, value: arr.length >= MIN_SEASON_DAYS ? mean(arr) : null };
    });
    const scale = (stat) => stat && {
      ...stat,
      perDecade: stat.perDecade * k, ciLow: stat.ciLow * k, ciHigh: stat.ciHigh * k
    };

    const ITER = 1200;   // verdicts come from the interval; this keeps the table responsive
    const rows = [
      { key: "high", label: "Average daily high", expected: 1, kind: "temp",
        expects: "rises", stat: scale(trendStats(build(b => mean(b.maxes), MIN_DAYS), ITER)) },
      { key: "low", label: "Average daily low", expected: 1, kind: "temp",
        expects: "rises, and faster than the high", stat: scale(trendStats(build(b => mean(b.mins), MIN_DAYS), ITER)) },
      { key: "dtr", label: "Day-to-night range", expected: -1, kind: "temp", caution: true,
        expects: "narrows", stat: scale(trendStats(build(b => mean(b.dtr), MIN_DAYS), ITER)) },
      { key: "winter", label: "Winter mean, Dec to Feb", expected: 1, kind: "temp",
        expects: "rises, and faster than summer", stat: scale(trendStats(seasonal(b => b.winter), ITER)) },
      { key: "summer", label: "Summer mean, Jun to Aug", expected: 1, kind: "temp",
        expects: "rises", stat: scale(trendStats(seasonal(b => b.summer), ITER)) },
      { key: "warm", label: "Hot days per year", expected: 1, kind: "count",
        expects: "more", stat: trendStats(build(b => b.warm, MIN_DAYS), ITER) },
      { key: "cold", label: "Cold nights per year", expected: -1, kind: "count",
        expects: "fewer", stat: trendStats(build(b => b.cold, MIN_DAYS), ITER) },
    ];

    const high = rows[0].stat, low = rows[1].stat;
    const winter = rows[3].stat, summer = rows[4].stat;
    const notes = [];
    if (high && low) {
      notes.push(low.perDecade > high.perDecade
        ? `Nights are warming faster than days here (${fmtTrend(low.perDecade, unit, "temp")} against ${fmtTrend(high.perDecade, unit, "temp")} per decade). Greenhouse forcing predicts that asymmetry; more sunlight reaching the surface would predict the reverse.`
        : `Days are warming at least as fast as nights here (${fmtTrend(high.perDecade, unit, "temp")} against ${fmtTrend(low.perDecade, unit, "temp")} per decade), which runs against the greenhouse prediction for this diagnostic.`);
    }
    if (winter && summer) {
      notes.push(winter.perDecade > summer.perDecade
        ? `Winter is warming faster than summer (${fmtTrend(winter.perDecade, unit, "temp")} against ${fmtTrend(summer.perDecade, unit, "temp")} per decade), the seasonal asymmetry the theory expects at this latitude.`
        : `Summer is warming at least as fast as winter (${fmtTrend(summer.perDecade, unit, "temp")} against ${fmtTrend(winter.perDecade, unit, "temp")} per decade). In one mountain valley, snow cover and cold-air pooling can swamp the expected seasonal split.`);
    }

    return { rows, notes, warmThreshold, coldThreshold };
  }, [daily, unit]);

  function onPointerMove(e) {
    if (!chart.valid.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * chart.W;
    const year = Math.round(fromYear + ((px-chart.m.left)/(chart.W-chart.m.left-chart.m.right))*(toYear-fromYear));
    const nearest = chart.valid.reduce((a,b) => Math.abs(b.year-year) < Math.abs(a.year-year) ? b : a);
    setHover(nearest);
  }

  const rangeWarning = fromYear >= toYear;

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.eyebrow}>Steamboat Springs, Colorado · NOAA station USC00057936</div>
        <h1 style={styles.title}>A century of mountain temperatures</h1>
        <p style={styles.dek}>
          Explore 100 complete calendar years, 1926–2025. Switch between annual and seasonal
          views, compare daily highs and lows, smooth the noise, and inspect the long-run trend.
        </p>

        <section style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.label}>Period average</div>
            <div style={styles.value}>{formatTemp(stats.average, unit)}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.label}>Linear change / century</div>
            <div style={styles.value}>
              {Number.isFinite(stats.changePerCentury) ? `${stats.changePerCentury >= 0 ? "+" : ""}${stats.changePerCentury.toFixed(1)}°${unit}` : "—"}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.label}>Warmest year</div>
            <div style={styles.value}>
              {stats.warmest ? `${stats.warmest.year} · ${formatTemp(stats.warmest.value, unit)}` : "—"}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.label}>Coldest year</div>
            <div style={styles.value}>
              {stats.coldest ? `${stats.coldest.year} · ${formatTemp(stats.coldest.value, unit)}` : "—"}
            </div>
          </div>
        </section>

        <section style={styles.controls}>
          <label style={styles.control}>
            <span style={styles.controlLabel}>Measure</span>
            <select style={styles.select} value={metric} onChange={e => setMetric(e.target.value)}>
              {Object.entries(METRICS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>

          <label style={styles.control}>
            <span style={styles.controlLabel}>Season</span>
            <select style={styles.select} value={season} onChange={e => setSeason(e.target.value)}>
              {Object.keys(SEASONS).map(s => <option key={s}>{s}</option>)}
            </select>
          </label>

          <label style={{...styles.control, minWidth: 120}}>
            <span style={styles.controlLabel}>Units</span>
            <select style={styles.select} value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="F">Fahrenheit</option>
              <option value="C">Celsius</option>
            </select>
          </label>

          <label style={{...styles.control, minWidth: 135}}>
            <span style={styles.controlLabel}>Smoothing</span>
            <select style={styles.select} value={smooth} onChange={e => setSmooth(Number(e.target.value))}>
              <option value={1}>None</option>
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
              <option value={20}>20 years</option>
            </select>
          </label>

          <label style={styles.control}>
            <span style={styles.controlLabel}>From year: {fromYear}</span>
            <input type="range" min={START_YEAR} max={END_YEAR-1} value={fromYear}
              onChange={e => setFromYear(Math.min(Number(e.target.value), toYear-1))} />
          </label>

          <label style={styles.control}>
            <span style={styles.controlLabel}>To year: {toYear}</span>
            <input type="range" min={START_YEAR+1} max={END_YEAR} value={toYear}
              onChange={e => setToYear(Math.max(Number(e.target.value), fromYear+1))} />
          </label>

          <button style={styles.button} onClick={() => {setFromYear(START_YEAR); setToYear(END_YEAR);}}>
            Reset range
          </button>
        </section>

        <section style={styles.chartCard}>
          {status === "loading" && (
            <div style={{padding: "110px 20px", textAlign: "center", color: "#6d655a"}}>
              Loading and aggregating roughly 36,500 NOAA observations…
            </div>
          )}

          {status === "error" && (
            <div style={{padding: 28}}>
              <strong>NOAA data could not be loaded.</strong>
              <p style={{color:"#6d655a"}}>{error}</p>
              <p style={{color:"#6d655a"}}>
                Export the station record from NOAA and commit it beside this page as
                <code>steamboat-daily.csv</code> (columns DATE, TMAX, TMIN). The live NOAA request is
                only a fallback and is often blocked by cross-origin rules on static hosts.
              </p>
            </div>
          )}

          {status === "ready" && !rangeWarning && chart.valid.length > 0 && (
            <>
              <div style={{display:"flex", justifyContent:"space-between", gap:16, flexWrap:"wrap", margin:"2px 6px 8px"}}>
                <div>
                  <strong>{season} · {METRICS[metric].label}</strong>
                  <div style={{fontSize:12, color:"#70685e"}}>{fromYear}–{toYear}</div>
                </div>
                <div style={{display:"flex", gap:16, fontSize:12, color:"#59534b"}}>
                  <span>Thin line: annual value</span>
                  <span>Heavy line: {smooth === 1 ? "annual value" : `${smooth}-year average`}</span>
                  <span>Dotted: linear trend</span>
                </div>
              </div>

              <svg
                ref={svgRef}
                viewBox={`0 0 ${chart.W} ${chart.H}`}
                style={{width:"100%", height:"auto", display:"block", touchAction:"none"}}
                onPointerMove={onPointerMove}
                onPointerLeave={() => setHover(null)}
                role="img"
                aria-label={`Line chart of ${METRICS[metric].label.toLowerCase()} in Steamboat Springs from ${fromYear} to ${toYear}`}
              >
                <rect x="0" y="0" width={chart.W} height={chart.H} fill="#fffdfa" />

                {chart.yTicks.map((t,i) => (
                  <g key={i}>
                    <line x1={chart.m.left} x2={chart.W-chart.m.right} y1={chart.y(t)} y2={chart.y(t)}
                      stroke="#ded8ce" strokeWidth="1" />
                    <text x={chart.m.left-12} y={chart.y(t)+4} textAnchor="end" fontSize="12" fill="#756e64">
                      {t.toFixed(0)}°
                    </text>
                  </g>
                ))}

                {chart.xTicks.map(yr => (
                  <g key={yr}>
                    <line x1={chart.x(yr)} x2={chart.x(yr)} y1={chart.m.top} y2={chart.H-chart.m.bottom}
                      stroke="#eee9e0" strokeWidth="1" />
                    <text x={chart.x(yr)} y={chart.H-chart.m.bottom+25} textAnchor="middle" fontSize="12" fill="#756e64">
                      {yr}
                    </text>
                  </g>
                ))}

                <path d={chart.path} fill="none" stroke="#b9b0a2" strokeWidth="1.2" />
                <path d={chart.smoothPath} fill="none" stroke="#9b2c2c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d={chart.trendPath} fill="none" stroke="#171717" strokeWidth="1.8" strokeDasharray="7 7" />

                {hover && Number.isFinite(hover.value) && (
                  <g pointerEvents="none">
                    <line x1={chart.x(hover.year)} x2={chart.x(hover.year)} y1={chart.m.top} y2={chart.H-chart.m.bottom}
                      stroke="#171717" strokeWidth="1" />
                    <circle cx={chart.x(hover.year)} cy={chart.y(hover.value)} r="5" fill="#9b2c2c" stroke="#fff" strokeWidth="2" />
                    <rect
                      x={Math.min(chart.W-190, Math.max(8, chart.x(hover.year)-80))}
                      y={Math.max(8, chart.y(hover.value)-76)}
                      width="170" height="58" rx="8" fill="#171717"
                    />
                    <text
                      x={Math.min(chart.W-180, Math.max(18, chart.x(hover.year)-70))}
                      y={Math.max(28, chart.y(hover.value)-52)}
                      fontSize="13" fill="#fff" fontWeight="700"
                    >
                      {hover.year}
                    </text>
                    <text
                      x={Math.min(chart.W-180, Math.max(18, chart.x(hover.year)-70))}
                      y={Math.max(46, chart.y(hover.value)-34)}
                      fontSize="12" fill="#d8d0c2"
                    >
                      {formatTemp(hover.value, unit)} · {hover.days} observations
                    </text>
                  </g>
                )}

                <text x={chart.W/2} y={chart.H-8} textAnchor="middle" fontSize="11" fill="#756e64">
                  Calendar year {season === "Winter" ? "(winter is Dec–Feb, labeled by Jan/Feb year)" : ""}
                </text>
                <text transform={`translate(16 ${chart.H/2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="#756e64">
                  Temperature (°{unit})
                </text>
              </svg>
            </>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <h2 style={styles.h2}>Is this trend distinguishable from noise?</h2>
            <span style={styles.panelNote}>{season} \u00b7 {METRICS[metric].label} \u00b7 {fromYear}\u2013{toYear}</span>
          </div>

          {detection ? (
            <>
              <div style={styles.statRow}>
                <div>
                  <div style={styles.label}>Trend</div>
                  <div style={styles.statBig}>{fmtTrend(detection.perDecade, unit, "temp")}</div>
                  <div style={styles.sub}>
                    per decade &middot; 95% interval {fmtTrend(detection.ciLow, unit, "temp")} to {fmtTrend(detection.ciHigh, unit, "temp")}
                  </div>
                </div>
                <div>
                  <div style={styles.label}>Odds of this from noise alone</div>
                  <div style={styles.statBig}>{fmtChance(detection.p, detection.iterations)}</div>
                  <div style={styles.sub}>{detection.iterations.toLocaleString()} synthetic trendless series</div>
                </div>
                <div>
                  <div style={styles.label}>Effective independent years</div>
                  <div style={styles.statBig}>
                    {Math.round(detection.nEff)} <span style={styles.statQual}>of {detection.n}</span>
                  </div>
                  <div style={styles.sub}>lag-1 autocorrelation {detection.r1.toFixed(2)}</div>
                </div>
              </div>
              <p style={styles.read}>{detectionRead}</p>
            </>
          ) : (
            <p style={styles.read}>Widen the range: at least twelve years with data are needed to test a trend.</p>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.panelHead}>
            <h2 style={styles.h2}>Does the warming carry the greenhouse fingerprint?</h2>
            <span style={styles.panelNote}>full record, {START_YEAR}\u2013{END_YEAR}</span>
          </div>

          <p style={styles.read}>
            Warming from rising greenhouse gases has a shape, and the shape differs from what other
            causes would produce. It warms nights more than days, winters more than summers, and it
            thins the cold tail faster than it fattens the warm one. Each row below tests one of
            those predictions against this station.
          </p>

          {diagnostics ? (
            <>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Diagnostic</th>
                      <th style={styles.th}>Per decade</th>
                      <th style={styles.th}>95% interval</th>
                      <th style={styles.th}>Greenhouse prediction</th>
                      <th style={styles.th}>Reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnostics.rows.map(row => {
                      const verdict = readTrend(row.stat, row.expected);
                      const chipStyle = verdict.tone === "flag"
                        ? {...styles.chip, ...styles.chipFlag}
                        : verdict.tone === "quiet" ? {...styles.chip, ...styles.chipQuiet} : styles.chip;
                      return (
                        <tr key={row.key}>
                          <td style={styles.td}>
                            <strong>{row.label}</strong>
                            {row.caution && (
                              <div style={styles.caution}>Distorted by the 1980s sensor change</div>
                            )}
                          </td>
                          <td style={styles.tdNum}>{row.stat ? fmtTrend(row.stat.perDecade, unit, row.kind) : "\u2014"}</td>
                          <td style={{...styles.td, color: "#70685e", whiteSpace: "nowrap"}}>
                            {row.stat
                              ? `${fmtTrend(row.stat.ciLow, unit, row.kind)} to ${fmtTrend(row.stat.ciHigh, unit, row.kind)}`
                              : "\u2014"}
                          </td>
                          <td style={{...styles.td, color: "#5a544c"}}>{row.expects}</td>
                          <td style={styles.td}><span style={chipStyle}>{verdict.verdict}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {diagnostics.notes.map((note, i) => <p key={i} style={styles.read}>{note}</p>)}

              <p style={styles.panelNote}>
                Hot days are those above the {formatTemp(diagnostics.warmThreshold, unit)} daily high and cold
                nights those below the {formatTemp(diagnostics.coldThreshold, unit)} daily low, both set at the
                90th and 10th percentiles of {START_YEAR}\u2013{BASELINE_END}. Years with fewer than {MIN_DAYS}
                daily records are left out of the annual rows.
              </p>
            </>
          ) : (
            <p style={styles.read}>Waiting on data.</p>
          )}

          <div style={styles.caveat}>
            <strong>What this can and cannot show.</strong> These rows test the shape of the warming at one
            station. They cannot establish its cause. Formal attribution compares observations against model
            ensembles run with and without human forcings, across many stations at once, and no single record
            can substitute for that. Three known problems in raw cooperative-network data bear directly on the
            table: changes in the time of day observations were taken impart a spurious mid-century cooling;
            the 1980s switch from liquid-in-glass thermometers to electronic sensors tends to cool recorded
            highs and warm recorded lows, which imitates the day-to-night narrowing in row three and makes that
            row the least trustworthy here; and station moves shift the record independently of the climate.
            None of these are corrected in the data behind this page.
          </div>
        </section>

        <p style={styles.foot}>
          Source: NOAA National Centers for Environmental Information, Global Historical Climatology
          Network Daily, Steamboat Springs station USC00057936 (40.4883° N, 106.8233° W; elevation
          6,866 ft). Daily TMAX and TMIN are aggregated in the browser. Years with missing observations
          remain in the timeline; hover counts show the number of records included. The dotted line is
          an ordinary least-squares trend, not a forecast.
        </p>
      </div>
    </main>
  );
}
