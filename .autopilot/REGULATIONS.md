# BMA v3 — The Regulations (compliance law for the autopilot)

This is the **authoritative** design law the autopilot must obey when adapting an
awwwards component into the site. It is distilled from the live design system
(`css/tokens.css` — the source of truth), the editorial rebuild spec
(`docs/superpowers/specs/2026-07-03-bma-v3-editorial-rebuild-design.md`), and the
BMA Design Guidelines (`~/Desktop/code/bma_website/reference/BMA-Design-Guidelines.html`).

If anything here conflicts with an awwwards component, **the component loses.**
The site's restraint is the product. A feature that cannot be expressed within
these rules must be rejected, not forced in.

---

## 0. The one-sentence test

> Would a calm, paper-ink editorial site — think a print quarterly, not a
> showreel — ship this? If it would read as "look what JavaScript can do," it fails.

## 1. Palette (monochrome — no color)

The live site is **fully monochrome**. Use ONLY these tokens (from `tokens.css`):

- `--paper #fafaf8` page bg · `--surface #ffffff` cards
- `--ink #141414` primary text · `--slate #444` secondary · `--muted #6b6b6b` meta
- `--hairline #e4e4e1` rules/borders · `--sand #ededea` / `--sand-tint #f4f4f1` pale grey blocks
- The **single near-black underline is the only accent.** There is no teal, no
  terracotta, no color. Do not introduce a hue. Do not add a gradient.

## 2. Type

- Serif display/headlines: `--font-serif` (Aparajita → Spectral → Georgia).
- Body: `--font-body` (Instrument Sans).
- Labels/eyebrows: `--font-mono` (IBM Plex Mono), 12px, uppercase, `--track-label` 0.12em.
- Use the scale tokens (`--fs-display` … `--fs-label`). Do not invent sizes.

## 3. Surface & depth

- **Hairlines, not shadows.** Separate content with 1px `--hairline` rules.
- **No drop shadows. No glass/backdrop blur. No gradients. No glows.**
- Cards = hairline border + `--radius-card` (6px). Buttons = `--radius-btn` (4px), never pills.

## 4. Layout

- Single centered stream, `--measure` (720px) max content width. No sidebars on public pages.
- Spacing is the 8px scale (`--space-*`). Section rhythm `--section-y` (96–128px).
- No horizontal scroll at any width. Legible from 720px down to ~320px.

## 5. Motion budget (the hard ceiling)

The site's motion is deliberately tiny. The existing, approved motion is:

1. Nav bottom-hairline fades in on scroll (`.is-scrolled`).
2. Section text reveal: fade + rise `--reveal-shift` (8px) once on entry
   (IntersectionObserver), staggered per line.
3. Menu overlay open/close.
4. Preloader panels part on first load.
5. Lenis smooth scroll.

**Rules for new motion:**

- Prefer adding **NO new motion.** The best adaptation of an awwwards animation is
  often a _static editorial refinement_ (a drop cap, a mono index number, a
  hairline treatment, a figure/caption pair) that captures the idea's spirit
  without a new animation.
- If motion is genuinely warranted, it must be **subtle, once, ≤300–500ms**, driven
  by `--ease` / `--ease-spring`, and **must extend the existing vocabulary** (reveal,
  hairline, underline) rather than introduce a new mechanic.
- Animate **only `transform` and `opacity`.** Never animate width/height/top/left/margin.
- **Must respect `prefers-reduced-motion: reduce`** — provide a static end-state.
- Banned mechanics: parallax, scroll-scrub/pinning, marquees, auto-playing carousels,
  cursor-trailing blobs, tilt/3D-transform cards, physics, confetti, count-up on
  everything, WebGL/canvas shaders, letter-by-letter typewriters on body copy.

## 6. Tech constraints

- Vanilla only. **No new third-party library, no CDN `<script>`, no npm install, no
  build step.** (Lenis is the one pre-existing vendor file; do not add more.)
- **No WebGL, no `<canvas>`, no Three.js, no GSAP, no Lottie.**
- New JS goes in `js/site.js` (extend it) as a small, self-contained, idempotent,
  progressively-enhanced module. Feature-detect; never break no-JS or reduced-motion.
- New CSS goes in `css/base.css` (or `pages.css` if present) using existing tokens.
- Keep total page weight lean. No large assets. No web fonts beyond the existing link.

## 7. Content policy

- **Do not invent claims, logos, metrics, testimonials, case studies, or team members.**
  Preserve BMA's real copy. A new feature is a _presentation_ of existing content,
  never fabricated content.
- Accessibility is non-negotiable: semantic HTML, focus states, keyboard support,
  ARIA where needed, WCAG AA contrast (all tokens above already pass on paper/white).

## 8. Definition of "compliant + tip-top" (the gate every iteration must pass)

A change may only be committed if ALL are true:

- Uses only the tokens in §1–§2; introduces no color, gradient, shadow, or blur.
- Adds at most one small, reduced-motion-safe behavior (or, ideally, none).
- No third-party JS/CSS added; no WebGL/canvas.
- All three pages (index, capabilities, about) still render correctly at 1440px
  and 390px with **no horizontal scroll and no console errors**.
- Keyboard + `prefers-reduced-motion` paths verified.
- The change reads as a deliberate editorial refinement, not a demo effect.

If it cannot pass this gate, **revert and mark the source component "incompatible."**
