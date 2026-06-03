# Handoff: Yu Ching Lin — Portfolio Site

## Overview
A single-page portfolio website for **Yu Ching Lin**, an HCI master's student & UX researcher/designer based in Munich / Augsburg, Germany. The page covers five sections — nav, hero, work, about, contact — and a hidden "Tweaks" panel that re-skins the design at runtime.

The visual reference is **the original reference**: minimal, high whitespace, data-forward, typography-led, no decorative gradients or stock icons.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the intended look and behavior, not production code to copy line-for-line. Your task is to **recreate these designs in your target codebase's environment** (Next.js, Astro, SvelteKit, Vue, whatever you prefer) using its established patterns. If no environment exists yet, choose what's most appropriate — for a static portfolio I'd suggest **Next.js (app router)** or **Astro**, both deployable to Vercel/Netlify with zero config.

The prototype currently loads React + Babel via CDN and transpiles JSX at runtime in the browser. **Don't ship that to production** — pre-compile JSX with Vite / Next / Astro instead. Inline styles can stay inline (they're fine), or you can lift them into CSS modules / Tailwind / styled-components as you prefer.

## Fidelity
**High-fidelity.** All colors, typography, spacing, sizes, and interactions are final. Reproduce pixel-faithfully unless your codebase's design system would clash — in which case match your system's tokens while preserving the layout, hierarchy, and interaction patterns.

## Tech Stack (current prototype)
- **React 18.3.1** + **react-dom 18.3.1** (UMD builds, dev mode)
- **@babel/standalone 7.29.0** (runtime JSX transpilation)
- **Google Fonts**: `Big Shoulders Display`, `Source Serif 4`, `Archivo` — all loaded via `@import` inside `design-system/colors_and_type.css`
- **No build step.** Open `Portfolio.html` directly in a browser, or run `python -m http.server` in the project root.

## File Map
```
design_handoff_portfolio/
├── README.md                              ← this file
├── Portfolio.html                         ← entry point; loads CSS + JSX
├── design-system/
│   └── colors_and_type.css                ← all design tokens (CSS custom properties)
├── components/
│   └── Portfolio.jsx                      ← every section's React component lives here
└── tweaks-panel.jsx                       ← Tweaks panel shell (host-protocol helper, can be omitted in prod)
```

Notes:
- The Tweaks panel is a design-tool affordance that lets the viewer reskin the page (Mood / Voice / Pulse / Hover). It's **not part of the shipped portfolio** — drop it on handoff unless you want to keep "dark mode" as a public feature, in which case extract just the `mood` toggle.
- `components/Portfolio.jsx` is a single ~1,000-line file. In a real codebase, split each section into its own file: `Nav.tsx`, `Hero.tsx`, `WorkSection.tsx`, `ProjectCard.tsx`, `Doodle.tsx`, `AboutSection.tsx`, `ContactSection.tsx`, `Marquee.tsx`.

## Design Tokens
All defined in `design-system/colors_and_type.css` as CSS custom properties on `:root`. Lift these into your token system (Tailwind theme, CSS variables, design tokens JSON, whatever).

### Color — paper / ink
| Token | Light | Dark |
|---|---|---|
| `--paper` | `#FFFFFF` | `#0E0E0C` |
| `--paper-deep` | `#F4F1EA` | `#16161310` |
| `--ink` | `#0E0E0C` | `#EFE9DD` |
| `--ink-2` (body prose) | `#3A3A36` | `#C9C3B7` |
| `--ink-3` (meta / captions) | `#6F6E66` | `#8C8A82` |
| `--ink-4` (disabled) | `#A09E94` | `#5C5B55` |
| `--hairline` (1px rules) | `rgba(14,14,12,0.15)` | `rgba(239,233,221,0.15)` |
| `--capsule-border` (pill outlines) | `rgba(14,14,12,0.25)` | `rgba(239,233,221,0.25)` |

