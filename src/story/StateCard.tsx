// Act V: your state. A clickable USA tile map driving a card that speaks in
// sentences with comparisons: your state's share vs the country, its rate vs
// the national median, its biggest biller labeled honestly (nationwide total).
// Data: category_state_year, state_code_year, provider_table, state_provenance.
import { useState } from "preact/hooks";
import { useQuery, fmtM } from "../hooks";
import { defs } from "../data/db";

// category vocabulary comes from the manifest (single source across the seam)
const careCats = () => "(" + defs().care_categories.map((c) => `'${c}'`).join(",") + ")";

// Standard USA tile cartogram (col, row).
const TILES: Record<string, [number, number]> = {
  AK: [0, 0], ME: [11, 0],
  VT: [10, 1], NH: [11, 1],
  WA: [1, 2], ID: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], IL: [6, 2], WI: [7, 2], MI: [8, 2], NY: [9, 2], RI: [10, 2], MA: [11, 2],
  OR: [1, 3], NV: [2, 3], WY: [3, 3], SD: [4, 3], IA: [5, 3], IN: [6, 3], OH: [7, 3], PA: [8, 3], NJ: [9, 3], CT: [10, 3],
  CA: [1, 4], UT: [2, 4], CO: [3, 4], NE: [4, 4], MO: [5, 4], KY: [6, 4], WV: [7, 4], VA: [8, 4], MD: [9, 4], DE: [10, 4],
  AZ: [2, 5], NM: [3, 5], KS: [4, 5], AR: [5, 5], TN: [6, 5], NC: [7, 5], SC: [8, 5], DC: [9, 5],
  OK: [4, 6], LA: [5, 6], MS: [6, 6], AL: [7, 6], GA: [8, 6],
  HI: [0, 7], TX: [4, 7], FL: [9, 7],
};

interface ShareRow { state: string; pct: number }

function TileMap(props: { sel: string; onPick: (st: string) => void; shares: Map<string, number>; lowVis: Set<string> }) {
  const mx = Math.max(1, ...props.shares.values());
  const CELL = 56, PAD = 3;
  const W = 12 * CELL + 8, H = 8 * CELL + 8;
  return (
    <div>
      <svg class="statemap" viewBox={`0 0 ${W} ${H}`} style="width:100%">
        {Object.entries(TILES).map(([st, [c, r]]) => {
          const pct = props.shares.get(st);
          const low = props.lowVis.has(st);
          const sel = st === props.sel;
          return (
            <g key={st} onClick={() => props.onPick(st)}>
              <rect
                x={4 + c * CELL} y={4 + r * CELL} width={CELL - PAD} height={CELL - PAD} rx="7"
                fill={low ? "var(--amber)" : pct == null ? "var(--hatch)" : "var(--care)"}
                fill-opacity={low ? 0.45 : pct == null ? 0.5 : 0.15 + 0.85 * (pct / mx)}
                stroke={sel ? "var(--ink)" : "var(--line)"} stroke-width={sel ? 2.5 : 1}
              />
              <text
                x={4 + c * CELL + (CELL - PAD) / 2} y={4 + r * CELL + (CELL - PAD) / 2 + 5}
                font-size="15" font-weight={sel ? 800 : 600} text-anchor="middle"
                fill={!low && pct != null && pct / mx > 0.55 ? "var(--paper)" : "var(--ink)"}
              >
                {st}
              </text>
            </g>
          );
        })}
      </svg>
      <div class="crown-legend" style="margin-top:6px">
        <span class="chip"><span class="dot" style="background:var(--care);opacity:.25" /> less of Medicaid is daily-life care</span>
        <span class="chip"><span class="dot" style="background:var(--care)" /> more of it is</span>
        <span class="chip"><span class="dot" style="background:var(--amber);opacity:.5" /> records too incomplete to read a share</span>
      </div>
    </div>
  );
}

