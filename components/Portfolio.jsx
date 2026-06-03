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
        fontSize: 'clamp(100px, 18vw, 280px)',
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
      background: dark ? 'rgba(10,10,10,0.55)' : 'rgba(255,255,255,0.55)',
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
        }}>UX/UI · INDUSTRIAL DESIGNER · PORTFOLIO '26

        </div>

        {/* Display name — particle canvas */}
        <ParticleText text="Nicole Lin" />

        {/* Intro row */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          marginTop: 56
        }}>
          {/* Status pills column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
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
  period: '2023.05 – 2024.04',
  org: 'Graduation Thesis · Taiwan Textile Federation',
  title: 'Mere',
  blurb: 'A smart nursing bra with integrated heating/cooling e-textile that lets breastfeeding mothers relieve engorgement on their own — backed by a 32-person survey and 14 in-depth interviews.',
  tags: ['UX Research', 'E-Textile', 'Mixed Methods', 'Wearable', 'Product Design'],
  insight: 'n=32 survey · n=14 interviews · 3 interaction opportunities',
  doodle: 'textile',
  images: {
    hero: {
      label: 'Hero image — Mere nursing bra',
      note: 'Clean product shot: worn in context or hero render. 16:9 or 4:3, no text overlaid.',
    },
  },
  // ── Case study detail ──
  role: 'Two-person graduation project in collaboration with the Taiwan Textile Federation. I led the UX research and product design — designing the interview and survey instruments, analyzing both qualitative and quantitative data, designing the physical form, and building the 3D models.',
  overview: 'Breastfeeding mothers face engorgement and blocked ducts that traditional warm-compress tools relieve slowly and awkwardly — often needing a second person to help. Mere is a smart nursing bra with integrated e-textile that delivers heating and cooling therapy, paired with a companion-app concept, so a mother can complete the whole routine on her own.',
  concept: {
    tagline: 'Feel the care. Cherish your moment.',
    text: 'Mere is a smart nursing bra that integrates e-textile technology, designed specifically for postpartum mothers.',
    formula: ['Nursing Bra', 'E-Textile', 'Temperature Control'],
    result: 'A smoother breastfeeding process',
  },
  problem: 'Existing relief methods — hot towels, manual massage, standalone warmers — are slow, messy, and hard to manage one-handed while caring for a newborn. Mothers described feeling helpless when no one was around to help. We needed to understand the real pain points before designing a wearable solution.',
  contextImage: {
    label: 'Context — the current routine',
    note: 'Traditional warm-compress tools / breastfeeding context. Wide shot, no text.',
  },
  methods: [
    'Survey (n=32)',
    'In-depth Interviews (n=14)',
    'Mixed-Methods Analysis',
    'Thematic Analysis',
    'Affinity Mapping',
    'Usability Testing (n=3)',
    '3D Modeling',
    'Physical Prototyping',
  ],
  methodsImages: [
    { label: 'Affinity mapping', note: 'Interview insights clustered into themes.' },
    { label: 'Research process', note: 'Survey + interview flow, or session photos.' },
  ],
  findings: [
    {
      title: '75% of mothers suffer from breastfeeding pain',
      description: 'Pain from engorgement and blocked ducts was near-universal and recurring, yet relief depended on slow, separate rituals.',
      design: 'Built thermal therapy directly into a wearable, so relief is always on-hand rather than a separate task.',
    },
    {
      title: '42% are frustrated by inconvenient cold/hot compress tools',
      description: 'Existing tools were described as slow, messy, and two-handed — hard to use while holding a newborn.',
      design: 'Integrated the heating e-textile into the bra so the whole routine is hands-free and self-operable — no second person needed.',
    },
    {
      title: '64% want soft materials and an easy-to-clean product',
      description: 'Comfort and hygiene ranked alongside function: mothers would not wear something stiff or hard to wash daily.',
      design: 'Selected skin-friendly e-textile and a construction that separates the electronics from a washable fabric layer.',
    },
  ],
  scopeNote: 'Mothers raised several needs — heating, cooling, and EMS massage. Under project time constraints we prioritized the most-cited need, thermal care, and scoped the final physical prototype around heating and cooling.',
  findingsChart: {
    label: 'Survey results chart (n=32)',
    note: 'Bar / percentage chart you lay out manually: 75% breastfeeding pain · 42% inconvenient compress tools · 64% want soft, easy-clean materials.',
  },
  designImages: [
    { label: 'Heating e-textile layer', note: 'The integrated thermal textile, up close.' },
    { label: 'Front-zipper access', note: 'Self-operable opening for the heating pad.' },
    { label: 'Washable construction', note: 'Electronics separated from the fabric layer.' },
  ],
  product: {
    text: 'Mere weaves a soft heating-and-cooling circuit directly into the fabric of a nursing bra. The whole system is a set: the bra itself, a pair of detachable thermal pads, and a small clip-on controller — designed so a mother can run her own warm- or cold-compress routine without separate tools or a second person.',
    features: [
      'Temperature-controlled heating & cooling',
      'Machine-washable fabric layer',
      'App-based session tracking',
    ],
    setImage: { label: 'The Mere set', note: 'Flat-lay of the full set: bra, thermal pads, and controller. Clean shot, no text.' },
  },
  anatomy: {
    title: 'The heating / cooling pad',
    text: 'The thermal pad is the heart of the system. A heating-alloy thread is woven across a hydrogel core, then sealed inside a soft textile layer that sits gently against the skin. Skin-friendly velcro lets the pad attach and detach for washing.',
    parts: [
      { name: 'Heating alloy thread', desc: 'Conductive thread that warms evenly across the pad surface.' },
      { name: 'Hydrogel core', desc: 'Holds and spreads warmth — and chills for cold compress.' },
      { name: 'Skin-friendly velcro', desc: 'Attaches and detaches the pad for washing and swapping.' },
      { name: 'Soft textile layer', desc: 'Sits gently against sensitive skin during a session.' },
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
    text: 'A full routine moves through three short stages — warm to encourage flow, breastfeed, then cool to soothe. Each thermal stage runs only a few minutes, so the whole cycle fits inside a single feed.',
    steps: [
      { name: 'Hot · 40°C', desc: 'Warm compress for 5–15 min to ease engorgement and encourage flow.' },
      { name: 'Breastfeed', desc: 'Feed the baby with the warmed, softened breast.' },
      { name: 'Cold · 15°C', desc: 'Cold compress for 15 min to reduce swelling and soothe.' },
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
    text: 'A companion-app concept lets mothers run a session, log it in about 15 minutes, and watch the live temperature. A skin-sensitivity alert — drawn from secondary research (literature review) — warns if a side runs too warm during compression. The app was designed as part of the system; it was not engineered into a working build.',
    images: [
      { label: 'App concept — Splash', note: 'Opening / welcome screen.' },
      { label: 'App concept — Care history', note: 'Past sessions, ~15-min logs.' },
      { label: 'App concept — Live session', note: 'Live temperature, e.g. 25°C.' },
      { label: 'App concept — Alert', note: 'Skin-sensitivity reminder (Left / Right side).' },
    ],
  },
  userTesting: {
    setup: 'Usability testing with 3 mothers — one who had taken part in the development interviews (informed) and two with no prior knowledge of the design. Each completed the heating routine independently.',
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
    { label: '新一代設計展 booth', note: 'Exhibition stand where the public tried the smart textile.' },
    { label: 'Final product — worn', note: 'Clean shot of the finished bra in context.' },
    { label: '3D render', note: 'Product render / construction breakdown.' },
  ],
  reflection: 'Testing surfaced that physical ergonomics — zipper range, dial sensitivity, control placement — mattered as much as the core thermal function, and were only visible once mothers used the product unaided. With more time I would run a second iteration addressing these issues and expand scope to the cooling and EMS needs we deprioritized.',
},
{
  idx: '02',
  slug: 'gallery-conversations',
  period: '2025',
  org: 'TH Augsburg · Master Thesis',
  title: 'Conversations in the gallery',
  blurb: "An interactive installation studying how shared touch surfaces help museum visitors break the ice and exchange thoughts about what they’re seeing.",
  tags: ['HCI', 'Interactive Installation', 'Field Study', 'Qual Analysis'],
  insight: '12 visitor pairs · 4 weeks in situ · 38 interviews',
  doodle: 'museum',
  // ── Case study detail ──
  overview: 'Museums are inherently social spaces, yet most visitors experience them in isolation — moving quietly from piece to piece without engaging with strangers around them. This thesis project explores whether a shared physical interface embedded in an exhibition could lower the social barrier enough for visitors to start talking about what they see.',
  problem: 'Visitor engagement research consistently shows that people who discuss artworks during a visit retain more, feel more, and return more often. But the typical museum experience offers no designed invitation to connect. The research question: can a shared tactile surface create the social permission to speak?',
  methods: [
    'Contextual Observation (4 gallery sites)',
    'Field Study (4 weeks in situ)',
    'Participatory Installation Design',
    'Semi-structured Exit Interviews (n=38)',
    'Video Interaction Analysis',
    'Thematic Coding (MAXQDA)',
  ],
  findings: [
    {
      title: 'Shared touch is a stronger conversation trigger than shared looking',
      description: 'Pairs who interacted with the touch surface together began verbal exchanges in a median of 11 seconds. Pairs who stood next to each other without the surface rarely spoke at all (median: no conversation in observed window).',
    },
    {
      title: 'The surface creates "social permission" — not conversation content',
      description: 'Interviews revealed that the installation didn\'t give people something to say — it gave them a reason to start saying it. "It felt okay to turn and talk because we were already doing something together" appeared as a theme across 24 of 38 interviews.',
    },
    {
      title: 'Children are disproportionately powerful conversation initiators',
      description: 'In 8 of 12 multi-generational pairs, a child\'s interaction with the surface prompted an adult to engage — both with the installation and verbally. This unexpected finding has implications for family exhibit design.',
    },
  ],
  outcome: 'The installation ran across two gallery contexts over 4 weeks, generating 38 post-interaction interviews and over 6 hours of video data. Findings directly inform the thesis argument: that ambient social affordances, not explicit prompts, are the more durable path to visitor connection. The thesis is in submission at TH Augsburg.',
},
{
  idx: '03',
  slug: 'tent-returns',
  period: '2025 – Now',
  org: 'Pangolin · Outdoor Gear',
  title: 'Why people return a tent',
  blurb: 'Designed interview protocols and ran 22 long-form sessions with returning customers. Translated raw transcripts into a return-reason taxonomy used by Design + PM.',
  tags: ['UX Research', 'Interviews', 'Affinity Mapping', 'Survey Design'],
  insight: '22 interviews · 9 themes · 1 product roadmap',
  doodle: 'tent',
  // ── Case study detail ──
  overview: 'Pangolin\'s tent line had a return rate nearly double the industry average, but the existing data — mostly one-line customer service notes — couldn\'t explain why. As the UX researcher on the team, I designed and ran a qualitative study to build the first structured picture of return motivations, then translated findings into a taxonomy the design and product teams could actually use.',
  problem: 'Customer service logs attributed most returns to "product defect" or "didn\'t meet expectations" — categories too broad to act on. Designers were guessing at the root cause. Product was under pressure to reduce returns without knowing what was driving them. The study needed to surface the real, specific reasons behind the label.',
  methods: [
    'Interview Protocol Design',
    'Screener Survey (n=140, 22 selected)',
    'Semi-structured Interviews (60–90 min each)',
    'Live Transcript Review',
    'Affinity Mapping (Miro)',
    'Thematic Coding (3-pass, independent coder for reliability)',
    'Follow-up Survey (n=68) to validate taxonomy',
  ],
  findings: [
    {
      title: 'Assembly is the stated reason; frustration is the real one',
      description: '"Too complicated to set up" appeared in 17 of 22 interviews — but follow-up probing revealed the frustration was emotional, not cognitive. Participants who returned tents described feeling embarrassed in front of family or partners. Solving the assembly problem alone wouldn\'t solve the return problem.',
    },
    {
      title: '"It rained through" is a proxy complaint for inadequate onboarding',
      description: 'Six participants reported water ingress as their reason for returning. Four of those six had not seam-sealed their tent — a step clearly documented in the manual but never demonstrated. The product wasn\'t failing; the handoff from purchase to first use was.',
    },
    {
      title: 'Solo campers return at 3× the rate of group campers — a previously invisible segment',
      description: 'Cross-tabulating return rate by party size revealed a clean pattern: solo campers returned at 29% vs. 9% for groups. Solo users have no one to help troubleshoot or divide setup tasks. This segment had never been explicitly designed for.',
    },
  ],
  outcome: 'The 9-theme return taxonomy is now the shared language between Customer Service, Design, and PM. One finding — the solo camper segment — directly influenced the tent line\'s next roadmap cycle, prompting a feature brief for a new "solo-first" setup system. The study is ongoing with a follow-up cohort planned for post-season.',
},
{
  idx: '04',
  slug: 'inside-the-hinge',
  period: '2024',
  org: 'Logitech · Mech Eng Intern',
  title: 'Inside the hinge',
  blurb: 'Spent four months on the mechanical engineering team prototyping hinge mechanisms for a new peripheral. CAD by day, paper mockups by night.',
  tags: ['Industrial Design', '3D Modeling', 'Prototyping', 'Mechanical'],
  insight: '17 hinge iterations · 3 finalists · 1 user test',
  doodle: 'hinge',
  // ── Case study detail ──
  overview: 'A four-month internship embedded in Logitech\'s mechanical engineering team, focused on a single design problem: the hinge mechanism of an unreleased peripheral. The existing design was the leading cause of warranty returns in the product category. My role spanned concept generation, CAD prototyping, and user testing of the three finalist mechanisms.',
  problem: 'The hinge mechanism in the incumbent design was failing under normal use — but the failure mode wasn\'t understood. Returns came in with vague complaints ("it broke") that masked whether the issue was material fatigue, geometry, or user behavior. Before designing a better hinge, we needed to understand what was actually going wrong and why.',
  methods: [
    'Competitive Product Teardown (8 products)',
    'Failure Mode Analysis (SEM imaging of returned units)',
    'Sketch Ideation (200+ concepts across 3 sessions)',
    'Paper Mockup Prototyping (early ideation)',
    'CAD Modeling — Fusion 360 (16 digital variants)',
    'FDM Rapid Prototyping (11 physical prints)',
    'Structured User Test (n=12, 3 finalist mechanisms)',
  ],
  findings: [
    {
      title: 'The failure was fatigue fracture at a predictable stress concentration — not user misuse',
      description: 'SEM imaging of 9 returned units showed fracture initiation at the same point in all cases: a sharp internal radius that concentrated stress under repeated bending. The design was the cause, not the user. This reframed the entire brief from "user education" to "geometry change."',
    },
    {
      title: 'Users apply 2.4× more force than the design load specification assumed',
      description: 'Force logging during user testing revealed that participants consistently exceeded the design\'s assumed load — particularly during one-handed opening. The spec had been based on two-handed operation, which no participant used spontaneously. Designing to spec was designing for a behavior that didn\'t exist.',
    },
    {
      title: 'Paper mockups outperformed CAD for finding the right open angle in ideation',
      description: 'In the first two weeks, spending 30 minutes with folded paper and tape produced more actionable angle and geometry feedback than two days of CAD iteration. Physical interaction revealed ergonomic truths that screen-based review consistently missed.',
    },
  ],
  outcome: 'Three finalist mechanisms were fabricated and user tested. The winning design eliminated the stress concentration point by moving to a swept radius geometry, and was rated significantly more comfortable in one-handed opening by 10 of 12 participants. The prototype was handed off to the senior mechanical engineer for production tolerance analysis.',
},
{
  idx: '05',
  slug: 'soft-circuits',
  period: '2024',
  org: 'TU Eindhoven · Exchange',
  title: 'Soft circuits, softer skin',
  blurb: 'An e-textile exploration of capacitive touch on knitted surfaces. Stitched, tested, broke things. Wrote a small zine about the failures.',
  tags: ['E-Textile', 'Physical Products', 'Speculative', 'Wearable'],
  insight: '6 samples · 2 working prototypes · 1 zine',
  doodle: 'textile',
  // ── Case study detail ──
  overview: 'A semester-long speculative design project at TU Eindhoven exploring whether capacitive touch sensing can be integrated into everyday knitted textiles without making them feel or look like technology. The project ended with two working prototypes and a zine documenting every failure in detail — the failures were the most useful output.',
  problem: 'Wearable technology interaction is still dominated by rigid input paradigms: buttons, touchscreens, pressure sensors under silicone. The tactile richness of textiles — softness, stretch, texture — is treated as a problem to work around rather than a material property to design with. The question: what happens when the circuit is the knit?',
  methods: [
    'Materials Literature Review (e-textile research, 2018–2024)',
    'Conductive Thread Sampling (12 thread types)',
    'Knit Gauge Variation Experiments',
    'Capacitive Threshold Measurement (Arduino)',
    'Wash & Wear Durability Testing',
    'Failure Documentation (photography + written log)',
    'Zine Production (risograph, TU Eindhoven print lab)',
  ],
  findings: [
    {
      title: 'Knit tension is the hidden variable — a 10% gauge change shifts capacitive threshold by ~40%',
      description: 'Consistent sensing requires consistent tension, but knitting is inherently variable — especially by hand. Machine-knit samples performed significantly better than hand-knit for repeatability. This finding alone rules out mass customization unless tension can be mechanically controlled.',
    },
    {
      title: 'Conductive thread oxidizes and loses conductivity after 30–40 wash cycles',
      description: 'All six sample types showed measurable resistance increase after 40 wash cycles at 30°C. Two failed completely. Silver-coated threads degraded faster than stainless steel blends. The conclusion: current e-textile materials cannot survive a normal garment lifespan without either replacement or encapsulation — neither of which is compatible with soft-feel design.',
    },
    {
      title: 'The most expressive material combinations were always the least reliable',
      description: 'The samples that felt most like "real" textiles — soft, drapey, skin-friendly — were consistently the least electrically stable. The materials hierarchy for fashion and the hierarchy for electronics are nearly inverted. Resolving this is the core unsolved problem of the field.',
    },
  ],
  outcome: 'Two working prototypes survived the full test sequence: a glove with gesture detection and a scarf with proximity sensing. The zine — 24 pages, risograph-printed — documented every failed sample with its failure mode, material spec, and one-sentence lesson. 60 copies were distributed at TU Eindhoven\'s semester show. Three copies were requested by the e-textile research lab for their methods library.',
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
        background: 'var(--paper-deep)',
        border: '1.5px solid var(--ink)',
        borderRadius: 6,
        aspectRatio: '4 / 3',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: `rotate(${rotate}deg)`,
        transition: 'transform 380ms cubic-bezier(.22,1,.36,1), box-shadow 380ms cubic-bezier(.22,1,.36,1)',
        boxShadow: hover ?
        '8px 10px 0 var(--ink)' :
        '4px 5px 0 var(--ink)',
        outline: 'none'
      }}>

      {/* Resting state — doodle + title */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '20px 22px 22px',
        transition: 'opacity 260ms ease, transform 380ms cubic-bezier(.22,1,.36,1)',
        opacity: hover ? 0 : 1,
        transform: hover ? 'translateY(-8px)' : 'translateY(0)'
      }}>
        {/* Top label row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--ink)'
        }}>
          <span>№ {p.idx}</span>
          <span>{p.period}</span>
        </div>
        {/* Doodle fills the middle */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 8px 0' }}>
          <Doodle kind={p.doodle} />
        </div>
        {/* Handwritten-style title */}
        <div style={{
          fontFamily: "Archivo, sans-serif",
          fontStyle: 'italic', fontWeight: 600,
          fontSize: 'clamp(20px, 2.4vw, 28px)',
          lineHeight: 1.1, color: 'var(--ink)',
          marginTop: 10
        }}>{p.title}</div>
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
          color: 'rgba(239,233,221,0.6)', marginBottom: 14
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
          color: 'rgba(239,233,221,0.82)',
          margin: '0 0 14px 0'
        }}>{p.blurb}</p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {p.tags.map((t) =>
          <span key={t} style={{
            padding: '4px 10px',
            border: '1px solid rgba(239,233,221,0.4)',
            borderRadius: 9999,
            fontFamily: 'Archivo, sans-serif',
            fontSize: 10.5, fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'rgba(239,233,221,0.9)',
            whiteSpace: 'nowrap'
          }}>{t}</span>
          )}
        </div>

        {/* Insight pinned to bottom */}
        <div style={{
          marginTop: 'auto', paddingTop: 14,
          borderTop: '1px dashed rgba(239,233,221,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(239,233,221,0.78)', textTransform: 'uppercase'
        }}>
          <span>{p.insight}</span>
          <span style={{ fontSize: 14 }}>View case study ↗</span>
        </div>
      </div>
    </article>);
}

