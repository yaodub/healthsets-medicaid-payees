// Act II: three snapshots. The same top-5 list the reader just learned to
// read, at three moments: 2018, 2021, 2024. The composition flip IS the
// takeover; the monthly lead-change facts ride in the caption. Underlying
// monthly lines stay one click down for skeptics. Data: who_race_monthly.
import { useMemo, useState } from "preact/hooks";
import { useQuery, linePath } from "../hooks";
import { defs } from "../data/db";

interface RaceRow {
  entity_name: string; kind: string; curated_family_id: string | null; mo: string;
  monthly_M: number; trailing12_M: number | null; gap_flag: boolean; runout_flag: boolean;
}

const SHORT: Record<string, string> = {
  "LOS ANGELES COUNTY DEPARTMENT OF MENTAL HEALTH": "LA County Mental Health",
  "Massachusetts Department of Developmental Services": "Massachusetts DDS",
  "DEPARTMENT OF INTELLECTUAL AND DEVELOPMENTAL DISABILITIES, STATE OF TN": "Tennessee Disabilities Dept",
  "ALABAMA DEPARTMENT OF MENTAL HEALTH AND MENTAL RETARDATION": "Alabama Mental Health Dept",
  "Public Partnerships (PPL)": "PPL",
  "Tempus Unlimited": "Tempus",
  "Cleveland Clinic": "Cleveland Clinic",
  FreedomCare: "FreedomCare",
  "University of California Health": "UC Health",
  Labcorp: "Labcorp",
  "Quest Diagnostics": "Quest",
  "Franciscan Missionaries of Our Lady Health System": "Our Lady Health System",
};

