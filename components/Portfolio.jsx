/* @jsx React.createElement */
const { useState, useEffect, useRef } = React;

/* =============================================================
   ROUTING — hash-based (#work/slug → detail page)
   ============================================================= */
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const match = hash.match(/^#work\/(.+)$/);
  if (match) return { page: 'detail', slug: match[1] };
  return { page: 'home' };
}

/* =============================================================
   LETTER REPEL — each letter is a real DOM span, mouse pushes
   entire letters away, spring physics brings them back.
   No canvas, no particles — just CSS transform on individual chars.
   ============================================================= */
function ParticleText({ text }) {
  const containerRef = useRef(null);
  const lettersRef   = useRef([]);   // [{ el, ox, oy, dx, dy, vx, vy }]
  const mouseRef     = useRef({ x: -9999, y: -9999 });
  const rafRef       = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const REPEL_R  = 100;   // px — how far the repulsion reaches
    const FORCE    = 14;    // push strength
    const SPRING   = 0.09;  // pull-back stiffness
    const DAMP     = 0.78;  // velocity damping per frame

    // ── measure each letter's natural centre (before any transforms) ──
    function measure() {
      const cRect = container.getBoundingClientRect();
      lettersRef.current = Array.from(
        container.querySelectorAll('[data-l]')
      ).map(el => {
        const r = el.getBoundingClientRect();
        return {
          el,
          ox: r.left - cRect.left + r.width  / 2,
          oy: r.top  - cRect.top  + r.height / 2,
          dx: 0, dy: 0,
          vx: 0, vy: 0,
        };
      });
    }

    // ── physics loop ──────────────────────────────────────────────
    function loop() {
      const { x: mx, y: my } = mouseRef.current;
      for (const l of lettersRef.current) {
        // visual centre = natural centre + current displacement
        const cx = l.ox + l.dx;
        const cy = l.oy + l.dy;
        const ddx = cx - mx;
        const ddy = cy - my;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);

        // repulsion when mouse is close
        if (dist < REPEL_R && dist > 0) {
          const f = (1 - dist / REPEL_R) * FORCE;
          l.vx += (ddx / dist) * f;
          l.vy += (ddy / dist) * f;
        }

        // spring back to natural position
        l.vx += -l.dx * SPRING;
        l.vy += -l.dy * SPRING;

        // damping
        l.vx *= DAMP;
        l.vy *= DAMP;

        l.dx += l.vx;
        l.dy += l.vy;

        l.el.style.transform = `translate(${l.dx}px,${l.dy}px)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    // wait for fonts, then measure + start
    document.fonts.ready.then(() => {
      measure();
      loop();
    });

    // re-measure on resize so positions stay accurate
    const onResize = () => {
      lettersRef.current.forEach(l => {
        l.dx = 0; l.dy = 0; l.vx = 0; l.vy = 0;
        l.el.style.transform = '';
      });
      measure();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(100px, 22vw, 360px)',
        lineHeight: 0.9,
        letterSpacing: '-0.025em',
        color: 'var(--ink)',
        userSelect: 'none',
        cursor: 'default',
      }}
      onMouseMove={(e) => {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onMouseLeave={() => { mouseRef.current = { x: -9999, y: -9999 }; }}
    >
      {text.split('').map((char, i) => (
        <span
          key={i}
          data-l="1"
          style={{ display: 'inline-block', willChange: 'transform' }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </div>
  );
}

/* ---------- Nav: name on left, links on right ---------- */
function PortfolioNav({ dark, onToggleDark }) {
  const items = [
  { name: 'Work', href: '#work' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' }];

  return (
    <nav style={{
      position: 'fixed', top: 20, left: 'var(--gutter)', right: 'var(--gutter)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 22px',
      background: dark ? 'rgba(29,30,39,0.55)' : 'rgba(237,242,244,0.55)',
      backdropFilter: 'blur(36px) saturate(200%)',
      WebkitBackdropFilter: 'blur(36px) saturate(200%)',
      borderRadius: 9999,
      boxShadow: dark
        ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.30)'
        : 'inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 14px rgba(14,14,12,0.04), 0 1px 2px rgba(14,14,12,0.03)',
      border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.45)'
    }}>
      <a href="#top" style={{
        fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
        fontWeight: 900, fontSize: 22, letterSpacing: '-0.01em',
        color: 'var(--ink)', textDecoration: 'none'
      }}>NL</a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {items.map((it) =>
        <a key={it.name} href={it.href} style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--ink)', textDecoration: 'none'
        }}>{it.name}</a>
        )}
        <button onClick={onToggleDark} aria-label="Toggle dark mode" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', marginLeft: 6,
          border: '1px solid var(--capsule-border)', borderRadius: 9999,
          background: 'transparent',
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
          color: 'var(--ink)'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" fill="none" />
            <path d="M12 3 a9 9 0 0 1 0 18 z" fill="currentColor" />
          </svg>
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>
    </nav>);

}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section id="top" style={{
      paddingTop: 'clamp(140px, 18vh, 200px)',
      paddingBottom: 'clamp(96px, 14vh, 160px)',
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)'
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', marginBottom: 28
        }}>UX/UI · INDUSTRIAL DESIGNER · PORTFOLIO '26</div>

        {/* Display name — particle canvas */}
        <ParticleText text="Nicole Lin" />

        {/* Masthead baseline row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 40,
          marginTop: 52,
          borderTop: '1px solid var(--hairline)',
          paddingTop: 28
        }}>
          {/* Left: role descriptor */}
          <p style={{
            margin: 0, maxWidth: 360,
            fontFamily: 'Archivo, sans-serif', fontSize: 17, lineHeight: 1.5,
            color: 'var(--fg-2)', letterSpacing: '-0.005em'
          }}>Research-led design across wearables, interfaces, and the physical products in between.</p>
          {/* Right: status capsules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', paddingTop: 2 }}>
            <span className="capsule capsule--eyebrow">
              <span className="dot" /> Open to Werkstudent / Internship
            </span>
            <span className="capsule capsule--eyebrow">Munich · Augsburg, Germany</span>
          </div>
        </div>
      </div>
    </section>);

}

/* ---------- Marquee ---------- */
function Marquee({ items }) {
  const dup = [...items, ...items, ...items];
  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid var(--hairline)',
      borderBottom: '1px solid var(--hairline)',
      padding: '20px 0'
    }}>
      <div style={{
        display: 'flex', gap: 56, whiteSpace: 'nowrap',
        animation: 'marquee var(--marquee-duration, 50s) linear infinite',
        animationPlayState: 'var(--marquee-state, running)',
        fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink)',
        width: 'max-content'
      }}>
        {dup.map((s, i) =>
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 56 }}>
            <span style={{ color: 'var(--fg-3)' }}>+</span>{s}
          </span>
        )}
      </div>
      <style>{`@keyframes marquee { from {transform: translateX(0)} to {transform: translateX(-33.333%)} }`}</style>
    </div>);

}

/* =============================================================
   PROJECTS DATA — includes detailed case study content
   ============================================================= */
const PROJECTS = [
{
  idx: '01',
  slug: 'mere',
  accent: '#5E7585',
  thumb: 'assets/mere/thumb.jpg',
  period: '2023.05 – 2024.04',
  org: 'Graduation Thesis · Taiwan Textile Federation',
  title: 'Mere',
  blurb: 'A smart nursing bra with integrated heating/cooling e-textile that lets breastfeeding mothers relieve engorgement on their own — backed by a 23-person survey and 5 in-depth interviews.',
  tags: ['UX Research', 'E-Textile', 'Mixed Methods', 'Wearable', 'Product Design'],
  insight: 'n=23 survey · n=5 interviews · 4 interaction opportunities',
  doodle: 'textile',
  images: {
    hero: {
      label: 'Hero image — Mere nursing bra',
      note: 'Clean product shot: worn in context or hero render. 16:9 or 4:3, no text overlaid.',
      src: 'assets/mere/hero-01.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Two-person graduation project · I led UX research and physical product design — interview design, survey, thematic analysis, and 3D modeling.',
  overview: 'Mere is a smart nursing bra with integrated e-textile that delivers heating and cooling therapy, so a mother can manage breastfeeding engorgement on her own.',
  concept: {
    tagline: 'Feel the care. Cherish your moment.',
    text: 'Mère is a smart nursing bra that integrates e-textile technology, designed specifically for postpartum mothers.',
    formula: ['Nursing Bra', 'E-Textile', 'Temperature Control'],
    result: 'A smoother breastfeeding process',
  },
  problem: 'In the postpartum period, milk engorgement and blocked ducts during breastfeeding often cause breast pain and make nursing difficult. Left unaddressed, this physical discomfort can build into emotional stress — and, in some cases, contribute to postpartum depression.',
  problemImage: { src: 'assets/mere/problem.jpg', label: 'Postpartum breastfeeding' },
  contextImage: {
    label: 'Context — the current routine',
    note: 'Traditional warm-compress tools / breastfeeding context. Wide shot, no text.',
  },
  methods: [
    'Survey (n=23)',
    'In-depth Interviews (n=5)',
    'Mixed-Methods Analysis',
    'Thematic Analysis',
    'Affinity Mapping',
    'Usability Testing (n=3)',
    '3D Modeling',
    'Physical Prototyping',
  ],
  researchMethods: [
    {
      name: 'Method 01',
      title: 'Survey',
      meta: 'n=23',
      purpose: "To understand mothers' most pressing pain points and needs after birth, gather feedback on our initial feature concepts, and learn which features they'd want in the app.",
    },
    {
      name: 'Method 02',
      title: 'Interviews',
      meta: 'n=5',
      purpose: "After narrowing the focus to hot- and cold-compress therapy, to study mothers' habits and the friction points they hit throughout that routine.",
    },
  ],
  painMatrix: [
    {
      observed: 'Breastfeeding is often chaotic',
      problem: 'Current products need to be refrigerated or filled with hot water',
      how: 'Reduce setup & cleanup time',
      src: 'assets/mere/pain-1.png',
    },
    {
      observed: 'Hard textures can worsen breast pain',
      problem: 'Most existing products are made of harder plastic',
      how: 'Integrate e-textiles while keeping material softness',
      src: 'assets/mere/pain-2.png',
    },
    {
      observed: 'Mothers often breastfeed alone for privacy',
      problem: "Can't care for the baby and prepare the tools at the same time",
      how: 'Complete the whole process on the spot',
      src: 'assets/mere/pain-3.png',
    },
  ],
  methodsImages: [
    { label: 'Affinity mapping', note: 'Interview insights clustered into themes.' },
    { label: 'Research process', note: 'Survey + interview flow, or session photos.' },
  ],
  findingsIntro: 'Across the survey and interviews, mothers described the same physical and emotional strain. Engorgement pain was near-universal, and existing relief routines were slow, two-handed, and hard to manage alone with a newborn.',
  findings: [
    {
      title: '75% suffer engorgement pain and poor milk flow',
      description: 'Engorgement pain was near-universal — yet relief meant slow, separate rituals.',
      design: 'Thermal therapy built into the garment — always on-hand, not a separate task.',
    },
    {
      title: '55% want a smoother hot- & cold-compress routine for engorgement',
      description: 'Existing tools are slow, messy, and two-handed — hard to use holding a newborn.',
      design: 'Heating e-textile in the bra makes the routine hands-free and self-operable.',
    },
    {
      title: '80% want an easy-to-store, easy-to-use compress product',
      description: 'Comfort and hygiene ranked alongside function — nothing stiff or hard to wash.',
      design: 'Skin-friendly e-textile with electronics that detach from a washable layer.',
    },
  ],
  scopeNote: 'Mothers raised several needs — heating, cooling, and EMS massage. Under project time constraints we prioritized the most-cited need, thermal care, and scoped the final physical prototype around heating and cooling.',
  findingsChart: {
    label: 'Survey results chart (n=23)',
    note: 'Bar / percentage chart you lay out manually: 75% breastfeeding pain · 42% inconvenient compress tools · 64% want soft, easy-clean materials.',
  },
  designImages: [
    { label: 'Heating e-textile layer', note: 'The integrated thermal textile, up close.' },
    { label: 'Front-zipper access', note: 'Self-operable opening for the heating pad.' },
    { label: 'Washable construction', note: 'Electronics separated from the fabric layer.' },
  ],
  product: {
    text: 'Mere is a complete set: the bra, thermal pads, and a clip-on controller — designed so a mother can run warm- or cold-compress therapy without separate tools.',
    features: [
      'Temperature-controlled heating & cooling',
      'Machine-washable fabric layer',
      'App-based session tracking',
    ],
    images: [
      { src: 'assets/mere/intro-0.jpg', label: 'Mère' },
      { src: 'assets/mere/intro-1.jpg', label: 'Mère' },
      { src: 'assets/mere/intro-2.jpg', label: 'Mère' },
      { src: 'assets/mere/intro-3.jpg', label: 'Mère' },
    ],
  },
  app: {
    text: 'A companion app visualises live temperature, logs each care session, and alerts mothers when a side runs too warm — helping prevent inflammation.',
    images: [
      { src: 'assets/mere/app-1.jpg', label: 'Mère app' },
      { src: 'assets/mere/app-2.jpg', label: 'Mère app' },
    ],
  },
  details: {
    hero: { src: 'assets/mere/detail-1.jpg', label: 'Mère detail' },
    images: [
      { src: 'assets/mere/detail-2.jpg' },
      { src: 'assets/mere/detail-3.jpg' },
      { src: 'assets/mere/detail-4.jpg' },
      { src: 'assets/mere/detail-5.jpg' },
      { src: 'assets/mere/detail-6.jpg' },
    ],
  },
  anatomy: {
    title: 'The heating / cooling pad',
    text: 'A modular thermal pad — woven heating thread over a hydrogel core — that clips into the bra pocket with skin-friendly velcro.',
    parts: [
      { name: 'Heating alloy thread', desc: 'Warms evenly across the pad surface.', icon: 'thread' },
      { name: 'Hydrogel core', desc: 'Retains heat and chills for cold compress.', icon: 'drop' },
      { name: 'Skin-friendly velcro', desc: 'Detaches cleanly for washing and swapping.', icon: 'velcro' },
      { name: 'Soft textile layer', desc: 'Sits gently against sensitive skin.', icon: 'textile' },
    ],
    images: [
      { label: 'Pad — exploded view', note: 'Layered diagram of the pad construction. Lay out part labels manually.' },
      { label: 'Pad — in the bra', note: 'The pad seated in the front pocket of the bra. Clean detail shot.' },
    ],
  },
  controller: {
    text: 'A small controller clips onto the bra and powers the pads. It charges over Type-C and detaches completely, so the fabric parts can go in the wash on their own.',
    features: [
      'Powers and sets the pad temperature',
      'Type-C charging',
      'Detachable for washing',
    ],
    images: [
      { label: 'Controller — detail', note: 'Clean shot of the clip-on controller.' },
      { label: 'Detach, then wash', note: 'Controller removed from the bra before washing. No text.' },
    ],
  },
  usage: {
    text: 'Three stages — warm to encourage flow, breastfeed, then cool to soothe.',
    steps: [
      { name: 'Hot · 40°C', desc: 'Warm compress 5–15 min to ease engorgement.', icon: 'hot' },
      { name: 'Breastfeed', desc: 'Feed with the warmed, softened breast.', icon: 'baby' },
      { name: 'Cold · 15°C', desc: 'Cold compress 15 min to reduce swelling.', icon: 'cold' },
    ],
    flow: [
      'Pull the zipper',
      'Install the heating pad',
      'Breastfeed',
      'Install the cold-compress pad',
    ],
    diagram: { label: 'Usage flow diagram', note: 'Step-by-step routine illustration. Lay out step labels manually.' },
  },
  appConcept: {
    text: 'The companion app monitors live temperature, records session history, and alerts if a side runs too warm — helping mothers prevent inflammation. Designed as a system concept, not an engineered build.',
    images: [
      { label: 'App concept — Splash', note: 'Opening / welcome screen.' },
      { label: 'App concept — Care history', note: 'Past sessions, ~15-min logs.' },
      { label: 'App concept — Live session', note: 'Live temperature, e.g. 25°C.' },
      { label: 'App concept — Alert', note: 'Skin-sensitivity reminder (Left / Right side).' },
    ],
  },
  userTesting: {
    setup: 'n=3 — one informed participant, two blind. Each completed the heating routine independently.',
    positives: [
      'Cut the routine time roughly in half versus traditional tools',
      'Operation felt intuitive — no points of confusion',
      'High overall comfort',
      'Would reduce the feeling of helplessness of doing it alone',
    ],
    negatives: [
      'Front zipper opening was too small — tugged on the breast when inserting the heating pad',
      'Temperature dial was over-sensitive — startling against already-sensitive skin',
      'Controller placement was not intuitive — required looking down to see the interface',
    ],
    photos: [
      { label: 'Testing session', note: 'Mother completing the heating routine unaided.' },
      { label: 'Zipper access issue', note: 'Detail of the too-small front opening.' },
      { label: 'Control interaction', note: 'Reaching / looking down at the temperature dial.' },
    ],
  },
  outcome: 'Mere was exhibited at the Young Designers’ Exhibition (新一代設計展), where the public could experience the smart textile firsthand — including EMS massage and heating/cooling — while the validated heating prototype was tested with mothers as described above.',
  outcomeImages: [
    { label: 'Mère in use — postpartum care', src: 'assets/mere/outcome.jpg' },
  ],
  reflection: 'Testing surfaced that physical ergonomics — zipper range, dial sensitivity, controller placement — mattered as much as the thermal function itself, and were only visible once mothers used the product unaided.',
  designDirection: {
    opportunities: [
      {
        title: 'Pressure Guidance',
        signal: 'Incorrect massage force is a key cause of physical pain',
        opportunity: 'Textile pressure sensors could give real-time feedback on force and direction',
      },
      {
        title: 'Embodied Interaction',
        signal: 'The care happens directly on the body',
        opportunity: 'The bra itself becomes the interface, delivering hot- and cold-compress therapy without external tools',
      },
      {
        title: 'App Breastfeeding Tracking',
        signal: 'Care is easy to lose track of, and inflammation escalates fast',
        opportunity: 'An app logs each feeding and care session, helping mothers spot patterns and catch problems early',
      },
    ],
    focus: {
      title: 'Final Decision',
      reasons: [
        {
          title: 'Embodied Interaction',
          text: 'Build hot/cold thermal care into the garment itself, so the bra becomes a hands-free interface during the care routine.',
        },
        {
          title: 'App Breastfeeding Tracking',
          text: 'Pair the garment with an app that tracks the breastfeeding routine and flags abnormal temperature early.',
        },
      ],
    },
  },
},
{
  idx: '02',
  slug: 'pangolin',
  // Brand orange sampled from the PNGL logo mark.
  accent: '#F39D34',
  period: '2025.03 – 2026.02',
  org: 'UX Research Internship · Pangolin',
  title: 'Pangolin',
  blurb: 'A solo UX-research internship where I designed, ran, and analysed sample-feedback interviews across two carry products’ second iteration — turning four-quadrant audience studies and region-by-region teardowns into prioritised recommendations for PM and designers.',
  tags: ['UX Research', 'User Interviews', 'Audience Segmentation', 'Qualitative + Quantitative', 'Design Thinking'],
  insight: '25 interviews · 2 four-quadrant audience studies · validated → retired a product hypothesis',
  doodle: 'tent',
  images: {
    hero: {
      label: 'Hero image — PNGL carry products in context',
      note: 'Wide shot of the two carry products in use, or a clean research-in-context image. 16:9 or 4:3, no text overlaid.',
      src: 'assets/pangolin/hero.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Solo UX Research intern (2025.03 – 2026.02). For both products I designed the interview guide, ran the interviews, analysed the results, and reported insights to the PM and designers; on the convertible bag I also contributed part of the design drawings.',
  concept: {
    // Thesis line only — no formula chips (keeps the dark band a single statement).
    tagline: 'Validate the audience before refining the product.',
  },
  problemLabel: 'Research Objective',
  problem: 'Both carry products were entering a second iteration. Rather than redesigning parts, the brief was to interrogate the audience model and the product bets behind it — before any feature was touched.',
  objectiveQuestions: [
    'Do the four hypothesised audience quadrants hold — and are their weighting and definitions right?',
    'What does each segment actually want — their goals, behaviours, pain points, and the words they use to describe them?',
    'Do the current product bets still match the segments they were built for?',
  ],
  researchMethods: [
    {
      name: 'Method 01',
      title: 'Interviews',
      meta: 'n=25',
      purpose: 'Designed the guide and ran sample-feedback interviews across both products — 16 for the phone carry, 9 for the convertible bag — covering goals, needs, pain points, and the words customers actually use.',
    },
    {
      name: 'Method 02',
      title: 'Affinity Mapping',
      meta: 'qual',
      purpose: 'Clustered every interview note into each segment’s concerns, behaviours and needs — the raw material for validating the audience model.',
    },
    {
      name: 'Method 03',
      title: 'Quadrant + Weighted Scoring',
      meta: '2×2',
      purpose: 'Mapped participants onto a two-axis matrix and scored purchase intent and willingness-to-pay to test whether the segments and their weighting held.',
    },
  ],
  analysisProcess: {
    exampleNote: 'Worked example — the convertible bag (the same pipeline ran on the phone carry too).',
    intro: 'The six-step pipeline below runs end to end — from clustering interviews to the weighting call and design feedback. (The code-rendered visuals are mine; the photos are the original deck artifacts, with the meaningful labels in English.)',
    steps: [
      {
        title: 'Cluster what each segment cares about',
        detail: 'Consolidated every interview into each segment’s concerns, behaviours and needs, then wrote up one analysis sheet per segment.',
        images: [
          { label: 'Affinity board 1', src: 'assets/pangolin/affinity/1.jpg' },
          { label: 'Affinity board 2', src: 'assets/pangolin/affinity/2.jpg' },
          { label: 'Affinity board 3', src: 'assets/pangolin/affinity/3.jpg' },
        ],
        imagesCaption: 'Affinity boards from the interviews (original working notes).',
        image: { label: 'Per-segment analysis (Frequent Overnighter shown)', src: 'assets/pangolin/segments.jpg' },
        caption: 'Per-segment analysis sheet · AI-translated to English.',
      },
      {
        title: 'Validate the audience quadrants & re-weight',
        detail: 'Tested whether the hypothesised segments held, then re-cut the weighting against what the interviews actually showed.',
        caption: 'Original audience-quadrant slide (V5) · AI-translated to English.',
        image: { label: 'Audience quadrant (V5)', src: 'assets/pangolin/quadrant.jpg' },
        bullets: [
          'Multi-function and signature-feature aren’t opposites under the current definitions — revise this axis.',
          'Few people actually cared about “packed size”; reframe the axis around packing process / packed appearance / portability (name TBD).',
          'Refined Men & Women scored notably low — define the segment more strictly and pre-screen interviewees.',
          'Healthy Sporty Group came in below the expected count; the two valid samples both prioritised waterproofing for rain sports — define it more pointedly.',
          'Daily Commuter overlaps Refined Men & Women (both cite everyday use); the real split is looks vs. practicality — redefine the segment.',
        ],
        weights: [
          { name: 'Refined Men & Women', before: 35, after: 30, reason: 'Lowest purchase intent of the four.' },
          { name: 'Healthy Sporty Group', before: 30, after: 20, reason: 'Several wouldn’t actually use it for sport.' },
          { name: 'Regular Overnighter', before: 20, after: 35, reason: 'Overnight use was far more common than assumed.' },
          { name: 'Daily Commuter', before: 15, after: 15, reason: 'Held — but overlaps Refined Men & Women; flagged for review.' },
        ],
      },
      {
        title: 'Associate score & price with feedback',
        detail: 'Linked each score band and each price band back to the qualitative reasons behind it.',
        bands: {
          score: {
            metric: 'Weighted score', avg: '6.8',
            bands: [
              { label: 'High', range: '≥ 7.9 — 3 people', reason: 'High everyday use, felt the capacity gain; waterproof, anti-theft and quick-access all landed.' },
              { label: 'Mid', range: '7.1–7.8 — 4 people', reason: 'Core needs met, but first-use learning cost was high.' },
              { label: 'Low', range: '≤ 7.0 — 2 people', reason: 'Looks felt unresolved, learning cost high, product positioning unclear.' },
            ],
          },
          price: {
            metric: 'Willingness to pay (NT$)', avg: '1,261',
            bands: [
              { label: 'Low', range: '≤ 1,056 — 3 people', reason: 'Minimal needs; would only pay up for a hard pain like waterproofing.' },
              { label: 'Mid', range: '1,056–1,427 — 3 people', reason: 'Value by CP / material / durability; pay for visible quality plus real use.' },
              { label: 'High', range: '≥ 1,427 — 3 people', reason: 'Function + durability trust + looks → worth investing; one-bag-many-uses.' },
            ],
          },
        },
      },
      {
        title: 'Tear down feedback by functional zone',
        detail: 'Organised reactions region by region across the bag’s components, annotating each zone with the weighted feedback.',
        images: [
          { label: 'Front layer zone', src: 'assets/pangolin/teardown/1.jpg' },
          { label: 'Functional zone 2', src: 'assets/pangolin/teardown/2.jpg' },
          { label: 'Functional zone 3', src: 'assets/pangolin/teardown/3.jpg' },
          { label: 'Functional zone 4', src: 'assets/pangolin/teardown/4.jpg' },
        ],
        imagesCaption: 'Each functional zone — front drawcord layer, mesh pocket, lower compartment, magnetic clasp & hook — scored and annotated with the weighted feedback. (Working drawings kept in the original Chinese.)',
        imagesMinCol: 420,
        imagesAspect: '16 / 10',
      },
      {
        title: 'Inventory the preference signals',
        detail: 'Pulled together the preference data captured alongside the core study.',
        prefs: [
          { label: 'Colour preference', note: 'Black led across all 9; grey and cocoa-brown the secondary choices.' },
          { label: 'KOL & media', note: 'IG core, YouTube secondary; YT mentions concentrated in two segments.' },
          { label: 'Keyword impression', note: '“Compact, simple, versatile, functional — for daily commute and outdoors.”' },
          { label: 'Strap add-on intent', note: '50% would add a strap; average willingness NT$461.' },
        ],
      },
      {
        title: 'Synthesise into design feedback',
        detail: 'Combined every finding with the re-cut weighting into the prioritised, per-product recommendations below.',
      },
    ],
  },
  studies: [
    {
      product: 'Convertible Bag',
      meta: 'n=9 · worked through above',
      findings: [
        { title: 'Quadrants held, but the weighting needed re-cutting', description: 'One segment overlapped enough with another to question whether it should stay.', design: 'Re-ranked priority and flagged the commuter segment for possible removal.' },
        { title: 'The “toiletry-bag” positioning was rejected', description: 'Across almost every segment, the secondary positioning did not survive real use.', design: 'Drop it; refocus on the small ↔ large convertible core.' },
        { title: 'Operation was the biggest shared blocker (+8)', description: 'Carry method, drawcords and magnetic clasps all caused first-use friction.', design: 'Lower the learning curve and add a quick-start guide for the large mode.' },
      ],
      recommendation: 'P0: streamline the large-bag packing flow and cut the learning cost. Add a back-carry mode and waterproof, easy-clean material.',
    },
    {
      product: 'Phone Carry',
      meta: 'n=16 · same method',
      findings: [
        { title: 'All four quadrants held; light-travel led at 35%', description: 'The hypothesised segmentation was validated, with the light-travel segment the largest.', design: 'Kept the model and carried the weighting into the next build.' },
        { title: 'The bottom compartment was a cross-segment P0', description: 'Low usage traced back to one structural cause shared across segments.', design: 'Re-estimate the core storage volume; swap the upper / lower layers and lift the quick-access layer.' },
        { title: 'One card clasp, three failure modes', description: 'Hard to use, too shallow, and barely used — three problems behind one label.', design: 'Split into three scoped changes for the designers.' },
      ],
      recommendation: 'P0: rework the core storage and the card layer. The body read too long — segments preferred a wider form — and several asked for a back-carry option.',
    },
  ],
  methodReflection: {
    intro: 'Running the pipeline twice sharpened the method itself.',
    points: [
      { title: 'Fix the framework first', text: 'Locking the analysis structure before extracting data made the second study far faster.' },
      { title: 'Objective before questions', text: 'Settling the research goal before writing the guide raised the accuracy of what came back.' },
      { title: 'Odd-numbered segments', text: 'An odd sample size per segment makes the trend easier to call.' },
      { title: 'Standardise the vocabulary', text: 'Unifying the product-part names up front prevents confusion downstream.' },
    ],
  },
},
];


/* ---------- Hand-drawn doodles (one per project) ---------- */
function Doodle({ kind }) {
  const stroke = 'var(--ink)';
  const sw = 2.2;
  const common = {
    width: '100%', height: '100%',
    style: { display: 'block' },
    viewBox: '0 0 320 240',
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  if (kind === 'museum') return (
    <svg {...common}>
      {/* Picture frame on a wall */}
      <path d="M70 60 Q72 58 76 58 L240 60 Q244 60 244 64 L246 170 Q246 174 242 174 L74 172 Q70 172 70 168 Z" />
      <path d="M86 76 L228 78 L230 156 L88 154 Z" strokeDasharray="0" />
      {/* Squiggle "art" inside the frame */}
      <path d="M100 130 C 110 100, 130 145, 144 115 S 175 130, 188 100 S 215 140, 222 118" />
      <circle cx="200" cy="98" r="6" />
      {/* Two stick figures looking at the frame */}
      <circle cx="120" cy="200" r="9" />
      <path d="M120 209 L120 224 M112 218 L128 218 M120 224 L114 232 M120 224 L126 232" />
      <circle cx="190" cy="200" r="9" />
      <path d="M190 209 L190 224 M182 218 L198 218 M190 224 L184 232 M190 224 L196 232" />
      {/* Speech wiggle between them */}
      <path d="M138 192 q 8 -10 16 0 q 8 10 18 -2" strokeWidth="1.6" />
      {/* Floor scribble */}
      <path d="M40 230 q 30 -3 60 0 q 40 3 80 0 q 50 -3 100 0" strokeWidth="1.4" />
    </svg>);


  if (kind === 'tent') return (
    <svg {...common}>
      {/* Tent silhouette */}
      <path d="M60 200 L160 60 L260 200 Z" />
      <path d="M160 60 L160 200" />
      {/* Door */}
      <path d="M140 200 L160 130 L180 200" />
      <path d="M155 198 q 5 -4 10 0" strokeWidth="1.6" />
      {/* Ground line */}
      <path d="M30 208 q 35 -3 70 0 q 40 4 80 0 q 50 -4 120 0" strokeWidth="1.4" />
      {/* Pegs + ropes */}
      <path d="M60 200 L40 218" /><path d="M260 200 L280 218" />
      <path d="M38 220 L42 218" /><path d="M278 220 L282 218" />
      {/* Sun scribble */}
      <circle cx="58" cy="60" r="14" />
      <path d="M38 60 L28 60 M58 40 L58 28 M44 46 L36 38 M72 46 L80 38" strokeWidth="1.6" />
      {/* Tiny pondering ? mark */}
      <path d="M230 90 q 4 -10 12 -8 q 8 2 4 10 q -4 6 -4 10" strokeWidth="1.6" />
      <circle cx="242" cy="112" r="1.4" fill="var(--ink)" />
    </svg>);


  if (kind === 'hinge') return (
    <svg {...common}>
      {/* Two hinge leaves opened */}
      <path d="M40 150 L150 80" />
      <path d="M40 150 L150 220" />
      <path d="M40 150 L40 90" />
      <path d="M40 150 L40 210" />
      {/* Pin (the pivot) */}
      <circle cx="40" cy="150" r="9" />
      <circle cx="40" cy="150" r="3" fill="var(--ink)" />
      {/* Arc showing rotation */}
      <path d="M120 90 A 80 80 0 0 1 120 210" strokeDasharray="4 6" strokeWidth="1.6" />
      <path d="M118 86 L124 91 L120 96" strokeWidth="1.6" />
      {/* Dimension lines / tick marks */}
      <path d="M170 80 L210 80 M170 220 L210 220" strokeWidth="1.4" />
      <path d="M210 80 L210 220" strokeDasharray="3 4" strokeWidth="1.4" />
      <path d="M205 84 L215 84 M205 76 L215 76 M205 224 L215 224 M205 216 L215 216" strokeWidth="1.4" />
      {/* Scribble note */}
      <path d="M230 96 q 12 -2 24 0 M230 110 q 16 -2 30 0 M230 124 q 8 -2 20 0" strokeWidth="1.4" />
    </svg>);


  if (kind === 'textile') return (
    <svg {...common}>
      {/* Knitted-grid surface */}
      <g strokeWidth="1.6">
        <path d="M70 70 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0" />
        <path d="M70 92 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0" />
        <path d="M70 114 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0" />
        <path d="M70 136 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0" />
        <path d="M70 158 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0 q 10 8 20 0 q 10 -8 20 0" />
      </g>
      {/* Conductive thread (heavier, looping out) */}
      <path d="M60 180 q 30 -10 50 -2 q 20 8 40 -4 q 30 -12 60 6 q 30 18 60 -2" strokeWidth="2.6" />
      {/* Needle */}
      <path d="M236 188 L286 168" strokeWidth="2.4" />
      <circle cx="290" cy="166" r="3" />
      {/* Spark dots */}
      <circle cx="120" cy="60" r="2" fill="var(--ink)" />
      <circle cx="180" cy="50" r="2" fill="var(--ink)" />
      <circle cx="220" cy="64" r="2" fill="var(--ink)" />
      <path d="M118 56 L122 60 M180 46 L182 54 M218 60 L222 64" strokeWidth="1.4" />
      {/* Scribbled "wow" wiggle */}
      <path d="M40 40 q 4 -8 10 -2 q 6 6 12 -2 q 6 -8 14 2" strokeWidth="1.6" />
    </svg>);


  return null;
}

/* ---------- Project Card ---------- */
function ProjectCard({ p, rotate, onOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      onClick={() => onOpen && onOpen(p.slug)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen && onOpen(p.slug); }}
      style={{
        position: 'relative',
        background: 'var(--paper)',
        border: 'none',
        borderRadius: 0,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 240ms ease',
        outline: 'none'
      }}>

      {/* Resting state — thumbnail image (or doodle fallback) */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 260ms ease',
        opacity: hover ? 0 : 1,
        pointerEvents: hover ? 'none' : 'auto'
      }}>
        {p.thumb ? (
          <img src={p.thumb} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '42%' }}>
            <Doodle kind={p.doodle} />
          </div>
        )}
      </div>

      {/* Hover state — info panel */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '24px 26px',
        display: 'flex', flexDirection: 'column',
        transition: 'opacity 240ms ease, transform 480ms cubic-bezier(.22,1,.36,1)',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateY(0)' : 'translateY(8%)',
        pointerEvents: hover ? 'auto' : 'none'
      }}>
        {/* Top meta */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)', marginBottom: 14
        }}>
          <span>№ {p.idx} · {p.org}</span>
          <span>{p.period}</span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "Archivo, sans-serif",
          fontStyle: 'italic', fontWeight: 600,
          fontSize: 'clamp(22px, 2.4vw, 28px)',
          lineHeight: 1.1, letterSpacing: '-0.012em',
          margin: '0 0 12px 0', color: 'var(--paper)'
        }}>{p.title}</h3>

        {/* Blurb */}
        <p style={{
          fontFamily: "Archivo, sans-serif",
          fontSize: 14.5, lineHeight: 1.5,
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 14px 0'
        }}>{p.blurb}</p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {p.tags.map((t) =>
          <span key={t} style={{
            padding: '4px 10px',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 9999,
            fontFamily: 'Archivo, sans-serif',
            fontSize: 10.5, fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.9)',
            whiteSpace: 'nowrap'
          }}>{t}</span>
          )}
        </div>

        {/* Insight pinned to bottom */}
        <div style={{
          marginTop: 'auto', paddingTop: 14,
          borderTop: '1px dashed rgba(255,255,255,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase'
        }}>
          <span>{p.insight}</span>
          <span style={{ fontSize: 14 }}>View case study ↗</span>
        </div>
      </div>
    </article>);
}

/* ---------- Project row (home list layout — one project per horizontal row) ---------- */
function ProjectRow({ p, onOpen, last }) {
  const [hover, setHover] = React.useState(false);
  const heroSrc = p.images && p.images.hero && p.images.hero.src;
  return (
    <article
      onClick={() => onOpen && onOpen(p.slug)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen && onOpen(p.slug); }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)',
        gap: 'clamp(24px, 4vw, 64px)',
        alignItems: 'center',
        padding: 'clamp(28px, 4vw, 52px) 0',
        borderTop: '1px solid var(--hairline)',
        borderBottom: last ? '1px solid var(--hairline)' : 'none',
        cursor: 'pointer', outline: 'none',
      }}>
      {/* Hero image (falls back to the doodle if no hero is set) */}
      <div style={{ overflow: 'hidden', borderRadius: 2, aspectRatio: '4 / 3', background: 'var(--paper-deep)' }}>
        {heroSrc ? (
          <img src={heroSrc} alt={p.title} loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transform: hover ? 'scale(1.045)' : 'scale(1)',
              transition: 'transform 620ms cubic-bezier(.22,1,.36,1)',
            }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '42%' }}><Doodle kind={p.doodle} /></div>
          </div>
        )}
      </div>
      {/* Text */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 16,
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 16,
        }}>
          <span>№ {p.idx} · {p.org}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{p.period}</span>
        </div>
        <h3 style={{
          fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800,
          fontSize: 'clamp(30px, 3.6vw, 52px)', lineHeight: 1, letterSpacing: '-0.02em',
          margin: '0 0 16px 0', color: hover ? 'var(--accent)' : 'var(--ink)', transition: 'color 200ms ease',
        }}>{p.title}</h3>
        <p style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 'clamp(14px, 1.4vw, 16px)', lineHeight: 1.55,
          color: 'var(--fg-2)', margin: '0 0 18px 0', maxWidth: 560,
        }}>{p.blurb}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
          {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16,
          paddingTop: 16, borderTop: '1px dashed var(--hairline)',
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-3)',
        }}>
          <span>{p.insight}</span>
          <span style={{ color: 'var(--ink)', fontSize: 13, whiteSpace: 'nowrap' }}>
            View case study{' '}
            <span style={{ display: 'inline-block', transform: hover ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 240ms ease' }}>↗</span>
          </span>
        </div>
      </div>
    </article>);
}

/* ---------- Image placeholder (dashed box w/ label) ---------- */
function ImagePlaceholder({ label, note, src, aspectRatio = '4 / 3', height }) {
  // Real image. With a height → cover banner (controlled). Without → natural full width.
  if (src) {
    return (
      <img src={src} alt={label || ''} loading="lazy"
        style={{ width: '100%', height: height || 'auto', objectFit: height ? 'cover' : undefined, display: 'block', borderRadius: 2 }} />
    );
  }
  // Intentional empty-state panel (not a dashed "missing image" box).
  // `label` shows as a quiet corner caption so Nicole knows what to drop in.
  return (
    <div style={{
      position: 'relative',
      background: 'var(--paper-deep)',
      border: '1px solid var(--hairline)',
      borderRadius: 2,
      overflow: 'hidden',
      aspectRatio: height ? undefined : aspectRatio,
      height: height || undefined,
      minHeight: 120,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, color: 'var(--fg-4)', padding: 24, textAlign: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 16 L15 11 L7 19" />
        </svg>
        {label && (
          <div style={{
            fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-3)',
          }}>{label}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Responsive grid of image placeholders ---------- */
function ImageGrid({ images, minCol = 220, aspectRatio = '4 / 3', maxWidth }) {
  if (!images || !images.length) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${minCol}px, 1fr))`,
      gap: 20,
      maxWidth: maxWidth || undefined
    }}>
      {images.map((im, i) => (
        <ImagePlaceholder key={i} label={im.label} note={im.note} src={im.src} aspectRatio={aspectRatio} />
      ))}
    </div>
  );
}

