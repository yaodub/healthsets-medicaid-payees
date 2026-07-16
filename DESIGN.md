# Design: a museum exhibit, not a dashboard

This report is curated like a museum exhibition. That is a design discipline,
not a metaphor. It shapes every choice below.

## The doctrine

1. **One question per exhibition.** The whole page exists to ask and answer a
   single question the visitor immediately understands. Facts that do not serve
   the question do not appear, however interesting. Other questions get their
   own exhibitions (separate reports).
2. **The visitor discovers; we do not announce.** The page opens with a
   mystery, not a thesis. Each room reveals one step. The conclusion lands in
   the visitor's head slightly before we say it.
3. **One room, one claim, one artifact, one interaction.** Every room has: a
   claim (one sentence), an artifact (the data made visible), at most one
   interaction, and a placard (short plain-English text that says what the
   artifact does and does not show). Interactivity exists only where touching
   the data teaches something reading it cannot. Decorative interactivity is
   deleted.
4. **The placard states the trick honestly, at the moment of the reveal.** If
   part of a surprise comes from what the data cannot see (file scope, grouping
   choices), the placard says so right there, not in a footer. A reveal that
   depends on an unstated definition is a card trick, and visitors who notice
   card tricks never trust the museum again.
5. **Headline claims must survive every defensible definition.** Before a claim
   leads a room, it is recomputed under each reasonable grouping/basis. If the
   ranking changes with the definition, either the claim is restated to what
   holds under all of them, or the definition toggle becomes part of the
   exhibit.
6. **The skeptic gets a room, not a footnote.** One room is explicitly "we
   tried to break this finding; here is what survived." Recompute consoles and
   definition drawers live one click down everywhere, primary nowhere.
7. **Exit through the gift shop.** The final room hands the visitor the data
   itself: downloads, the row-level slice, and pointers to the definitions
   that make every displayed number re-derivable.
8. **Every act must answer the question it plants, or hand it explicitly to
   the limits panel.** Reader curiosity alone never justifies an addition;
   the test is whether answering makes the one message land harder. An
   unanswerable question a reader will naturally ask belongs, named, in
   the limits panel's cannot-answer list.

## The exhibition: "Who does Medicaid pay?"

The question: when Medicaid pays out, who receives the most money? Everyone
carries a guess (big hospitals, maybe pharmacies). The answer is stranger, and
unwinding *why* it is strange tells the story of what Medicaid has become:
America's home-care program.

### The walk (rebuilt from scratch 2026-07-15; supersedes the room map)

The page is five acts and a gift shop. One persistent idea: the reader placed
a bet, and the whole walk is the bet paying off.

| Act | Form | Claim | Interaction |
|---|---|---|---|
| Door | prose + the bet | "Who got the most? You already have a guess." | six bet buttons; nothing renders until the bet is placed |
| I · The countdown | ten full-height steps, #10 → #1; bar animates in on scroll; one-sentence micro-story each; two interludes (the pipes placard after #7, the medical-lens list after #5); verdict aside; the receipt-under-glass artifact | the top of Medicaid is agencies and caregiver-payroll firms | scroll IS the reveal |
| II · The crown strip | one row, 84 columns, colored by who held #1 that rolling year; amber flip markers; NY-2025 epilogue placard | the takeover happened in-window and is accelerating | tap a month for holder + $; "show the underlying lines" progressive disclosure (gap-masked) |
| III · The curve | two lines crossing, zero-based %, crossing annotated | the whole program is tipping the same way | three plain-language counting bases ("the honest count / narrowest / widest") |
| IV · Your state | a dossier card: care share trend, median personal-care payment, biggest local biller, completeness badge | every state runs a different Medicaid | state picker |
| Gift shop | search 41k billers · run-your-own-SQL console · honest limits | check our work | live queries |

Design rules carried from the doctrine: plain language everywhere (no
"itemized", no "runout", no basis jargon in reader-facing copy); zero-anchored
axes; reporting gaps render as holes, never as crashes; every named entity is
citation-gated before publication; the countdown micro-stories are
neutrality-reviewed facts.

Verification: a headless walk of the page (bet gate, scroll reveals, chart
interactions, plain-language sweep) must pass before any release; the harness
is to be committed to this repo as its E2E before publication.

<!-- superseded room map kept for history -->
<!--
### Room map

