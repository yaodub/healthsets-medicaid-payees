// "Who does Medicaid pay?" — a curated walk, rebuilt from scratch 2026-07-15.
// Structure (DESIGN.md): a bet, a countdown from #10 to #1 with interludes,
// the crown strip, the quiet curve, your state's card, and the gift shop.
import { useEffect, useState } from "preact/hooks";
import { ready, manifest, type Manifest } from "./data/db";
import { Countdown } from "./story/Countdown";
import { Snapshots } from "./story/Crown";
import { Curve } from "./story/Curve";
import { StateCard } from "./story/StateCard";
import { StressTest } from "./story/StressTest";
import { Search, HonestLimits, TakeTheData, AboutHealthsets } from "./story/GiftShop";
import { useQuery } from "./hooks";
import { SideGallery } from "./story/SideGallery";
import { Drivers } from "./story/Drivers";

function ExitNumbers(props: { guess: string | null }) {
  // the closing claims stay tied to the data they came from
  const ptm = useQuery<{ m: number }>(
    `SELECT round(sum(patient_months)/1e6, 1) m FROM hcbs_code_yearbook
     WHERE code = 'T1019' AND year = 2023`
  );
  return (
    <>
      <p style="font-size:16.5px">
        {props.guess && props.guess !== "(no bet)" ? (
          <>You walked in betting on <b>{props.guess}</b>. </>
        ) : null}
        The biggest recipients of Medicaid's bill-by-bill money are not
        hospitals. They are organizations paid for help with daily
        life: county care agencies, and payroll companies for
        caregivers that people hire themselves.
      </p>
      <p style="font-size:16.5px">
        The change is recent and it is still moving: payroll companies
        took the top spots in the last three years. And the engine is
        not prices. It is people: the biggest single service alone paid
        for {ptm.rows?.[0] ? `${ptm.rows[0].m} million` : "millions of"}{" "}
        patient-months of care in 2023.
      </p>
    </>
  );
}

export function App() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [mf, setMf] = useState<Manifest | null>(null);
  const [err, setErr] = useState("");
  const [guess, setGuess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([ready(), manifest()])
      .then(([, m]) => {
        setMf(m);
        setState("ready");
      })
      .catch((e) => {
        setErr(String(e));
        setState("error");
      });
  }, []);

  return (
    <main>
      {/* ── the door ── */}
      <section>
        <div class="wrap">
          <h1>Who does Medicaid pay?</h1>
          <p style="font-size:19px;color:var(--muted);margin-top:22px">
            Medicaid is the government health insurance program for people with
            low incomes or disabilities. One in five Americans is on it. Over
            seven years it paid out about a trillion dollars that anyone can
            check, bill by bill.
          </p>
          <p style="font-size:19px;color:var(--muted)">
            So who got the most? You already have a guess. This page counts it
            down, ten to one.
          </p>
          <p style="font-size:14px;color:var(--muted)">
            The records cover January 2018 through December 2024. That is the
            most recent data the government has published: payment records like
            these are released with a lag of a year or more, so this is a
            history that ends in 2024, not a live feed.
          </p>
          <p class="stamp" style="margin-top:22px">
            An independent open-data analysis from <span class="brand">healthsets</span>. Not affiliated
            with any government agency, insurer, or provider. No tracking, no
            accounts, nothing to sell.
          </p>
        </div>
      </section>

      {state === "error" && (
        <div class="wrap loading">
          The data didn't load. Try refreshing the page.
          {import.meta.env.DEV && (
            <> Dev hint: run <span class="mono">npm run sync-data</span> first. ({err})</>
          )}
        </div>
      )}
      {state === "loading" && <div class="wrap loading">loading the records…</div>}

      {state === "ready" && mf && (
        <>
          {/* ── Act I: the countdown ── */}
          <section style="padding-top:8px">
            <div class="wrap">
              <Countdown guess={guess} onBet={setGuess} />
            </div>
          </section>

          {/* ── Acts II+ stay behind the bet: no spoilers by scrolling ── */}
          {guess && (
          <>
          <section class="quiet">
            <div class="wrap">
              <h2>That list looked very different seven years ago.</h2>
              <p class="placard">
                The countdown added up all seven years into one list. Here is
                the same top five at three moments in time. Watch the colors.
              </p>
              <Snapshots />
            </div>
          </section>

          {/* ── Interlude: the stress test ── */}
          <section>
            <div class="wrap">
              <h2>Then one month put it to the test.</h2>
              <p class="placard">
                A fair question about any trend: is it real, or is it an
                accounting fashion? The spring of 2020 answered it the hard
                way.
              </p>
              <StressTest />
            </div>
          </section>

          {/* ── Act III: the curve ── */}
          <section>
            <div class="wrap">
              <h2>The whole program is tipping the same way.</h2>
              <p class="placard">
                We tried to break this finding. The buttons under the chart
                show every way we counted it. Watch where the lines cross.
              </p>
              <Curve />
            </div>
          </section>

          <section style="padding:34px 0">
            <div class="wrap" style="text-align:center">
              <p style="font-size:17px;color:var(--muted);max-width:520px;margin:0 auto">
                The dollars behind those shares doubled in seven years.
                What did the doubling?
              </p>
            </div>
          </section>

          {/* ── Act IV: the engine ── */}
          <section>
            <div class="wrap">
              <h2>It is not the same care getting pricier. It is more people.</h2>
              <Drivers />
            </div>
          </section>

          <section style="padding:34px 0">
            <div class="wrap" style="text-align:center">
              <p style="font-size:17px;color:var(--muted);max-width:520px;margin:0 auto">
                More people, in more places. How much more depends entirely on
                where you live.
              </p>
            </div>
          </section>

          {/* ── Act V: your state ── */}
          <section class="quiet">
            <div class="wrap">
              <h2>Every state runs a different Medicaid.</h2>
              <p class="placard">
                Whether a family member can be paid to give care, and what that
                care pays, depends on the state. Pick yours.
              </p>
              <StateCard />
            </div>
          </section>

          {/* ── the side gallery ── */}
          <section>
            <div class="wrap">
              <h2>What else this money buys.</h2>
              <p class="placard">
                Three small pieces from the same payment records, each one
                checkable in the data below.
              </p>
              <SideGallery />
            </div>
          </section>

          {/* ── the exit ── */}
          <section class="quiet">
            <div class="wrap">
              <h2>What you now know.</h2>
              <ExitNumbers guess={guess} />
              <p class="placard">
                Medicaid is the largest payer for long-term care in the United
                States, and private insurance rarely covers ongoing help at
                home. Whatever happens to this program next happens to this
                economy first.
              </p>
            </div>
          </section>

          {/* ── the gift shop ── */}
          <section>
            <div class="wrap">
              <h2>Every biller is real. Look one up.</h2>
              <Search />
              <TakeTheData />
              <div style="margin-top:26px">
                <HonestLimits />
              </div>
            </div>
          </section>

          {/* ── the healthsets plug, prominent and last ── */}
          <section class="quiet">
            <div class="wrap">
              <AboutHealthsets />
            </div>
          </section>
          </>
          )}
        </>
      )}
      <footer class="mono">
        built from public government records · no tracking
      </footer>
    </main>
  );
}
