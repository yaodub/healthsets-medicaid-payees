// The side gallery: three small pieces from the same records, each with a viz
// in its honest form: a calendar profile, a unit grid, and the page's
// cents-waffle idiom. Data: school_calendar, curiosities, about_the_file.
import { useQuery } from "../hooks";

interface Cur { card: string; a_val: number | null; b_val: number | null }

function SchoolCalendar() {
  const { rows } = useQuery<{ mo: string; pct: number }>(
    `SELECT mo, pct FROM school_calendar ORDER BY mo`
  );
  if (!rows) return null;
  const mx = Math.max(...rows.map((r) => r.pct));
  const NAMES = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  return (
    <div style="margin:10px 0 12px">
      <div style="display:flex;align-items:flex-end;gap:3px;height:56px">
        {rows.map((r, i) => (
          <div key={r.mo} style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
            <div style={`height:${(100 * r.pct) / mx}%;border-radius:3px 3px 0 0;background:var(--amber);opacity:${r.pct < mx / 3 ? 0.4 : 1}`} />
          </div>
        ))}
      </div>
      <div style="display:flex;gap:3px">
        {NAMES.map((n, i) => (
          <span key={i} style="flex:1;text-align:center;font-size:9.5px;color:var(--muted)">{n}</span>
        ))}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:3px">
        share of the year's school-service bills, by month
      </div>
    </div>
  );
}

function VoiceDots(props: { patientMonthsK: number }) {
  const per = 5; // one dot = 5,000 patient-months
  const n = Math.round(props.patientMonthsK / per);
  return (
    <div style="margin:10px 0 12px">
      <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:340px">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} style="width:9px;height:9px;border-radius:50%;background:var(--violet);display:inline-block" />
        ))}
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:5px">
        each dot: five thousand months lived with a voice
      </div>
    </div>
  );
}

function CentsWaffle(props: { cents: number }) {
  return (
    <div style="margin:10px 0 12px;display:flex;align-items:center;gap:12px">
      <svg viewBox="0 0 110 110" style="width:88px;flex-shrink:0">
        {Array.from({ length: 100 }, (_, i) => (
          <rect key={i} x={(i % 10) * 11} y={99 - Math.floor(i / 10) * 11}
            width="9" height="9" rx="2"
            fill={i < props.cents ? "var(--care)" : "var(--hatch)"} />
        ))}
      </svg>
      <div style="font-size:11px;color:var(--muted)">
        {props.cents} cents of every readable Medicaid dollar
      </div>
    </div>
  );
}

export function SideGallery() {
  const cur = useQuery<Cur>(`SELECT card, a_val, b_val FROM curiosities`);
  const about = useQuery<{ readable_T: number }>(`SELECT readable_T FROM about_the_file`);
  if (!cur.rows || !about.rows) return <div class="loading">loading…</div>;
  const c = new Map(cur.rows.map((r) => [r.card, r]));
  const voices = c.get("voices");
  const quarter = c.get("quarter_hour");
  const readableB = about.rows[0].readable_T * 1000;
  return (
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:18px">
      <div class="exhibit" style="margin-top:0;border-top:3px solid var(--amber)">
        <h3 style="font-size:15.5px;margin-bottom:2px">You can see summer vacation</h3>
        <SchoolCalendar />
        <p style="font-size:13.5px;color:var(--muted);margin:0">
          School-based services collapse every June and return every September.
          The claims file knows when school is out.
        </p>
      </div>
      {voices?.a_val != null && voices.b_val != null && (
        <div class="exhibit" style="margin-top:0;border-top:3px solid var(--violet)">
          <h3 style="font-size:15.5px;margin-bottom:2px">Medicaid buys people voices</h3>
          <VoiceDots patientMonthsK={voices.b_val} />
          <p style="font-size:13.5px;color:var(--muted);margin:0">
            ${Math.round(voices.a_val)}M for speech-generating devices: for
            people who cannot speak, the program pays for the machine that
            talks. A twentieth of one percent of the readable money.
          </p>
        </div>
      )}
      {quarter?.a_val != null && (
        <div class="exhibit" style="margin-top:0;border-top:3px solid var(--care)">
          <h3 style="font-size:15.5px;margin-bottom:2px">The quarter-hour economy</h3>
          <CentsWaffle cents={Math.round((100 * quarter.a_val) / readableB)} />
          <p style="font-size:13.5px;color:var(--muted);margin:0">
            About ${Math.round(quarter.a_val)}B is billed in codes measured in
            15-minute units. The base unit of this economy is a quarter hour of
            one person helping another.
          </p>
        </div>
      )}
    </div>
  );
}
