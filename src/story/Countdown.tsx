// Act I: the countdown. Ten screens, #10 to #1, one organization each.
// The reader bets first. Interludes answer the questions the ranks raise,
// at the moment they raise them. Ends with the verdict and one receipt
// under glass. Data: who_leaderboard, who_leaderboard_lens, firm_code_year.
import { useQuery, fmtB, useReveal } from "../hooks";
import { defs } from "../data/db";

interface LB {
  rank: number; entity_name: string; kind: string; n_npis: number;
  clean_paid_B: number; curated_family_id: string | null;
}

/** Display category. Curated families carry theirs in the manifest (single
 *  source across the seam); government comes from the entity kind; hospital
 *  systems are the only regex fallback (AHRQ-named, uncurated). */
export function category(r: LB): string {
  if (r.kind === "government") return "government agency";
  if (r.curated_family_id) {
    const fam = defs().entity_families.find((f) => f.family_id === r.curated_family_id);
    if (fam) return fam.display_category;
  }
  const n = r.entity_name.toUpperCase();
  if (/CLINIC|HOSPITAL|HEALTH SYSTEM|UNIVERSITY|MEDICAL CENTER|HEALTH NETWORK|MISSIONARIES/.test(n))
    return "hospital system";
  return "company";
}

export const CAT_COLOR: Record<string, string> = {
  "government agency": "var(--med)",
  "caregiver-payroll company": "var(--care)",
  "home-care company": "var(--care)",
  "lab company": "var(--amber)",
  "dialysis company": "var(--amber)",
  "hospital system": "var(--violet)",
};
export const catColor = (c: string) => CAT_COLOR[c] ?? "var(--muted)";

const GUESSES = [
  "a hospital system",
  "a pharmacy chain",
  "an insurance company",
  "a lab company",
  "a government agency",
  "a caregiver-payroll company",
];

export const SKIP = "(no bet)";

const GUESS_TO_CAT: Record<string, string> = {
  "a hospital system": "hospital system",
  "a lab company": "lab company",
  "a government agency": "government agency",
  "a caregiver-payroll company": "caregiver-payroll company",
};

// One sentence per rank, in countdown order. Written to the neutrality rule:
// verifiable roles, no characterization.
const STORY: Record<string, string> = {
  "Franciscan Missionaries of Our Lady Health System":
    "A Catholic hospital system in Louisiana and Mississippi. Hospitals do appear on this list. Just not where you might think.",
  "DEPARTMENT OF INTELLECTUAL AND DEVELOPMENTAL DISABILITIES, STATE OF TN":
    "A Tennessee state agency. Its bills are group homes and day programs, paid by the day.",
  "Quest Diagnostics":
    "A name from your lab slip. Blood tests, millions of them.",
  "University of California Health":
    "Five university hospital systems, counted as one.",
  "Labcorp":
    "The other name from your lab slip.",
  "Cleveland Clinic":
    "One of the most famous hospitals in the world, hundreds of billing IDs counted as one system. Remember it. It is the last hospital on this list.",
  "Tempus Unlimited":
    "A company that runs payroll for Massachusetts families who hire their own caregivers. By 2024 it billed more in these records than any hospital system in America.",
  "Massachusetts Department of Developmental Services":
    "One state department, registered under three different spellings. Group homes and day programs for people with developmental disabilities.",
  "Public Partnerships (PPL)":
    "A company most people have never heard of. It runs payroll in about 20 states for caregivers hired by the person they care for. Often that caregiver is family.",
  "LOS ANGELES COUNTY DEPARTMENT OF MENTAL HEALTH":
    "A county mental health department: support teams, rehab sessions, case management, out in the community. Mental health is not the biggest money in Medicaid, but it is the most centralized. One county, one department, and it out-bills every hospital system in the country.",
};

function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function Step(props: { r: LB; mx: number; final: boolean; children?: preact.ComponentChildren }) {
  const [ref, on] = useReveal();
  const { r, mx } = props;
  const cat = category(r);
  return (
    <div ref={ref} class={"step" + (on ? " on" : "")}>
      <div class="step-inner">
        <div class="rankno" style={on ? `color:${catColor(cat)}` : ""}>#{r.rank}</div>
        <div class="barTrack">
          <div class="barFill" style={`background:${catColor(cat)};width:${on ? (r.clean_paid_B / mx) * 100 : 0}%`} />
        </div>
        <div class="who">
          {titleCase(r.entity_name)}
          <span class="chip" style="margin-left:10px;vertical-align:2px">
            <span class="dot" style={`background:${catColor(cat)}`} /> {cat}
          </span>
          <span class="mono" style="float:right;font-weight:400">${fmtB(r.clean_paid_B)}</span>
        </div>
        <p class="story">{STORY[r.entity_name] ?? ""}</p>
        {props.children}
      </div>
    </div>
  );
}

function LensAside() {
  const { rows } = useQuery<{ rank: number; entity_name: string; clean_paid_B: number }>(
    `SELECT rank, entity_name, clean_paid_B FROM who_leaderboard_lens ORDER BY rank LIMIT 5`
  );
  return (
    <div class="aside">
      <h3>Why does this list feel unfamiliar?</h3>
      <p>
        Medicaid pays for two different worlds of things. One is medical care:
        doctor visits, tests, procedures. The other is help with daily life: a
        caregiver's hours, a group home, a ride to treatment.
      </p>
      <p>
        Count only the medical world and the leaderboard looks like the
        healthcare you know:
        {rows ? " " + rows.map((r) => `${r.rank}. ${titleCase(r.entity_name)}`).join("  ·  ") : " loading…"}
      </p>
      <p>This page counts both worlds. Keep going.</p>
    </div>
  );
}