/* ---------- Image placeholder (dashed box w/ label) ---------- */
function ImagePlaceholder({ label, note, aspectRatio = '4 / 3', height }) {
  return (
    <div style={{
      border: '1.5px dashed var(--fg-4, var(--ink))',
      borderRadius: 6,
      background: 'var(--paper-deep)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: 24, textAlign: 'center',
      aspectRatio: height ? undefined : aspectRatio,
      height: height || undefined,
      minHeight: 140,
      color: 'var(--fg-3)'
    }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.6" />
        <path d="M21 16 L15 11 L7 19" />
      </svg>
      <div style={{
        fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)'
      }}>{label}</div>
      {note && <div style={{
        fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.45,
        color: 'var(--fg-3)', maxWidth: 320
      }}>{note}</div>}
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
        <ImagePlaceholder key={i} label={im.label} note={im.note} aspectRatio={aspectRatio} />
      ))}
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

  return (
    <main style={{ paddingTop: 'clamp(100px, 14vh, 160px)', paddingBottom: 96 }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)' }}>

        {/* ── Back link ── */}
        <a href="#work" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', textDecoration: 'none', marginBottom: 56
        }}>← Selected Work</a>

        {/* ── Hero: eyebrow + title + tags ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ ...eyebrow, marginBottom: 16 }}>
            {project.org} · {project.period}
          </div>
          <h1 style={{
            fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(52px, 9vw, 128px)',
            lineHeight: 0.9, letterSpacing: '-0.025em',
            margin: '0 0 36px 0', color: 'var(--ink)'
          }}>{project.title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {project.tags.map((tag) => (
              <span key={tag} className="capsule">{tag}</span>
            ))}
          </div>
        </div>

        {/* ── Hero visual ── */}
        {project.images && project.images.hero ? (
          <div style={{ marginBottom: project.role ? 56 : 80 }}>
            <ImagePlaceholder
              label={project.images.hero.label}
              note={project.images.hero.note}
              height={'clamp(280px, 42vw, 520px)'}
            />
          </div>
        ) : (
          <div style={{
            border: '1.5px solid var(--ink)',
            borderRadius: 6,
            height: 'clamp(240px, 36vw, 420px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 80,
            background: 'var(--paper-deep)',
            boxShadow: '6px 8px 0 var(--ink)',
            overflow: 'hidden'
          }}>
            <div style={{ width: 320, height: 240 }}>
              <Doodle kind={project.doodle} />
            </div>
          </div>
        )}

        {/* ── My Role ── */}
        {project.role && (
          <div style={{ marginBottom: 80 }}>
            <div style={eyebrow}>My Role</div>
            <p style={bodyText}>{project.role}</p>
          </div>
        )}

        {/* ── Two-col: overview + by the numbers ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
          gap: 'clamp(40px, 8vw, 96px)',
          marginBottom: 80,
          alignItems: 'start'
        }}>
          <div>
            <div style={eyebrow}>Overview</div>
            <p style={bodyText}>{project.overview}</p>
          </div>
          <div>
            <div style={eyebrow}>By the numbers</div>
            <div style={{
              fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
              fontWeight: 700, fontSize: 17,
              color: 'var(--ink)', lineHeight: 1.7,
              letterSpacing: '-0.01em'
            }}>{project.insight}</div>
          </div>
        </div>

        {/* ── Concept ── */}
        {project.concept && (
          <div style={{ marginBottom: 80 }}>
            <div style={eyebrow}>Concept</div>
            {project.concept.tagline && (
              <p style={{
                fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
                fontWeight: 700, fontStyle: 'italic',
                fontSize: 'clamp(24px, 4vw, 38px)',
                color: 'var(--ink)', lineHeight: 1.15,
                letterSpacing: '-0.01em', margin: '0 0 20px'
              }}>“{project.concept.tagline}”</p>
            )}
            {project.concept.text && (
              <p style={{ ...bodyText, marginBottom: project.concept.formula ? 28 : 0 }}>{project.concept.text}</p>
            )}
            {project.concept.formula && project.concept.formula.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                {project.concept.formula.map((part, i) => (
                  <React.Fragment key={part}>
                    {i > 0 && (
                      <span style={{
                        fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                        fontSize: 16, color: 'var(--fg-3)'
                      }}>+</span>
                    )}
                    <span className="capsule">{part}</span>
                  </React.Fragment>
                ))}
                {project.concept.result && (
                  <React.Fragment>
                    <span style={{
                      fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                      fontSize: 16, color: 'var(--fg-3)'
                    }}>=</span>
                    <span style={{
                      fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                      fontSize: 13, letterSpacing: '0.02em',
                      color: 'var(--paper)', background: 'var(--ink)',
                      padding: '8px 16px', borderRadius: 999, whiteSpace: 'nowrap'
                    }}>{project.concept.result}</span>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>
        )}

        {project.contextImage && (
          <div style={{ marginBottom: 80 }}>
            <ImagePlaceholder
              label={project.contextImage.label}
              note={project.contextImage.note}
              height={'clamp(240px, 34vw, 420px)'}
            />
          </div>
        )}

        <hr className="rule" />

        {/* ── The Problem ── */}
        {project.problem && (
          <div style={{ marginBottom: 80 }}>
            <div style={eyebrow}>The Problem</div>
            <p style={bodyText}>{project.problem}</p>
          </div>
        )}

        <hr className="rule" />

        {/* ── Research Methods ── */}
        {project.methods && project.methods.length > 0 && (
          <div style={{ marginBottom: 80 }}>
            <div style={eyebrow}>Research Methods</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.methods.map((m) => (
                <span key={m} className="capsule">{m}</span>
              ))}
            </div>
            {project.methodsImages && project.methodsImages.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <ImageGrid images={project.methodsImages} minCol={240} aspectRatio={'4 / 3'} />
              </div>
            )}
          </div>
        )}

        <hr className="rule" />

        {/* ── Key Findings ── */}
        {project.findings && project.findings.length > 0 && (
          <div style={{ marginBottom: 80 }}>
            <div style={eyebrow}>Key Findings</div>
            <div>
              {project.findings.map((f, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  gap: 24,
                  padding: '28px 0',
                  borderBottom: '1px solid var(--hairline)'
                }}>
                  {/* Number */}
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                    fontSize: 13, letterSpacing: '0.08em',
                    color: 'var(--fg-4)', paddingTop: 4
                  }}>0{i + 1}</div>
                  {/* Content */}
                  <div>
                    <div style={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700, fontSize: 18,
                      color: 'var(--fg-1)', lineHeight: 1.3,
                      marginBottom: 10
                    }}>{f.title}</div>
                    <p style={{
                      fontFamily: "Archivo, sans-serif",
                      fontSize: 16, lineHeight: 1.6,
                      color: 'var(--fg-2)', margin: 0
                    }}>{f.description}</p>
                    {f.design && (
                      <div style={{
                        marginTop: 14,
                        display: 'flex', gap: 12,
                        padding: '12px 16px',
                        background: 'var(--paper-deep)',
                        borderRadius: 6,
                        borderLeft: '3px solid var(--ink)'
                      }}>
                        <span style={{
                          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'var(--ink)', whiteSpace: 'nowrap', paddingTop: 3
                        }}>Design →</span>
                        <span style={{
                          fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.55,
                          color: 'var(--fg-1)'
                        }}>{f.design}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {project.scopeNote && (
              <p style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6,
                color: 'var(--fg-3)', margin: '24px 0 0', maxWidth: 680, fontStyle: 'italic'
              }}>{project.scopeNote}</p>
            )}
            {project.findingsChart && (
              <div style={{ marginTop: 36 }}>
                <ImagePlaceholder
                  label={project.findingsChart.label}
                  note={project.findingsChart.note}
                  height={'clamp(220px, 30vw, 340px)'}
                />
              </div>
            )}
            {project.designImages && project.designImages.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ ...eyebrow, marginBottom: 18 }}>From research to form</div>
                <ImageGrid images={project.designImages} minCol={220} aspectRatio={'4 / 3'} />
              </div>
            )}
          </div>
        )}

        <hr className="rule" />

        {/* ── The Product ── */}
        {project.product && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>The Product</div>
              <p style={{ ...bodyText, marginBottom: project.product.features ? 24 : 28 }}>{project.product.text}</p>
              {project.product.features && project.product.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: project.product.setImage ? 36 : 0 }}>
                  {project.product.features.map((f) => (
                    <span key={f} className="capsule">{f}</span>
                  ))}
                </div>
              )}
              {project.product.setImage && (
                <ImagePlaceholder
                  label={project.product.setImage.label}
                  note={project.product.setImage.note}
                  height={'clamp(240px, 34vw, 420px)'}
                />
              )}
            </div>
            <hr className="rule" />
          </div>
        )}

        {/* ── Anatomy: heating / cooling pad ── */}
        {project.anatomy && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>{project.anatomy.title || 'Anatomy'}</div>
              <p style={{ ...bodyText, marginBottom: 36 }}>{project.anatomy.text}</p>
              {project.anatomy.parts && project.anatomy.parts.length > 0 && (
                <div style={{ marginBottom: project.anatomy.images ? 36 : 0 }}>
                  {project.anatomy.parts.map((p, i) => (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 0.4fr) minmax(0, 1fr)',
                      gap: 24,
                      padding: '16px 0',
                      borderBottom: '1px solid var(--hairline)'
                    }}>
                      <div style={{
                        fontFamily: 'Archivo, sans-serif', fontWeight: 700,
                        fontSize: 15, color: 'var(--fg-1)'
                      }}>{p.name}</div>
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
            <hr className="rule" />
          </div>
        )}

        {/* ── Controller ── */}
        {project.controller && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>The Controller</div>
              <p style={{ ...bodyText, marginBottom: project.controller.features ? 24 : 28 }}>{project.controller.text}</p>
              {project.controller.features && project.controller.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: project.controller.images ? 36 : 0 }}>
                  {project.controller.features.map((f) => (
                    <span key={f} className="capsule">{f}</span>
                  ))}
                </div>
              )}
              {project.controller.images && project.controller.images.length > 0 && (
                <ImageGrid images={project.controller.images} minCol={240} aspectRatio={'4 / 3'} />
              )}
            </div>
            <hr className="rule" />
          </div>
        )}

        {/* ── How It Works ── */}
        {project.usage && (
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
                      borderRadius: 8,
                      padding: '20px 22px',
                      background: 'var(--paper-deep)'
                    }}>
                      <div style={{
                        fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
                        fontWeight: 700, fontSize: 22,
                        color: 'var(--ink)', marginBottom: 8,
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
            <hr className="rule" />
          </div>
        )}

        {/* ── Companion App (concept) ── */}
        {project.appConcept && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>Companion App — Concept</div>
              <p style={{ ...bodyText, marginBottom: 28 }}>{project.appConcept.text}</p>
              {project.appConcept.images && project.appConcept.images.length > 0 && (
                <ImageGrid images={project.appConcept.images} minCol={160} aspectRatio={'9 / 16'} maxWidth={740} />
              )}
            </div>
            <hr className="rule" />
          </div>
        )}

        {/* ── User Testing ── */}
        {project.userTesting && (
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
            <hr className="rule" />
          </div>
        )}

        {/* ── Outcome ── */}
        {project.outcome && (
          <div style={{ marginBottom: project.reflection ? 80 : 96 }}>
            <div style={eyebrow}>Outcome</div>
            <p style={{ ...bodyText, marginBottom: project.outcomeImages ? 28 : 0 }}>{project.outcome}</p>
            {project.outcomeImages && project.outcomeImages.length > 0 && (
              <ImageGrid images={project.outcomeImages} minCol={240} aspectRatio={'4 / 3'} />
            )}
          </div>
        )}

        {/* ── Reflection ── */}
        {project.reflection && (
          <div>
            <hr className="rule" />
            <div style={{ marginBottom: 96, marginTop: 80 }}>
              <div style={eyebrow}>Reflection</div>
              <p style={bodyText}>{project.reflection}</p>
            </div>
          </div>
        )}

        {/* ── Next Project ── */}
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

      </div>
    </main>
  );
}