The reveal claim is COMPOSITIONAL, never a crown. "Company X is the #1 biller"
does not survive entity-grouping choices (a county agency and a payroll firm
trade first place with the definition); "the top of the list is the
care-at-home-and-in-the-community economy, in two administrative costumes —
county/state agencies in some states, caregiver-payroll firms in others — with
hospital systems below both" survives every grouping tested (2026-07-14/15).
The service mix of the top agencies verifies the claim: their dollars are
waiver residential per-diems, day habilitation, personal care, and community
support codes, not hospital medicine. Where first place lands depending on the
definition IS a placard: both answers say the same thing about the program.

| # | Room | Claim | Artifact | Interaction | Status |
|---|------|-------|----------|-------------|--------|
| 0 | **Lobby** | You have a guess. It is wrong. | Blinded top-10 leaderboard | Pick your guess (category), then reveal | GATED: entity curation (top-10 families cited) |
| 1 | **The reveal, honestly** | The top of the list is the care-at-home-and-in-the-community economy — county agencies and caregiver-payroll firms — with the biggest assembled hospital systems below both. | Entity-grain leaderboard + the "pipes" placard (what this ledger cannot see) + the "two costumes" placard (the agencies at the top bill waiver/community codes, same economy as the payroll firms) | Lens toggle: "doctor-medicine only" (familiar names) vs "everything" (the real list) | GATED: entity curation |
| 2 | **What is this company?** | The #1-class biller employs almost no caregivers. It runs payroll. | PPL's receipt: top codes, all personal-care variants | Tap through the monotone receipt | placeholder (data exported) |
| 3 | **Rewind — the centerpiece** | The takeover happened inside this file's window: in 2018 the podium was government agencies; by 2024 payroll firms hold the top spots while the agencies' dollars sit flat. The economy changed costumes, recently, and it is accelerating (epilogue: NY 2025). | Animated top-5 podium at entity grain, 2024 rewinding to 2018; flat-agency vs surging-firm growth curves | Scrub the years | placeholder (needs leaderboard_year export; 2024 podium claim must be re-checked on a runout-leveled basis before copy ships) |
| 4 | **It's an economy** | Self-directed care, where the person hires their own caregiver (often family), roughly tripled. | Fiscal-intermediary growth series, six firms | Tap a firm for its sparkline + states | partial (Firms exhibit reusable) |
| 5 | **What the money buys** | The biggest single thing Medicaid buys is a person's time, 15 minutes at a time. | The receipt: largest home-care services; months-of-care view | Tap a service line | wired (Receipt/CodeDetail reuse) |
| 6 | **The tipping point** | Home-and-community care passed doctor-medicine inside this ledger. | Crossover chart | The skeptic's toggle: three bases, "we tried to kill this finding" | wired (CareStack reuse, reframe) |
| 7 | **Where you live decides** | Whether Medicaid pays family caregivers, and what an hour of care pays, depends on your state. | State map + rate explorer | Pick your state (the one personalization moment) | wired (StateMap/RateMap reuse) |
| 8 | **Epilogue + gift shop** | The story is still moving (post-window: New York handed its whole program to the #1 firm). Here is everything, checkable. | Honest-limits placard; provider search; downloads; recompute console | Search any organization; run the SQL | partial (ProviderSearch, RecomputeDrawer reuse) |

### Cut from the previous layout (not in this exhibition)

Month scrubber, business-formation counts, industry-shape trio (breadth /
bridges / segments), county/ZIP lookup, geo-shape comparison, spark wall.
Reason: they answer questions this exhibition does not ask. Candidates for
future exhibitions; their components remain in `src/exhibits/` until room
build-out finalizes, then unused ones are removed.

### Prerequisites tracked outside this repo

- **Entity table** (rooms 0, 1, 3): "who" must mean the real-world
  organization, not the billing ID. Rankings change with grouping, so the
  grouping is load-bearing. The exhibit consumes the **curated overlay**
  artifacts (base pipeline = uniform rules only; hand-verified family merges
  apply as a view-side overlay with per-row provenance — the exhibit is
  editorial surface, the base data product is not). Every family the exhibit
  names must be cited (needs_citation=false) before rooms 0/1/3 un-gate.
- **leaderboard_year export** (room 3).
- Scope placard copy needs the itemized-vs-total disclosure reviewed against
  the data card.

-->