### Color — accents
| Token | Hex | Use |
|---|---|---|
| `--accent-green` | `#1F8A4C` | "Available for work" status dot |
| `--accent-red` | `#E04E2A` | Cursor "Guest" indicator (in Nicole Lin ref) |

### Typography
| Token | Family | Notes |
|---|---|---|
| `--font-display` | `"Big Shoulders Display"` | Wordmark, hero name, section titles |
| `--font-serif` | `"Source Serif 4"` | Body prose, project titles (italic 600 in the doodle cards) |
| `--font-sans` | `"Archivo"` | Eyebrows, labels, capsules, nav, meta |

### Type Scale
| Token | Value |
|---|---|
| `--fs-display-xl` | `clamp(96px, 17vw, 248px)` |
| `--fs-display-lg` | `clamp(72px, 11vw, 160px)` |
| `--fs-display-md` | `clamp(36px, 4.5vw, 56px)` |
| `--fs-metric` | `40px` |
| `--fs-body-lg` | `18px` |
| `--fs-body` | `15px` |
| `--fs-caption` | `13px` |
| `--fs-eyebrow` | `11px` |

Line heights: `--lh-tight 0.85` · `--lh-snug 1.05` · `--lh-normal 1.5` · `--lh-loose 1.7`.

Tracking: `--tracking-eyebrow 0.12em` · `--tracking-caption 0.04em` · `--tracking-display -0.02em`.

### Spacing (8pt grid)
`--sp-1 4` · `--sp-2 8` · `--sp-3 12` · `--sp-4 16` · `--sp-5 24` · `--sp-6 32` · `--sp-7 48` · `--sp-8 64` · `--sp-9 96` · `--sp-10 128`

### Radii
`--radius-sm 8` · `--radius-md 12` · `--radius-lg 16` · `--radius-xl 24` · `--radius-pill 9999`

### Layout
- `--maxw: 1200px` (content max-width)
- `--gutter: clamp(20px, 5vw, 64px)` (left/right page padding)

### Shadows
- `--shadow-float: 0 8px 24px rgba(14,14,12,0.06), 0 2px 6px rgba(14,14,12,0.04)`
- `--shadow-press: 0 2px 8px rgba(14,14,12,0.06)`

### Motion
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` — default for hover, reveal, layout shifts
- `--dur-fast: 120ms` · `--dur-base: 220ms` · `--dur-slow: 480ms`

---

## Screens / Views

The page is a single scrolling document with 5 sections, smooth-scroll anchored via `#work`, `#about`, `#contact`. The viewport reveal animation (`@keyframes rise`) staggers each section on load by 50–250ms.

### 1. Nav
**Purpose:** persistent top-of-page anchor links.

**Layout:** fixed pill at `top: 20px`, full-width minus gutter (`left: var(--gutter); right: var(--gutter)`), backdrop-blur `20px saturate(160%)`, background `rgba(255,255,255,0.75)` (light) / `rgba(14,14,12,0.7)` (dark), border `1px solid var(--capsule-border)`, border-radius `9999px`, box-shadow `var(--shadow-float)`, `display: flex; justify-content: space-between; align-items: center; padding: 12px 22px`.

**Content:**
- Left: wordmark `"Nicole Lin"` — Big Shoulders Display 900, 22px, letter-spacing `-0.01em`, `var(--ink)`. **Replace with `"Yu Ching Lin"` or her chosen mark in the final implementation.**
- Right: three links (`Work`, `About`, `Contact`) — Archivo 600, 11px, uppercase, letter-spacing `0.14em`, gap 28px between them; then a "Dark" toggle pill with theme-toggle SVG glyph.

### 2. Hero
**Purpose:** big name + status pills above the fold.

**Layout:** `padding-top: clamp(140px, 18vh, 200px)`, gutter padding on x. Inner column `max-width: var(--maxw)`, centered.

