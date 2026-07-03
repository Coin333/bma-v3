# BMA v3 — Editorial Rebuild (design spec)

**Date:** 2026-07-03
**Author:** Colin (with Claude)
**Status:** Approved direction, pending spec review

## 1. Goal

Take the "Old BMA v1" computer-OS site (`~/Desktop/BMA/site`) and completely
revise it into a calm, paper-ink editorial site that conforms to the BMA Design
Guidelines ("the regulations", `~/Desktop/code/bma_website/reference/BMA-Design-Guidelines.html`).

Build fresh in a **new folder** `~/Desktop/BMA/site-v3`. v1 stays untouched as
reference. This is a from-scratch rebuild of the design system and layout, reusing
v1's real content verbatim.

## 2. Decisions locked with the user

- **Direction:** Full editorial rebuild. Retire the v1 aesthetic entirely.
- **Output:** New folder `~/Desktop/BMA/site-v3`.
- **Capabilities "OS" visual:** Dropped. No pipeline diagram; the competencies +
  delivery-model lists carry the page.
- **Serif font:** Self-host real **Aparajita** (`~/Library/Fonts/aparaj.ttf`,
  Regular/400 only). Convert TTF→woff2 at build (`pip install fonttools brotli`);
  ship the TTF as a fallback source. **Spectral 500** stays in the CSS stack as
  the web fallback the regulations prescribe.

## 3. What v1 assets are retired (do NOT carry over)

3D laptop "BMA Operating System"; Three.js / GLTFLoader / CSS3DRenderer; GSAP +
ScrollTrigger + Lenis + Lottie; the macOS-style magnifying dock; floating orb
PNGs and the dark navy gradient hero; the scroll "ascent" cinematic; window-chrome
app cards with traffic-light dots; the logo marquee; the floating glass pill nav.
All of it is explicitly named by the regulations as the thing to move away from.

## 4. Tech & file structure

Plain static **HTML + CSS**, no build framework, minimal vanilla JS. Previews by
opening the file; deploys anywhere static.

```
site-v3/
  index.html            # Home
  capabilities.html     # Capabilities
  about.html            # About
  css/
    tokens.css          # the regulations as CSS custom properties
    base.css            # reset, type scale, nav, footer, buttons, primitives
    pages.css           # page/section-specific layout
  js/
    site.js             # nav hairline-on-scroll + IntersectionObserver reveal ONLY
  assets/
    fonts/aparajita.woff2 (+ aparaj.ttf fallback)
    bmalogo, favicon, og-image
  robots.txt  sitemap.xml
```

Only one JS file. No third-party JS. No canvas/WebGL.

## 5. Design system (tokens — the regulations)

### Color

| Token          | Hex                                 | Use               |
| -------------- | ----------------------------------- | ----------------- |
| `--paper`      | `#FAF8F2`                           | page background   |
| `--ink`        | `#10202F`                           | primary text      |
| `--slate`      | `#46586A`                           | secondary text    |
| `--muted`      | `#8B95A0`                           | meta / captions   |
| `--hairline`   | `#E7E1D5`                           | rules, borders    |
| `--surface`    | `#FFFFFF`                           | cards             |
| `--teal`       | `#1E7A78`                           | accent, underline |
| `--teal-deep`  | `#123F41`                           | accent hover      |
| `--teal-tint`  | `#E7F1EF`                           | accent background |
| `--terracotta` | `#C4603D`                           | primary CTA       |
| `--sand`       | `#EADCC6` / `--sand-tint` `#F6EAE1` | warm blocks       |
| `--navy`       | `#0C1B2A`                           | logo, footer only |

Rule: paper + ink do the work; teal + terracotta are seasoning at ~70/30. **Never
more than two accents.** Legacy BMA blue `#1F4E73` is banned here except if ever
needed sparingly.

### Type

- Headlines: **Aparajita** (self-hosted, 400), fallback `Spectral`, then serif.
- Body: **Instrument Sans** (Google Fonts), fallback system sans.
- Labels: **IBM Plex Mono** (Google Fonts), 12px, uppercase, `letter-spacing 0.12em`,
  e.g. `HOME · SECTION 01`.