/* ---------- Weighting shift: hypothesised → re-cut, with rationale ---------- */
function WeightShift({ rows }) {
  const bF = 'Archivo, sans-serif';
  const tF = "'Big Shoulders Display', Helvetica, sans-serif";
  return (
    <div style={{ display: 'grid', gap: 0 }}>
      <div style={{ fontFamily: bF, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 6 }}>Weighting · hypothesised → re-cut</div>
      {rows.map((r, i) => {
        const same = r.after === r.before;
        const up = r.after > r.before;
        return (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) auto minmax(0, 1.25fr)',
            gap: 'clamp(10px, 1.8vw, 24px)', alignItems: 'baseline',
            padding: '12px 0', borderTop: '1px solid var(--hairline)',
            borderBottom: i === rows.length - 1 ? '1px solid var(--hairline)' : 'none',
          }}>
            <span style={{ fontFamily: bF, fontWeight: 700, fontSize: 14.5, color: 'var(--fg-1)' }}>{r.name}</span>
            <span style={{ fontFamily: tF, fontWeight: 900, fontSize: 17, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              {r.before}% <span style={{ color: same ? 'var(--fg-4)' : 'var(--accent)' }}>→</span> {r.after}%
              {!same && <span style={{ fontFamily: bF, fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginLeft: 5 }}>{up ? '▲' : '▼'}</span>}
            </span>
            <span style={{ fontFamily: bF, fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.5 }}>{r.reason}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Band breakdown: metric band → associated feedback ---------- */
function BandBreakdown({ data }) {
  const bF = 'Archivo, sans-serif';
  const tF = "'Big Shoulders Display', Helvetica, sans-serif";
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: bF, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{data.metric}</span>
        <span style={{ fontFamily: tF, fontWeight: 900, fontSize: 24, color: 'var(--accent)' }}>{data.avg}</span>
        <span style={{ fontFamily: bF, fontSize: 12, color: 'var(--fg-3)' }}>avg</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 'clamp(14px, 2.4vw, 28px)', rowGap: 10 }}>
        {data.bands.map((b, i) => (
          <div key={'l' + i} style={{ paddingTop: 12, borderTop: '2px solid var(--ink)', fontFamily: bF, fontWeight: 700, fontSize: 14, color: 'var(--fg-1)' }}>{b.label}</div>
        ))}
        {data.bands.map((b, i) => (
          <div key={'r' + i} style={{ fontFamily: bF, fontSize: 11.5, color: 'var(--fg-4)' }}>{b.range}</div>
        ))}
        {data.bands.map((b, i) => (
          <div key={'x' + i} style={{ fontFamily: bF, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{b.reason}</div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================
   PROJECT DETAIL VIEW
   ============================================================= */
function ProjectDetailView({ project }) {
  // Scroll to top when detail view loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [project.slug]);

  const currentIndex = PROJECTS.findIndex((p) => p.slug === project.slug);
  const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

  // Shared style helpers (matching the design system)
  const eyebrow = {
    fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--fg-3)', marginBottom: 18
  };
  const bodyText = {
    fontFamily: "Archivo, sans-serif",
    fontSize: 19, lineHeight: 1.55, color: 'var(--fg-2)',
    margin: 0, maxWidth: 680
  };

  // LEAN MODE — deeper sections live in the downloadable PDF, not on the page.
  // Flip to true to show them all again (data is untouched in PROJECTS).
  const SHOW_DETAIL = false;

  const ICONS = {
    thread: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 9 Q5 4 8 9 Q11 14 14 9 Q15.5 6.5 17 9"/></svg>,
    drop:   <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2 Q14 7.5 14 11.5 A5 5 0 0 1 4 11.5 Q4 7.5 9 2Z"/></svg>,
    velcro: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="6" height="6"/><rect x="10" y="2" width="6" height="6"/><rect x="2" y="10" width="6" height="6"/><rect x="10" y="10" width="6" height="6"/></svg>,
    textile:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5 Q9 3 16 5"/><path d="M2 9 Q9 7 16 9"/><path d="M2 13 Q9 11 16 13"/></svg>,
    hot:    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"><line x1="11" y1="3" x2="11" y2="12"/><circle cx="11" cy="16" r="3"/><line x1="8" y1="6.5" x2="9.5" y2="6.5"/><line x1="8" y1="9.5" x2="9.5" y2="9.5"/></svg>,
    baby:   <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="5.5" r="2.5"/><path d="M7 10.5 Q11 9 15 10.5 L14 19 H8 Z"/></svg>,
    cold:   <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#5B8DB8" strokeWidth="1.5" strokeLinecap="round"><line x1="11" y1="2" x2="11" y2="20"/><line x1="2" y1="11" x2="20" y2="11"/><line x1="5" y1="5" x2="17" y2="17"/><line x1="17" y1="5" x2="5" y2="17"/></svg>,
  };

  // Section-marker pictograms (functional wayfinding, monochrome, inherit color)
  const SECTION_ICONS = {
    role:      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="2.6"/><path d="M2.8 13.5 Q8 8.5 13.2 13.5"/></svg>,
    overview:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 8 Q8 2.5 14.5 8 Q8 13.5 1.5 8Z"/><circle cx="8" cy="8" r="1.9"/></svg>,
    numbers:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="13.5" x2="3" y2="9"/><line x1="8" y1="13.5" x2="8" y2="4"/><line x1="13" y1="13.5" x2="13" y2="7"/></svg>,
    concept:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5 L9.6 6.4 L14.5 8 L9.6 9.6 L8 14.5 L6.4 9.6 L1.5 8 L6.4 6.4Z"/></svg>,
    problem:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2 L14.5 13.5 H1.5Z"/><line x1="8" y1="6.5" x2="8" y2="9.5"/><circle cx="8" cy="11.6" r="0.5" fill="currentColor"/></svg>,
    methods:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="4.5"/><line x1="10.4" y1="10.4" x2="14" y2="14"/></svg>,
    findings:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10 L6 6 L9 9 L14 3.5"/><path d="M14 7 V3.5 H10.5"/></svg>,
    direction: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 8 L10.6 5.4 M8 8 L5.6 10.6"/></svg>,
    product:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.8 L14 5 V11 L8 14.2 L2 11 V5Z"/><path d="M2 5 L8 8 L14 5 M8 8 V14.2"/></svg>,
    outcome:   <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 14 V2 H12 L10 5 L12 8 H3.5"/></svg>,
  };

  const SectionLabel = ({ children }) => (
    <div style={{ marginBottom: 'clamp(28px, 3.2vw, 48px)' }}>
      <h2 style={{
        fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
        fontWeight: 800, fontSize: 'clamp(30px, 4vw, 46px)',
        color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em', margin: 0,
      }}>{children}</h2>
      <div style={{ height: 1, background: 'var(--hairline)', marginTop: 'clamp(16px, 2vw, 22px)' }} />
    </div>
  );

  return (
    <main style={{ paddingTop: 'clamp(100px, 14vh, 160px)', paddingBottom: 96, ...(project.accent && { '--accent': project.accent }) }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)' }}>

        {/* ── Back link (very top) ── */}
        <a href="#work" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', textDecoration: 'none', marginBottom: 28
        }}>← Selected Work</a>

        {/* ── Hero visual (full-bleed) ── */}
        <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginBottom: 'clamp(36px, 5vw, 64px)' }}>
          <ImagePlaceholder
            label={(project.images && project.images.hero && project.images.hero.label) || project.title}
            note={(project.images && project.images.hero && project.images.hero.note) || ''}
            src={project.images && project.images.hero && project.images.hero.src}
            height={'clamp(340px, 52vw, 660px)'}
          />
        </div>

        {/* ── Hero: meta sidebar + title + blurb ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.72fr) minmax(0, 1.7fr)',
          gap: 'clamp(28px, 5vw, 72px)',
          alignItems: 'end',
          marginBottom: 'clamp(40px, 5vw, 72px)',
        }}>
          <div style={{ display: 'grid', gap: 22 }}>
            <div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>Timeline</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, color: 'var(--fg-1)' }}>{project.period}</div>
            </div>
            <div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>Context</div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, color: 'var(--fg-1)', lineHeight: 1.4 }}>{project.org}</div>
            </div>
            {project.role && (
              <div>
                <div style={{ ...eyebrow, marginBottom: 6 }}>Role</div>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, color: 'var(--fg-1)', lineHeight: 1.5 }}>{project.role}</div>
              </div>
            )}
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(56px, 9vw, 132px)',
              lineHeight: 0.9, letterSpacing: '-0.025em',
              margin: '0 0 22px 0', color: 'var(--ink)'
            }}>{project.title}</h1>
            {project.blurb && (
              <p style={{ ...bodyText, fontSize: 20, lineHeight: 1.5, marginBottom: 24, maxWidth: 640 }}>{project.blurb}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* (My Role folded into hero meta; Overview & By-the-numbers removed) */}

        {/* ── Concept — full-bleed dark statement band ── */}
        {project.concept && (
          <div style={{
            width: '100vw', marginLeft: 'calc(50% - 50vw)',
            background: 'var(--ink)',
            marginBottom: 'clamp(80px, 13vw, 168px)',
          }}>
            <div style={{
              maxWidth: 'var(--maxw)', margin: '0 auto',
              paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
              minHeight: '72vh',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              paddingTop: 'clamp(64px, 12vh, 140px)', paddingBottom: 'clamp(64px, 12vh, 140px)',
            }}>
              <div style={{ ...eyebrow, color: 'var(--paper)', opacity: 0.55, marginBottom: 30 }}>Concept</div>
              {project.concept.tagline && (
                <p style={{
                  fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
                  fontWeight: 700, fontStyle: 'italic',
                  fontSize: 'clamp(44px, 7.5vw, 100px)',
                  color: 'var(--paper)', lineHeight: 1.04,
                  letterSpacing: '-0.02em', margin: '0 0 40px', maxWidth: '12em'
                }}>“{project.concept.tagline}”</p>
              )}
              {project.concept.formula && project.concept.formula.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  {project.concept.formula.map((part, i) => (
                    <React.Fragment key={part}>
                      {i > 0 && (<span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--paper)', opacity: 0.55 }}>+</span>)}
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', padding: '6px 12px', borderRadius: 2, color: 'var(--paper)', border: '1px solid rgba(237,242,244,0.32)' }}>{part}</span>
                    </React.Fragment>
                  ))}
                  {project.concept.result && (
                    <React.Fragment>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>=</span>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', padding: '6px 12px', borderRadius: 2, color: 'var(--ink)', background: 'var(--paper)' }}>{project.concept.result}</span>
                    </React.Fragment>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {SHOW_DETAIL && project.contextImage && (
          <div style={{ marginBottom: 80 }}>
            <ImagePlaceholder
              label={project.contextImage.label}
              note={project.contextImage.note}
              height={'clamp(240px, 34vw, 420px)'}
            />
          </div>
        )}


        {/* ── The Problem — full page (text + image) ── */}
        {project.problem && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="01">{project.problemLabel || 'The Problem'}</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: project.problemImage ? 'minmax(0, 1fr) minmax(0, 0.78fr)' : '1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}>
              <p style={{ ...bodyText, fontSize: 'clamp(19px, 2.1vw, 27px)', lineHeight: 1.5, maxWidth: 600 }}>{project.problem}</p>
              {project.problemImage && (
                <ImagePlaceholder src={project.problemImage.src} label={project.problemImage.label} height={'clamp(320px, 38vw, 460px)'} />
              )}
            </div>
            {project.objectiveQuestions && project.objectiveQuestions.length > 0 && (
              <div style={{ marginTop: 'clamp(32px, 4.5vw, 56px)', display: 'grid', gap: 0 }}>
                {project.objectiveQuestions.map((q, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 2.5vw, 32px)',
                    padding: 'clamp(16px, 2vw, 24px) 0',
                    borderBottom: i < project.objectiveQuestions.length - 1 ? '1px solid var(--hairline)' : 'none',
                    borderTop: i === 0 ? '1px solid var(--hairline)' : 'none',
                  }}>
                    <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(20px, 2.4vw, 30px)', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 'clamp(16px, 1.5vw, 19px)', color: 'var(--fg-1)', lineHeight: 1.45 }}>{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ── Research Methods — full page: title + two method boxes ── */}
        {project.researchMethods && project.researchMethods.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="02">Research Methods</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'clamp(20px, 3vw, 36px)',
            }}>
              {project.researchMethods.map((m, i) => (
                <div key={i} style={{
                  border: '1px solid var(--hairline)', borderRadius: 2,
                  padding: 'clamp(26px, 3vw, 44px)',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ ...eyebrow, marginBottom: 0 }}>{m.name}</span>
                    {m.meta && <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--accent)' }}>{m.meta}</span>}
                  </div>
                  <div style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800, fontSize: 'clamp(30px, 3.6vw, 44px)', color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.01em' }}>{m.title}</div>
                  <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0 }}>{m.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analysis Process — the six-step pipeline, each step with its artifact ── */}
        {project.analysisProcess && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>Analysis Process</SectionLabel>
            {project.analysisProcess.exampleNote && (
              <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginTop: 'calc(-1 * clamp(16px, 2vw, 28px))', marginBottom: 'clamp(18px, 2.4vw, 28px)' }}>{project.analysisProcess.exampleNote}</div>
            )}
            {project.analysisProcess.intro && (
              <p style={{ ...bodyText, maxWidth: 820, marginBottom: 'clamp(40px, 6vw, 72px)' }}>{project.analysisProcess.intro}</p>
            )}
            <div style={{ display: 'grid', gap: 'clamp(48px, 7vw, 80px)' }}>
              {project.analysisProcess.steps.map((s, i) => {
                const hasVisual = s.image || s.images || s.bullets || s.weights || s.bands || s.prefs;
                const capStyle = { fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)', marginTop: 12 };
                return (
                  <div key={i} style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'clamp(22px, 2.6vw, 34px)' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)',
                      gap: 'clamp(16px, 3vw, 36px)', alignItems: 'baseline',
                      marginBottom: hasVisual ? 'clamp(24px, 3vw, 38px)' : 0,
                    }}>
                      <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(26px, 3.2vw, 44px)', color: 'var(--accent)', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 'clamp(17px, 1.7vw, 21px)', color: 'var(--ink)', lineHeight: 1.25, marginBottom: 7 }}>{s.title}</div>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15.5, color: 'var(--fg-2)', lineHeight: 1.55, maxWidth: 720 }}>{s.detail}</div>
                      </div>
                    </div>
                    {hasVisual && (
                      <div style={{ paddingLeft: 'clamp(0px, 5vw, 60px)', display: 'grid', gap: 'clamp(24px, 3vw, 36px)' }}>
                        {s.images && s.images.length > 0 && (
                          <figure style={{ margin: 0 }}>
                            <ImageGrid images={s.images} minCol={s.imagesMinCol || 200} aspectRatio={s.imagesAspect || '4 / 3'} maxWidth={s.imagesMaxWidth} />
                            {s.imagesCaption && <figcaption style={capStyle}>{s.imagesCaption}</figcaption>}
                          </figure>
                        )}
                        {s.image && (
                          <figure style={{ margin: 0 }}>
                            <ImagePlaceholder label={s.image.label} src={s.image.src} aspectRatio={'16 / 9'} />
                            {s.caption && <figcaption style={capStyle}>{s.caption}</figcaption>}
                          </figure>
                        )}
                        {(s.bullets || s.weights) && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(28px, 4vw, 52px)', alignItems: 'start' }}>
                            {s.bullets && (
                              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 0 }}>
                                {s.bullets.map((b, bi) => (
                                  <li key={bi} style={{
                                    display: 'flex', gap: 12, padding: '11px 0',
                                    borderTop: '1px solid var(--hairline)',
                                    borderBottom: bi === s.bullets.length - 1 ? '1px solid var(--hairline)' : 'none',
                                    fontFamily: 'Archivo, sans-serif', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)',
                                  }}>
                                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>›</span>{b}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {s.weights && <WeightShift rows={s.weights} />}
                          </div>
                        )}
                        {s.bands && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(28px, 4vw, 56px)' }}>
                            {s.bands.score && <BandBreakdown data={s.bands.score} />}
                            {s.bands.price && <BandBreakdown data={s.bands.price} />}
                          </div>
                        )}
                        {s.prefs && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(14px, 1.6vw, 20px)' }}>
                            {s.prefs.map((p, pi) => (
                              <div key={pi} style={{ border: '1px solid var(--hairline)', borderRadius: 2, padding: 'clamp(16px, 1.8vw, 22px)' }}>
                                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--fg-1)', marginBottom: 8 }}>{p.label}</div>
                                <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{p.note}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Findings & Design Feedback — split per product ── */}
        {project.studies && project.studies.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>Findings &amp; Design Feedback</SectionLabel>
            <div style={{ display: 'grid', gap: 'clamp(48px, 7vw, 88px)' }}>
              {project.studies.map((st, si) => (
                <div key={si}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 'clamp(20px, 2.4vw, 32px)', paddingBottom: 16, borderBottom: '1px solid var(--ink)' }}>
                    <h3 style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 38px)', color: 'var(--ink)', margin: 0, lineHeight: 1, letterSpacing: '-0.01em' }}>{st.product}</h3>
                    {st.meta && <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', color: 'var(--fg-3)' }}>{st.meta}</span>}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${st.findings.length}, minmax(0, 1fr))`,
                    columnGap: 'clamp(24px, 4vw, 48px)', rowGap: 'clamp(12px, 1.4vw, 18px)',
                    marginBottom: st.recommendation ? 'clamp(24px, 3vw, 36px)' : 0,
                  }}>
                    {st.findings.map((f, fi) => (
                      <div key={'t' + fi} style={{ paddingTop: 18, borderTop: '1px solid var(--hairline)', fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: 'var(--fg-1)', lineHeight: 1.35 }}>{f.title}</div>
                    ))}
                    {st.findings.map((f, fi) => (
                      <div key={'d' + fi} style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.5 }}>{f.description}</div>
                    ))}
                    {st.findings.map((f, fi) => (
                      <div key={'g' + fi} style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5 }}>→ {f.design}</div>
                    ))}
                  </div>
                  {st.recommendation && (
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'start', paddingTop: 4 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', paddingTop: 3 }}>Recommendation</div>
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0, maxWidth: 640 }}>{st.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ── Key Findings — ring charts ── */}
        {project.findings && project.findings.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="03">Key Findings</SectionLabel>
            {project.findingsIntro && (
              <p style={{ ...bodyText, fontSize: 17, maxWidth: 760, marginBottom: 'clamp(44px, 6vw, 80px)' }}>{project.findingsIntro}</p>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${project.findings.length}, minmax(0, 1fr))`,
              columnGap: 'clamp(24px, 4vw, 56px)',
              rowGap: 24,
              justifyItems: 'center',
            }}>
              {project.findings.map((f, i) => {
                const m = (f.title || '').match(/^(\d+)%\s+(.*)$/);
                const pct = m ? parseInt(m[1], 10) : 100;
                const fig = m ? m[1] + '%' : '0' + (i + 1);
                const ttl = m ? m[2] : f.title;
                const R = 52, C = 2 * Math.PI * R;
                return (
                  <div key={i} style={{ textAlign: 'center', maxWidth: 240 }}>
                    <svg viewBox="0 0 120 120" style={{ width: 'clamp(140px, 15vw, 190px)', height: 'auto', display: 'block', margin: '0 auto' }}>
                      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--paper-deep)" strokeWidth="9" />
                      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 60 60)" />
                      <text x="60" y="62" textAnchor="middle" dominantBaseline="middle"
                        fontFamily="'Big Shoulders Display', Helvetica, sans-serif" fontWeight="900" fontSize="30" fill="var(--ink)">{fig}</text>
                    </svg>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: 'var(--fg-1)', lineHeight: 1.35, marginTop: 18 }}>{ttl}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* ── Common Pain Points → How (qualitative matrix) ── */}
        {project.painMatrix && project.painMatrix.length > 0 && (
          <div style={{ marginBottom: 'clamp(48px, 8vw, 96px)' }}>
            <SectionLabel num="04">Common Pain Points</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${project.painMatrix.length}, minmax(0, 1fr))`,
              columnGap: 'clamp(24px, 4vw, 48px)',
              rowGap: 'clamp(16px, 1.8vw, 24px)',
            }}>
              {project.painMatrix.map((row, i) => (
                <div key={'img' + i} style={{ alignSelf: 'end' }}>
                  {row.src && <img src={row.src} alt={row.observed} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />}
                </div>
              ))}
              {project.painMatrix.map((row, i) => (
                <div key={'obs' + i} style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--fg-1)', lineHeight: 1.3 }}>{row.observed}</div>
              ))}
              {project.painMatrix.map((row, i) => (
                <p key={'prob' + i} style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14.5, lineHeight: 1.55, color: 'var(--fg-3)', fontStyle: 'italic', margin: 0 }}>“{row.problem}”</p>
              ))}
            </div>
          </div>
        )}

        {/* ── How Might We… (pulled from the pain matrix) ── */}
        {project.painMatrix && project.painMatrix.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>How Might We…</SectionLabel>
            <div style={{ display: 'grid', gap: 0 }}>
              {project.painMatrix.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 2.5vw, 32px)',
                  padding: 'clamp(20px, 2.6vw, 34px) 0',
                  borderBottom: i < project.painMatrix.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}>
                  <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(24px, 3vw, 40px)', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 700, fontSize: 'clamp(24px, 3.2vw, 42px)', color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>How might we {row.how.charAt(0).toLowerCase() + row.how.slice(1)}?</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Design Direction ── */}
        {project.designDirection && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <SectionLabel num="05">Design Direction</SectionLabel>
              {project.designDirection.intro && (
                <p style={{ ...bodyText, marginBottom: 32 }}>{project.designDirection.intro}</p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${project.designDirection.opportunities.length}, minmax(0, 1fr))`,
                columnGap: 'clamp(20px, 3vw, 40px)',
                rowGap: 14,
                marginBottom: project.designDirection.focus ? 40 : 0,
              }}>
                {project.designDirection.opportunities.map((opp, i) => (
                  <div key={'t' + i} style={{
                    paddingTop: 18, borderTop: '1px solid var(--hairline)',
                    fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--fg-1)',
                  }}>{opp.title}</div>
                ))}
                {project.designDirection.opportunities.map((opp, i) => (
                  <div key={'s' + i} style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 14, color: 'var(--fg-3)', lineHeight: 1.5,
                  }}>{opp.signal}</div>
                ))}
                {project.designDirection.opportunities.map((opp, i) => (
                  <div key={'o' + i} style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5,
                  }}>→ {opp.opportunity}</div>
                ))}
              </div>
              {project.designDirection.focus && (
                <div style={{
                  paddingTop: 28,
                  marginTop: 8,
                  borderTop: '1px solid var(--hairline)',
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  gap: 40,
                  alignItems: 'start',
                }}>
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: 'var(--ink)', paddingTop: 3,
                  }}>{project.designDirection.focus.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                    {project.designDirection.focus.reasons.map((r, i) => (
                      <div key={i}>
                        <div style={{
                          fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                          fontSize: 14, color: 'var(--fg-1)', marginBottom: 8,
                        }}>{r.title}</div>
                        <div style={{
                          fontFamily: 'Archivo, sans-serif', fontSize: 14,
                          lineHeight: 1.6, color: 'var(--fg-2)',
                        }}>{r.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
              </div>
        )}

        {/* ── The Product ── */}
        {project.product && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <SectionLabel num="06">The Product</SectionLabel>
              <p style={{ ...bodyText, marginBottom: project.product.features ? 24 : 28 }}>{project.product.text}</p>
              {project.product.features && project.product.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: project.product.images ? 36 : 0 }}>
                  {project.product.features.map((f) => (
                    <span key={f} className="tag">{f}</span>
                  ))}
                </div>
              )}
              {project.product.images && project.product.images.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 'clamp(16px, 2.5vw, 36px)',
                }}>
                  {project.product.images.map((im, i) => (
                    <img key={i} src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} />
                  ))}
                </div>
              )}
            </div>
              </div>
        )}

        {/* ── The App ── */}
        {project.app && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="07">The App</SectionLabel>
            {project.app.text && <p style={{ ...bodyText, maxWidth: 680, marginBottom: 'clamp(32px, 4vw, 56px)' }}>{project.app.text}</p>}
            {project.app.images && project.app.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${project.app.images.length}, minmax(0, 1fr))`, gap: 'clamp(12px, 1.5vw, 20px)' }}>
                {project.app.images.map((im, i) => (
                  <img key={i} src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Details — big image + row ── */}
        {project.details && (
          <div style={{ marginBottom: 'clamp(48px, 8vw, 96px)' }}>
            <SectionLabel num="08">Details</SectionLabel>
            {project.details.hero && (
              <div style={{ marginBottom: 'clamp(12px, 1.5vw, 20px)' }}>
                <img src={project.details.hero.src} alt={project.details.hero.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} />
              </div>
            )}
            {project.details.images && project.details.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${project.details.images.length}, minmax(0, 1fr))`, gap: 'clamp(10px, 1.2vw, 16px)' }}>
                {project.details.images.map((im, i) => (
                  <img key={i} src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 2 }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Anatomy: heating / cooling pad ── */}
        {SHOW_DETAIL && project.anatomy && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>{project.anatomy.title || 'Anatomy'}</div>
              <p style={{ ...bodyText, marginBottom: 36 }}>{project.anatomy.text}</p>
              {project.anatomy.parts && project.anatomy.parts.length > 0 && (
                <div style={{ marginBottom: project.anatomy.images ? 36 : 0 }}>
                  {project.anatomy.parts.map((p, i) => (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(180px, 0.4fr) minmax(0, 1fr)',
                      gap: 24,
                      padding: '16px 0',
                      borderBottom: '1px solid var(--hairline)',
                      alignItems: 'center',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                        fontSize: 15, color: 'var(--fg-1)',
                      }}>
                        {p.icon && (
                          <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
                            {ICONS[p.icon]}
                          </span>
                        )}
                        {p.name}
                      </div>
                      <div style={{
                        fontFamily: 'Archivo, sans-serif', fontSize: 15,
                        lineHeight: 1.55, color: 'var(--fg-2)'
                      }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              )}
              {project.anatomy.images && project.anatomy.images.length > 0 && (
                <ImageGrid images={project.anatomy.images} minCol={240} aspectRatio={'4 / 3'} />
              )}
            </div>
              </div>
        )}

        {/* ── Controller ── */}
        {SHOW_DETAIL && project.controller && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>The Controller</div>
              <p style={{ ...bodyText, marginBottom: project.controller.features ? 24 : 28 }}>{project.controller.text}</p>
              {project.controller.features && project.controller.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: project.controller.images ? 36 : 0 }}>
                  {project.controller.features.map((f) => (
                    <span key={f} className="tag">{f}</span>
                  ))}
                </div>
              )}
              {project.controller.images && project.controller.images.length > 0 && (
                <ImageGrid images={project.controller.images} minCol={240} aspectRatio={'4 / 3'} />
              )}
            </div>
              </div>
        )}

        {/* ── How It Works ── */}
        {SHOW_DETAIL && project.usage && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>How It Works</div>
              <p style={{ ...bodyText, marginBottom: 32 }}>{project.usage.text}</p>
              {project.usage.steps && project.usage.steps.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                  marginBottom: project.usage.flow ? 36 : 0
                }}>
                  {project.usage.steps.map((s, i) => (
                    <div key={i} style={{
                      border: '1px solid var(--hairline)',
                      padding: '22px 24px',
                      background: 'var(--paper-deep)',
                    }}>
                      {s.icon && (
                        <div style={{ marginBottom: 12 }}>{ICONS[s.icon]}</div>
                      )}
                      <div style={{
                        fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
                        fontWeight: 700, fontSize: 22,
                        color: 'var(--ink)', marginBottom: 6,
                        letterSpacing: '-0.01em'
                      }}>{s.name}</div>
                      <div style={{
                        fontFamily: 'Archivo, sans-serif', fontSize: 14,
                        lineHeight: 1.55, color: 'var(--fg-2)'
                      }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              )}
              {project.usage.flow && project.usage.flow.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
                  marginBottom: project.usage.diagram ? 36 : 0
                }}>
                  {project.usage.flow.map((step, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span style={{
                          fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                          fontSize: 16, color: 'var(--fg-3)'
                        }}>→</span>
                      )}
                      <span style={{
                        fontFamily: 'Archivo, sans-serif', fontWeight: 600, fontSize: 13,
                        color: 'var(--fg-1)', background: 'var(--paper)',
                        border: '1px solid var(--capsule-border)',
                        padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap'
                      }}>
                        <span style={{ color: 'var(--fg-4)', marginRight: 7 }}>{i + 1}</span>
                        {step}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
              {project.usage.diagram && (
                <ImagePlaceholder
                  label={project.usage.diagram.label}
                  note={project.usage.diagram.note}
                  height={'clamp(220px, 30vw, 360px)'}
                />
              )}
            </div>
              </div>
        )}

        {/* ── Companion App (concept) ── */}
        {SHOW_DETAIL && project.appConcept && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>Companion App — Concept</div>
              <p style={{ ...bodyText, marginBottom: 28 }}>{project.appConcept.text}</p>
              {project.appConcept.images && project.appConcept.images.length > 0 && (
                <ImageGrid images={project.appConcept.images} minCol={160} aspectRatio={'9 / 16'} maxWidth={740} />
              )}
            </div>
              </div>
        )}

        {/* ── User Testing ── */}
        {SHOW_DETAIL && project.userTesting && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>User Testing</div>
              <p style={{ ...bodyText, marginBottom: 32 }}>{project.userTesting.setup}</p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'clamp(24px, 5vw, 64px)',
                marginBottom: 36
              }}>
                <div>
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--ink)', marginBottom: 14
                  }}>What worked</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {project.userTesting.positives.map((item, i) => (
                      <li key={i} style={{
                        fontFamily: 'Archivo, sans-serif', fontSize: 16, lineHeight: 1.5,
                        color: 'var(--fg-2)', padding: '10px 0',
                        borderBottom: '1px solid var(--hairline)',
                        display: 'flex', gap: 10
                      }}><span style={{ color: 'var(--ink)', fontWeight: 700 }}>+</span>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--ink)', marginBottom: 14
                  }}>What to improve</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {project.userTesting.negatives.map((item, i) => (
                      <li key={i} style={{
                        fontFamily: 'Archivo, sans-serif', fontSize: 16, lineHeight: 1.5,
                        color: 'var(--fg-2)', padding: '10px 0',
                        borderBottom: '1px solid var(--hairline)',
                        display: 'flex', gap: 10
                      }}><span style={{ color: 'var(--fg-3)' }}>→</span>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {project.userTesting.photos && project.userTesting.photos.length > 0 && (
                <ImageGrid images={project.userTesting.photos} minCol={220} aspectRatio={'4 / 3'} />
              )}
            </div>
              </div>
        )}

        {/* (Outcome section removed) */}

        {/* ── Reflection ── */}
        {SHOW_DETAIL && project.reflection && (
          <div>
                <div style={{ marginBottom: 96, marginTop: 80 }}>
              <div style={eyebrow}>Reflection</div>
              <p style={bodyText}>{project.reflection}</p>
            </div>
          </div>
        )}

        {/* ── Reflection — methodology learnings (always-on, separate from SHOW_DETAIL) ── */}
        {project.methodReflection && (
          <div style={{ marginBottom: 'clamp(48px, 8vw, 96px)' }}>
            <SectionLabel>Reflection</SectionLabel>
            {project.methodReflection.intro && (
              <p style={{ ...bodyText, maxWidth: 760, marginBottom: 'clamp(28px, 4vw, 48px)' }}>{project.methodReflection.intro}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(20px, 3vw, 40px)' }}>
              {project.methodReflection.points.map((p, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--fg-1)', marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, lineHeight: 1.6, color: 'var(--fg-2)' }}>{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Next Project (only when there's more than one) ── */}
        {PROJECTS.length > 1 && (
        <a href={`#work/${nextProject.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            border: '1.5px solid var(--ink)',
            borderRadius: 6,
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '4px 5px 0 var(--ink)',
            transition: 'box-shadow 260ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.22,1,.36,1)',
            background: 'var(--paper-deep)',
            cursor: 'pointer'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '8px 10px 0 var(--ink)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '4px 5px 0 var(--ink)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Next Project</div>
              <div style={{
                fontFamily: "Archivo, sans-serif",
                fontStyle: 'italic', fontWeight: 600,
                fontSize: 'clamp(22px, 3vw, 32px)',
                lineHeight: 1.1, color: 'var(--ink)'
              }}>{nextProject.title}</div>
              <div style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--fg-3)', marginTop: 8
              }}>{nextProject.org}</div>
            </div>
            <div style={{
              fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
              fontWeight: 900, fontSize: 48, color: 'var(--ink)', lineHeight: 1
            }}>→</div>
          </div>
        </a>
        )}

      </div>
    </main>
  );
}

/* ---------- Work section ---------- */
function WorkSection() {
  const onOpen = (slug) => { window.location.hash = `work/${slug}`; };
  return (
    <section id="work" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(120px, 16vh, 200px)'
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <SectionHeader eyebrow="Sketchbook" title="Work" caption={`${PROJECTS.length} projects · 2024 – 2026`} />
        <div style={{ marginTop: 8, paddingBottom: 24 }}>
          {PROJECTS.map((p, i) => (
            <ProjectRow key={p.idx} p={p} onOpen={onOpen} last={i === PROJECTS.length - 1} />
          ))}
        </div>
      </div>
    </section>);

}

function SectionHeader({ eyebrow, title, caption }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24,
      paddingBottom: 24, height: "200px"
    }}>
      <div>
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', marginBottom: 24
        }}>{eyebrow}</div>
        <h2 style={{
          fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",

          fontSize: 'clamp(64px, 11vw, 160px)',
          lineHeight: 0.9, letterSpacing: '-0.025em',
          margin: 0, color: 'var(--ink)', fontWeight: "700"
        }}>{title}</h2>
      </div>
      {caption &&
      <div style={{
        fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--fg-3)', paddingBottom: 18
      }}>{caption}</div>
      }
    </div>);

}

/* ---------- About ---------- */
const EXPERIENCE = [
{ company: 'Pangolin', role: 'UX Researcher Intern', period: '2025.03 –\n2026.02' },
{ company: 'Logitech', role: 'Industrial Design Intern', period: '2024.03 – 2024.07' }];


const EDUCATION = [
{ label: 'M.Sc. HCI · TH Augsburg', period: '2025 – Now' },
{ label: 'Exchange Student · Eindhoven University of Technology', period: '2024.09 – 2025.02' },
{ label: 'B.S. Industrial Design · NTUST', period: '2020 – 2024' }];


const SKILLS = [
'UX Research', 'User Interviews', 'Usability Testing', 'Affinity Mapping',
'Survey Design', 'Qualitative Analysis', 'Figma', 'Prototyping',
'Interaction Design', 'Industrial Design', 'Physical Products', 'E-Textile',
'HCI', 'Design Research', 'Sketching', '3D Modeling'];


function AboutSection() {
  return (
    <section id="about" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(120px, 16vh, 200px)', fontWeight: "400"
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', lineHeight: "1.5" }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64,
          alignItems: 'start'
        }}>
          {/* Left column — title + bio */}
          <div>
            {/* Display heading */}
            <div style={{
              fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(72px, 10vw, 140px)',
              lineHeight: 0.88, letterSpacing: '-0.02em',
              color: 'var(--ink)', marginBottom: 52
            }}>About</div>
            <div style={{
              fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-3)', marginBottom: 18
            }}>The short version</div>

            <p style={{
              fontFamily: "Archivo, sans-serif",
              fontSize: 19, lineHeight: 1.55, color: 'var(--fg-2)',
              maxWidth: 540, margin: '0 0 20px 0'
            }}>
              <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>HCI master's student</strong> at TH Augsburg
              with a background in <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>industrial design</strong>.
              I've interned at <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>Logitech</strong> on the
              mechanical engineering team, and worked as a <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>UX researcher</strong> at
              an outdoor gear startup — designing interview protocols, analyzing qualitative data, and
              translating findings into actionable insights for designers and PMs.
            </p>


            {/* CV button */}
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px',
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', borderRadius: 0,
              fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              textDecoration: 'none'
            }}>View CV <span>↗</span></a>
          </div>

          {/* Right column — experience + education + skills */}
          <div>
            {/* Experience timeline */}
            <div>
              <div style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-3)', marginBottom: 18
              }}>Experience</div>
              <div style={{ borderTop: '1px solid var(--hairline)' }}>
                {EXPERIENCE.map((e) => <Row key={e.company} {...e} />)}
              </div>
            </div>

            {/* Education */}
            <div style={{ marginTop: 56 }}>
              <div style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-3)', marginBottom: 18
              }}>Education</div>
              <div style={{ borderTop: '1px solid var(--hairline)' }}>
                {EDUCATION.map((a) =>
                <div key={a.label} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  alignItems: 'baseline', gap: 16,
                  padding: '14px 0', borderBottom: '1px solid var(--hairline)'
                }}>
                    <div style={{
                    fontFamily: "Archivo, sans-serif",
                    fontSize: 16, color: 'var(--ink)', fontWeight: "700"
                  }}>{a.label}</div>
                    <div style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--fg-3)'
                  }}>{a.period}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: 56 }}>
              <div style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-3)', marginBottom: 18
              }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SKILLS.map((s) =>
                <span key={s} className="capsule" style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  letterSpacing: '0.02em'
                }}>{s}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function Row({ company, role, period }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 110px',
      alignItems: 'baseline', columnGap: 16,
      padding: '18px 0', borderBottom: '1px solid var(--hairline)'
    }}>
      <div>
        <div style={{
          fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
          fontSize: 22, color: 'var(--ink)', lineHeight: 1.1,
          letterSpacing: '-0.01em', fontWeight: "700"
        }}>{company}</div>
        <div style={{
          fontFamily: "Archivo, sans-serif",
          fontSize: 14, color: 'var(--fg-3)', marginTop: 4
        }}>{role}</div>
      </div>
      <div style={{
        fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--fg-3)', textAlign: 'right', whiteSpace: 'pre-line'
      }}>{period}</div>
    </div>);

}

