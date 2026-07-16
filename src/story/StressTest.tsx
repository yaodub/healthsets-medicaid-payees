// Interlude: the stress test. One chart for the one month that showed which
// kind of spending is load-bearing. Two indexed lines around April 2020.
// Data: code_month (summed) vs medical_month, Feb 2020 = 100.
import { useQuery, linePath } from "../hooks";

interface Row { m: string; care: number; med: number }

export function StressTest() {
  const { rows } = useQuery<Row>(
    `WITH care AS (SELECT claim_month m, sum(clean_M) v FROM code_month GROUP BY 1),
     med AS (SELECT claim_month m, clean_M v FROM medical_month)
     SELECT care.m,
       round(100 * care.v / (SELECT v FROM care WHERE m = '2020-02'), 1) care,
       round(100 * med.v / (SELECT v FROM med WHERE m = '2020-02'), 1) med
     FROM care JOIN med USING (m)
     WHERE care.m BETWEEN '2019-10' AND '2020-12' ORDER BY 1`
  );
  if (!rows) return <div class="loading">loading…</div>;
  const W = 560, H = 300, L = 46, R = 96;
  const mx = 120;
  const x = (i: number) => L + (i / (rows.length - 1)) * (W - L - R);
  const y = (v: number) => 18 + (1 - v / mx) * (H - 62);
  const apr = rows.findIndex((r) => r.m === "2020-04");
  const last = rows.length - 1;
  return (
    <div class="exhibit">
      <div class="exhibit-tag">
        <span>EACH MONTH'S SPENDING, AS % OF FEBRUARY 2020</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style="width:100%">
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R + 20} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} font-size="13" fill="var(--muted)" text-anchor="end">{v}</text>
          </g>
        ))}
        <path d={linePath(rows.map((_, i) => x(i)), rows.map((r) => y(r.care)))}
          fill="none" stroke="var(--care)" stroke-width="4" />
        <path d={linePath(rows.map((_, i) => x(i)), rows.map((r) => y(r.med)))}
          fill="none" stroke="var(--med)" stroke-width="4" />
        {apr >= 0 && (
          <g>
            <line x1={x(apr)} x2={x(apr)} y1={16} y2={H - 30} stroke="var(--amber)" stroke-dasharray="3 4" />
            <text x={x(apr)} y={H - 14} font-size="12.5" fill="var(--amber)" text-anchor="middle">April 2020</text>
            <text x={x(apr) + 6} y={y(rows[apr].med) + 18} font-size="13" fill="var(--med)">−{(100 - rows[apr].med).toFixed(0)}%</text>
            <text x={x(apr) + 6} y={y(rows[apr].care) - 8} font-size="13" fill="var(--care)">−{(100 - rows[apr].care).toFixed(0)}%</text>
          </g>
        )}
        <text x={x(last) + 8} y={y(rows[last].care) + 4} font-size="14" fill="var(--care)">daily life</text>
        <text x={x(last) + 8} y={y(rows[last].med) + 4} font-size="14" fill="var(--med)">medicine</text>
      </svg>
      <p class="placard" style="font-size:13px;margin-top:8px">
        In the worst month of the pandemic, spending on medicine fell by
        nearly half. Spending on help with daily life barely moved. Doctor
        visits can wait. Somebody still has to help you out of bed.
      </p>
    </div>
  );
}