**Content:**
- **Eyebrow** — `UX RESEARCHER & DESIGNER · PORTFOLIO '26`, Archivo 600, 11px, uppercase, tracking 0.14em, `var(--fg-3)`, `margin-bottom: 28px`.
- **Display name** — `"Yu Ching Lin"`, Big Shoulders Display 900, `fontSize: clamp(56px, 11vw, 168px)` (currently overridden inline; see "Open Questions" below), line-height 0.9, letter-spacing `-0.025em`, single line (`white-space: nowrap`).
- **Status pills** (right-aligned, stacked column, gap 10px, margin-top 56px):
  - `[● dot] OPEN TO WERKSTUDENT / INTERNSHIP` — green dot
  - `MUNICH · AUGSBURG, GERMANY`
  - Both use `.capsule.capsule--eyebrow` — Archivo 600, 11px, uppercase, padding 6×12, border 1px `var(--capsule-border)`, border-radius pill.
- **Skill marquee** — full-width horizontal scrolling band, `margin-top: 96px`, `border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); padding: 20px 0`. Items: `UX Research · User Interviews · Usability Testing · Figma · Interaction Design · Industrial Design · Prototyping · Affinity Mapping · E-Textile · Survey Design · HCI · Physical Products`. Each item joined by a faded `+` separator. Animation: triple-duplicate the list, `transform: translateX(0 → -33.333%)`, duration `var(--marquee-duration, 50s)` linear infinite. Style: Archivo 600, 12px, uppercase, tracking 0.18em, `var(--ink)`.

### 3. Work
**Purpose:** showcase 4 projects in a sketchbook-style grid where details appear on hover.

**Layout:** `margin-top: clamp(120px, 16vh, 200px)`, gutter padding, inner max-width `var(--maxw)`.

**Section header** — eyebrow `SKETCHBOOK` / title `Work` / right-aligned caption `4 PROJECTS · 2024 – 2026`. Title is Big Shoulders 900, `clamp(64px, 11vw, 160px)`, line-height 0.9, tracking -0.025em.

**Grid:** `display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 32px`.

**Project Card** — see component spec below.

**Project data** (in `PROJECTS` array):
| # | Period | Org | Title | Doodle | Insight footer |
|---|---|---|---|---|---|
| 01 | 2025 | TH Augsburg · Master Thesis | Conversations in the gallery | `museum` (picture frame + 2 stick figures) | 12 visitor pairs · 4 weeks in situ · 38 interviews |
| 02 | 2025 – Now | Pangolin · Outdoor Gear | Why people return a tent | `tent` (tent silhouette + sun + ?) | 22 interviews · 9 themes · 1 product roadmap |
| 03 | 2024 | Logitech · Mech Eng Intern | Inside the hinge | `hinge` (pivot mechanism with rotation arc) | 17 hinge iterations · 3 finalists · 1 user test |
| 04 | 2024 | TU Eindhoven · Exchange | Soft circuits, softer skin | `textile` (knitted grid + conductive thread + needle) | 6 samples · 2 working prototypes · 1 zine |

#### `ProjectCard` component spec
**Wrapper** (`<article>`):
- Background `var(--paper-deep)`
- Border `1.5px solid var(--ink)`
- Border-radius `6px`
- `aspect-ratio: 4 / 3`
- Hand-drawn shadow offset: `box-shadow: 4px 5px 0 var(--ink)` resting → `8px 10px 0 var(--ink)` on hover/focus
- Each card has a baked rotation: `[-1.6°, 1.2°, -0.8°, 1.8°]` — apply with `transform: rotate(...)`
- Transition: `transform 380ms var(--ease-out), box-shadow 380ms var(--ease-out)`
- `cursor: pointer; tab-index: 0`

**Resting state** (visible when not hovered/focused):
- Absolutely positioned `inset: 0`, padding `20px 22px 22px`, `display: flex; flex-direction: column`
- Top row (`justify-content: space-between`): `№ 01` left, `2025` right — Archivo 700, 11px, uppercase, tracking 0.16em
- Middle: doodle SVG, centered, `flex: 1`, padding `8px 8px 0`. Stroke: `var(--ink)`, stroke-width 2.2, round caps/joins
- Bottom: title in Source Serif 4 italic 600, `clamp(20px, 2.4vw, 28px)`, line-height 1.1
- On hover: `opacity: 0; transform: translateY(-8px)` (transition opacity 260ms, transform 380ms)

