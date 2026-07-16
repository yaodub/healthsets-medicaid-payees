// Act III: the quiet room. Two lines, one crossing. The generalization of
// everything the countdown showed, with the skeptic's counting buttons.
// Data: crossover_bases.
import { useState } from "preact/hooks";
import { useQuery, linePath } from "../hooks";
import { defs } from "../data/db";

interface XRow { year: number; care_pct: number; medicine_pct: number }

const BASES: { key: string; btn: string; caption: string }[] = [
  {
    key: "plus_ca",
    btn: "the honest count",
    caption:
      "Home care counted narrowly, plus California's personal-care payments. California keeps them in codes national data cannot read, so an honest count adds them back.",
  },
  {
    key: "strict",
    btn: "the narrowest count",
    caption: "Only unambiguous home-care services, California excluded. The hardest test we could give this finding.",
  },
  {
    key: "broad",
    btn: "the widest count",
    caption: "Every home-and-community service: home care, group homes, day programs, community support.",
  },
];

function StateFootnote() {
  const careCats = "(" + defs().care_categories.map((c) => `'${c}'`).join(",") + ")";
  const { rows } = useQuery<{ yr: number; leads: number; n: number }>(
    `WITH s AS (
       SELECT state, year,
         sum(attributed_clean_M) FILTER (WHERE category IN ${careCats}) care,
         sum(attributed_clean_M) FILTER (WHERE category = 'medical_visits') med,
         sum(attributed_clean_M) tot
       FROM category_state_year GROUP BY 1, 2)
     SELECT year yr, count(*) FILTER (WHERE care > med) leads, count(*) n
     FROM s WHERE year IN (2018, 2023) AND tot > 100 GROUP BY 1 ORDER BY 1`
  );
  if (!rows || rows.length < 2) return null;
  const [a, b] = rows;
  return (
    <p class="placard" style="font-size:12.5px">
      One honest footnote: this is the national line. State by state, help
      with daily life led medicine in {a.leads} of the {a.n} states we can
      read in {a.yr}, and {b.leads} by {b.yr}. The national crossing comes
      from the biggest programs tipping, not from every state crossing at
      once.
    </p>
  );
}

export function Curve() {
  const [basis, setBasis] = useState("plus_ca");
  const { rows } = useQuery<XRow>(
    `SELECT year, care_pct, medicine_pct FROM crossover_bases
     WHERE basis = '${basis}' ORDER BY year`
  );
  if (!rows) return <div class="loading">loading…</div>;
  const W = 560, H = 320, L = 46, R = 150;
  const top = Math.max(45, ...rows.map((r) => Math.max(r.care_pct, r.medicine_pct))) + 3;
  const x = (i: number) => L + (i / (rows.length - 1)) * (W - L - R);
  const y = (v: number) => 18 + (1 - v / top) * (H - 62);
  // annotate the FINAL sustained crossing, not the first sign flip: the 2020
  // collapse of medicine briefly put care ahead (a pandemic artifact, visible
  // in the wiggle), and marking it as "the" crossing misdates the story.
  let firstAhead = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].care_pct >= rows[i].medicine_pct) firstAhead = i;
    else break;
  }
  let cross: { cx: number; cy: number; yr: string } | null = null;
  if (firstAhead > 0) {
    const i = firstAhead;
    const d0 = rows[i - 1].care_pct - rows[i - 1].medicine_pct;
    const d1 = rows[i].care_pct - rows[i].medicine_pct;
    const t = d0 < 0 ? d0 / (d0 - d1) : 0;
    cross = {
      cx: x(i - 1) + t * (x(i) - x(i - 1)),
      cy: y(rows[i - 1].care_pct + t * (rows[i].care_pct - rows[i - 1].care_pct)),
      yr: `${rows[i - 1].year}–${String(rows[i].year).slice(2)}`,
    };
  }
  const last = rows[rows.length - 1];
  const b = BASES.find((v) => v.key === basis)!;
  return (
    <div class="exhibit">
      <div class="exhibit-tag">
        <span>TWO SHARES OF THE SAME DOLLARS · 2018–2024</span>
      </div>
      <p style="font-size:14.5px;margin:2px 0 10px">
        Out of every dollar this ledger can read clearly, how many cents went
        to <b style="color:var(--care)">help with daily life</b>, and how many
        to <b style="color:var(--med)">medical care</b>?
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style="width:100%">
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R + 30} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} font-size="13" fill="var(--muted)" text-anchor="end">{v}%</text>
          </g>
        ))}
        <path d={linePath(rows.map((_, i) => x(i)), rows.map((r) => y(r.care_pct)))}
          fill="none" stroke="var(--care)" stroke-width="4" />
        <path d={linePath(rows.map((_, i) => x(i)), rows.map((r) => y(r.medicine_pct)))}
          fill="none" stroke="var(--med)" stroke-width="4" />
        {rows.map((r, i) => (
          <text key={r.year} x={x(i)} y={H - 10} font-size="12.5" fill="var(--muted)" text-anchor="middle">
            {r.year}
          </text>
        ))}
        <text x={x(rows.length - 1) + 10} y={y(last.care_pct) + 4} font-size="14" fill="var(--care)">
          daily life · {last.care_pct}%
        </text>
        <text x={x(rows.length - 1) + 10} y={y(last.medicine_pct) + 4} font-size="14" fill="var(--med)">
          medicine · {last.medicine_pct}%
        </text>
        {cross && (
          <g>
            <circle cx={cross.cx} cy={cross.cy} r="7" fill="none" stroke="var(--amber)" stroke-width="2.5" />
            <text x={cross.cx} y={cross.cy - 13} font-size="13.5" fill="var(--amber)" text-anchor="middle">
              ahead for good, {cross.yr}
            </text>
          </g>
        )}
        {!cross && (
          <text x={L + 8} y={30} font-size="11.5" fill="var(--amber)">
            no crossing under this count. the gap narrows from {(rows[0].medicine_pct - rows[0].care_pct).toFixed(1)} points to {(last.medicine_pct - last.care_pct).toFixed(1)}
          </text>
        )}
      </svg>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        {BASES.map((v) => (
          <button key={v.key} class={"btn" + (basis === v.key ? " sel" : "")}
            onClick={() => setBasis(v.key)}>{v.btn}</button>
        ))}
      </div>
      <p class="placard" style="font-size:13px;margin-top:8px">{b.caption}</p>
      <StateFootnote />
    </div>
  );
}