function PipesAside() {
  return (
    <div class="aside">
      <h3>Where are the giant hospital chains?</h3>
      <p>
        They are not poor in Medicaid. Most of their money arrives through
        channels this ledger does not carry: whole hospital stays billed as one
        case, lump sums paid through insurance plans, special subsidies.
      </p>
      <p>
        This page counts the part of Medicaid paid bill by bill, the part
        anyone can check. Even in that part, the biggest hospital systems are
        about to appear. And then stop appearing.
      </p>
    </div>
  );
}

function Verdict(props: { guess: string | null; rows: LB[] }) {
  const counts: Record<string, number> = {};
  for (const r of props.rows) counts[category(r)] = (counts[category(r)] ?? 0) + 1;
  const topCat = category(props.rows[0]);
  const guessCat = props.guess ? GUESS_TO_CAT[props.guess] : undefined;
  const right = guessCat === topCat;
  const guessCount = guessCat ? counts[guessCat] ?? 0 : 0;
  return (
    <div class="aside" style="border-left-color:var(--care)">
      <h3>
        {props.guess === SKIP
          ? "No bet placed. Here is the answer anyway."
          : right
          ? "You called it."
          : "Your bet: " + (props.guess ?? "none placed")}
      </h3>
      {!right && props.guess !== SKIP && (
        <p>
          {guessCat === undefined || guessCount === 0
            ? "Not a single one in the top ten."
            : `${guessCount} in the top ten. But not on top.`}{" "}
          The list belongs to another world.
        </p>
      )}
      <p>
        Three government agencies whose bills are group homes and community
        care. Two payroll companies for hired caregivers. Two labs. Three
        hospital systems, none higher than fifth. The top four spots, all of
        them, belong to the care that happens where people live.
      </p>
      <p>
        And no, it is not a mental-health bill: behavioral care is about one
        dollar in seven here, and most of the agencies above actually bill
        group homes for people with disabilities. A leaderboard crowns whoever
        concentrates the billing. The big money is help with daily life.
      </p>
    </div>
  );
}

function PplReceipt() {
  const { rows } = useQuery<{ code: string; v: number }>(
    `SELECT code, round(sum(clean_M),0) v FROM firm_code_year
     WHERE firm = 'PPL' GROUP BY 1 ORDER BY 2 DESC LIMIT 6`
  );
  const NAMES: Record<string, string> = {
    T1019: "personal care, 15 min",
    S5126: "attendant care, per day",
    T2025: "waiver services",
    S5125: "attendant care, 15 min",
    S5150: "respite for family, 15 min",
    H2021: "community wraparound, 15 min",
    H2016: "residential habilitation, day",
    S5130: "homemaker services, 15 min",
  };
  if (!rows) return <div class="loading">loading…</div>;
  const total = rows.reduce((s, r) => s + r.v, 0);
  return (
    <div>
      <div class="receipt">
        <div class="rhead">PUBLIC PARTNERSHIPS LLC<br />MEDICAID · 2018–2024</div>
        {rows.map((r) => (
          <div key={r.code} class="rline">
            <span>{NAMES[r.code] ?? r.code}</span>
            <span>${(r.v / 1000).toFixed(2)}B</span>
          </div>
        ))}
        <div class="rtotal"><span>largest items</span><span>${(total / 1000).toFixed(1)}B</span></div>
      </div>
      <p class="placard" style="margin:0 auto;max-width:400px;text-align:center">
        Hold one artifact up to the light. Every line on the #2 biller's
        receipt is a person's time, sold in 15-minute units or by the day. Not
        one operation. Not one drug.
      </p>
      <p class="placard" style="margin:12px auto 0;max-width:400px;text-align:center">
        Most of it is caregivers' paychecks passing through: the company's
        verified role is running payroll, not clinics. What these records
        cannot show is how much of each dollar reaches the caregiver.
      </p>
    </div>
  );
}

export function Countdown(props: { guess: string | null; onBet: (g: string) => void }) {
  const { guess } = props;
  const { rows } = useQuery<LB>(
    `SELECT rank, entity_name, kind, n_npis, clean_paid_B, curated_family_id
     FROM who_leaderboard WHERE rank <= 10 ORDER BY rank DESC`
  );
  if (!rows) return <div class="loading">loading the data…</div>;
  const mx = Math.max(...rows.map((r) => r.clean_paid_B));
  return (
    <div>
      {!guess && (
        <div class="exhibit" style="margin-bottom:20px">
          <p style="font-size:15px;margin:0 0 10px">
            <b>Before the countdown, place a bet.</b> Over seven years,
            2018 to 2024, what kind of organization received the most money
            from Medicaid, bill by bill?
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            {GUESSES.map((g) => (
              <button key={g} class="btn" onClick={() => props.onBet(g)}>{g}</button>
            ))}
          </div>
          <p style="font-size:12.5px;color:var(--muted);margin:12px 0 0">
            Ten answers, three charts, and a map are behind this question.{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); props.onBet(SKIP); }}>
              Skip the bet and just show me
            </a>
          </p>
        </div>
      )}
      {guess && (
        <>
          <p class="placard" style="margin-bottom:6px">
            {guess === SKIP ? "No bet placed. Counting down from #10." : (
              <>Your bet: <b>{guess}</b>. Counting down from #10.</>
            )}
          </p>
          {rows.map((r) => {
            const after: preact.ComponentChildren[] = [];
            if (r.rank === 7) after.push(<PipesAside key="pipes" />);
            if (r.rank === 5) after.push(<LensAside key="lens" />);
            return (
              <Step key={r.rank} r={r} mx={mx} final={r.rank === 1}>
                {after}
              </Step>
            );
          })}
          <Verdict guess={guess} rows={[...rows].sort((a, b) => a.rank - b.rank)} />
          <PplReceipt />
        </>
      )}
    </div>
  );
}