**Hover state** (visible when hovered/focused):
- Absolutely positioned `inset: 0`, background `var(--ink)`, color `var(--paper)`, padding `24px 26px`, flex column
- Top meta row: `№ 01 · TH AUGSBURG · MASTER THESIS` / `2025` — Archivo 600, 10.5px, uppercase, tracking 0.16em, color `rgba(239,233,221,0.6)`, margin-bottom 14
- Title: Source Serif 4 italic 600, `clamp(22px, 2.4vw, 28px)`, line-height 1.1, tracking -0.012em, color `var(--paper)`
- Blurb: Source Serif 4 14.5px, line-height 1.5, color `rgba(239,233,221,0.82)`, margin-bottom 14
- Tags: flex-wrap row of mini-pills, gap 6, each: padding `4px 10px`, `1px solid rgba(239,233,221,0.4)` border, border-radius pill, Archivo 500, 10.5px, tracking 0.04em, color `rgba(239,233,221,0.9)`, `white-space: nowrap`
- Insight footer pinned to bottom: `margin-top: auto; padding-top: 14px; border-top: 1px dashed rgba(239,233,221,0.3)`, justify-between, Archivo 600, 11px, uppercase, tracking 0.08em, color `rgba(239,233,221,0.78)`, right-side `↗` arrow at 14px
- Transition: `opacity 240ms ease, transform 480ms var(--ease-out)`, from `opacity: 0; translateY(8%)` → `opacity: 1; translateY(0)`. `pointer-events: none` when hidden.

#### `Doodle` component spec
Hand-drawn SVGs at viewBox `0 0 320 240`, all using `stroke: var(--ink); stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round`. Four variants by `kind` prop:

- **`museum`** — picture frame (rounded rect with squiggle "art" inside + circle dot), 2 stick figures looking at it with speech-wiggle between them, wavy floor line
- **`tent`** — triangle tent with door + zip wiggle, ground line, pegs/ropes, sun with rays, small floating `?` over the right side
- **`hinge`** — two leaves opening from a pin (circle + dot), dashed rotation arc with arrow head, dimension lines on the right, scribbled note marks
- **`textile`** — five rows of zigzag-knit pattern, heavier conductive-thread loop, sewing needle entering from the right, three spark dots above with rays, small "wow" wiggle in top-left

Each doodle is intentionally loose — don't perfect them. They're charming because they're hand-drawn.

### 4. About
**Purpose:** bio, CV link, experience, education, skills.

**Layout:**
- `margin-top: clamp(120px, 16vh, 200px)`, gutter padding, inner max-width
- Section header `MY STORY` / `About`
- Two-column grid below: `grid-template-columns: 1.1fr 0.9fr; gap: 96px; margin-top: 64px; align-items: start`

**Left column — Bio + CV button:**
- Eyebrow `THE SHORT VERSION` (Archivo 600, 11px, uppercase, tracking 0.14em, color `var(--fg-3)`, margin-bottom 18)
- Two `<p>` blocks, Source Serif 4 19px, line-height 1.55, color `var(--fg-2)`, max-width 540, with bold lead-ins (`<strong>`, `var(--fg-1)`, weight 700) on these phrases:
  1. Paragraph 1: **HCI master's student** at TH Augsburg with a background in **industrial design**. I've interned at **Logitech** on the mechanical engineering team, and worked as a **UX researcher** at an outdoor gear startup — designing interview protocols, analyzing qualitative data, and translating findings into actionable insights for designers and PMs.
  2. Paragraph 2: **My current research** explores how interactive installations help museum visitors exchange ideas and build social connections.
- CV button: `<a>` with `display: inline-flex; gap: 10; padding: 14px 22px; background: var(--ink); color: var(--paper); border-radius: 9999; font: 600 12px/1 Archivo; letter-spacing: 0.14em; text-transform: uppercase`. Content: `VIEW CV ↗`.