- Scale: Display 52 (−0.025em) · H1 40 (−0.02em) · H2 30 · H3 21 (Instrument 600) ·
  Body 18 / lh 1.65 · Small 15 · Label/Meta 12.

### Layout & motion

- Single centered stream, **~720px** max content width. No sidebars on public pages.
- Spacing base **8px**; section vertical rhythm **96–128px**; element gaps 24–32px.
- **Hairlines, not shadows.** 1px `--hairline` rules separate content. Cards =
  hairline border + 4–6px radius. No drop shadows, no glass blur, no gradients.
- Buttons: 4px radius, no pills, no gradients. Primary = terracotta fill; secondary
  = ink text link with teal underline on hover.
- Motion (only two effects): nav bottom-hairline fades in on scroll; sections
  fade + rise 8px once on entry (IntersectionObserver, respects
  `prefers-reduced-motion`). No parallax, no scrub.

## 6. Information architecture

Flat, full-width, edge-to-edge nav. Hairline bottom border fades in on scroll (no
blur, no float). **Three destinations + one CTA:**

`Home · Capabilities · About` + **Book a Call** (terracotta → Calendly:
`https://calendly.com/bluemodernadvisory/30min`).

No "Our Work" (no real case studies yet). No Wiki in public nav.

## 7. Pages (v1's real copy, re-set editorially)

Content below is preserved from v1 verbatim as claims. Layout/rhythm is the only
thing that changes. **No invented claims, no fake logos, no fabricated case studies.**

### 7.1 Home (`index.html`) — one calm top-to-bottom stream

1. **Hero** — paper, left-aligned.
   - Eyebrow (mono): `BUILT BY OPERATORS FROM PE, MBB, AND CLAY`
   - Headline (Aparajita display): _"The future of pipeline."_ — single teal
     underline on **pipeline** only.
   - Sub (body): "We design and build the prospecting engines, enrichment, and CRM
     systems that growth-stage and PE-backed teams run on."
   - CTAs: **Book a 15-min call** (terracotta) · View Capabilities (text link).
2. **Proof strip** — hairline-bordered row, mono label:
   "Recommended by 150+ MBB consultants & M7 MBAs." No logo marquee.
3. **What we build** — intro line ("The pipeline runs itself, end to end…") then a
   quiet numbered list, hairline dividers, name + one line each:
   - 01 Source — "Target accounts pulled from your ICP, not bought off a list vendor."
   - 02 Enrich — "Every contact verified and filled in: email, title, firmographics,
     and tech stack, scored for fit."
   - 03 Qualify — "Buying signals, warm intro paths, and timing surfaced so reps work
     the accounts most likely to close."
   - 04 Activate — "Routed clean into your CRM and outreach. Built in Clay, wired into
     HubSpot or Salesforce."
4. **Engagements** — "Choose how you want to work with us." Three hairline-bordered
   columns (not glass cards), each ending in its own action:
   - **Sprint** (2 weeks) — scoped data output; ICP/targeting definition; structured
     export with quality scoring; one strategy call + written summary. → Get started
   - **Build** (6–8 weeks) — full prospecting/enrichment engine in Clay; ICP +
     segmentation; CRM integration + routing; multi-channel outreach setup;
     documentation + team training. → Book a discovery call
   - **Operate** (monthly retainer) — continuous workflow operation + QA; monthly
     pipeline reporting; new use-case/segment builds; stack optimization. → Talk to us
5. **Use cases** — "Custom prospecting systems for the pipelines that matter most."
   Quiet list, **five-item ceiling**. Surface 5 here (name + one sentence):
   Deal Sourcing · Outbound TAM Buildout · Signal-Based Prospecting · CRM Enrichment
   & Recycling · Warm Network. (The 6th, generic "Enrichment", folds into Capabilities.)
   No app-window mockups / fake data tables.