/* ---------- Contact ---------- */
function ContactSection() {
  const socials = [
  { label: 'Email', value: 'babalimao5244@gmail.com', href: 'mailto:babalimao5244@gmail.com' },
  { label: 'LinkedIn', value: 'linkedin.com/in/yu-ching-lin', href: '#' },
  { label: 'Behance', value: 'behance.net/yu-ching-lin', href: '#' }];

  return (
    <section id="contact" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(200px, 40vh, 400px)',
      paddingBottom: 96
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', marginBottom: 24
        }}>Get in touch</div>

        {/* Display heading */}
        <h2 style={{
          fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(96px, 18vw, 280px)',
          lineHeight: 0.85, letterSpacing: '-0.025em',
          margin: 0, color: 'var(--ink)'
        }}>Let's talk !</h2>

        {/* Single baseline row: capsules left, socials right */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24,
          marginTop: 52,
          borderTop: '1px solid var(--hairline)',
          paddingTop: 28
        }}>
          {/* Left: status capsules */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="capsule capsule--eyebrow">
              <span className="dot" /> Open to Werkstudent / Internship
            </span>
            <span className="capsule capsule--eyebrow">Replies within 24h</span>
          </div>

          {/* Right: social links in a row */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {socials.map((s) =>
            <a key={s.label} href={s.href} style={{
              fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--fg-3)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'color 180ms ease'
            }}>
              {s.label} <span style={{ fontSize: 13 }}>↗</span>
            </a>
            )}
          </div>
        </div>

      </div>
    </section>);

}