**Right column — Experience → Education → Skills (in that order):**

Each subsection: eyebrow label (`EXPERIENCE`, `EDUCATION`, `SKILLS`) → content. Subsections separated by `margin-top: 56px`. The first list under each eyebrow has `border-top: 1px solid var(--hairline)`.

**Experience** — list of `<Row>` items (`EXPERIENCE` array):
| Company | Role | Period |
|---|---|---|
| Pangolin | UX Researcher Intern | 2025.03 – 2026.02 (period wraps on 2 lines via `white-space: pre-line`) |
| Logitech | Industrial Design Intern | 2024.03 – 2024.07 |

Row layout: `grid-template-columns: 1fr 110px; column-gap: 16; padding: 18px 0; border-bottom: 1px solid var(--hairline)`. Company in Big Shoulders 700, 22px, tracking -0.01em, line-height 1.1. Role in Source Serif 4 14px, color `var(--fg-3)`, margin-top 4. Period right-aligned, Archivo 600, 11px, uppercase, tracking 0.12em, color `var(--fg-3)`.

**Education** — `EDUCATION` array, each row: label (Source Serif 4 16px, weight 700, `var(--ink)`) + period (same style as Experience period):
| Label | Period |
|---|---|
| M.Sc. HCI · TH Augsburg | 2025 – Now |
| Exchange Student · Eindhoven University of Technology | 2024.09 – 2025.02 |
| B.S. Industrial Design · NTUST | 2020 – 2024 |

**Skills** — `SKILLS` array, rendered as flex-wrap row of small capsules. Override the default `.capsule` size:
- `font-size: 11px`
- `padding: 4px 10px`
- `letter-spacing: 0.02em`
- Gap: 6px

Skills: `UX Research, User Interviews, Usability Testing, Affinity Mapping, Survey Design, Qualitative Analysis, Figma, Prototyping, Interaction Design, Industrial Design, Physical Products, E-Textile, HCI, Design Research, Sketching, 3D Modeling`

### 5. Contact
**Purpose:** big "say hi" closer, social links, footer.

**Layout:** `margin-top: clamp(120px, 18vh, 220px); padding-bottom: 96px`, gutter padding, inner max-width.