function colorFor(familyId: string | null, kind: string): string {
  if (kind === "government") return "var(--med)";
  if (familyId) {
    const fam = defs().entity_families.find((f) => f.family_id === familyId);
    if (fam?.display_category === "caregiver-payroll company") return "var(--care)";
    if (fam?.display_category === "lab company") return "var(--amber)";
  }
  return "var(--violet)"; // hospital systems among the top-12
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const PANELS = [
  { year: "2018", note: "the year this file opens" },
  { year: "2021", note: "midway" },
  { year: "2024", note: "" }, // note computed from the data: through the last complete month
];

export function Snapshots() {
  const { rows } = useQuery<RaceRow>(
    `SELECT entity_name, kind, curated_family_id, mo, monthly_M, trailing12_M, gap_flag, runout_flag
     FROM who_race_monthly ORDER BY entity_name, mo`
  );
  const [showLines, setShowLines] = useState(false);
  const model = useMemo(() => {
    if (!rows) return null;
    const byYear = new Map<string, Map<string, { kind: string; fam: string | null; v: number }>>();
    for (const r of rows) {
      if (r.runout_flag) continue;
      const y = r.mo.slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, new Map());
      const m = byYear.get(y)!;
      const cur = m.get(r.entity_name) ?? { kind: r.kind, fam: r.curated_family_id, v: 0 };
      cur.v += r.monthly_M;
      m.set(r.entity_name, cur);
    }
    return byYear;
  }, [rows]);
  if (!rows || !model) return <div class="loading">loading…</div>;
  // bars scale WITHIN each year: 2024 covers ten months, so cross-year bar
  // lengths would understate it; each panel's claim is composition, not size
  const mxOf = (yr: string) => Math.max(...[...model.get(yr)!.values()].map((e) => e.v));
  const last2024 = rows.filter((r) => !r.runout_flag && r.mo.startsWith("2024"))
    .map((r) => r.mo).sort().slice(-1)[0];
  const note2024 = last2024
    ? `January to ${MONTH_NAMES[parseInt(last2024.slice(5), 10) - 1]}, the last complete stretch`
    : "";
  return (
    <div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px">
        {PANELS.map((p) => {
          const top5 = [...model.get(p.year)!.entries()]
            .sort((a, b) => b[1].v - a[1].v).slice(0, 5);
          return (
            <div key={p.year} class="exhibit" style="margin-top:0">
              <div style="font-size:22px;font-weight:800">{p.year}</div>
              <div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">{p.year === "2024" ? note2024 : p.note}</div>
              {top5.map(([name, e], i) => (
                <div key={name} style="margin:8px 0">
                  <div style="display:flex;justify-content:space-between;font-size:12px">
                    <span><span class="mono" style="color:var(--muted)">{i + 1}.</span> {SHORT[name] ?? name}</span>
                    <span class="mono" style="color:var(--muted)">${(e.v / 1000).toFixed(1)}B</span>
                  </div>
                  <div style="background:var(--paper);border-radius:4px;margin-top:2px">
                    <div style={`height:12px;border-radius:4px;width:${(e.v / mxOf(p.year)) * 100}%;background:${colorFor(e.fam, e.kind)}`} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div class="crown-legend" style="margin-top:12px">
        <span class="chip"><span class="dot" style="background:var(--med)" /> government agency</span>
        <span class="chip"><span class="dot" style="background:var(--care)" /> caregiver-payroll company</span>
        <span class="chip"><span class="dot" style="background:var(--amber)" /> lab</span>
        <span class="chip"><span class="dot" style="background:var(--violet)" /> hospital system</span>
      </div>
      <p class="placard" style="margin-top:14px">
        In 2018 the top five was mostly government agencies, with one payroll
        company climbing. By 2024, payroll companies hold the top spots and
        first place is a close race between one county department and two of
        them. And it kept going: months after this data ends, New York moved its
        entire consumer-directed care program, more than two hundred thousand
        people, to PPL as its single payroll firm.
      </p>
      <div class="aside" style="margin:26px 0 6px">
        <h3>Three things happened in between</h3>
        <p>
          In 2020 the pandemic made care at home the safer default: in its
          worst month, office medicine halved in these records while home care
          barely moved.
        </p>
        <p>
          In 2021, federal pandemic-relief money raised home-care funding, and
          the typical personal-care payment began climbing.
        </p>
        <p>
          And state after state kept expanding programs that let people hire
          their own caregivers.
        </p>
      </div>
      <button class="btn" style="margin-top:6px" onClick={() => setShowLines(!showLines)}>
        {showLines ? "hide the month-by-month detail" : "show the month-by-month detail"}
      </button>
      {showLines && <RaceLines rows={rows} />}
    </div>
  );
}

function RaceLines(props: { rows: RaceRow[] }) {
  const rows = props.rows.filter((r) => !r.runout_flag);
  const months = [...new Set(rows.map((r) => r.mo))].sort();
  const names = [...new Set(rows.map((r) => r.entity_name))];
  const by = new Map(names.map((n) => [n, new Map<string, RaceRow>()]));
  for (const r of rows) by.get(r.entity_name)!.set(r.mo, r);
  const gapWindow = new Map(names.map((n) => {
    const flags = months.map((m) => by.get(n)!.get(m)?.gap_flag ?? false);
    const bad = months.map((_, i) => flags.slice(Math.max(0, i - 11), i + 1).some(Boolean));
    return [n, bad] as const;
  }));
  const keep = names
    .map((n) => ({ n, peak: Math.max(...months.map((m) => by.get(n)!.get(m)?.trailing12_M ?? 0)) }))
    .sort((a, b) => b.peak - a.peak).slice(0, 6).map((x) => x.n);
  const mx = Math.max(...keep.flatMap((n) => months.map((m) => by.get(n)!.get(m)?.trailing12_M ?? 0)));
  // first month a payroll-family entity held the trailing-12 #1 (computed, not quoted)
  const isPayroll = (n: string) => {
    const fam = [...by.get(n)!.values()][0]?.curated_family_id;
    return !!fam && defs().entity_families.find((f) => f.family_id === fam)?.display_category === "caregiver-payroll company";
  };
  let firstPay: string | null = null;
  for (let i = 11; i < months.length && !firstPay; i++) {
    let best: string | null = null, bv = -1;
    for (const n of names) {
      if (gapWindow.get(n)![i]) continue;
      const v = by.get(n)!.get(months[i])?.trailing12_M;
      if (v != null && v > bv) { bv = v; best = n; }
    }
    if (best && isPayroll(best)) firstPay = months[i];
  }
  const firstPayLabel = firstPay
    ? `${MONTH_NAMES[parseInt(firstPay.slice(5), 10) - 1]} ${firstPay.slice(0, 4)}`
    : null;
  const W = 740, H = 250, L = 44, R = 8;
  const x = (i: number) => L + (i / (months.length - 1)) * (W - L - R);
  const y = (v: number) => 14 + (1 - v / mx) * (H - 52);
  return (
    <div class="exhibit">
      <div class="exhibit-tag">
        <span>EACH LINE = ONE ORGANIZATION'S LAST 12 MONTHS OF BILLING, $ MILLIONS</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style="width:100%">
        {[0, 500, 1000, 1500].filter((v) => v <= mx).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 6} y={y(v) + 4} font-size="10" fill="var(--muted)" text-anchor="end">
              {v === 0 ? "0" : `$${v}M`}
            </text>
          </g>
        ))}
        {keep.map((n) => {
          const first = [...by.get(n)!.values()][0];
          const color = colorFor(first?.curated_family_id ?? null, first?.kind ?? "organization");
          const segs: string[] = [];
          let xs: number[] = [], ys: number[] = [];
          const flush = () => { if (xs.length > 1) segs.push(linePath(xs, ys)); xs = []; ys = []; };
          months.forEach((m, i) => {
            const v = by.get(n)!.get(m)?.trailing12_M;
            if (v == null || gapWindow.get(n)![i]) { flush(); return; }
            xs.push(x(i)); ys.push(y(v));
          });
          flush();
          return (
            <g key={n}>
              {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={color} stroke-width="2" opacity="0.85" />)}
            </g>
          );
        })}
        {months.map((m, i) =>
          m.endsWith("-01") && i > 6 ? (
            <text key={m} x={x(i)} y={H - 8} font-size="10" fill="var(--muted)" text-anchor="middle">{m.slice(0, 4)}</text>
          ) : null
        )}
      </svg>
      <p class="placard" style="font-size:12.5px">
        Blue: agencies. Green: payroll companies. A line breaks where an
        organization's records show a state reporting gap: a hole in the data,
        not a collapse.{firstPayLabel ? ` A payroll company first held the monthly #1 in ${firstPayLabel}.` : ""}
      </p>
    </div>
  );
}