/* ---------- Scroll indicator ---------- */
function ScrollIndicator() {
  return (
    <div style={{
      position: 'fixed', right: 18, top: '50%',
      transform: 'translateY(-50%)',
      writingMode: 'vertical-rl',
      fontFamily: 'Archivo, sans-serif', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--fg-3)',
      zIndex: 30, pointerEvents: 'none'
    }}>SCROLL ↓</div>);

}

/* =============================================================
   Tweaks — three expressive controls
   ============================================================= */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "cream",
  "voice": "bold",
  "pulse": 60,
  "hover": "lift"
} /*EDITMODE-END*/;

const TWEAK_CSS = `
/* MOOD ─ palette presets ────────────────────────────── */
html.tw-mood-cream { /* default — already in design system */ }
html.tw-mood-noir {
  --paper:#1D1E27; --paper-deep:#25262F;
  --ink:#EDF2F4; --ink-2:#C0C4CB; --ink-3:#7A7E85; --ink-4:#4B4E53;
  --hairline:rgba(237,242,244,0.14); --capsule-border:rgba(237,242,244,0.25);
  --accent-green:#C80018;
}
html.tw-mood-lab {
  --paper:#F4F3EE; --paper-deep:#E9E7DE;
  --ink:#0F0F11; --ink-2:#3A3A40; --ink-3:#6F6E72; --ink-4:#A6A4A8;
  --hairline:rgba(15,15,17,0.12); --capsule-border:rgba(15,15,17,0.22);
  --accent-green:#2A6FDB;
}
html.tw-mood-cream body, html.tw-mood-noir body, html.tw-mood-lab body { background: var(--paper); color: var(--ink); }

/* VOICE ─ typographic character ─────────────────────── */
html.tw-voice-editorial h1,
html.tw-voice-editorial h2,
html.tw-voice-editorial h3 {
  font-family: Archivo, sans-serif !important;
  font-weight: 600 !important;
  font-style: italic !important;
  letter-spacing: -0.018em !important;
  line-height: 0.98 !important;
}
html.tw-voice-editorial #top h1 { font-size: clamp(72px, 13vw, 200px) !important; }
html.tw-voice-editorial section h2 { font-size: clamp(56px, 9vw, 132px) !important; }
html.tw-voice-editorial .t-eyebrow,
html.tw-voice-editorial [style*="textTransform"][style*="uppercase"] {
  text-transform: none !important;
  letter-spacing: 0.02em !important;
}

html.tw-voice-hushed h1,
html.tw-voice-hushed h2,
html.tw-voice-hushed h3 {
  font-family: "Archivo", "Helvetica Neue", Helvetica, sans-serif !important;
  font-weight: 500 !important;
  letter-spacing: -0.012em !important;
  line-height: 1.02 !important;
}
html.tw-voice-hushed #top h1 { font-size: clamp(56px, 8.5vw, 130px) !important; font-weight: 600 !important; }
html.tw-voice-hushed section h2 { font-size: clamp(44px, 6.5vw, 96px) !important; font-weight: 600 !important; }
html.tw-voice-hushed h3 { font-weight: 600 !important; }
html.tw-voice-hushed .capsule { letter-spacing: 0.02em !important; }

html.tw-mood-lab body { -webkit-font-smoothing: antialiased; }

/* HOVER ─ expressive interaction temperament ─────── */
html[class*="tw-hover-"] .capsule,
html[class*="tw-hover-"] #contact a,
html[class*="tw-hover-"] nav a {
  transition: transform 380ms cubic-bezier(.22,1,.36,1),
              box-shadow 380ms cubic-bezier(.22,1,.36,1),
              background 280ms cubic-bezier(.22,1,.36,1),
              color 280ms cubic-bezier(.22,1,.36,1),
              letter-spacing 320ms cubic-bezier(.22,1,.36,1),
              opacity 280ms cubic-bezier(.22,1,.36,1) !important;
}

html.tw-hover-subtle .capsule:hover {
  background: transparent !important;
  color: var(--ink) !important;
  opacity: 0.55;
}

html.tw-hover-lift .capsule:hover {
  background: var(--ink) !important;
  color: var(--paper) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(14,14,12,0.12);
}
html.tw-hover-lift #contact a:hover {
  transform: translateX(6px);
  opacity: 1;
}

html.tw-hover-magnetic .capsule:hover {
  background: var(--ink) !important;
  color: var(--paper) !important;
  transform: scale(1.12);
  letter-spacing: 0.08em !important;
  box-shadow: 0 0 0 4px rgba(14,14,12,0.06);
}
html.tw-hover-magnetic #contact a:hover {
  transform: scale(1.015);
  letter-spacing: 0.01em;
  opacity: 1;
}
html.tw-hover-magnetic nav a:hover {
  letter-spacing: 0.22em !important;
  opacity: 1 !important;
}
`;