6. **FAQ** — retain v1's Q&As as a quiet hairline-divided list (extract exact copy
   from v1 during build).
7. **Closing CTA** → "Book a working session."

### 7.2 Capabilities (`capabilities.html`)

1. Intro: "The systems behind modern pipeline growth. BMA works backward from the
   commercial objective, then builds the strategy, data, workflows, and operating
   infrastructure to support it."
2. **Core competencies** — quiet list of the 7, each with mono sublabels
   (Deliverables / Business outcome):
   1. GTM Strategy
   2. Prospecting Systems
   3. Data Enrichment & CRM Hygiene
   4. Multi-Channel Outbound
   5. Pipeline Operations
   6. Warm Contact Intelligence
   7. Data Warehouse Enrichment
      (Full deliverable/outcome copy per item preserved from v1 during build.)
3. **Delivery model** — "Each engagement moves from operating question to working
   system." 4-step hairline sequence: Diagnose · Design · Implement · Transfer
   (each with its three mono sub-points from v1).
4. **Closing CTA** → "Ready to build the system behind your next pipeline? Book a
   Meeting."
5. **No** pipeline visual / no laptop / no diagram.

### 7.3 About (`about.html`)

1. **Lede:** "Most go-to-market breaks at the seam between the people who plan it and
   the people who build it. We close that seam. One team of strategists and engineers
   designs your commercial system and ships the AI-prospecting engine that runs it,
   for financial institutions, B2B enterprises, and Series A to D startups."
2. **Team** — "Three operators. One accountable line from strategy to shipped system."
   Three hairline rows, initials (no photos):
   - **Sagar Tiwari** — Co-Founder & CEO. "Carries the commercial thesis. Private
     equity and MBB before BMA."
   - **Karthik Devarakonda** — Co-Founder & CTO. "Owns the engine room. Ships the data
     and enrichment infrastructure clients run on."
   - **Maggie Chen** — Head of GTM Engineering. "Turns the strategy into running plays
     inside Clay and the warehouse."
3. **What BMA does** — "Strategy and engineering, connected." + the paragraph and the
   practice-areas quiet list (7 items, links to Capabilities).
4. **Closing** — "If the system makes sense, the next step is a fifteen-minute
   conversation." → Start the conversation.

### 7.4 Global — Footer

Navy footer: Explore (Home · Capabilities · About) · newsletter subscribe line ·
`© 2026 Blue Modern Advisory · GTM Strategy & Engineering` · LinkedIn ·
reem@bluemodernadvisory.com. Drop the "Tower model" attribution (asset retired).

## 8. Content policy

Preserve v1's substance verbatim where it is a claim (pricing tiers, team
names/titles/bios, "150+ MBB", practice areas, engagement bullets). Re-compose
layout and rhythm only. Do not invent claims, logos, metrics, or case studies.

## 9. Fonts — build handling

- Copy `~/Library/Fonts/aparaj.ttf` → `site-v3/assets/fonts/`.
- Convert to woff2: `pip install fonttools brotli` then
  `fonttools ttLib.woff2 compress aparaj.ttf`. If tooling fails, ship the TTF
  directly (`@font-face src: woff2, ttf`).
- `@font-face` family `Aparajita`, weight 400, `font-display: swap`.
- CSS stack: `font-family: "Aparajita", "Spectral", Georgia, serif;`
- Load Instrument Sans + IBM Plex Mono + Spectral via one Google Fonts `<link>`.

## 10. Definition of done

- Three pages render the sections above with the exact tokens in §5.
- Zero retired v1 assets present (§3).
- Two accents max, hairlines not shadows, flat nav, paper hero — verified against
  the regulations' don'ts.
- Aparajita self-hosted and rendering; Spectral fallback verified.
- Reduced-motion respected; no horizontal scroll; mobile-legible at 720px→narrow.

## 11. Out of scope (this rebuild)

Auth/portal, `/team`, `/wiki`, `/get-started` form flows, Offerings enterprise-partner
strip, case studies. Public marketing 3-pager only.
