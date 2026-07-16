// Act IV: where the doubling came from. No growth-share abstractions: show
// the three plain quantities behind personal care's rise, 2018 vs 2023, and
// let the reader see which one moved. Data: hcbs_code_yearbook.
import { useQuery } from "../hooks";

interface Y { yr: number; dollars_B: number; ptm_M: number; per_bill: number; per_person: number }

export function Drivers() {
  const { rows } = useQuery<Y>(
    `SELECT year yr,
       round(sum(clean_M)/1000, 1) dollars_B,
       round(sum(patient_months)/1e6, 1) ptm_M,
       round(sum(clean_M)*1e6 / sum(claim_lines), 0) per_bill,
       round(sum(claim_lines)*1.0 / sum(patient_months), 1) per_person
     FROM hcbs_code_yearbook
     WHERE category = 'personal_care' AND year IN (2018, 2023)
     GROUP BY 1 ORDER BY 1`
  );
  if (!rows || rows.length < 2) return <div class="loading">loading…</div>;
  const [a, b] = rows;
  const pct = (x: number, y: number) => Math.round((100 * y) / x - 100);
  const FACTORS = [
    {
      label: "People getting it",
      unit: "million patient-months of care",
      v18: a.ptm_M, v23: b.ptm_M, fmt: (v: number) => `${v}M`,
      color: "var(--care)",
      note: "the big mover",
    },
    {
      label: "How much care each person gets",
      unit: "bills per person per month",
      v18: a.per_person, v23: b.per_person, fmt: (v: number) => `${v}`,
      color: "var(--med)",
      note: "somewhat more per person",
    },
    {
      label: "What a bill pays",
      unit: "average payment per bill",
      v18: a.per_bill, v23: b.per_bill, fmt: (v: number) => `$${v}`,
      color: "var(--amber)",
      note: "the smallest mover here; cheaper services growing fastest hides part of the raise",
    },
  ];
  return (
    <div class="exhibit" style="padding:22px 24px">
      <div class="exhibit-tag">
        <span>PERSONAL CARE, THE BIGGEST SERVICE · 2018 VS 2023</span>
      </div>
      <p style="font-size:15px;margin:2px 0 4px">
        Personal care went from <b>${a.dollars_B}B to ${b.dollars_B}B a
        year</b>. Only three things can do that: more people, higher payments,
        or more bills per person. Here is how much each one actually moved:
      </p>
      {FACTORS.map((f) => {
        const growth = pct(f.v18, f.v23);
        return (
          <div key={f.label} style="margin:20px 0">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
              <b style="font-size:15.5px">{f.label}</b>
              <span style={`font-size:17px;font-weight:800;color:${f.color}`}>+{growth}%</span>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px">{f.unit} · {f.note}</div>
            {[{ yr: 2018, v: f.v18 }, { yr: 2023, v: f.v23 }].map((r) => (
              <div key={r.yr} style="display:flex;align-items:center;gap:10px;margin:4px 0">
                <span class="mono" style="width:38px;color:var(--muted);font-size:12px">{r.yr}</span>
                <div style="flex:1;background:var(--paper);border-radius:4px">
                  <div style={`height:16px;border-radius:4px;width:${(100 * r.v) / f.v23}%;background:${f.color};opacity:${r.yr === 2018 ? 0.45 : 1}`} />
                </div>
                <span class="mono" style="width:56px;font-size:13px">{f.fmt(r.v)}</span>
              </div>
            ))}
          </div>
        );
      })}
      <p style="font-size:14.5px;margin-top:16px">
        The people grew more than four times as fast as the average payment.
        This is an expansion, not an inflation: far more people are getting
        help than in 2018.
      </p>
      <p class="placard" style="font-size:12.5px;margin-top:8px">
        Group homes and day programs grew the same way. Nurses at home are the
        one exception: there, payments rose faster than the number of people,
        which fits sicker people being cared for more intensively at home. A
        bill can cover more than one 15-minute unit, and patient counts add
        each provider's patients separately, so read these as close, not exact.
      </p>
    </div>
  );
}
