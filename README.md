# Who does Medicaid pay?

An interactive analysis of US Medicaid payment records, 2018-2024, built as a
curated walk: place a bet, count down the ten biggest recipients, and follow
the story of what the program has become. Every number on the page is computed
in your browser, with DuckDB-WASM, from a published set of parquet tables that
ship with their definitions and row-level records.

Part of **healthsets**, an open-source project that cleans US healthcare's
public data files and republishes them the way they should have shipped:
documented, checkable, and free. The full pipeline is not ready for release
yet; this analysis is its first public piece.

## Run it

```bash
npm ci
npm run dev        # needs data in public/data — see below
```

The app reads its dataset from `public/data/` (or any origin set via
`VITE_DATA_BASE`). Two ways to get the data:

- **Published dataset:** set `VITE_DATA_BASE` to the published bundle URL
  (Hugging Face; announced with the first data release).
- **Inside the healthsets workspace:** `npm run sync-data` copies the newest
  export bundle from the pipeline workspace.

## Check the work

- `public/data/manifest.json` lists every table with row counts, checksums,
  and the exact definitions used (which billing codes count as home care, what
  "readable" means, how billing IDs were grouped into organizations).
- The bill-level slice (`slice_rowlevel.parquet`) and the NPI-to-entity map
  (`who_xwalk.parquet`) ship in the bundle, so the page's numbers are
  re-derivable without any private tooling.
- `npm run e2e` walks the built page headlessly (requires Python 3 with
  `playwright` installed and a preview server on port 5199).

## Publishing

`npm run build` produces a development build stamped with its data anchor.
`npm run build:release` is the deploy path: it refuses to build unless the
bundle is anchored to a tagged data release and every named entity's sources
are attached (`citation_debt: 0` in the manifest).

## License

Apache-2.0. The underlying data is US-government public domain; see the data
card in the published dataset for source attribution.