**Content:**
- Eyebrow `GET IN TOUCH` — Archivo 600, 11px, uppercase, tracking 0.14em, `var(--fg-3)`, margin-bottom 24
- Display heading: `"Let's work together."` — Big Shoulders 900, `clamp(96px, 18vw, 280px)`, line-height 0.85, letter-spacing `-0.025em`
- Two-column grid below: `1.1fr 0.9fr`, gap 64, margin-top 64, align-items start
  - **Left:** two status pills row (gap 8, flex-wrap): green-dot `OPEN TO WERKSTUDENT / INTERNSHIP` + `REPLIES WITHIN 24H`. _(The original large email link `babalimao5244@gmail.com ↗` was removed at the user's request — but you may want to put it back in production for accessibility.)_
  - **Right:** social list (`socials` array). Each row:
    | label | href |
    |---|---|
    | Email | `mailto:babalimao5244@gmail.com` |
    | LinkedIn | `linkedin.com/in/yu-ching-lin` |
    | Behance | `behance.net/yu-ching-lin` |

    Row layout: `grid-template-columns: 1fr auto; align-items: baseline; gap: 16; padding: 15px 0 20px; border-bottom: 1px solid var(--hairline); width: 300px`. Label in Archivo 600, 11px, uppercase, tracking 0.14em, `var(--fg-3)`. Right side: `↗` arrow, 16px, `var(--fg-3)`. The URL values are stored in the data array but **not currently rendered** — to show them, add a middle column with Source Serif 4 18px and the `s.value`.
- **Footer:** `margin-top: 96px; padding-top: 32px; border-top: 1px solid var(--hairline); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px`. Three Archivo 600 11px uppercase tracking-0.14em items in `var(--fg-3)`:
  - `© Yu Ching Lin · 2024 – 2026`
  - `Designed in Augsburg · Set in Big Shoulders & Source Serif`
  - `Last updated April '26`

---

## Interactions & Behavior

### Smooth-scroll anchors
`html { scroll-behavior: smooth }`. Nav links use `href="#work"`, `#about`, `#contact`, `#top`.

### Section reveal on load
`@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }` applied to `main > section`, duration `var(--reveal-duration, 0.7s)` `cubic-bezier(0.22, 1, 0.36, 1)`, staggered with `animation-delay` 0.05s / 0.15s / 0.2s / 0.25s.

### Marquee
Triple the items, translate `-33.333%`, infinite linear. Hover/Tweak can pause via `animation-play-state`.

### Project card hover
- Card lifts (`transform` adds rotation persistence + bigger shadow)
- Resting state fades out (`opacity 260ms`) + slides up (`translateY(-8px)`)
- Hover state fades in (`opacity 240ms`) + slides up from `translateY(8%)`
- All transitions use `var(--ease-out)`

### Capsule hover
Default: `background: var(--ink); color: var(--paper)` on hover, transition `var(--dur-base) var(--ease-out)`.

### Anchor hover
Underlined `<a>` tags fade to `opacity: 0.6` on hover.

### Dark mode
The toggle button in nav flips `data-theme="dark"` on `<html>`, which swaps all paper/ink tokens. Skip the Tweaks panel in production but you may want to keep this toggle.

---

## State Management
- `dark` boolean in `Portfolio` root — toggles dark mode via `data-theme` attribute on `<html>`
- `hover` boolean per `ProjectCard` — drives the resting/hover state swap
- `target` and `pos` for the springy `GuestCursor` follower (RAF-driven lerp)
- That's it. No data fetching, no routing, no forms.

In a real implementation you can drop the GuestCursor entirely — it's a nostalgic nod to the Nicole Lin reference and may feel out of place once the design ships.

---

## Assets
None. All visuals are typography, CSS shapes, or inline SVG (the four doodles + nav glyph + cursor SVG). No images, no icons, no fonts beyond the three Google Fonts.

If you want to add real project imagery later, the obvious slot is **replacing each doodle with a static product photo / hero image** inside the same card frame.

---

## Open Questions / Known Issues
1. **Hero name font size** is currently inlined as `fontSize: "270px"` (with `whiteSpace: nowrap`) which overflows the viewport on narrow screens. Restore the original `fontSize: 'clamp(56px, 11vw, 168px)'` for responsive behavior, or allow a 2-line layout below ~700px.
2. **Big email link** under "Let's work together." was removed at the user's request. Consider putting it back for accessibility — the social list is small and easy to miss.
3. **Social row URLs** are in the data array but not rendered. Either delete the `value` field or render them as a third grid column.
4. **Wordmark** in nav still reads `"Nicole Lin"` — update to Yu Ching Lin's mark.
5. **Tweaks panel** should not ship to production. Strip the `<TweaksPanel>` JSX and `useTweaks` hook from the root component.

---

## Suggested Implementation Plan
1. Scaffold a Next.js / Astro project. Copy `colors_and_type.css` into `src/styles/` (or convert tokens to a Tailwind theme).
2. Split `components/Portfolio.jsx` into one file per section. Each is straightforward — mostly inline styles + a couple of small data arrays at the top.
3. Drop the Tweaks panel, dark-mode toggle (optional), GuestCursor (optional), and scroll indicator.
4. Replace `"Nicole Lin"` wordmark and stale copy.
5. Verify the four Google Fonts load (consider `next/font` for SSR-safe font-loading).
6. Test responsive — the hero name and Work grid need explicit mobile handling (`@media (max-width: 720px) { grid-template-columns: 1fr; }`).
7. Add real `<a href>` URLs for LinkedIn / Behance / Email.
8. Add `<meta>` tags for SEO/social sharing (Open Graph image, description).
9. Deploy.

Good luck! Reach out to the designer (Yu Ching Lin) with any clarifying questions about content or feel.
