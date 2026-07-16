// Data layer: DuckDB-WASM over the published parquet bundle.
// Dev reads /data/* (synced from the pipeline export); the released build points
// DATA_BASE at the published dataset. Tables load lazily: exactly the parquets a
// query mentions, on first use. The 24 MB row-level slice loads only if queried.
import * as duckdb from "@duckdb/duckdb-wasm";
import wasmEh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import workerEh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

export const DATA_BASE = import.meta.env.VITE_DATA_BASE ?? `${import.meta.env.BASE_URL}data`;

export const CORE_TABLES = [
  "about_the_file",
  "care_components",
  "crossover_bases",
  "category_state_year",
  "hcbs_code_yearbook",
  "fi_provider_year",
  "firm_code_year",
  "provider_table",
  "provider_year",
  "county_year",
  "county_reference",
  "zip_county",
  "state_code_year",
  "code_month",
  "medical_month",
  "org_breadth_year",
  "component_bridges",
  "org_segments",
  "state_provenance",
  "who_leaderboard",
  "who_leaderboard_lens",
  "who_race_monthly",
  "curiosities",
  "school_calendar",
] as const;

export interface EntityFamily {
  family_id: string;
  family_name: string;
  display_category: string;
  needs_citation: boolean;
}

export interface Manifest {
  dataset: string;
  data_release: string;
  source_vintage: string;
  generated: string;
  publishable: boolean;
  citation_debt: number;
  tables: Record<string, { rows: number; sha256: string }>;
  definitions: Record<string, string | string[] | EntityFamily[]> & {
    care_categories: string[];
    completeness_tiers: string[];
    fi_residual_bucket: string;
    entity_families: EntityFamily[];
  };
  caveats: string[];
}


let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
const registered = new Set<string>();

async function init(): Promise<duckdb.AsyncDuckDB> {
  // Bundles ship with the app (vite ?url assets) — no CDN, fully self-hosted.
  // eh-only: every current browser supports wasm exception handling; dropping
  // the mvp fallback halves the shipped engine.
  const bundle = await duckdb.selectBundle({
    mvp: { mainModule: wasmEh, mainWorker: workerEh },
    eh: { mainModule: wasmEh, mainWorker: workerEh },
  });
  const worker = new Worker(bundle.mainWorker!);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  // extensions (parquet) are vendored under public/extensions — the page
  // makes zero requests outside its own origin
  const conn = await db.connect();
  const repo = new URL(`${import.meta.env.BASE_URL}extensions`, location.href).href;
  await conn.query(`SET custom_extension_repository='${repo}'`);
  await conn.close();
  return db;
}

export function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

async function registerTable(name: string): Promise<void> {
  if (registered.has(name)) return;
  const db = await getDB();
  const url = new URL(`${DATA_BASE}/${name}.parquet`, location.href).href;
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  await db.registerFileBuffer(`${name}.parquet`, buf);
  const conn = await db.connect();
  await conn.query(
    `CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_parquet('${name}.parquet')`
  );
  await conn.close();
  registered.add(name);
}

/** First paint needs only the lobby's table; everything else loads on demand. */
export async function ready(): Promise<void> {
  await registerTable("who_leaderboard");
}

const ALL_TABLES: readonly string[] = [...CORE_TABLES, "slice_rowlevel"];

/** Lazy registration: fetch exactly the tables a query mentions, on first use. */
async function ensureTables(sql: string): Promise<void> {
  const needed = ALL_TABLES.filter(
    (t) => !registered.has(t) && new RegExp(`\\b${t}\\b`).test(sql)
  );
  await Promise.all(needed.map(registerTable));
}

export async function q<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  await ensureTables(sql);
  const db = await getDB();
  const conn = await db.connect();
  try {
    const res = await conn.query(sql);
    return res.toArray().map((r: { toJSON(): Record<string, unknown> }) => {
      const o = r.toJSON();
      for (const k in o) if (typeof o[k] === "bigint") o[k] = Number(o[k]);
      return o as T;
    });
  } finally {
    await conn.close();
  }
}

let manifestCache: Manifest | null = null;

export async function manifest(): Promise<Manifest> {
  if (!manifestCache) {
    manifestCache = await (await fetch(`${DATA_BASE}/manifest.json`)).json();
  }
  return manifestCache!;
}

/** Shared vocabulary published by the export (single source across the seam). */
export function defs(): Manifest["definitions"] {
  if (!manifestCache) throw new Error("manifest not loaded yet");
  return manifestCache.definitions;
}
