# BMA v3 Autopilot — one iteration

You are running **unattended** as a scheduled background job. No human will answer
questions. Work autonomously, make one small, high-quality, reversible improvement,
verify it, commit it locally, and stop. If anything is unsafe or unclear, do the
conservative thing (add nothing, leave the site exactly as you found it).

**Project root:** `/Users/colinsweeney2/Desktop/BMA/site-v3` (this is your CWD).
**Component library (read-only):** `/Users/colinsweeney2/Desktop/Awwwards Components`
(285 `code.zip` files grouped by category across 4 "Awwwards Pack" folders).

## Absolute guardrails (never violate)

1. **Scope:** Edit files ONLY inside `site-v3/`. Never touch the packs, other repos,
   `~/.claude`, or anything outside the project. Never delete or move the pack zips.
2. **Compliance:** Obey `.autopilot/REGULATIONS.md` to the letter. It wins over any
   component. Monochrome, hairlines-not-shadows, tiny motion budget, vanilla only.
3. **Local only:** Commit locally. **Never push, never touch a remote, never create
   a GitHub repo.** No `npm install`, no new dependencies, no network fetches for libs.
4. **Never ship broken:** If verification fails or you are unsure, `git checkout -- .`
   (and remove any new untracked files you added) so the working tree returns to the
   last commit. A no-op iteration is a success. A broken site is a failure.
5. **One change per run.** Add a single, self-contained feature/refinement. Small beats big.

## Steps

### 0. Reconcile & baseline

- `git -C . status`. If the tree is dirty from a previous crashed run (uncommitted
  changes you did not just make), restore it: `git stash` or `git checkout -- .` and
  delete stray untracked files, so you start from a clean HEAD. Note the HEAD sha.
- Read `.autopilot/REGULATIONS.md` in full. Read `css/tokens.css`. Skim `js/site.js`,
  `css/base.css`, and the three pages to learn the current structure and vocabulary.
- Read `.autopilot/state/ledger.json` to see which zips are already consumed and what
  features already exist. **Do not repeat an existing feature.**

### 1. Choose the next component

- Enumerate candidates: `find "/Users/colinsweeney2/Desktop/Awwwards Components" -iname "*.zip"`.
- Skip any path already in the ledger's `consumed` map.
- **Priority order** (most editorial-adaptable first): `Text Animations` →
  `Hover Effects` → `Navigation Menus` → `SVG Animations` → `Scroll Animation` →
  `Page Transitions` → `Grid Animations` → `Sliders`. Deprioritize (usually
  incompatible): `3D Animation`, `Webgl & ThreeJS Effects`, `Physics Effects`,
  `Background Animations`, `Hero Animations` (these are almost always non-compliant;
  only mine them for a static idea).
- Unzip the chosen one into a temp dir under the scratchpad (NOT into the project):
  `unzip -o -q "<zip>" -d "$TMPDIR/bma-autopilot-<n>"`. Read its HTML/CSS/JS to
  understand the **core idea** (what interaction or editorial device it demonstrates).
- You may inspect up to ~5 candidates this run before deciding. Mark ones you open
  but reject as `incompatible` in the ledger with a one-line reason.

### 2. Compliance gate — adapt to editorial

- Ask: what is the _essence_ of this component, and can it live within REGULATIONS?
- **"Adapt to editorial" almost always means de-animating the idea into a restrained,
  monochrome, hairline treatment.** Examples of good adaptations:
  - a flashy text-scramble → a tasteful serif **drop cap** or mono lead-in for a lede.
  - a WebGL hover-distort → a **hairline underline that draws in** on link hover.
  - an auto-carousel slider → a static, numbered **editorial index** list with hairline rows.
  - a parallax hero → a quiet **figure + mono caption** or a `01 / 04` section marker.
  - a marquee → a single hairline-bordered **proof row** (no motion).
- Reject (mark `incompatible`) anything that can only exist as color/WebGL/parallax/
  physics/3D and has no restrained editorial reduction. Then pick the next candidate.
- Pick the single best-fitting, genuinely-additive idea for THIS site's real content.

### 3. Implement (minimal, token-driven, progressive-enhancement)

- CSS in `css/base.css` (or `css/pages.css` if it exists) using existing tokens only.
- JS, if any, appended to `js/site.js` as a small idempotent, feature-detected module
  that no-ops under `prefers-reduced-motion` and degrades to a valid static state with
  JS off. Animate only `transform`/`opacity`. Never add a third-party file.
- Integrate into real content on the appropriate page(s). Do not fabricate content.
- Keep the diff tight and readable; match the surrounding code style and comments.

### 4. Polish passes (use your skills and subagents)

Run a battery of polish/critique passes over the change and apply the fixes. Use the
Skill tool and/or spawn subagents (Agent tool / a Workflow) for:

- **impeccable** (invoke the impeccable skill) for a live copy/craft edit of any text.
- **stop-slop** skill on any prose you touched.
- Design critique skills: `visual-critique:critique-typography`,
  `visual-critique:critique-visual-hierarchy`, `visual-critique:critique-composition`,
  `visual-critique:critique-color`, `visual-critique:critique-affordance`,
  plus `ui-design:*` and `interaction-design:*` and `ecc:accessibility` as relevant.
- Apply the actionable findings; ignore ones that would violate REGULATIONS.
  Be judicious — the goal is restraint, not more stuff. Do not let a critique talk you
  into adding color, shadow, or motion the regulations forbid.

### 5. Verify it is tip-top

- Start a local server on an ephemeral port from the project root, e.g.
  `python3 -m http.server 4787 --bind 127.0.0.1 &` (remember the PID; kill it after).
- Using the **playwright** MCP (preferred) or `chrome-devtools` MCP, load all three
  pages at **1440×900** and **390×844**. On each page verify:
  - no horizontal scroll; no console errors; fonts loaded; nav hairline works;
  - the new feature renders and behaves as intended, and looks deliberate;
  - toggle reduced-motion and confirm the static end-state is correct;
  - keyboard reach/focus is intact (esp. if you touched nav/menu/links).
  - Take screenshots to `.autopilot/logs/shots/` for the record.
- If playwright/chrome MCP is unavailable in this headless context, fall back to:
  `curl -s localhost:4787/<page>` sanity + careful code review, and be MORE
  conservative about shipping. Kill the server when done.
- Loop: fix → re-verify, up to ~3 rounds. If it still isn't clean, **revert (step 4
  guardrail) and treat this run as a no-op** (still record the attempt in the ledger).

### 6. Record & commit (local only)

- Update `.autopilot/state/ledger.json`: increment `iterations`; add the chosen zip to
  `consumed` with `{outcome:"integrated"|"incompatible"|"skipped", reason, at}`; append
  to `added_features` `{iteration, title, source_zip, page, files, note, commit:""}`.
- Prepend a dated one-line entry to `.autopilot/CHANGELOG.md`.
- Stage ONLY the specific files you changed (never `git add -A`). Commit with a
  Conventional-Commits message, no AI attribution / no Co-Authored-By:
  `feat: <short editorial feature> (autopilot #<iteration>)` and, in the body, the
  source component and a one-line compliance note. Put the resulting sha back into the
  ledger entry's `commit` field (a follow-up commit amending the ledger is fine).
- If the run was a no-op (nothing compliant found or verification failed), still commit
  the ledger/CHANGELOG update as `chore: autopilot #<n> — no change (<reason>)` so the
  next run knows what was tried. Never leave source/site files half-edited.

### 7. Stop

Print a 3–5 line summary: which component, what you added (or why nothing), files
touched, verification result, commit sha. Then exit. Do not start a second change.
