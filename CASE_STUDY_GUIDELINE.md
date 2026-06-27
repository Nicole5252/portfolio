# Case-Study Detail Page — Design Guideline (v1)

**Source of truth** for how every `#work/<slug>` detail page is structured and written.
Owned/maintained in the governance session; mirrored into the `portfolio-case-page` skill so
other sessions build pages consistently. If this file and the skill ever disagree, **this file
wins** — update the skill to match.

Design tokens are NOT redefined here — `design-system/colors_and_type.css` is authoritative
(red/black/gray/white system: `--accent #C80018`, `--ink #1D1E27`, `--paper #EDF2F4`; display
= Big Shoulders, body = Archivo). The home page is documented in `README.md` (note: README's
colour/font tables are stale — trust the CSS). This file governs only the **case-study detail
pages**.

---

## 1. Principles

- **Lean and skimmable.** A hiring manager skims a case study in ~2–3 min and reads it fully in
  ~5–6. Target ≈ 8 screens, ≈ 800–1200 words of prose.
- **Editing IS the senior signal.** Showing *everything* (every part, every screen, every
  feature) reads as junior. Choosing what to show — and cutting the rest — is the skill being
  evaluated.
- **Every section must earn its place.** For each block ask: *"why is this here for a hiring
  manager?"* If it only documents the product (not your thinking or ability), cut or collapse it.
- **Research-forward.** Nicole's positioning is UX researcher. The insight and decision sections
  carry the case study; product documentation supports, never leads.

---

## 2. The unified skeleton — Hero + 7 content sections

Same spine for every project. Project *type* changes only which section is **weighted heaviest**
(see §3), not which sections exist.

| # | Section | Content rule | Length | Data fields (in `PROJECTS[]`) | Images |
|---|---|---|---|---|---|
| 1 | **Hero** | Title + one-line "so what" + meta (Role · Team · Period) + tags + hero image | title + 1 sentence | `title, blurb, role, period, org, tags, images.hero` | 1 |
| 2 | **Overview** | What it is + core concept (fold `concept`; drop the "formula" gimmick unless genuinely clarifying) | 2–4 sentences | `overview` (+ `concept` condensed) | 0–1 |
| 3 | **Problem & Context** | The user problem and why it matters | 2–4 sentences | `problem` (+ `contextImage` optional) | 0–1 |
| 4 | **Research & Method** | Method tags + 1 short paragraph on approach | method list + 2–3 sentences | `methods`, `methodsImages` | ≤1 |
| 5 | **Key Insights** ⭐ | 2–4 findings, each = insight → design implication. End by reframing into **How-Might-We** (the bridge to §6). | richest section | `findings[{title,description,design}]`, `findingsChart` | ≤1 |
| 6 | **Design Response** | The solution **+ the key decision/trade-off** + key design visuals | 1 para + decision 2–3 sentences | `product` **(always)** + ONE of `scopeNote` / `designDirection` + `designImages` | 2–3 |
| 7 | **Validation** *(optional)* | User testing: setup + 2–3 positives + 2–3 negatives (honest iteration). Include only if the project has it. | condensed | `userTesting` | ≤2 |
| 8 | **Outcome & Reflection** | Result/impact + 1–2 sentence reflection (what you learned / next) | short | `outcome`, `outcomeImages`, `reflection` | ≤2 |

Image budget per section: **1–3**. Never more.

---

## 3. Weighting (unified skeleton, adjustable emphasis)

- **Research-led projects** (Mère, Gallery Conversations, Pangolin): expand **§5 Key Insights**
  (3–4 findings with clear "so what"); keep §6 tight.
- **Design / industrial-design-led projects** (Logitech hinge): compress §5 to 1–2 insights;
  expand **§6 Design Response** (process, iterations, craft).
- The spine and section list stay identical — only depth shifts. This keeps every page coherent
  and the skill simple.

---

## 4. §6 rule — solution + decision

§6 has two jobs that must NOT be conflated:

- **`product`** answers *"what I made"* — the solution + key features. **Always include.** On its
  own it's a brochure (low judgment signal), so it must be paired with a decision element.
- The **decision element** answers *"how I decided what to build"* — include exactly **one**:
  - **`scopeNote`** — a compact one-paragraph prioritisation narrative. **Default** for most
    projects. Best judgment-per-word; fits the lean goal.
  - **`designDirection`** — a structured opportunity matrix (signal → opportunity) + an explicit
    "why this focus" rationale. **Upgrade to this only for the 1–2 flagship research projects**
    (e.g. Mère). Strongest "research → strategy" signal, but heavy — don't use it everywhere.
  - **Never include both** — `designDirection` already contains `scopeNote`'s point.

---

## 5. §4 / §5 — using method terminology

Naming methods well boosts credibility and keyword/ATS match (and mirrors JD language like
"qualitative und quantitative Methoden", "Design Thinking"). But follow three rules or it becomes
"method theatre":

1. **Every method name must point to an output.** "Affinity mapping" needs the artifact or the
   insight it produced next to it. Show *method → output → decision*, never a bare list of terms.
2. **Put each term in its right home.**
   - **§4** = actual research methods: interviews, survey, thematic analysis, affinity mapping,
     usability testing.
   - **How-Might-We is NOT a research method** — it's a framing/ideation tool. Place it at the
     **end of §5 → bridge into §6**: "I reframed the findings into How-Might-We questions that
     drove the design direction."
   - personas / journey maps: §4 or §5 depending on whether used to synthesise or to define.
3. **In prose, quality over quantity.** A dense method **tag list** in §4 is fine (scannable);
   in sentences, name only the 2–3 methods that genuinely shaped the work. The rest stay as tags.

---

## 6. Default-OFF modules

These exist in the data/render layer but are **off by default** (they are the `SHOW_DETAIL`-gated
product-documentation blocks): `anatomy`, `controller`, `usage`, `appConcept`.

- Turn one on only when it genuinely adds, and then **collapse it to a single condensed visual
  inside §6 Design Response** — never as its own multi-image section.

---

## 7. How this is realised in code

The detail page is **data-driven**: `ProjectDetailView` (in `components/Portfolio.jsx`) renders
whatever fields a `PROJECTS[]` entry contains, each behind a conditional guard. So you shape a
case study mostly by **editing that project's data object**:

- **Drop a section** → omit its field(s). The view already hides absent fields.
- **Default-OFF modules** → leave them out, or keep `SHOW_DETAIL` controlling them.
- Touch `ProjectDetailView` itself only for genuine structural/order changes — prefer data edits.
- Keep voice consistent: plain, specific, quietly confident; no buzzword padding; tokens and
  type classes from `design-system/colors_and_type.css`.
