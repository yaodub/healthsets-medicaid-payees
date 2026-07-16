// Exit through the gift shop: search any biller, read the honest limits.
// Data: provider_table, provider_year.
import { useState } from "preact/hooks";
import { useQuery, fmtM } from "../hooks";
import { DATA_BASE } from "../data/db";

interface Prov {
  npi: string; provider_name: string | null;
  first_year: number; last_year: number; v: number | null;
}

export function Search() {
  const [term, setTerm] = useState("");
  const n = useQuery<{ c: number }>(`SELECT count(*) c FROM provider_table`);
  const clean = term.replace(/[^a-zA-Z0-9 .&'-]/g, "").trim();
  const list = useQuery<Prov>(
    clean.length >= 3
      ? `SELECT pt.npi, pt.provider_name, pt.first_year, pt.last_year,
           pt.clean_paid_M_alltime v
         FROM provider_table pt
         WHERE pt.provider_name ILIKE '%${clean.replace(/'/g, "''")}%'
         ORDER BY 5 DESC NULLS LAST LIMIT 6`
      : null
  );
  return (
    <div>
      <input
        class="search"
        placeholder={`Search ${n.rows?.[0] ? n.rows[0].c.toLocaleString() : "the"} home-care billers by name…`}
        value={term}
        onInput={(e) => setTerm((e.target as HTMLInputElement).value)}
      />
      {list.rows && list.rows.length > 0 && (
        <table class="out">
          <thead><tr><th>organization</th><th>NPI</th><th>active</th><th>billed, all services</th></tr></thead>
          <tbody>
            {list.rows.map((r) => (
              <tr key={r.npi}>
                <td>{r.provider_name}</td>
                <td class="mono">{r.npi}</td>
                <td class="mono">{r.first_year}–{r.last_year}</td>
                <td class="mono">{r.v != null ? fmtM(r.v) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!list.rows && clean.length >= 3 && (
        <div class="loading">searching…</div>
      )}
      {list.rows && list.rows.length === 0 && clean.length >= 3 && (
        <p class="placard">No match. This table holds the home-care side of the ledger.</p>
      )}
      <TopInState />
      <p class="placard" style="font-size:12px;margin-top:8px">
        Figures are nationwide totals across all Medicaid services, per billing
        ID. An organization can bill through several IDs; the countdown at the
        top of the page adds those together.
      </p>
    </div>
  );
}

const STATES = ("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY").split(" ");

function TopInState() {
  const [st, setSt] = useState("NY");
  const { rows } = useQuery<{ provider_name: string; npi: string; v: number }>(
    `SELECT provider_name, npi, max(clean_paid_M_alltime) v FROM provider_table
     WHERE list_contains(attributed_states, '${st}') AND provider_name IS NOT NULL
     GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 5`
  );
  return (
    <div style="margin-top:14px">
      <p style="font-size:13px;color:var(--muted);margin:0 0 6px">
        Don't know any names? Start with the five biggest home-care billers
        enrolled in{" "}
        <select
          style="font:inherit;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:2px 6px"
          value={st}
          onChange={(e) => setSt((e.target as HTMLSelectElement).value)}
        >
          {STATES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </p>
      {!rows && <div class="loading">loading the billers…</div>}
      {rows && (
        <table class="out">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.npi}>
                <td class="mono">{i + 1}</td>
                <td>{r.provider_name}</td>
                <td class="mono">{fmtM(r.v)} nationwide</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function TakeTheData() {
  return (
    <div class="exhibit" style="margin-top:22px">
      <div class="exhibit-tag"><span>TAKE THE DATA</span></div>
      <p style="font-size:14px;margin:0">
        Every number on this page is computed in your browser from a public
        set of parquet tables, row-level records included. The{" "}
        <a href={`${DATA_BASE}/manifest.json`}>manifest</a> lists every table
        with its row count, checksum, and the exact definitions used. The
        data and the code for this page live at{" "}
        <a href="https://github.com/yaodub/healthsets-medicaid-payees">
          github.com/yaodub/healthsets-medicaid-payees
        </a>.
      </p>
    </div>
  );
}

export function AboutHealthsets() {
  return (
    <div>
      <h2>This page is a <span class="brand">healthsets</span> project.</h2>
      <p style="font-size:16px;max-width:620px">
        <span class="brand">healthsets</span> cleans US healthcare's public data files and
        republishes them the way they should have shipped: documented,
        checkable, and free. Every number carries its definition, every
        dataset its row-level records, every correction its history.
      </p>
      <p style="font-size:16px;max-width:620px">
        The full pipeline is not ready for release yet. This analysis is its
        first public piece; the code and data for it live at{" "}
        <a href="https://github.com/yaodub/healthsets-medicaid-payees">
          github.com/yaodub/healthsets-medicaid-payees
        </a>.
      </p>
    </div>
  );
}

export function HonestLimits() {
  const { rows } = useQuery<{ raw_total_T: number; n_error_rows: number; readable_T: number; recon_min_pct: number; recon_max_pct: number }>(
    `SELECT raw_total_T, n_error_rows, readable_T, recon_min_pct, recon_max_pct FROM about_the_file`
  );
  const f = rows?.[0];
  return (
    <div class="placard" style="max-width:none">
      <p>
        <b>What this page can and cannot see.</b> It counts the part of
        Medicaid the government records bill by bill. Most hospital stays and
        prescription drugs sit outside it, on both sides of every comparison.
        Very small billing cells are removed by the government before release.
        The last months of 2024 were still filling in when this file was
        published. Some states' records are more complete than others; state
        views carry a completeness badge.
      </p>
      {f && (
        <p>
          <b>Why trust the numbers at all?</b> The raw government file claims
          ${f.raw_total_T} trillion in payments; {f.n_error_rows} broken rows
          carry most of that. We flag rather than delete, and the readable
          remainder, ${f.readable_T} trillion, matches {f.recon_min_pct}
          to {f.recon_max_pct} percent of Medicaid's official financial totals
          in every one of the seven years. How we read the file is a story of
          its own, for another page.
        </p>
      )}
      <p>
        <b>Good questions this ledger cannot answer.</b> How much of a payroll
        company's dollar reaches the caregiver (we see the payment, not the
        paycheck). Whether nursing homes shrank as home care grew (facility
        stays live in a different file). Who the new people receiving care are
        (these records carry no ages or diagnoses). And whether you or your
        family qualify for any of this (this is a ledger, not a rule book;
        your state's Medicaid office is the answer to that one).
      </p>
      <p>
        Organizations were assembled from billing IDs two ways: uniform rules
        applied to every record (government keys, calibrated name matching),
        plus a short hand-checked list for the names shown on this page. The
        grouping rules ship with the data, and rankings that depend on grouping
        choices say so.
      </p>
      <p>
        The tables above are the full dataset behind this page, row-level
        records included. The pipeline that produces them from the raw
        government file is not ready for release yet.
      </p>
    </div>
  );
}