/* ---------- App ---------- */
function Portfolio() {
  const [dark, setDark] = useState(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const route = useRoute();

  // Mood + Voice + Hover → classes on <html>; Pulse → CSS vars
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('tw-mood-cream', 'tw-mood-noir', 'tw-mood-lab');
    html.classList.add(`tw-mood-${t.mood}`);
    html.classList.remove('tw-voice-bold', 'tw-voice-editorial', 'tw-voice-hushed');
    html.classList.add(`tw-voice-${t.voice}`);
    html.classList.remove('tw-hover-subtle', 'tw-hover-lift', 'tw-hover-magnetic');
    html.classList.add(`tw-hover-${t.hover}`);
    html.setAttribute('data-theme', t.mood === 'noir' ? 'dark' : dark ? 'dark' : 'light');
  }, [t.mood, t.voice, t.hover, dark]);

  useEffect(() => {
    const html = document.documentElement;
    const p = Math.max(0, Math.min(100, t.pulse));
    const duration = p === 0 ? '0s' : `${Math.round(180 - p / 100 * 174)}s`;
    html.style.setProperty('--marquee-duration', duration);
    html.style.setProperty('--marquee-state', p === 0 ? 'paused' : 'running');
    const revealMs = p === 0 ? 0 : Math.round(1100 - p / 100 * 750);
    html.style.setProperty('--reveal-duration', `${revealMs}ms`);
  }, [t.pulse]);

  const isNoir = t.mood === 'noir';

  // ── Detail view routing ──
  if (route.page === 'detail') {
    const project = PROJECTS.find((p) => p.slug === route.slug);
    return (
      <div>
        <style>{TWEAK_CSS}</style>
        <PortfolioNav dark={isNoir || dark} onToggleDark={() => setDark((d) => !d)} />
        {project
          ? <ProjectDetailView project={project} />
          : (
            <div style={{ padding: 'clamp(100px,14vh,160px) var(--gutter) 96px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Archivo, sans-serif', color: 'var(--fg-3)' }}>Project not found.</p>
              <a href="#work">← Back to work</a>
            </div>
          )
        }
      </div>
    );
  }

  // ── Home view ──
  return (
    <div>
      <style>{TWEAK_CSS}</style>
      <PortfolioNav dark={isNoir || dark} onToggleDark={() => setDark((d) => !d)} />
      <ScrollIndicator />
      <main>
        <Hero />
        <WorkSection />
        <AboutSection />
        <ContactSection />
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Mood" />
        <TweakRadio
          label="Palette"
          value={t.mood}
          options={['cream', 'noir', 'lab']}
          onChange={(v) => setTweak('mood', v)} />

        <TweakSection label="Voice" />
        <TweakRadio
          label="Type"
          value={t.voice}
          options={['bold', 'editorial', 'hushed']}
          onChange={(v) => setTweak('voice', v)} />

        <TweakSection label="Pulse" />
        <TweakSlider
          label="Energy"
          value={t.pulse}
          min={0} max={100} step={1}
          onChange={(v) => setTweak('pulse', v)} />

        <TweakSection label="Hover" />
        <TweakRadio
          label="Feel"
          value={t.hover}
          options={['subtle', 'lift', 'magnetic']}
          onChange={(v) => setTweak('hover', v)} />
      </TweaksPanel>
    </div>);

}

Object.assign(window, { Portfolio });
