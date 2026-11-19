"""Take the 4 screenshots for Leonida 55 with Playwright + Chrome-for-Testing.
Serves app/ with the repo's own serve.ts, seeds progress (13 of 55 earned, counters
part way) via localStorage before load, and shoots 1280x800 JPEG q82.
Every request is checked to stay on the local server (offline proof)."""
import json, os, subprocess, sys, time, urllib.request

REPO = os.path.dirname(os.path.abspath(__file__))
PORT = 8091
BASE = f"http://127.0.0.1:{PORT}"
CHROME = "/home/hatch/workspace/.tmp/chrome-linux64/chrome"

with open(os.path.join(REPO, "app", "data", "trophies.json")) as f:
    TROPHIES = json.load(f)["trophies"]
BY_ID = {t["id"]: t for t in TROPHIES}

# 13 earned: early-game mix of story, activity and world trophies.
EARNED_IDS = [2, 3, 8, 16, 20, 21, 44, 45, 46, 51, 55, 19, 32]
# Counters part way: stunts 137/250, vehicles 41/100, WAiNK 23/100, challenges 18/50,
# meditation 6/18, laundered $87,400, registered 4/10.
COUNTERS = {"15": 137, "35": 41, "31": 23, "32": 18, "28": 6, "52": 87400, "55": 4}

SHOTS = [
    ("1-checklist.jpg", "/#/checklist/28", False, "detail"),
    ("2-roadmap.jpg", "/#/roadmap", False, None),
    ("3-missables.jpg", "/#/missables", False, None),
    ("4-planner.jpg", "/#/planner", True, None),
]

def seed_script(spoiler):
    state = {
        "earned": [BY_ID[i]["name"] for i in EARNED_IDS],
        "counters": COUNTERS,
        "spoiler": spoiler,
        "theme": "night",
    }
    return f"localStorage.setItem('leonida55-v1', {json.dumps(json.dumps(state))});"

def main():
    server = subprocess.Popen(
        ["node", "serve.ts", "--port", str(PORT)],
        cwd=REPO, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(BASE + "/", timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        else:
            print("server did not start"); return 1

        sys.path.insert(0, "/home/hatch/workspace/venv-playwright/lib/python3.12/site-packages")
        from playwright.sync_api import sync_playwright

        requests = []
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
            for filename, path, spoiler, mode in SHOTS:
                page = browser.new_page(viewport={"width": 1280, "height": 800})
                page.on("request", lambda r: requests.append(r.url))
                page.on("console", lambda m: print(f"[{filename}] console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
                page.on("pageerror", lambda e: print(f"[{filename}] PAGEERROR: {e}"))
                page.add_init_script(seed_script(spoiler))
                page.goto(BASE + path, wait_until="networkidle")
                page.wait_for_timeout(600)
                if mode == "detail":
                    # Scroll the guide pane so the Guide heading + first lines are in view.
                    pane = page.locator(".detail")
                    if pane.count():
                        pane.evaluate("el => { el.scrollTop = 170; }")
                        page.wait_for_timeout(200)
                out = os.path.join(REPO, "screenshots", filename)
                page.screenshot(path=out, type="jpeg", quality=82)
                size = os.path.getsize(out)
                print(f"{filename}: {size} bytes {'OK' if size <= 262144 else 'OVER 256KiB!'}")
                page.close()
            browser.close()

        outside = [u for u in requests if not u.startswith(BASE)]
        print(f"requests total: {len(requests)}, outside local server: {len(outside)}")
        for u in outside:
            print("  OUTSIDE:", u)
        return 0
    finally:
        server.terminate()

if __name__ == "__main__":
    raise SystemExit(main())