/* ---------- Work section ---------- */
function WorkSection() {
  const tilts = [-1.6, 1.2, -0.8, 1.8];
  const onOpen = (slug) => { window.location.hash = `work/${slug}`; };
  return (
    <section id="work" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(120px, 16vh, 200px)'
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <SectionHeader eyebrow="Sketchbook" title="Work" caption={`${PROJECTS.length} projects · 2024 – 2026`} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 40,
          marginTop: 32,
          paddingBottom: 24
        }}>
          {PROJECTS.map((p, i) => <ProjectCard key={p.idx} p={p} rotate={tilts[i % tilts.length]} onOpen={onOpen} />)}
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
        <SectionHeader eyebrow="My story" title="About" />

        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 96,
          marginTop: 64, alignItems: 'start'
        }}>
          {/* Left column — bio + experience */}
          <div>
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

            <p style={{
              fontFamily: "Archivo, sans-serif",
              fontSize: 19, lineHeight: 1.55, color: 'var(--fg-2)',
              maxWidth: 540, margin: '0 0 40px 0'
            }}>
              <strong style={{ fontWeight: 700, color: "var(--fg-1)" }}>My current research</strong>{' '}
              explores how interactive installations help museum visitors exchange ideas
              and build social connections.
            </p>

            {/* CV button */}
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px',
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', borderRadius: 9999,
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
      marginTop: 'clamp(120px, 18vh, 220px)',
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

        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 64,
          marginTop: 64, alignItems: 'start'
        }}>
          {/* Email + intro */}
          <div>
            <div style={{ marginTop: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="capsule capsule--eyebrow">
                <span className="dot" /> Open to Werkstudent / Internship
              </span>
              <span className="capsule capsule--eyebrow">REPLIES WITHIN 24H</span>
            </div>
          </div>

          {/* Social list */}
          <div style={{ borderTop: '1px solid var(--hairline)' }}>
            {socials.map((s) =>
            <a key={s.label} href={s.href} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              alignItems: 'baseline', gap: 16,
              borderBottom: '1px solid var(--hairline)',
              textDecoration: 'none', color: 'var(--ink)', width: "300px", opacity: "1", padding: "15px 0px 20px"
            }}>
                <div style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--fg-3)'
              }}>{s.label}</div>
                <div style={{ fontSize: 16, color: 'var(--fg-3)' }}>↗</div>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 96, paddingTop: 32,
          borderTop: '1px solid var(--hairline)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)'
        }}>
          <span>© NICOLE LIN · 2024 – 2026</span>
          <span>Designed in Augsburg · Set in Big Shoulders & Source Serif</span>
          <span>Last updated April '26</span>
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
  --paper:#0A0A0A; --paper-deep:#1A1A1A;
  --ink:#F0F0F0; --ink-2:#C8C8C8; --ink-3:#8C8C8C; --ink-4:#5C5C5C;
  --hairline:rgba(240,240,240,0.14); --capsule-border:rgba(240,240,240,0.25);
  --accent-green:#8C8C8C;
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