export function StateCard() {
  const [st, setSt] = useState("NY");
  // every state's 2023 share, once — feeds both the map and the rank sentence
  const all = useQuery<ShareRow>(
    `WITH t AS (
       SELECT state, sum(attributed_clean_M) tot,
              sum(attributed_clean_M) FILTER (WHERE category IN ${careCats()}) care
       FROM category_state_year WHERE year = 2023 GROUP BY 1)
     SELECT state, round(100.0 * care / tot, 1) pct FROM t WHERE tot > 100`
  );
  const trend = useQuery<{ year: number; pct: number }>(
    `WITH t AS (
       SELECT year, sum(attributed_clean_M) tot,
              sum(attributed_clean_M) FILTER (WHERE category IN ${careCats()}) care
       FROM category_state_year WHERE state = '${st}' AND year <= 2023 GROUP BY 1)
     SELECT year, round(100.0 * care / tot, 1) pct FROM t WHERE tot > 0 ORDER BY year`
  );
  const rate = useQuery<{ code: string; med: number; us_med: number }>(
    `WITH here AS (
       SELECT code, median_paid_per_line med FROM state_code_year
       WHERE state = '${st}' AND year = 2024 AND code IN ('T1019','S5125')
         AND median_paid_per_line IS NOT NULL
       ORDER BY claim_lines_enrolled DESC LIMIT 1),
     us AS (
       SELECT median(median_paid_per_line) us_med FROM state_code_year
       WHERE year = 2024 AND code = (SELECT code FROM here)
         AND median_paid_per_line IS NOT NULL)
     SELECT here.code, here.med, round(us.us_med, 0) us_med FROM here, us`
  );
  const top = useQuery<{ provider_name: string; v: number }>(
    `SELECT provider_name, max(clean_paid_M_alltime) v FROM provider_table
     WHERE list_contains(attributed_states, '${st}') AND provider_name IS NOT NULL
     GROUP BY 1 ORDER BY 2 DESC LIMIT 1`
  );
  const prov = useQuery<{ completeness_tier: string; pct: number | null }>(
    `SELECT completeness_tier, round(layered_pct_of_cms64) pct
     FROM state_provenance WHERE state = '${st}' LIMIT 1`
  );
  const lowStates = useQuery<{ state: string }>(
    `SELECT state FROM state_provenance WHERE completeness_tier = '${defs().completeness_tiers.find((t) => t.startsWith("low")) ?? ""}'`
  );
  // the act's own question: does self-directed care (hiring your own
  // caregiver, incl. family) verifiably operate here? Name-list = a floor.
  const fi = useQuery<{ n: number }>(
    `SELECT count(DISTINCT fy.firm) n
     FROM (SELECT DISTINCT npi, firm FROM fi_provider_year
           WHERE firm <> '${defs().fi_residual_bucket}') fy
     JOIN provider_table pt USING (npi)
     WHERE list_contains(pt.attributed_states, '${st}')`
  );

  const shares = new Map((all.rows ?? []).map((r) => [r.state, r.pct]));
  const here23 = shares.get(st);
  const rank = here23 != null
    ? 1 + (all.rows ?? []).filter((r) => r.pct > here23).length
    : null;
  const usAvg = all.rows?.length
    ? (all.rows.reduce((s, r) => s + r.pct, 0) / all.rows.length).toFixed(0)
    : null;
  const t = trend.rows;
  const first = t?.[0], last = t?.slice(-1)[0];
  const delta = first && last ? last.pct - first.pct : null;

  return (
    <div>
      <TileMap sel={st} onPick={setSt} shares={shares}
        lowVis={new Set((lowStates.rows ?? []).map((r) => r.state))} />
      <div class="dossier">
        <div class="big">Medicaid in {st}</div>
        {here23 != null && (
          <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap;margin-top:12px">
            <svg class="waffle" viewBox="0 0 110 110" style="width:132px;flex-shrink:0">
              {Array.from({ length: 100 }, (_, i) => {
                const filled = i < Math.round(here23);
                return (
                  <rect key={i} x={(i % 10) * 11} y={99 - Math.floor(i / 10) * 11}
                    width="9" height="9" rx="2"
                    fill={filled ? "var(--care)" : "var(--hatch)"} />
                );
              })}
            </svg>
            <p style="font-size:16.5px;flex:1;min-width:230px;margin:0">
              One dollar, as a hundred cents. In 2023,{" "}
              <b style="color:var(--care)">{Math.round(here23)} of every 100
              readable Medicaid cents</b> in {st} paid for help with daily
              life. That is {rank != null ? <>#{rank} of {all.rows!.length} states</> : ""}
              {usAvg ? <> (typical state: about {usAvg} cents)</> : ""}.
              {usAvg && (
                <span style="color:var(--muted)">
                  {" "}The national line you saw earlier sits higher because
                  the biggest programs lean toward care.
                </span>
              )}
              {prov.rows?.[0]?.completeness_tier === defs().completeness_tiers.find((t) => t.startsWith("low")) && (
                <span style="color:var(--amber)">
                  {" "}Careful: these records can see less than a fifth of{" "}
                  {st}'s program, so this number is a floor, not a measurement.
                </span>
              )}
            </p>
          </div>
        )}
        {first && last && delta != null && (
          <p style="font-size:14px;color:var(--muted)">
            {delta > 1
              ? `That share rose from ${Math.round(first.pct)} cents in 2018.`
              : delta < -1
              ? rank != null && rank <= 8
                ? `That share was ${Math.round(first.pct)} cents in 2018. Most states rose; ${st} started near the top.`
                : `That share was ${Math.round(first.pct)} cents in 2018.`
              : `Roughly unchanged since 2018 (${first.pct} cents).`}
          </p>
        )}
        {fi.rows && (
          <div style="border-left:4px solid var(--care);background:var(--care-soft);border-radius:0 8px 8px 0;padding:14px 16px;margin:14px 0">
            <b>Can a family member be paid to give care here?</b>{" "}
            {fi.rows[0].n > 0 ? (
              <>
                Yes. Self-directed care operates in {st}: these records verify{" "}
                {fi.rows[0].n === 1 ? "one" : fi.rows[0].n} of its payroll
                firm{fi.rows[0].n > 1 ? "s" : ""} by name, and that count is a
                floor, not a census. Some states run dozens of such firms;
                our named list only covers the biggest national ones.
              </>
            ) : (
              <>
                We cannot verify a self-direction payroll firm in {st} from
                these records. That is not proof there is none: our firm list
                is short, and some programs run through counties or health
                plans these records cannot see.
              </>
            )}
          </div>
        )}
        <div class="row" style="margin-top:8px">
          <span>A personal-care bill here typically pays</span>
          <span class="mono">
            {rate.rows?.[0]
              ? `$${rate.rows[0].med.toFixed(0)} (typical state: $${rate.rows[0].us_med})`
              : "too few records to say"}
          </span>
        </div>
        <div class="row">
          <span>Biggest home-care biller enrolled in {st}</span>
          <span class="mono" style="text-align:right">
            {top.rows?.[0]
              ? `${top.rows[0].provider_name} ($${(top.rows[0].v / 1000).toFixed(1)}B nationwide)`
              : "…"}
          </span>
        </div>
        <div class="row">
          <span>How much of {st}'s Medicaid these records can see</span>
          <span class="mono">
            {prov.rows?.[0]?.pct != null ? (
              <>
                about {prov.rows[0].pct}% of the official total
                {prov.rows[0].completeness_tier === defs().completeness_tiers.find((t) => t.startsWith("low")) && (
                  <span style="color:var(--amber)"> (a severe lower bound)</span>
                )}
              </>
            ) : (
              "…"
            )}
          </span>
        </div>
        <p class="placard" style="font-size:12.5px;margin-top:12px">
          A bill usually covers one or more 15-minute units, so the typical
          payment is a per-bill rate, not an hourly wage. The biggest biller's
          dollar figure is its national total, not what it billed in {st}.
          California shows amber on the map because most of its personal care
          hides in codes national data cannot read.
        </p>
      </div>
    </div>
  );
}
