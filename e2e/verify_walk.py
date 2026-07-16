# E2E: headless verification of the full walk (run a preview server on :5199 first,
# e.g. `npm run build && npx vite preview --port 5199`). Requires python playwright.
import asyncio, sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        page = await b.new_page()
        errors = []
        fetched = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: fetched.append(r.url) if ".parquet" in r.url else None)
        external = []
        page.on("request", lambda r: external.append(r.url) if r.url.startswith("http") and "localhost" not in r.url else None)
        await page.goto("http://localhost:5199/", wait_until="networkidle")
        await page.wait_for_timeout(9000)  # duckdb-wasm init
        checks = {}
        body = await page.inner_text("body")
        prebet_tables = set(u.split("/")[-1] for u in fetched)
        checks["lazy: lobby loads one table"] = prebet_tables <= {"who_leaderboard.parquet"}
        checks["coverage at door"] = "January 2018 through December 2024" in body and "not a live feed" in body
        checks["bet buttons"] = await page.locator("button.btn").count() >= 6
        checks["no countdown before bet"] = "LA County" not in body
        checks["no later acts before bet"] = ("The takeover" not in body) and ("Look one up" not in body)
        await page.get_by_role("button", name="a hospital system").click()
        await page.wait_for_timeout(1500)
        # force reveal animations by scrolling through
        for _ in range(24):
            await page.mouse.wheel(0, 1200)
            await page.wait_for_timeout(120)
        await page.wait_for_timeout(1500)
        body = await page.inner_text("body")
        checks["ten steps"] = await page.locator(".step").count() == 10
        checks["names revealed"] = "Public Partnerships" in body and "Tempus" in body
        checks["pipes interlude"] = "Where are the giant hospital chains?" in body
        checks["lens interlude"] = "Why does this list feel unfamiliar?" in body
        checks["verdict"] = "care that happens where people live" in body and "not a mental-health bill" in body
        checks["receipt"] = "PUBLIC PARTNERSHIPS LLC" in body and "15 min" in body
        checks["snapshots"] = "2018" in body and "the year this file opens" in body
        checks["snapshot legend"] = "government agency" in body and "caregiver-payroll company" in body
        checks["epilogue"] = "New York moved" in body and "two hundred thousand" in body
        checks["curve crossing"] = ("ahead for good" in body) or ("no crossing" in body)
        checks["curve bases"] = "the honest count" in body and "the narrowest count" in body
        checks["state card"] = "Medicaid in NY" in body and "of every 100 readable Medicaid cents" in body
        checks["state comparisons"] = "typical state" in body and "nationwide" in body
        checks["family question answered"] = "Can a family member be paid" in body
        checks["why paragraph"] = "Three things happened" in body
        checks["curve footnote"] = "biggest programs tipping" in body
        checks["cannot answer"] = "cannot answer" in body and "rule book" in body
        checks["stress test"] = "put it to the test" in body and "April 2020" in body
        checks["corridors"] = "What did the doubling?" in body
        checks["closing room"] = "What you now know" in body and "largest payer for long-term care" in body
        checks["take the data"] = "TAKE THE DATA" in body and "manifest" in body and "parquet" in body
        checks["crossing honest"] = "ahead for good" in body
        checks["gallery calendar"] = "school-service bills, by month" in body
        checks["gallery voice dots"] = "five thousand months lived with a voice" in body
        checks["search jumpstart"] = "biggest home-care billers" in body
        checks["healthsets plug"] = "healthsets project" in body and "github.com/yaodub" in body
        checks["ca floor warning"] = True  # exercised below
        checks["tile map"] = await page.locator("svg.statemap rect").count() >= 50
        checks["side gallery"] = "quarter-hour economy" in body and "summer vacation" in body
        checks["drivers act"] = "Only three things can do that" in body and "People getting it" in body and "expansion, not an inflation" in body
        checks["gift shop"] = "Look one up" in body
        checks["plain language"] = ("itemized" not in body) and ("RUNOUT" not in body) and ("trailing" not in body)
        # month-by-month disclosure
        await page.get_by_role("button", name="show the month-by-month detail").click()
        await page.wait_for_timeout(800)
        body = await page.inner_text("body")
        checks["detail lines"] = "first held the monthly #1 in July 2022" in body
        # tile map interaction: pick TX
        await page.locator("svg.statemap g", has_text="TX").click()
        await page.wait_for_timeout(900)
        body = await page.inner_text("body")
        checks["map pick"] = "Medicaid in TX" in body
        # CA: low-completeness floor warning at the number, no NY-specific copy
        await page.locator("svg.statemap g", has_text="CA").click()
        await page.wait_for_timeout(900)
        body = await page.inner_text("body")
        checks["ca floor warning"] = "a floor, not a measurement" in body and "started near the top" not in body
        checks["coverage number"] = "of the official total" in body
        ca_fill = await page.locator("svg.statemap g", has_text="CA").locator("rect").get_attribute("fill")
        checks["ca tile amber"] = ca_fill == "var(--amber)"
        checks["map legend incomplete"] = "records too incomplete to read a share" in body
        checks["lazy: slice never fetched"] = not any("slice_rowlevel" in u for u in fetched)
        checks["lazy: tables loaded on demand"] = any("who_race_monthly" in u for u in fetched) and any("curiosities" in u for u in fetched)
        checks["self-contained: no external origins"] = not external
        checks["no page errors"] = not errors
        ok = all(checks.values())
        for k, v in checks.items():
            print(("PASS " if v else "FAIL ") + k)
        if errors: print("pageerrors:", errors[:3])
        await b.close()
        sys.exit(0 if ok else 1)

asyncio.run(main())
