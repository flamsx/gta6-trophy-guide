"""Functional test for Leonida 55: renders, persistence, spoiler, filters, counters,
export/import, theme, planner — plus a network check (every request stays local)."""
import json, os, subprocess, sys, time, urllib.request

REPO = os.path.dirname(os.path.abspath(__file__))
PORT = 8092
BASE = f"http://127.0.0.1:{PORT}"
CHROME = "/home/hatch/workspace/.tmp/chrome-linux64/chrome"

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")

def main():
    server = subprocess.Popen(["node", "serve.ts", "--port", str(PORT)],
                              cwd=REPO, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(BASE + "/", timeout=1); break
            except Exception:
                time.sleep(0.2)
        sys.path.insert(0, "/home/hatch/workspace/venv-playwright/lib/python3.12/site-packages")
        from playwright.sync_api import sync_playwright
        errors, failed, requests = [], [], []
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
            ctx = browser.new_context(viewport={"width": 1280, "height": 800})
            page = ctx.new_page()
            page.on("request", lambda r: requests.append(r.url))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("requestfailed", lambda r: failed.append(r.url))

            page.goto(BASE + "/#/checklist", wait_until="networkidle")
            page.wait_for_timeout(400)
            rows = page.locator(".trophy-row")
            check("55 trophies render", rows.count() == 55, f"count={rows.count()}")
            check("audit strip visible", "55/55 official names verified" in page.locator(".audit").inner_text())
            check("progress starts 0/55", "0 of 55 earned" in page.locator("#progressCount").inner_text())

            # Persistence: tick the platinum, reload, still ticked.
            rows.first.locator("input[type=checkbox]").click()
            page.wait_for_timeout(200)
            page.reload(wait_until="networkidle"); page.wait_for_timeout(400)
            check("checkbox persists after reload",
                  page.locator(".trophy-row").first.locator("input[type=checkbox]").is_checked())
            check("progress shows 1/55", "1 of 55 earned" in page.locator("#progressCount").inner_text())

            # Counter persists: set stunts to 100.
            page.locator(".trophy-row", has_text="Cunning Stunts").locator("input[type=number]").fill("100")
            page.locator(".trophy-row", has_text="Cunning Stunts").locator("input[type=number]").press("Enter")
            page.wait_for_timeout(200)
            page.reload(wait_until="networkidle"); page.wait_for_timeout(400)
            val = page.locator(".trophy-row", has_text="Cunning Stunts").locator("input[type=number]").input_value()
            check("counter persists after reload", val == "100", f"value={val}")

            # Spoiler: hidden story trophy masked by default, revealed when spoilers on.
            masked = page.locator(".trophy-row", has_text="Hidden trophy").count()
            check("spoiler masks hidden trophies (default on)", masked > 0, f"masked rows={masked}")
            page.locator("#spoilerToggle").click(); page.wait_for_timeout(300)
            check("spoiler off reveals names",
                  page.locator(".trophy-row", has_text="T**s Ass Drug Money").count() == 1)
            page.locator("#spoilerToggle").click(); page.wait_for_timeout(300)

            # Filters: grade silver -> 6 rows; search "stunt" -> Cunning Stunts.
            page.locator(".filters select").first.select_option("silver")
            page.wait_for_timeout(300)
            check("grade filter silver = 6 rows", page.locator(".trophy-row").count() == 6,
                  f"count={page.locator('.trophy-row').count()}")
            page.locator(".filters select").first.select_option("all")
            page.locator("input[type=search]").fill("stunt")
            page.wait_for_timeout(300)
            check("search 'stunt' finds Cunning Stunts",
                  page.locator(".trophy-row", has_text="Cunning Stunts").count() == 1)
            page.locator("input[type=search]").fill("")
            page.wait_for_timeout(200)

            # Detail pane: click a row, guide + sources visible.
            page.locator(".trophy-row", has_text="Cunning Stunts").click()
            page.wait_for_timeout(300)
            detail = page.locator(".detail").inner_text()
            check("detail pane shows guide + sources",
                  "Guide" in detail and "Exophase" in detail and "250 stunts" in detail)
            check("detail pane shows PSN target", "PSN target" in detail)

            # Roadmap: 7 stages, platinum stage shows 1 of 2 (platinum ticked above).
            page.goto(BASE + "/#/roadmap", wait_until="networkidle"); page.wait_for_timeout(400)
            check("roadmap has 7 stages", page.locator(".stage-card").count() == 7)
            check("roadmap platinum stage 1/2",
                  "1 of 2 earned" in page.locator(".stage-card").last.inner_text())

            # Planner: items present, click navigates to the trophy's guide.
            page.goto(BASE + "/#/planner", wait_until="networkidle"); page.wait_for_timeout(400)
            n = page.locator(".next-item").count()
            check("planner suggests next trophies", n >= 3, f"items={n}")
            page.locator(".next-item").first.click(); page.wait_for_timeout(400)
            check("planner item opens its guide", "#/checklist/" in page.url and page.locator(".detail").count() == 1)

            # Missables page.
            page.goto(BASE + "/#/missables", wait_until="networkidle"); page.wait_for_timeout(400)
            check("missables watch card present", "Missable watch: Positive Mental Attitude" in page.inner_text("main"))
            check("missables honesty note present", "No confirmed missable list yet" in page.inner_text("main"))

            # Export -> reset -> import restores progress.
            page.goto(BASE + "/#/settings", wait_until="networkidle"); page.wait_for_timeout(300)
            page.on("dialog", lambda d: d.accept())
            with page.expect_download() as dl:
                page.locator("button", has_text="Export progress").click()
            dl_path = os.path.join("/tmp", "leonida55-test-export.json")
            dl.value.save_as(dl_path)
            exported = json.load(open(dl_path))
            check("export contains earned + counters",
                  len(exported.get("earned", [])) == 1 and "15" in exported.get("counters", {}))
            page.locator("button", has_text="Reset all progress").click()
            page.wait_for_timeout(300)
            check("reset clears progress", "0 of 55 earned" in page.locator("#progressCount").inner_text())
            page.locator("input[type=file]").set_input_files(dl_path)
            page.wait_for_timeout(400)
            check("import restores progress", "1 of 55 earned" in page.locator("#progressCount").inner_text())

            # Theme toggle.
            page.locator("#themeToggle").click(); page.wait_for_timeout(200)
            check("theme toggle switches to paper",
                  page.evaluate("document.documentElement.dataset.theme") == "paper")

            outside = [u for u in requests if not u.startswith(BASE)]
            check("no console errors", not errors, "; ".join(errors[:3]))
            check("no failed requests", not failed, "; ".join(failed[:3]))
            check("no outside-network requests", not outside, "; ".join(outside[:3]))
            check("all requests local", len(requests) > 0, f"total={len(requests)}")
            browser.close()
        failed_count = sum(1 for _, ok, _ in results if not ok)
        print(f"\n{len(results) - failed_count}/{len(results)} checks passed")
        return 1 if failed_count else 0
    finally:
        server.terminate()

if __name__ == "__main__":
    raise SystemExit(main())
