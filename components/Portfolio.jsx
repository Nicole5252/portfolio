/* @jsx React.createElement */
const { useState, useEffect, useRef } = React;

/* =============================================================
   RESPONSIVE — narrow-viewport hook (stacks fixed grids ≤720px)
   ============================================================= */
function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return narrow;
}

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
      padding: '12px clamp(12px, 3vw, 22px)',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 3.5vw, 28px)' }}>
        {items.map((it) =>
        <a key={it.name} href={it.href} style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--ink)', textDecoration: 'none'
        }}>{it.name}</a>
        )}
        <button onClick={onToggleDark} aria-label="Toggle dark mode" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px clamp(8px, 2vw, 14px)', marginLeft: 'clamp(0px, 1vw, 6px)',
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

/* ---------- Ink blur — soft blurred ink blob that trails the cursor (hero background) ---------- */
function InkBlur() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    let x = null, y = null, tx = null, ty = null;
    let last = null; // last drawn state, for theme-change redraws

    const inkRgb = () => {
      const hex = (getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#141414');
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const draw = (cx, cy, radius, alpha) => {
      last = { cx, cy, radius, alpha };
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = inkRgb();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')');
      grad.addColorStop(0.55, 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.4) + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };
    const restingBlob = () => draw(w * 0.72, h * 0.42, Math.min(w, h) * 0.55, 0.10);
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (last) draw(last.cx, last.cy, last.radius, last.alpha); else restingBlob();
    };
    resize();
    window.addEventListener('resize', resize);

    // Redraw with the new ink colour when the theme flips
    const themeObs = new MutationObserver(() => { if (last) draw(last.cx, last.cy, last.radius, last.alpha); });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let cleanupMove = null;
    if (fine && !reduced) {
      const loop = () => {
        raf = requestAnimationFrame(() => {
          raf = 0;
          x += (tx - x) * 0.09; y += (ty - y) * 0.09;
          draw(x, y, 240, 0.12);
          if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) loop();
        });
      };
      const onMove = (e) => {
        const r = canvas.getBoundingClientRect();
        tx = e.clientX - r.left; ty = e.clientY - r.top;
        if (x === null) { x = tx; y = ty; }
        if (!raf) loop();
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanupMove = () => window.removeEventListener('pointermove', onMove);
    }
    return () => {
      if (cleanupMove) cleanupMove();
      window.removeEventListener('resize', resize);
      themeObs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ---------- Shape blur — React Bits ShapeBlur (VAR 0), ported for no-build + global THREE ----------
   Source: reactbits.dev/animations/shape-blur. Changes from upstream: global THREE instead of
   import, u_color uniform (ink token, follows theme) instead of hardcoded white. */
const SHAPE_BLUR_VERT = `
varying vec2 v_texcoord;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_texcoord = uv;
}`;
const SHAPE_BLUR_FRAG = `
varying vec2 v_texcoord;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform vec3 u_color;
uniform float u_shapeSize;
uniform float u_roundness;
uniform float u_borderSize;
uniform float u_circleSize;
uniform float u_circleEdge;

#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef VAR
#define VAR 0
#endif

vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
        p.x *= u_resolution.x / u_resolution.y;
        p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
    } else {
        p.y *= u_resolution.y / u_resolution.x;
        p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
    }
    p -= 0.5;
    p *= vec2(-1.0, 1.0);
    return p;
}
#define st0 coord(gl_FragCoord.xy)
#define mx coord(u_mouse * u_pixelRatio)

float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}
float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}
float aastep(float threshold, float value) {
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}
float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}
float strokeAA(float x, float size, float w, float edge) {
    float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
    float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
            - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

void main() {
    vec2 st = st0 + 0.5;
    vec2 posMouse = mx * vec2(1., -1.) + 0.5;
    float sdfCircle = fill(sdCircle(st, posMouse), u_circleSize, u_circleEdge);
    /* circle stroke variant (upstream VAR 2) */
    float sdf = sdCircle(st, vec2(0.5));
    sdf = strokeAA(sdf, 0.58, 0.02, sdfCircle) * 4.0;
    gl_FragColor = vec4(u_color, sdf);
}`;

function ShapeBlurRB({ pixelRatioProp = 2, shapeSize = 1.2, roundness = 0.4, borderSize = 0.05, circleSize = 0.3, circleEdge = 0.5 }) {
  const mountRef = React.useRef(null);
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof THREE === 'undefined') return;

    let active = true;
    let animationFrameId;
    let time = 0, lastTime = 0;

    const vMouse = new THREE.Vector2();
    const vMouseDamp = new THREE.Vector2();
    const vResolution = new THREE.Vector2();
    let w = 1, h = 1;

    const inkColor = () => new THREE.Color(
      (getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#141414')
    );

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: SHAPE_BLUR_VERT,
      fragmentShader: SHAPE_BLUR_FRAG,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: pixelRatioProp },
        u_color: { value: inkColor() },
        u_shapeSize: { value: shapeSize },
        u_roundness: { value: roundness },
        u_borderSize: { value: borderSize },
        u_circleSize: { value: circleSize },
        u_circleEdge: { value: circleEdge }
      },
      defines: { VAR: 0 },
      transparent: true
    });

    const quad = new THREE.Mesh(geo, material);
    scene.add(quad);

    const onPointerMove = (e) => {
      // Map the full viewport onto the shape's space: the interaction follows the
      // mouse from anywhere on the page — no proximity needed, never a static circle.
      const rect = mount.getBoundingClientRect();
      vMouse.set(
        (e.clientX / window.innerWidth) * rect.width,
        (e.clientY / window.innerHeight) * rect.height
      );
    };
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('pointermove', onPointerMove);

    const resize = () => {
      if (!active) return;
      w = mount.clientWidth; h = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      camera.left = -w / 2; camera.right = w / 2;
      camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      quad.scale.set(w, h, 1);
      vResolution.set(w, h).multiplyScalar(dpr);
      material.uniforms.u_pixelRatio.value = dpr;
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(() => { if (active) resize(); });
    ro.observe(mount);

    const themeObs = new MutationObserver(() => {
      material.uniforms.u_color.value = inkColor();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const update = () => {
      if (!active) return;
      time = performance.now() * 0.001;
      const dt = time - lastTime;
      lastTime = time;
      ['x', 'y'].forEach((k) => {
        vMouseDamp[k] = THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 8, dt);
      });
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(update);
    };
    update();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
      themeObs.disconnect();
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('pointermove', onPointerMove);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [pixelRatioProp, shapeSize, roundness, borderSize, circleSize, circleEdge]);
  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

/* ---------- Hero field — original ShapeBlur when possible, static ink blob otherwise ---------- */
function HeroField() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasThree = typeof THREE !== 'undefined';
  if (fine && !reduced && hasThree) {
    return (
      <div aria-hidden="true" style={{
        position: 'absolute', zIndex: 0, pointerEvents: 'none',
        top: '50%', transform: 'translateY(-52%)', right: 'var(--gutter)',
        width: 'min(42vw, 600px)', aspectRatio: '1 / 1'
      }}>
        <ShapeBlurRB />
      </div>
    );
  }
  return <InkBlur />;
}

/* ---------- Custom cursor — ink dot, ring on interactive hover ---------- */
function CustomCursor() {
  const dotRef = React.useRef(null);
  React.useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-custom-cursor');
    const move = (e) => {
      const d = dotRef.current; if (!d) return;
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      const hit = e.target && e.target.closest && e.target.closest('a, button, [role="button"], article');
      d.classList.toggle('cursor--hover', !!hit);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);
  return (
    <React.Fragment>
      <style>{`
        .has-custom-cursor, .has-custom-cursor * { cursor: none !important; }
        .custom-cursor {
          position: fixed; top: -100px; left: -100px; width: 8px; height: 8px;
          border-radius: 50%; background: var(--ink); border: 1.5px solid transparent;
          transform: translate(-50%, -50%); pointer-events: none; z-index: 9999;
          transition: width 160ms ease, height 160ms ease, background 160ms ease, border-color 160ms ease;
        }
        .custom-cursor.cursor--hover { width: 26px; height: 26px; background: transparent; border-color: var(--ink); }
        @media (pointer: coarse) { .custom-cursor { display: none; } }
      `}</style>
      <div ref={dotRef} className="custom-cursor" aria-hidden="true" />
    </React.Fragment>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section id="top" style={{
      position: 'relative', overflow: 'hidden',
      minHeight: '100svh', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'clamp(120px, 16vh, 180px)',
      paddingBottom: 'clamp(40px, 6vh, 72px)',
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)'
    }}>
      <HeroField />
      <div style={{
        maxWidth: 'var(--maxw)', margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
        flex: 1, display: 'flex', flexDirection: 'column'
      }}>
        {/* Eyebrow — name */}
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--fg-3)', marginBottom: 28
        }}>Nicole · Yu Ching Lin</div>

        {/* Display title — left half; right half stays open for the ink-blur field */}
        <h1 style={{
          fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800,
          fontSize: 'clamp(72px, 12vw, 190px)', lineHeight: 0.88, letterSpacing: '-0.02em',
          margin: 0, color: 'var(--ink)', maxWidth: '68%', minWidth: 300
        }}>UX &amp; Product<br />Design</h1>

        {/* Masthead baseline row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: 40,
          marginTop: 'auto', paddingTop: 48
        }}>
          {/* Left: role descriptor */}
          <p style={{
            margin: 0, maxWidth: 360,
            fontFamily: 'Archivo, sans-serif', fontSize: 17, lineHeight: 1.5,
            color: 'var(--fg-2)', letterSpacing: '-0.005em'
          }}>Research-led design across wearables, interfaces, and the physical products in between.</p>
          {/* Right: location, plain text */}
          <span style={{
            fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)',
            whiteSpace: 'nowrap'
          }}>Munich · Augsburg</span>
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
  thumb: 'assets/mere/thumb-main.jpg',
  period: '2023.05 – 2024.04',
  org: 'Graduation Thesis · Taiwan Textile Federation',
  context: 'A smart nursing bra for relieving breast engorgement at home.',
  title: 'Mere',
  blurb: 'Integrated heating/cooling e-textile lets breastfeeding mothers manage engorgement on their own terms — and every design decision traces back to a specific finding, from an 18-person survey, 5 interviews, and a 3-user test.',
  tags: ['UX Research', 'Product Design', 'Wearable'],
  insight: 'n=18 survey · n=5 interviews · every decision evidence-traced',
  doodle: 'textile',
  images: {
    hero: {
      label: 'Hero image — Mere nursing bra',
      note: 'Clean product shot: worn in context or hero render. 16:9 or 4:3, no text overlaid.',
      src: 'assets/mere/hero-main.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Two-person graduation project. I led UX research and physical product design — interview design, survey, thematic analysis, and prototyping; my teammate led branding and vendor liaison with the Taiwan Textile Federation.',
  overview: 'Mere is a smart nursing bra with integrated e-textile that delivers heating and cooling therapy, so a mother can manage breastfeeding engorgement on her own. The validated prototype was exhibited at Taiwan’s Young Designers’ Exhibition.',
  concept: {
    tagline: 'Feel the care. Cherish your moment.',
    text: 'Mère is a smart nursing bra that integrates e-textile technology, designed specifically for postpartum mothers.',
    formula: ['Nursing Bra', 'E-Textile', 'Temperature Control'],
    result: 'A smoother breastfeeding process',
  },
  problemLabel: 'Postpartum care almost always centers the baby — Mère asks who is caring for the mother.',
  problem: 'In the postpartum period, milk engorgement and blocked ducts during breastfeeding often cause breast pain and make nursing difficult. Left unaddressed, this physical discomfort can build into emotional stress — and, in some cases, contribute to postpartum depression.',
  problemImage: { src: 'assets/mere/problem.jpg', label: 'Postpartum breastfeeding' },
  methods: [
    'Survey (n=18)',
    'In-depth Interviews (n=5)',
    'Thematic Analysis',
    'Usability Testing (n=3)',
    'Physical Prototyping',
  ],
  researchMethods: [
    {
      name: 'Method 01',
      title: 'Survey',
      meta: 'n=18',
      purpose: "To understand mothers' most pressing pain points and needs after birth, gather feedback on our initial feature concepts, and learn which features they'd want in the app — results quantified in the findings below.",
    },
    {
      name: 'Method 02',
      title: 'Interviews',
      meta: 'n=5',
      purpose: "After narrowing the focus to hot- and cold-compress therapy, to study mothers' habits and the friction points they hit throughout that routine — synthesised into the pain points below.",
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
  findingsIntro: 'Across the survey and interviews, mothers described the same physical and emotional strain. Engorgement pain was near-universal, and existing relief routines were slow, two-handed, and hard to manage alone with a newborn — every design decision below traces back to one of these three findings.',
  findings: [
    {
      title: '13 of 18 suffer engorgement pain and poor milk flow — F1',
      description: 'F1 — Engorgement pain was near-universal, and mothers often breastfeed alone for privacy, unable to care for the baby and prepare relief tools at the same time.',
      design: 'F1 → Thermal therapy built into the garment — always on-hand, not a separate task.',
    },
    {
      title: '10 of 18 want a smoother hot- & cold-compress routine — F2',
      description: 'F2 — Existing tools are slow, messy, and two-handed — hard to use holding a newborn.',
      design: 'F2 → Heating e-textile in the bra makes the routine hands-free and self-operable.',
    },
    {
      title: '14 of 18 want an easy-to-store, easy-to-use compress product — F3',
      description: 'F3 — Comfort and hygiene ranked alongside function — nothing stiff or hard to wash.',
      design: 'F3 → Skin-friendly e-textile with electronics that detach from a washable layer.',
    },
  ],
  product: {
    text: 'Scoped to thermal care first. Mère is a complete set: the bra, thermal pads, and a clip-on controller — designed so a mother can run warm- or cold-compress therapy without separate tools, and without help.',
    features: [
      'Temperature-controlled heating & cooling',
      'Machine-washable fabric layer (F3)',
      'App-based session tracking',
    ],
    images: [
      { src: 'assets/mere/intro-0.jpg', label: 'Mère — full set' },
      { src: 'assets/mere/detail-2.jpg', label: 'Mère — worn, opening the pad pocket' },
      { src: 'assets/mere/detail-1.jpg', label: 'Mère — worn in context, nursing' },
      { src: 'assets/mere/detail-3.jpg', label: 'Mère — fabric detail' },
      { src: 'assets/mere/detail-4.jpg', label: 'Mère — material swatches' },
    ],
  },
  app: {
    text: 'A companion app visualises live temperature, logs each care session, and alerts mothers when a side runs too warm — a system concept, not an engineered build, that helps prevent inflammation.',
    images: [
      { src: 'assets/mere/app-1.jpg', label: 'Mère app' },
      { src: 'assets/mere/app-2.jpg', label: 'Mère app' },
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
      { src: 'assets/mere/intro-1.jpg', label: 'Pad construction — exploded view and in-bra detail' },
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
      { src: 'assets/mere/intro-2.jpg', label: 'Controller — detail and wash sequence' },
    ],
  },
  usage: {
    text: 'Three stages — warm to encourage flow, breastfeed, then cool to soothe.',
    image: { src: 'assets/mere/usage-process.jpg', label: 'Usage process — warm compress, breastfeed, cold compress' },
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
  },
  designDirection: {
    intro: 'How might we turn engorgement relief into something a mother can do alone, on the spot, with both hands free? Mothers raised several needs — heating, cooling, and EMS massage — and time constraints meant choosing one.',
    opportunities: [
      {
        title: 'Pressure Guidance',
        signal: 'Incorrect massage force is a key cause of physical pain — textile pressure sensors could give real-time feedback.',
        opportunity: 'Not pursued — added hardware complexity beyond project scope.',
      },
      {
        title: 'Embodied Interaction',
        signal: 'Care happens directly on the body — the bra itself can become the hands-free interface.',
        opportunity: 'Chosen: built hot/cold thermal care into the garment.',
      },
      {
        title: 'App Breastfeeding Tracking',
        signal: 'Care is easy to lose track of, and inflammation escalates fast.',
        opportunity: 'Chosen: an app logs sessions and flags abnormal temperature early.',
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
  context: 'User research behind the next iteration of two convertible carry bags.',
  title: 'Pangolin',
  blurb: 'Working solo, I designed, ran, and analysed 25 sample-feedback interviews — turning four-quadrant audience studies and region-by-region teardowns into prioritised recommendations for PM and designers.',
  tags: ['UX Research', 'Mixed Methods', 'Industry'],
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
  problem: 'Both carry products were entering a second iteration. Rather than redesigning parts, the brief was to interrogate the audience model and the product bets behind it — before any feature was touched. The findings changed real decisions: on the convertible bag, the interviews showed the secondary "toiletry-bag" positioning did not survive real use across almost every segment, and the team dropped it to refocus on the core small ↔ large convertible use case.',
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
        image: { label: 'Per-segment analysis (Regular Overnighter shown)', src: 'assets/pangolin/segments.jpg' },
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
          { name: 'Daily Commuter', before: 15, after: 15, reason: 'Weight unchanged — but it behaves almost identically to Refined Men & Women, so I flagged it to redefine or merge.' },
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
    intro: 'Running the same analysis pipeline twice — across two different products — taught me as much about how to research as about the products themselves.',
    points: [
      { title: 'Curation over completeness', text: 'The most-mentioned finding is not always the most important one. I learned to weigh each signal against brand positioning, development cost, and design potential before assigning priority — some low-frequency observations unlocked higher-value directions than majority opinions did.' },
      { title: 'Cross-disciplinary judgment as a research tool', text: 'Carrying product design, development, and business lenses alongside UX let me evaluate each finding for feasibility and brand fit, not just user value. That cross-disciplinary view is what turned raw interview data into recommendations stakeholders could act on directly.' },
      { title: 'AI collaboration requires a designed protocol', text: 'Unstructured AI use introduced two failure modes I had to design around: inconsistent extraction standards across team members, and AI stripping context to reach surface-level conclusions. I built a fixed extraction framework — defined criteria first, AI for aggregation, then my own review for context integrity. The second run was markedly faster because the protocol already existed.' },
      { title: 'Precision is a communication skill', text: 'From a PM review after the first report, I learned that vague synthesis language creates ambiguity for anyone without full interview context. I moved to Must / Should / Nice-to-have ratings and colour-coded segments to make priority legible at a glance. Precise wording matters as much as precise findings — a single imprecise term can shift how a team interprets a recommendation.' },
      { title: 'What I’d do differently', text: 'Both the extraction protocol and the Must / Should / Nice-to-have framework were built reactively — after the first product’s report exposed the gap. Next time I’d design the AI-extraction protocol and the priority-rating scale before round one, so the phone-carry study started with the same rigor the convertible bag only reached on its second pass.' },
    ],
  },
},
{
  idx: '03',
  slug: 'voice-shell',
  // Glow-gold sampled from the shell's lit rim — warm, deepened so it stays legible on paper.
  accent: '#C8920E',
  period: '2026.03 – 2026.04',
  org: 'HCI Project',
  context: 'An interactive gallery installation where strangers exchange voice notes about art.',
  title: 'Speaking Shell',
  blurb: 'Glowing shells placed in front of paintings — you pick one up, hear what someone else felt looking at the same artwork, and leave your own.',
  tags: ['Exploratory Research', 'Interaction Design', 'HCI'],
  insight: 'n=10 interviews · 5 visitor types · 3 design iterations',
  doodle: 'museum',
  thumb: 'assets/voice-shell/cover-thumb.jpg',
  images: {
    hero: {
      label: 'Hero — listening to a shell, and speaking into one',
      note: 'Lead with a hand sketch or the AI spatial scene. 16:9 or 4:3, no text overlaid.',
      src: 'assets/voice-shell/cover-hero.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Four-person team (2026.03 – 2026.04). I led the design and interview analysis, concept ideation, the web prototype, and defining the interaction model.',
  overview: 'Speaking Shell is a physical interaction for museums: a set of glowing shells set on the floor in front of an artwork, each holding one anonymous visitor’s spoken reaction to that same piece. You pick a shell up, hold it to your ear to hear a stranger, then open one to leave your own voice for whoever comes next. It turns looking — normally silent and one-directional — into an anonymous, asynchronous exchange between visitors.',
  concept: {
    tagline: 'Pick one up, listen, and leave yours.',
  },
  problemLabel: 'Visitors never hear each other',
  problem: 'In a gallery, people have rich, private reactions to what they see — and almost no way to share them, or to hear anyone else’s. The experience stays one-directional: visitor and artwork, never visitor and visitor. The most interesting layer of a show — how other people read the same painting — vanishes silently the moment they walk away.',
  problemImage: { src: 'assets/voice-shell/problem.jpg', label: 'Visitors viewing alone — reactions stay private' },
  researchMethods: [
    {
      name: 'Phase 01',
      title: 'Interviews',
      meta: 'n=10',
      purpose: 'Semi-structured interviews at a hair-themed art exhibition in Munich — covering memorable works, what visitors thought about while looking, their interest in others’ views, and their willingness to share.',
      images: [
        { label: 'Interview — participant at exhibition', src: 'assets/voice-shell/interview-01.jpg' },
        { label: 'Interview — note-taking and probing', src: 'assets/voice-shell/interview-02.jpg' },
      ],
    },
    {
      name: 'Phase 02',
      title: 'Observation',
      meta: 'on-site',
      purpose: 'Watched how visitors actually moved through the show — where they paused, how long they lingered, and whether they reacted to one another — to ground the interview accounts in real behaviour.',
      images: [
        { label: 'Observation — visitor movement at artwork', src: 'assets/voice-shell/observation-01.jpg' },
        { label: 'Observation — lingering and pausing behaviour', src: 'assets/voice-shell/observation-02.jpg' },
      ],
    },
    {
      name: 'Phase 03',
      title: 'Synthesis',
      meta: 'qual',
      purpose: 'Affinity mapping clustered the quotes into 6 themes; from these I built 5 visitor types and a four-lens curiosity framework (Empathic, Epistemic, Social Comparison, Hedonic), grounded in Proxemic Interaction literature.',
      images: [
        { label: 'Curiosity framework', src: 'assets/voice-shell/synthesis-01.jpg' },
        { label: 'Visitor persona map', src: 'assets/voice-shell/synthesis-02.jpg' },
      ],
    },
    {
      name: 'Phase 04',
      title: 'Workshop',
      meta: '15+ concepts',
      purpose: 'A team workshop analysed two artworks, gathered live reactions, and tested ways to share — writing, speaking, recording, bodily interaction — sketching 15+ interface concepts.',
      images: [
        { label: 'Workshop — Crazy 8 sketches', src: 'assets/voice-shell/workshop-01.jpg' },
        { label: 'Workshop — reactions wall', src: 'assets/voice-shell/workshop-02.jpg' },
      ],
    },
  ],
  findingsIntro: 'The interviews pointed one direction: visitors are hungry to hear each other, but reluctant to speak — and what moves them is personal, not aesthetic.',
  findings: [
    { title: '7 of 10 want to hear a stranger’s thoughts on the same artwork' },
    { title: '3 of 10 would share — but only if it’s anonymous and quick' },
    { title: '10 of 10 connected to a work through personal experience or their own view — not its beauty' },
  ],
  insightGroups: {
    intro: 'Across interviews, observation and the workshop, seven insights held — four about the visitor, three about the interaction.',
    groups: [
      {
        label: 'About the visitor',
        items: [
          { title: 'People want to listen, rarely to speak', text: 'Curiosity about others is near-universal; the will to contribute is not.' },
          { title: 'Anonymity is the price of honesty', text: 'Visitors open up only when nothing is tied back to them.' },
          { title: 'Speed is the price of participation', text: 'Anything that feels slow or effortful gets skipped.' },
          { title: 'Personal experience beats expertise', text: 'What resonates is a memory or a feeling, not art-historical knowledge.' },
        ],
      },
      {
        label: 'About the interaction',
        items: [
          { title: 'Curiosity needs a trigger to become action', text: 'Interest alone stays passive until something invites the first move.' },
          { title: 'Voice carries what text loses', text: 'A spoken reaction holds a connection that written words flatten.' },
          { title: 'Proximity is more natural than instruction', text: 'Visitors respond to nearness and presence faster than to signage.' },
        ],
      },
    ],
  },
  howMightWe: [
    'How might we let a visitor share a reaction in under a minute — anonymously and effortlessly?',
    'How might we preserve the emotional connection in a reaction — the part plain text flattens?',
    'How might we turn a visitor’s curiosity into a first move — without telling them what to do?',
  ],
  designEvolution: {
    intro: 'Three iterations, each failing in a way that defined the next.',
    iterations: [
      {
        name: 'Phone booth + headphones',
        what: 'A central booth to record in; headphones beside each work played reactions back.',
        verdictType: 'dropped',
        verdict: 'Severed from the artwork — the feeling happened at the painting, the recording somewhere else.',
      },
      {
        name: 'Interactive blocks',
        what: 'Several blocks per artwork: pick up to listen, shake to switch, squeeze to record.',
        verdictType: 'dropped',
        verdict: 'Too many objects — visual clutter and choice overload pulled attention off the work.',
      },
      {
        name: 'Speaking Shell',
        what: 'A flip-open shell on the floor in front of the work — eight fixed shells, an intuitive gesture, two self-explaining states.',
        verdictType: 'kept',
        verdict: 'Eight stays calm, the gesture needs no instruction, the states explain themselves — all in the artwork’s space.',
      },
    ],
  },
  product: {
    text: 'The final object is a palm-sized, flip-open shell in frosted translucent polycarbonate. A solid dome in the lid holds an LED; light bleeds through the frosted surface and escapes brightest through a ring of holes around the rim. The bowl underneath has a mic-and-speaker mesh at its centre. It opens and closes like a clamshell — or a powder compact.',
    features: [
      'Frosted polycarbonate, palm-sized',
      'Flip-open clamshell gesture',
      'LED glow through a perforated rim',
      'Mic + speaker in one object',
    ],
    images: [
      { label: 'Vizcom product render', src: 'assets/voice-shell/object.jpg', note: 'The shell, lit. Use the Vizcom render here.' },
      { label: 'AI spatial scene', note: 'The shells in a gallery, in front of an artwork. AI-generated scene.' },
    ],
  },
  principles: [
    { label: 'Anonymous', text: 'Voice only — no identity, no login, no trace. The record button holds no name.' },
    { label: 'Fast', text: 'Under a minute from pick-up to set-down. Anything that feels slow gets skipped.' },
    { label: 'Curiosity attraction', text: 'Within a metre the shells whisper. A hand nearing one triggers a glow. Proximity does the inviting — no sign needed.' },
  ],
  designSpec: {
    images: [
      { src: 'assets/voice-shell/howitworks-01.jpg' },
      { src: 'assets/voice-shell/howitworks-02.jpg' },
      { src: 'assets/voice-shell/howitworks-03.jpg' },
      { src: 'assets/voice-shell/howitworks-04.jpg' },
      { src: 'assets/voice-shell/howitworks-05.jpg' },
      { src: 'assets/voice-shell/howitworks-06.jpg' },
    ],
  },
  userTesting: {
    participants: 'n=6',
    method: 'Structured observation + think-aloud (2026.06). Brief concept intro → two shell-state images + questions → TouchDesigner-simulated proximity and recording interaction with a physical low-fi prototype.',
    rqs: [
      'Which shell attracts the visitor first?',
      'Do visitors understand the full interaction flow?',
    ],
    positives: [
      '4 of 6 reached for the closed shell first — mystery drives the first move, which matches the intended entry point (closed = listen).',
      'The two-state concept landed after a short explanation — the logic is coherent once heard.',
      'Emotional response was positive: hearing a stranger was described as surprising and personal.',
    ],
    negatives: [
      '0 of 6 interacted independently — the museum "don\'t touch" norm suppressed spontaneous action entirely.',
      'No shared convention for closed → listen / open → record: participants split evenly between matching and reversing the mapping; shape alone cannot carry it.',
      'Recording discoverability is low: only 1 of 5 found the record function unaided — an explicit cue (icon, colour, audio) is required.',
      'Privacy concern (2 of 6): participants wanted to know exactly when recording started and whether the voice was saved.',
    ],
  },
  // Reflection removed 2026-07-20 (user decision): Reflection now runs on Pangolin only.
},
{
  idx: '04',
  slug: 'texttune',
  // Muted blue sampled from the TextTune prototype's accent — distinct from the site's red so
  // the product's own brand colour reads correctly in the interface screenshots.
  accent: '#5E7A94',
  period: '2026.05 – 2026.07',
  org: 'HCI Research Project',
  context: 'A reading tool that adapts each paragraph to how difficult it feels.',
  title: 'TextTune',
  blurb: 'Text is flat, but reading never is. TextTune zooms a text like a map — from 5% mind-map to 150% original with margin notes — tuning each paragraph to how difficult it feels, on a difficulty instrument I built.',
  tags: ['UX Research', 'Prototyping', 'HCI'],
  insight: '5-dimension rubric · 3 readers × 2 genres · consensus vs. personal difficulty',
  doodle: 'textile',
  thumb: 'assets/texttune/texttune-cover-01b.jpg',
  images: {
    hero: {
      label: 'Hero — TextTune',
      note: '',
      src: 'assets/texttune/texttune-cover-02c.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Three-person HCI research team. I designed the difficulty instrument, analysed the multi-reader results, and built and tested the prototype.',
  concept: {
    tagline: 'Tune the text, not the reader.',
  },
  // ── Opening hero beats — the one deliberate exception to standard-field rendering
  //    (user-decided Option B, 2026-07-15): two large-type beats + the product
  //    definition line, shown right after the hero image, before the standard sections.
  //    Every other section below uses the same fields/renderer as the other case pages.
  texttuneOpening: {
    lines: [
      'A text ships in one version.',
      'But a reader shows up in a hundred states',
      '— different background, different day, different paragraph.',
    ],
    productLine: "TextTune adapts a text's presentation paragraph by paragraph — from 5% to 150% — based on how difficult each paragraph actually feels.",
  },
  // The Problem section is retired (2026-07-16 polish pass) — its intro text now
  // opens Building the Instrument via the generic researchMethodsIntro field
  // (new, renderer-supported below; unset on every other project so they're unaffected).
  // methodsLabel keeps the instrument-design framing for the section heading.
  methodsLabel: 'Building the Instrument',
  researchMethodsIntro: 'Before any interface, the text had to become measurable. I built a five-dimension rubric — Lexical, Syntactic/Stance, Propositional/Quantitative, Background knowledge, and Argumentative transparency — and used it to score a text paragraph by paragraph, 1–10 per dimension, with a free-text note explaining each score. An instrument is only as good as the data it produces — so we read.',
  researchMethods: [
    {
      name: 'Decision 01',
      title: 'Why five dimensions, not one score',
      purpose: 'A single "hard/easy" rating conflates distinct sources of friction — a paragraph can be lexically simple but argumentatively opaque, or dense with numbers but easy to follow. Splitting the rubric surfaces which kind of difficulty is driving each spike, because different causes need different fixes.',
    },
    {
      name: 'Decision 02',
      title: 'Why per-paragraph, 1–10, plus notes',
      purpose: 'A whole-text score (a Flesch-Kincaid grade level) can’t show where a reader hits a hard patch inside an otherwise easy text. Scoring every paragraph — and asking readers to explain the score in their own words — turns "this text is hard" into a curve with named causes at each peak.',
    },
  ],
  // §3 Key Findings — findingsIntro only renders alongside project.findings (ring charts),
  // which texttune doesn't use, so the intro text and chart are carried by insightGroups
  // instead (matches the group's intro/groups/chart shape used elsewhere, e.g. Speaking Shell);
  // AI comparison is the second group.
  findingsChart: {
    src: 'assets/texttune/difficulty-curve-multireader.png',
    label: 'Difficulty curve — 3 readers, academic paper (20 paragraphs)',
    note: 'Per-reader curves plus the cross-reader consensus line.',
  },
  // §3 Insights — restructured 2026-07-16 to exactly three reader-facing findings,
  // each a claim + 2–3 sentences of evidence. AI-overlay content was cut as a
  // planned-not-run method note, not a finding.
  insightGroups: {
    intro: 'Three readers each scored the same 20-paragraph academic paper (Design Frictions on Social Media) on the five-dimension rubric, and a 15-paragraph magazine feature (The Guardian) was scored on the same rubric — comparing how difficulty behaves across two genres.',
    groups: [
      {
        label: 'What the readings taught us',
        items: [
          {
            title: 'Readers bump into hard patches and easy patches within the same text — over and over.',
            text: 'The paper’s difficulty is a mountain concentrated in its technical core (Methods/Results); the magazine’s is a flat floor with three isolated spikes tied to attribution and cultural background, not vocabulary. The one peak all three readers agreed on — the statistics/methods paragraphs (p12, p14) — also had the smallest disagreement of the whole text (SD as low as 0.42), the closest thing to text-intrinsic difficulty.',
          },
          {
            title: 'What makes a passage hard differs per reader — it hides in five different dimensions of the writing.',
            text: 'Several early paragraphs looked easy on average (~3/10) but had high disagreement between readers (SD 1.1–1.4) — one reader was climbing alone through the introduction while another’s flat low scores cancelled it out in the mean. Disagreement (SD), not the mean, is the signal for personal difficulty — and the five-dimension rubric (Lexical, Syntactic/Stance, Propositional/Quantitative, Background knowledge, Argumentative transparency) is what lets a peak be traced to a specific cause instead of a vague "this is hard."',
          },
          {
            title: 'Readers distrust rewrites — they fear losing the real thing.',
            text: 'Early testing surfaced this directly: readers were wary of any rewrite because they worried it would quietly drop or distort the source. That fear, more than the difficulty data itself, is what shaped the interface — 100% had to stay a fixed, always-reachable anchor to the original text, not just one stop among many.',
          },
        ],
      },
    ],
  },
  // §4 How Might We — bridge from the three insights into the interface response.
  // Continuation style (like FocusAnchor): the section label already reads
  // "How Might We…", so the item completes that sentence instead of repeating it.
  howMightWe: [
    "let readers tune a text's difficulty the moment they hit a wall — so they can move freely between versions without ever losing sight of the original?",
  ],
  // §5 The Product — video demo first (user-placed), then the interactive dial.
  // §5 The Product — from measurement to intervention. Intro trimmed 2026-07-16:
  // the "readers distrust rewrites" narrative now lives in insight #3 and the HMW
  // above, so this only needs to state what the dial actually does.
  product: {
    concept: {
      headline: 'Tune the text, zoom in from mind-map to margin notes',
      image: { src: 'assets/texttune/concept-overview.png', label: 'The tuning range — 5% mind-map, 100% original (anchored), 150% original plus notes' },
      points: [
        { title: 'Zoom like a map', text: 'The gesture teaches itself — the same pinch you already use every day.' },
        { title: '13 discrete stops', text: 'From 5% to 150%, each a deliberate presentation of the same text.' },
        { title: '100% is the anchor', text: 'The original is always one stop away — never rewritten out of reach.' },
      ],
    },
    text: 'The interface gives the reader a dial, not a single "simplify" toggle — driven by pinch-zoom: a continuous range from 5% (mind-map-level compression) to 100% (the original text, anchored) to 150% (the original text plus margin notes), moving across five rewrite dimensions — Vocabulary, Sentence length, Number, Tone, and Concreteness. 100% always anchors to the original.',
    gesture: {
      items: [
        { title: 'Zoom out', text: 'The text recedes — through plainer language down to its mind map.' },
        { title: 'Pinch to tune', text: 'Settle anywhere on the range; each paragraph re-renders at that level.' },
        { title: 'Zoom in', text: 'Back to the original — and past it, into margin notes.' },
      ],
      note: 'The dial has no buttons — the gesture is the interface. The same pinch you already use on a map, repurposed for meaning.',
      hint: 'On a trackpad: pinch, or Ctrl + scroll.',
    },
    video: {
      src: 'assets/texttune/texttune-demo.mp4',
      poster: 'assets/texttune/texttune-demo-poster.jpg',
      caption: '45-second walkthrough — the whole dial is driven by pinch-zoom.',
      link: 'https://tyler25-blip.github.io/TextTune/',
    },
    images: [
      { src: 'assets/texttune/interface-shot.png', label: 'TextTune reader — gradient scale in use' },
      { src: 'assets/texttune/panel-145.png', label: '145% — original text plus margin notes' },
      { src: 'assets/texttune/mindmap-5pct.png', label: '5% — mind-map-level compression' },
    ],
  },
  // §6 Reflection — intentionally REMOVED for now (user decision 2026-07-17: the
  // limits-list framing lacked a sense of learning; a rewritten reflection may
  // return later). Previous content is recoverable from git history /
  // Portfolio.jsx.bak-20260717b. Do not re-add without the user's go-ahead.
},
{
  idx: '05',
  slug: 'focusanchor',
  // Warm terracotta sampled from the product's own neumorphic accent colour.
  accent: '#E8734A',
  doodle: 'hinge',
  period: '2026.04 – 2026.06',
  org: 'TH Augsburg · Innovation & Entrepreneurship',
  context: 'A focus Chrome extension for ADHD users that never blocks or shames.',
  title: 'FocusAnchor',
  blurb: 'Research said the industry playbook — streaks, blocking, guilt — was harming the very users it claimed to help. So we shipped the opposite.',
  tags: ['UX Research', 'Product Strategy', 'Shipped'],
  insight: '5/5-pattern interviews (n=5) · Kano reverse requirements · live Chrome extension (Claude API)',
  thumb: 'assets/focusanchor/cover-thumb.jpg',
  images: {
    hero: {
      label: 'FocusAnchor — a calm focus tool for the ADHD brain',
      note: 'Cover image.',
      src: 'assets/focusanchor/cover-hero.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Two-person team-taught venture project (2026). I owned part of the business analysis — the Kano study and market positioning — ran the user testing, and refined the extension; my teammate built and shipped the core.',
  overview: "FocusAnchor is a calm Chrome extension for ADHD brains: it breaks any task into laughably small steps and gently redirects wandering tabs — never blocking, never punishing. The two of us ran it as a class venture project, and the interesting part isn't the extension itself — it's the argument underneath it: mainstream productivity tools' \"engagement features\" are, for this audience, actively harmful.",
  concept: {
    tagline: 'The only browser extension that works with your ADHD brain — not against it.',
  },
  problemLabel: '"I just need to look up a word. Then in thirty minutes I\'m watching a video on how Norwegians build wooden cabins."',
  problem: 'That\'s not laziness; it\'s a measurable executive-function deficit (Barkley). An estimated 366M adults worldwide live with ADHD — 6.76% adult prevalence (Song et al., 2021) — and almost every productivity tool on the market was built for neurotypical brains. We went to find out why they fail.',
  problemImage: { src: 'assets/focusanchor/problem-procrastination.png', label: 'Knowing the task, not starting — executive-function paralysis' },
  methods: [
    'Semi-structured interviews (n=5, qualitative)',
    'Literature review',
    'Value Proposition Canvas',
    'Kano model',
    'Business Model Canvas',
  ],
  researchMethods: [
    {
      name: 'Method 01',
      title: 'Interviews',
      meta: 'n=5, qual.',
      purpose: 'Semi-structured, 5-question protocol with ADHD adults, listening for where existing productivity tools broke down and why — synthesised into the three failure patterns below.',
    },
    {
      name: 'Method 02',
      title: 'Literature review',
      meta: 'desk research',
      purpose: 'Grounded the interview patterns in the executive-function literature (Barkley; de Zwaan, 2012) and in prior evidence that punishment-style design backfires (Desrochers, 2019; Campbell, 2023, CHI).',
    },
    {
      name: 'Method 03',
      title: 'VPC · Kano · BMC',
      meta: 'synthesis',
      purpose: 'A Value Proposition Canvas and Kano analysis turned the interview findings into a reverse-requirement insight — see Key Insights — and a Business Model Canvas scoped the freemium model.',
    },
  ],
  findingsIntro: 'Across five qualitative interviews, the same three failure patterns kept surfacing — small sample, but a consistent pattern within it.',
  findings: [
    {
      title: 'Task initiation paralysis (5/5)',
      description: '"I could start any second. I just… don\'t." All five participants described knowing exactly what to do and still not starting.',
      design: 'Break any goal into steps small enough that the first one is almost funny to skip.',
    },
    {
      title: 'Time blindness (5/5)',
      description: '"Sat down in Figma at 2pm, looked up and it was 8." Every participant lost track of time mid-task, with no natural checkpoint to notice.',
      design: 'Use every new tab as a gentle, recurring checkpoint — never a hard interruption.',
    },
    {
      title: 'Punishment backfires (4/5)',
      description: 'Guilt-driven uninstalls: four of five had abandoned a blocking or streak-based app after it made them feel worse, not better.',
      design: 'Design a Kano reverse requirement: remove blocking and streaks entirely rather than tune them.',
    },
  ],
  insightGroups: {
    intro: 'The market\'s blind spot: what mainstream tools call "engagement features" — streaks, leaderboards, blocking — read in this data as actively harmful to ADHD users. That\'s a Kano reverse requirement, and it\'s the one insight the whole product argument rests on.',
    groups: [
      {
        label: 'The blind spot',
        items: [
          { title: '"The dead tree felt like surveillance"', text: 'A Forest user we interviewed deleted the app after its guilt-based streak mechanic backfired — direct evidence that gamified accountability reads as punishment to this audience, not motivation.' },
          { title: 'Reverse requirement, not a tuning problem', text: 'Kano analysis on the interview data placed streaks, leaderboards, and blocking as reverse requirements: adding more of them makes the product worse for ADHD users, not better. The fix isn\'t softer blocking — it\'s no blocking.' },
        ],
      },
      {
        label: 'The product boundary',
        items: [
          { title: 'Participant D taught us who this isn\'t for', text: 'One interviewee wanted gamified accountability — streaks, leaderboards, the exact mechanics the other four rejected. She\'s not our user, and excluding her deliberately is what let the "never blocks" promise stay uncompromised for everyone else.' },
        ],
      },
    ],
  },
  howMightWe: [
    'help someone start — without ever blocking, punishing, or watching them?',
  ],
  product: {
    text: 'Two modules, one promise: never a wall. Storage-only permissions\n— no tracking, no browsing-history access.',
    features: [
      'AI task decomposition (Claude API)',
      'Gentle intention interceptor, 3 exits, never a block',
      'Storage-only permissions — no tracking',
    ],
    images: [
      { src: 'assets/focusanchor/product-mod-1.png', label: '1 · AI Task Decomposition', caption: 'You type a vague goal. Claude breaks it into 4–8 tiny steps — the first one laughably small, because starting is the hard part.' },
      { src: 'assets/focusanchor/product-mod-2.png', label: '2 · Intention Interceptor', caption: 'Every new tab gently asks what you were doing. It never walls you off — you\'re always one calm tap from moving.' },
    ],
    cta: {
      href: 'https://drive.google.com/drive/folders/1gqIisgZT8vTpz2J5y5Y6gW_CmeOSXgS9?usp=sharing',
      label: 'Download the extension →',
      note: 'Chrome · manual install — not yet on the Web Store',
    },
  },
  usage: {
    video: 'assets/focusanchor/promo.mp4',
    videoCaption: 'Promo — the full flow in 52 seconds. Sound on optional.',
    frames: [
      { src: 'assets/focusanchor/flow-01-goal.png', caption: 'The report is due tomorrow. You type the goal — that\'s all FocusAnchor needs.' },
      { src: 'assets/focusanchor/flow-02-steps.png', caption: 'Claude breaks it into five tiny steps. The first is laughably small — starting is the hard part.' },
      { src: 'assets/focusanchor/flow-03-checkin.png', caption: 'Mid-task, you open a new tab to find a reference — a gentle check-in appears. It never blocks.' },
      { src: 'assets/focusanchor/flow-04-lookup.png', caption: 'You choose "Look something up" — a real need is a real need, so it lets you through.' },
      { src: 'assets/focusanchor/flow-05-pill.png', caption: 'The floating pill follows you to the feed, keeping the next step in sight until you head back.' },
    ],
  },
  userTesting: {
    setup: 'MVP is live and functional (extension-v3, Chrome) — storage-only permissions were a deliberate trust decision, not a default. A 10-user beta is scheduled for autumn 2026; effectiveness has not yet been validated with beta data, so this section reports build status, not outcomes.',
    positives: [
      'Interview-stage willingness to pay: €3–5/month — "a cup of coffee, if it actually works" (qualitative, n=5)',
      'Extension is live and functional in Chrome today',
    ],
    negatives: [
      'No beta data yet — the 10-user beta (autumn 2026) is the next real test of whether the never-blocks approach holds up in daily use',
      'Sample is small and qualitative (n=5) — directional, not conclusive',
    ],
  },
},
{
  slug: 'snapwear',
  accent: '#B85C7A',
  doodle: 'textile',
  period: '2025.09 – 2025.10',
  org: 'Self-Initiated Product Project',
  context: 'A product-centric beauty app that turns scattered platform research into one cited answer.',
  title: 'SnapWear',
  blurb: 'An end-to-end Figma UI built on a defined design system — designed to collapse a 26-minute in-store platform hop into one cited Advice Card.',
  tags: ['UI Design', 'Figma', 'Journey Mapping'],
  insight: 'Survey (n=12) · journey mapping · competitive analysis · end-to-end Figma prototype',
  thumb: 'assets/snapwear/cover-card.jpg',
  images: {
    hero: {
      label: 'SnapWear — snap it, match it, wear it',
      note: 'Cover image.',
      src: 'assets/snapwear/hero.jpg',
    },
  },
  // ── Case study detail ──
  role: 'Solo project — research, UI design, and design system, start to finish.',
  overview: 'SnapWear is a product-centric beauty-review app: point your camera at a product on a store shelf — or search it — and get one cited Advice Card, a suitability score tied to your own skin profile, instead of a feed of mixed opinions to scroll through.',
  concept: {
    tagline: 'Snap it, match it, wear it.',
  },
  problemLabel: 'Beauty shoppers do all the research — and still leave the shelf undecided.',
  problem: '"I already struggle to decide. For foundation especially, I end up checking reviews everywhere — half an hour\'s gone, crouched at the shelf."',
  problemImage: { src: 'assets/snapwear/journey.jpg', label: 'The in-store decision journey — shelf to Reddit to YouTube to Google and back' },
  problemImageFull: true,
  methods: [
    'Survey (n=12, convenience sample)',
    'Journey mapping',
    'Competitive analysis',
  ],
  researchMethodsIntro: 'The sample is small and self-selected — 12 people from a friends-and-acquaintances convenience sample. I\'m reading it as directional, not conclusive: enough to sharpen the problem, not enough to prove the solution.',
  researchMethods: [
    {
      name: 'Method 01',
      title: 'Survey',
      meta: 'n=12',
      purpose: 'A 10–12 question survey targeting three questions: where in-store decision friction lives, where information breaks down across platforms, and whether a "people like me" comparison would be trusted. Produced the 26-minute / 3-platform / 5.5-confidence baseline above.',
    },
    {
      name: 'Method 02',
      title: 'Journey mapping',
      meta: 'qualitative',
      purpose: 'Mapped the shelf-to-decision journey — pick up, check Reddit, check YouTube, check Google, back to shelf — to locate exactly where shoppers stalled or gave up. That structure carries through directly to the interface.',
    },
    {
      name: 'Method 03',
      title: 'Competitive analysis',
      meta: 'desk research',
      purpose: 'Reviewed existing beauty-review and comparison apps to confirm the gap: most are feed-first, browsed like social media. None collapse research into one cited, product-centric answer.',
    },
  ],
  statRings: {
    intro: 'The survey was built around three questions — where friction lives, where information breaks down, and whether a "people like me" comparison is trusted. Only one of the three carries a number that means what it looks like; the other two are read qualitatively.',
    items: [
      {
        figure: '26 min',
        sub: '(n=12) Average in-store research time',
        note: '8 of 12 said information was scattered, not missing — lost between apps, not absent.',
      },
      {
        figure: '3',
        sub: '(n=12) Platforms switched per decision',
        note: 'Hesitation is category-dependent — foundation and function-first products take longest, because claims and effectiveness language vary by seller.',
      },
      {
        figure: '5.5 / 10',
        sub: '(n=12) Self-reported decision confidence',
        note: 'Respondents wanted proof from "people like me" — surfaced qualitatively, treated as a design assumption to validate, not a measured finding.',
      },
    ],
  },
  howMightWe: [
    'bring every piece of product information a decision needs into one place — cutting decision time and raising purchase confidence?',
  ],
  product: {
    concept: {
      headline: 'Wireframe to prototype',
      image: { src: 'assets/snapwear/overview-composite.jpg', label: 'SnapWear MVP overview' },
      imageCaption: 'From lo-fi wireframes to the final UI: the four MVP moves — personalized recommendations, product-centric review hub, quick compare, and the community data flywheel — annotated on the screens they live in.',
    },
    text: 'Twenty-six minutes of scattered platform-hopping, collapsed into one card: a suitability score, the claims behind it, and where they came from. I built this product-centric — one product, one page, one verdict — instead of feed-centric, because a feed is built to be browsed, and browsing was exactly the friction this research was trying to remove. Everything below works backward from that one card.',
    features: [
      'Cited AI Advice Card (skin-profile-powered)',
      'Side-by-side compare with match scores',
      'Guided review flow → community data flywheel',
    ],
    narrativeImages: [
      { src: 'assets/snapwear/main-flow.jpg', label: 'Main flow, start to finish', caption: 'The main flow, start to finish: home → scan → advice → compare → decide. Every screen after this one works backward from that path.' },
      { src: 'assets/snapwear/search.jpg', label: 'Product-centric search', caption: 'Product-centric search — browse by category or scan in-store; results ranked by skin-profile match, filterable by brand and price.' },
      { src: 'assets/snapwear/personalize.jpg', label: 'Skin profile & review hub', caption: 'Skin profile setup feeds the "people like me" engine; internal wear-tests and external platform reviews sit in one hub, with a guided posting flow — wear timeline, shade, verdict — that keeps contributions structured.' },
    ],
    images: [
      { src: 'assets/snapwear/flow-02-advice.jpg', label: 'Advice Card detail', caption: 'Score, the factors behind it, and a stated confidence level — including an honest "shade may run slightly light" caveat when the data doesn\'t fully support the claim. AI explainability, not just a number.' },
      { src: 'assets/snapwear/design-system.jpg', label: 'Design system board', caption: 'Tokens and reusable components keep every screen consistent.' },
    ],
    cta: {
      href: 'https://www.figma.com/proto/zeuYV5rio6elynVkeBrflL/Untitled?node-id=125-643&t=7YDYQ2qKGO9XUBlO-1',
      label: 'View the Figma prototype →',
      note: 'Click-through prototype',
    },
  },
},
];

/* Homepage order (2026-07-17): industry work leads, exploratory Speaking Shell closes.
   idx is renumbered from this sequence — edit the slugs here to reorder, nothing else. */
const PROJECT_SEQUENCE = ['pangolin', 'mere', 'snapwear', 'texttune', 'focusanchor', 'voice-shell'];
PROJECTS.sort((a, b) => PROJECT_SEQUENCE.indexOf(a.slug) - PROJECT_SEQUENCE.indexOf(b.slug));
PROJECTS.forEach((p, i) => { p.idx = String(i + 1).padStart(2, '0'); });


/* ---------- Scroll reveal — fade/rise once when scrolled into view ---------- */
function Reveal({ children, delay = 0 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    let ioAlive = false; // IO delivers an initial callback in healthy browsers
    const io = new IntersectionObserver((entries) => {
      ioAlive = true;
      if (entries[0].isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    const failsafe = setTimeout(() => { if (!ioAlive) el.classList.add('is-in'); }, 3000);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);
  return <div ref={ref} className="reveal" style={delay ? { transitionDelay: delay + 'ms' } : undefined}>{children}</div>;
}


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
          <span>{p.context || p.org}</span>
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
          borderTop: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase'
        }}>
          <span style={{ fontSize: 14, marginLeft: 'auto' }}>View case study ↗</span>
        </div>
      </div>
    </article>);
}

/* ---------- Project row (home list layout — one project per horizontal row) ---------- */
function ProjectRow({ p, onOpen, last }) {
  const [hover, setHover] = React.useState(false);
  const narrow = useIsNarrow();
  const heroSrc = p.thumb || (p.images && p.images.hero && p.images.hero.src);
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
        gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 0.92fr) minmax(0, 1.08fr)',
        gap: narrow ? 20 : 'clamp(24px, 4vw, 64px)',
        alignItems: 'center',
        padding: 'clamp(28px, 4vw, 52px) 0',
        borderTop: '1px solid var(--hairline)',
        borderBottom: last ? '1px solid var(--hairline)' : 'none',
        cursor: 'pointer',
      }}>
      {/* Hero image (falls back to the doodle if no hero is set) */}
      <div style={{ overflow: 'hidden', borderRadius: 12, aspectRatio: '4 / 3', background: 'var(--paper-deep)' }}>
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
          <span>{p.context || p.org}</span>
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
          paddingTop: 16, borderTop: '1px solid var(--hairline)',
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--fg-3)',
        }}>
          <span style={{ color: 'var(--ink)', fontSize: 13, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
            View case study{' '}
            <span style={{ display: 'inline-block', transform: hover ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 240ms ease' }}>↗</span>
          </span>
        </div>
      </div>
    </article>);
}

/* ---------- Lightbox (click-to-zoom for case-study images) ---------- */
const LightboxCtx = React.createContext(null);

function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);
  if (!item) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={item.label || 'Image preview'}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(29, 30, 39, 0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 64px)', cursor: 'zoom-out',
      }}>
      <img src={item.src} alt={item.label || ''}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }} />
      {item.label && (
        <div style={{
          position: 'absolute', bottom: 22, left: 24, right: 24, textAlign: 'center',
          fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(237, 242, 244, 0.72)',
        }}>{item.label}</div>
      )}
      <button onClick={onClose} aria-label="Close image preview"
        style={{
          position: 'absolute', top: 18, right: 22,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Archivo, sans-serif', fontSize: 26, lineHeight: 1,
          color: 'rgba(237, 242, 244, 0.85)', padding: 10,
        }}>×</button>
    </div>
  );
}

/* ---------- Image placeholder (dashed box w/ label) ---------- */
function ImagePlaceholder({ label, note, src, aspectRatio = '4 / 3', height }) {
  const openLightbox = React.useContext(LightboxCtx);
  // Real image. With a height → cover banner (controlled). Without → natural full width.
  if (src) {
    return (
      <img src={src} alt={label || ''} loading="lazy"
        onClick={openLightbox ? () => openLightbox({ src, label }) : undefined}
        style={{
          width: '100%', height: height || 'auto', objectFit: height ? 'cover' : undefined,
          display: 'block', borderRadius: 12,
          cursor: openLightbox ? 'zoom-in' : undefined,
        }} />
    );
  }
  // Intentional empty-state panel (not a dashed "missing image" box).
  // `label` shows as a quiet corner caption so Nicole knows what to drop in.
  // Hidden on the live site (any non-local host); shown locally as a "drop image here" reminder.
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (!isLocal) return null;
  return (
    <div style={{
      position: 'relative',
      background: 'var(--paper-deep)',
      border: '1px solid var(--hairline)',
      borderRadius: 12,
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
      gridTemplateColumns: `repeat(auto-fit, minmax(min(${minCol}px, 100%), 1fr))`,
      gap: 20,
      maxWidth: maxWidth || undefined
    }}>
      {images.map((im, i) => (
        <ImagePlaceholder key={i} label={im.label} note={im.note} src={im.src} aspectRatio={aspectRatio} />
      ))}
    </div>
  );
}

/* ---------- Usage stepper: one large frame, click through a scenario ---------- */
function UsageStepper({ frames }) {
  const [idx, setIdx] = useState(0);
  const f = frames[idx];
  const btn = (off) => ({
    fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '9px 18px', borderRadius: 999,
    border: '1px solid var(--capsule-border)', background: 'transparent',
    color: off ? 'var(--fg-4)' : 'var(--ink)', cursor: off ? 'default' : 'pointer',
  });
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 'clamp(16px, 1.7vw, 19px)', lineHeight: 1.5, color: 'var(--fg-1)', margin: '0 0 18px', minHeight: 58 }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 10 }}>{idx + 1}/{frames.length}</span>
        {f.caption}
      </p>
      <img key={idx} className="usage-frame-img" src={f.src} alt={f.caption || ''}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--hairline)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <button className="usage-stepper-back" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={btn(idx === 0)}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {frames.map((_, i) => (
            <span key={i} onClick={() => setIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer', background: i === idx ? 'var(--accent)' : 'var(--fg-4)' }} />
          ))}
        </div>
        <button className="usage-stepper-next" onClick={() => setIdx(Math.min(frames.length - 1, idx + 1))} disabled={idx === frames.length - 1} style={btn(idx === frames.length - 1)}>Next →</button>
      </div>
    </div>
  );
}

/* ---------- Product gallery: big image + thumbnail strip, autoplay + manual ---------- */
function ProductGallery({ images }) {
  const openLightbox = React.useContext(LightboxCtx);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const count = images ? images.length : 0;
  // Stable key so the autoplay interval doesn't reset on every unrelated re-render
  // (the caller passes a freshly-filtered array each render).
  const imagesKey = images ? images.map((im) => im.src).join('|') : '';

  useEffect(() => {
    if (count <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [imagesKey, count, paused]);

  if (!images || !images.length) return null;
  const im = images[active];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ marginBottom: 12 }}>
        <img
          src={im.src}
          alt={im.label || ''}
          loading="lazy"
          onClick={openLightbox ? () => openLightbox({ src: im.src, label: im.label }) : undefined}
          style={{
            width: '100%', aspectRatio: '16 / 9', objectFit: 'cover',
            display: 'block', borderRadius: 12,
            cursor: openLightbox ? 'zoom-in' : undefined,
          }}
        />
      </div>
      {images.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
            style={{
              flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 12,
              color: 'var(--fg-2)', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1,
            }}
          >‹</button>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${images.length}, 1fr)`, gap: 8, flex: 1 }}>
            {images.map((t, i) => (
              <img
                key={i}
                src={t.src}
                alt={t.label || ''}
                loading="lazy"
                onClick={() => setActive(i)}
                style={{
                  width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', borderRadius: 12,
                  cursor: 'pointer',
                  border: i === active ? '1px solid var(--ink)' : '1px solid var(--hairline)',
                  opacity: i === active ? 1 : 0.62,
                  transition: 'opacity 180ms ease',
                }}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => setActive((i) => (i + 1) % images.length)}
            style={{
              flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 12,
              color: 'var(--fg-2)', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1,
            }}
          >›</button>
        </div>
      )}
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
// ── TextTune "difficulty dial" — a concept demo of how one paragraph looks at
//    four points on the dial. The product itself is a continuous range; this
//    interactive shows only four anchor points so the idea reads at a glance.
//    Example text is the REAL prototype content (Tyler's gradient-reader build,
//    tyler25-blip.github.io/TextTune): the same Introduction paragraph from the
//    Semantic Reader paper (Head et al.), pulled from the prototype's own
//    per-level rewrite data at levels 5 / 100 / 125. 5% uses the mind-map asset.
function TextTuneDial() {
  const narrow = useIsNarrow(760);
  // Concept labels replace exact percentages on the left rail (2026-07-16 polish —
  // the rail communicates position on the dial, not a number to memorise). Exact
  // stop numbers are kept as small print inside the right-hand detail panel only.
  const REWRITE_DIMENSIONS = ['Vocabulary', 'Sentence length', 'Number', 'Tone', 'Concreteness'];
  const ANCHORS = [
    {
      pct: 5, stop: 1,
      concept: 'Mind map',
      band: 'map',
      name: 'Mind map',
      blurb: 'The whole passage compressed to its concept map — structure before sentences.',
      kind: 'image',
      src: 'assets/texttune/mindmap-5pct.png',
    },
    {
      pct: 25, stop: 2,
      concept: 'Below 100%',
      band: 'below',
      name: 'Compressed rewrite',
      blurb: 'Rewritten shorter and plainer. The claim survives; the jargon is spent.',
      kind: 'text',
      text: 'Research papers are dense, and there are more of them every year. Finding a paper got easy once search engines came along. But reading one still means staring at a flat PDF, almost the same as decades ago. A team of researchers wondered if AI could fix this, making papers easier to read and more accessible, without even changing the PDF. They call their effort the Semantic Reader Project, and they built ten small tools to test the idea.',
      // Highlight spans map 1:1 (by array position) to compareHighlights below —
      // marking "this says the same thing as that", not attributing to a specific
      // rewrite dimension (that would be fabricated precision).
      highlights: ['Research papers are dense', 'Finding a paper got easy once search engines came along', 'staring at a flat PDF, almost the same as decades ago'],
      // Same three claims, located inside the 100% original text (ANCHORS[originalAnchorIdx].text)
      // — used to highlight the "original, for comparison" block with the matching phrases.
      compareHighlights: ['exponential growth of scientific publication', 'Academic search engines help scholars discover research papers', 'based on a static PDF format, has remained largely unchanged for many decades'],
    },
    {
      pct: 100, stop: 7,
      concept: '100% — Original',
      band: 'original',
      name: 'Original, anchored',
      blurb: 'The source text, word for word. The dial always returns here, so adjusting difficulty never means losing the real thing.',
      kind: 'text',
      text: 'The exponential growth of scientific publication and increasing interdisciplinary nature of scientific progress makes it increasingly hard for scholars to keep up with the latest developments. Academic search engines help scholars discover research papers, and automated summarization helps scholars triage between them. But when it comes to actually reading research papers, the process, based on a static PDF format, has remained largely unchanged for many decades. This is a problem because digesting technical research papers is difficult.',
      highlights: ['exponential growth of scientific publication', 'Academic search engines help scholars discover research papers', 'based on a static PDF format, has remained largely unchanged for many decades'],
    },
    {
      pct: 145, stop: 12,
      concept: 'Above 100%',
      band: 'above',
      name: 'Original + margin notes',
      blurb: 'The original text, unchanged, with glosses for the hard terms alongside.',
      kind: 'text',
      text: 'The exponential growth of scientific publication and increasing interdisciplinary nature of scientific progress makes it increasingly hard for scholars to keep up with the latest developments. Academic search engines help scholars discover research papers, and automated summarization helps scholars triage between them. But when it comes to actually reading research papers, the process, based on a static PDF format, has remained largely unchanged for many decades. This is a problem because digesting technical research papers is difficult.',
      notes: [
        { anchor: 'interdisciplinary nature', gloss: 'research increasingly draws on and connects multiple different fields at once' },
      ],
    },
  ];
  const [sel, setSel] = useState(2); // default: 100% (original, anchored)
  const cur = ANCHORS[sel];

  // Render body text with note anchors underlined so the margin-note idea is legible.
  const renderText = (text, notes) => {
    if (!notes || notes.length === 0) return text;
    let parts = [text];
    notes.forEach((n, ni) => {
      const next = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') { next.push(part); return; }
        const idx = part.indexOf(n.anchor);
        if (idx === -1) { next.push(part); return; }
        next.push(part.slice(0, idx));
        next.push(
          <span key={'a' + ni} style={{
            borderBottom: '1.5px solid var(--accent)', color: 'var(--ink)', fontWeight: 600,
          }}>{n.anchor}</span>
        );
        next.push(part.slice(idx + n.anchor.length));
      });
      parts = next;
    });
    return parts;
  };

  // Render body text with cross-version highlight spans (low-opacity accent background) —
  // marks "this phrase corresponds to a phrase in the other version", not a dimension label.
  const renderHighlighted = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;
    let parts = [text];
    highlights.forEach((phrase, hi) => {
      const next = [];
      parts.forEach((part) => {
        if (typeof part !== 'string') { next.push(part); return; }
        const idx = part.indexOf(phrase);
        if (idx === -1) { next.push(part); return; }
        next.push(part.slice(0, idx));
        next.push(
          <span key={'h' + hi} style={{
            background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
            borderRadius: 4, padding: '0 2px',
          }}>{phrase}</span>
        );
        next.push(part.slice(idx + phrase.length));
      });
      parts = next;
    });
    return parts;
  };

  // 13-stop dial, matching the prototype's own scale exactly (see interface-shot.png):
  // a slim vertical track with a tick per stop, top chip = "Map", fill running dark
  // top (simplest) → deep (richest) to echo the prototype's own gradient direction.
  const ALL_STOPS = [5, 25, 45, 55, 75, 85, 100, 105, 115, 125, 135, 145, 150];
  const TRACK_H = 260;
  // Values below are copied from the real TextTune prototype bundle
  // (tyler25-blip.github.io/TextTune, assets/index-IF5ZACez.js — un-minified inline
  // styles), not eyeballed. Rail: width 5, radius 3, sunken + inset neu shadow.
  const TRACK_W = 6;
  // Neumorphic shadow literals from the prototype CSS (index-DA-mbK1V.css)
  const NEU_RAISED_SM = '-3px -3px 7px rgba(255,255,255,0.88), 3px 3px 7px rgba(170,170,174,0.42)';
  const NEU_IN_SM = 'inset 2px 2px 5px rgba(170,170,174,0.42), inset -2px -2px 5px rgba(255,255,255,0.88)';
  const rawY = (stopIdx1based) => ((stopIdx1based - 1) / (ALL_STOPS.length - 1)) * TRACK_H;

  // Concept-only axis labels — no exact stop percentages (2026-07-16 revision per
  // Nicole's sketch: "below 100" and "above 100" are ranges, not single points, so
  // they read as ranges, not numbers to memorise). 100% keeps its label since it is
  // a genuine fixed point on the dial, not a range.
  const RANGE_LABEL = {
    below: '5%–95% (compressed)',
    original: '100% — Original',
    above: '105%–150% (original + notes)',
  };

  // The four concept zones as *segments* on the track, not point-anchors:
  //   map    → the top chip only (no track segment)
  //   below  → the track from just under stop 1 to just above stop "100"
  //   original → a single fixed point at the "100" tick
  //   above  → the track from just below "100" to the bottom
  // Segment boundaries sit at the true proportional stop position of 100% (rawY of
  // its index in ALL_STOPS), so "below" and "above" cover the real below/above range.
  const stop100Idx = ALL_STOPS.indexOf(100) + 1; // 1-based index into ALL_STOPS
  const y100 = rawY(stop100Idx);
  const SEG_GAP = 3; // px gap so the 100% point and the segments read as visually distinct

  const belowAnchorIdx = ANCHORS.findIndex((a) => a.band === 'below');
  const originalAnchorIdx = ANCHORS.findIndex((a) => a.band === 'original');
  const aboveAnchorIdx = ANCHORS.findIndex((a) => a.band === 'above');

  const VerticalAxis = () => (
    <div role="group" aria-label="Difficulty dial — Mind map, below 100%, 100%, above 100%"
      style={{ display: 'grid', gap: 10 }}>
      <div style={{
        fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)',
      }}>The dial, four selectable zones</div>

      {/* Top: Map chip — copied 1:1 from the TextTune prototype bundle (component l1):
          span 22×22, borderRadius 6, NO border (neumorphic: raised shadow unselected,
          inset shadow selected), 12×12 three-node SVG (stroke 1.3, fill none), "Map"
          label 13px (weight 500 faint unselected / 600 accent selected), gap 10.
          Portfolio addition: the chip's horizontal centre is aligned to the track's
          centre line below (marginLeft -(22-TRACK_W)/2), per Nicole's request. */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setSel(0)}
          aria-pressed={sel === 0}
          data-testid="segment-map"
          style={{
            width: 22, height: 22, flexShrink: 0,
            marginLeft: -(22 - TRACK_W) / 2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 999, padding: 0, cursor: 'pointer',
            background: 'var(--paper)', border: 'none',
            boxShadow: sel === 0 ? NEU_IN_SM : NEU_RAISED_SM,
            transition: 'box-shadow 0.15s',
          }}>
          {/* mindmap glyph — exact prototype geometry: viewBox 0 0 12 12, stroke 1.3,
              circles (6,2.6)(2.6,9)(9.4,9) r1.4, lines 6,4→3.2,7.7 and 6,4→8.8,7.7 */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
            stroke={sel === 0 ? 'var(--accent)' : 'var(--fg-3)'} strokeWidth="1.3"
            style={{ flexShrink: 0, display: 'block', transition: 'stroke 0.15s' }}>
            <circle cx="6" cy="2.6" r="1.4" />
            <circle cx="2.6" cy="9" r="1.4" />
            <circle cx="9.4" cy="9" r="1.4" />
            <line x1="6" y1="4" x2="3.2" y2="7.7" />
            <line x1="6" y1="4" x2="8.8" y2="7.7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setSel(0)}
          aria-pressed={sel === 0}
          data-testid="segment-map-label"
          style={{
            textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
          }}>
          <div style={{
            fontFamily: 'Archivo, sans-serif',
            fontWeight: sel === 0 ? 600 : 500, fontSize: 13,
            lineHeight: 1.25, color: sel === 0 ? 'var(--accent)' : 'var(--fg-3)',
            transition: 'color 0.15s',
          }}>Map</div>
        </button>
      </div>

      {/* Track: 13 real ticks for scale honesty, but the clickable targets are two
          whole segments (below/above) plus one fixed point (100%) — selecting a
          segment highlights its full run on the track, not a single dot. */}
      <div style={{ display: 'flex', gap: 14, paddingTop: 4 }}>
        <div style={{ position: 'relative', width: TRACK_W, height: TRACK_H, flexShrink: 0 }}>
          {/* Base track — TextTune prototype rail: borderRadius 3, vertical
              gradient fill (light → dark, top → bottom), copied from the
              prototype bundle (assets/index-IF5ZACez.js): linear-gradient(var(--accent-soft), var(--accent)).
              No border. Inset shadow dropped — reads muddy over a gradient fill. */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: 8,
            background: 'linear-gradient(color-mix(in srgb, var(--accent) 50%, #fff), var(--accent))',
          }} />
          {/* No tick marks along the run — the prototype only marks the fixed
              100% point (below); intermediate stops are implicit in the gradient. */}

          {/* Below-100 segment — clickable, fills the whole top run when selected */}
          <button
            type="button"
            onClick={() => setSel(belowAnchorIdx)}
            aria-pressed={sel === belowAnchorIdx}
            aria-label="Below 100 percent — compressed range"
            data-testid="segment-below"
            style={{
              position: 'absolute', left: -4.5, top: 0, width: 15, height: Math.max(0, y100 - SEG_GAP),
              borderRadius: 8, cursor: 'pointer', border: 'none', padding: 0,
              // prototype indicates selection with a solid FILL only — no border, no
              // inset ring. (verified: prototype marker is a filled block + shadow-sm.)
              background: sel === belowAnchorIdx ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'transparent',
              transition: 'background 0.15s',
            }}
          />

          {/* Above-100 segment — clickable, fills the whole bottom run when selected */}
          <button
            type="button"
            onClick={() => setSel(aboveAnchorIdx)}
            aria-pressed={sel === aboveAnchorIdx}
            aria-label="Above 100 percent — original with margin notes range"
            data-testid="segment-above"
            style={{
              position: 'absolute', left: -4.5, top: y100 + SEG_GAP, width: 15,
              height: Math.max(0, TRACK_H - y100 - SEG_GAP),
              borderRadius: 8, cursor: 'pointer', border: 'none', padding: 0,
              // solid fill only — no border / inset ring (prototype idiom)
              background: sel === aboveAnchorIdx ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'transparent',
              transition: 'background 0.15s',
            }}
          />

          {/* 100% — a fixed point, drawn in the prototype's qx line idiom, but with
              the asymmetric left-short/right-long shape from the prototype bundle:
              the line's left end sits just left of the rail centre (a short stub)
              and the line extends mostly to the right. Selected = total 30w / 3h /
              accent; unselected = total 12w / 2h / fg-3. Left stub stays ~3-4px in
              both states; the right side carries the length change. The button hit
              area is unchanged (generous, rail-centred) for click/tap ergonomics. */}
          <button
            type="button"
            onClick={() => setSel(originalAnchorIdx)}
            aria-pressed={sel === originalAnchorIdx}
            aria-label="100 percent — original"
            data-testid="segment-original"
            style={{
              position: 'absolute', left: -14, top: y100 - 10,
              width: 34, height: 20, cursor: 'pointer',
              background: 'none', border: 'none', padding: 0, zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            }}>
            <span aria-hidden="true" style={{
              display: 'block',
              marginLeft: 14 - 4, // rail centre (button centre - 3px left stub)
              width: sel === originalAnchorIdx ? 30 : 12,
              height: sel === originalAnchorIdx ? 3 : 2,
              borderRadius: 12,
              background: sel === originalAnchorIdx ? 'var(--accent)' : 'var(--fg-3)',
              transition: 'background 0.15s, height 0.15s, width 0.15s, margin-left 0.15s',
            }} />
          </button>
        </div>

        {/* Axis-side labels — ranges for the segments, a fixed label for 100%,
            no exact stop percentages (5%/25%/145% never appear here). */}
        <div style={{ position: 'relative', height: TRACK_H, flex: 1 }}>
          <button
            type="button"
            onClick={() => setSel(belowAnchorIdx)}
            aria-pressed={sel === belowAnchorIdx}
            style={{
              position: 'absolute', left: 0, top: Math.max(0, y100 - SEG_GAP) / 2 - 14,
              textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
            }}>
            <div style={{
              fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12.5,
              lineHeight: 1.25, color: sel === belowAnchorIdx ? 'var(--ink)' : 'var(--fg-3)',
              transition: 'color 0.15s',
            }}>{RANGE_LABEL.below}</div>
          </button>

          <button
            type="button"
            onClick={() => setSel(originalAnchorIdx)}
            aria-pressed={sel === originalAnchorIdx}
            style={{
              position: 'absolute', left: 0, top: y100 - 9,
              textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
            }}>
            <div style={{
              fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12.5,
              lineHeight: 1.25, color: sel === originalAnchorIdx ? 'var(--ink)' : 'var(--fg-3)',
              transition: 'color 0.15s',
            }}>{RANGE_LABEL.original}</div>
          </button>

          <button
            type="button"
            onClick={() => setSel(aboveAnchorIdx)}
            aria-pressed={sel === aboveAnchorIdx}
            style={{
              position: 'absolute', left: 0,
              top: y100 + SEG_GAP + Math.max(0, TRACK_H - y100 - SEG_GAP) / 2 - 14,
              textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
            }}>
            <div style={{
              fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12.5,
              lineHeight: 1.25, color: sel === aboveAnchorIdx ? 'var(--ink)' : 'var(--fg-3)',
              transition: 'color 0.15s',
            }}>{RANGE_LABEL.above}</div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 0.42fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 3vw, 44px)', alignItems: 'start',
      }}>
        {/* Left: vertical tick-mark axis, matching the prototype's own scale UI */}
        <VerticalAxis />

        {/* Right: the selected stop's explanation + the same paragraph at that stop */}
        <div style={{
          border: '1px solid var(--hairline)', borderRadius: 12,
          padding: 'clamp(22px, 2.6vw, 36px)', minHeight: narrow ? 0 : 300,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16,
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800,
              fontSize: 'clamp(18px, 2vw, 24px)', lineHeight: 1, color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}>{cur.name}</span>
          </div>
          <p style={{
            fontFamily: 'Archivo, sans-serif', fontSize: 14.5, lineHeight: 1.55,
            color: 'var(--fg-2)', margin: '0 0 8px 0', maxWidth: 620,
          }}>{cur.blurb}</p>
          <div style={{
            fontFamily: 'Archivo, sans-serif', fontSize: 11.5, color: 'var(--fg-3)',
            marginBottom: 20,
          }}>{cur.pct}% on the dial</div>

          {cur.kind === 'image' ? (
            <img src={cur.src} alt="TextTune 5% view — mind-map compression of the passage"
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--hairline)' }} />
          ) : (
            <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: (cur.notes || (cur.band === 'below' && !narrow)) ? 'minmax(0, 1fr) minmax(150px, 0.44fr)' : '1fr',
              gap: 'clamp(16px, 2vw, 28px)',
            }}>
              <p style={{
                fontFamily: 'Archivo, sans-serif', fontSize: 'clamp(15px, 1.6vw, 18px)',
                lineHeight: 1.65, color: 'var(--fg-1)', margin: 0,
              }}>{cur.notes ? renderText(cur.text, cur.notes) : renderHighlighted(cur.text, cur.highlights)}</p>

              {/* Margin notes (145% stop) */}
              {cur.notes && cur.notes.length > 0 && (
                <div style={{
                  borderLeft: narrow ? 'none' : '1px solid var(--hairline)',
                  borderTop: narrow ? '1px solid var(--hairline)' : 'none',
                  paddingLeft: narrow ? 0 : 'clamp(14px, 1.6vw, 20px)',
                  paddingTop: narrow ? 16 : 0,
                  display: 'grid', gap: 14, alignContent: 'start',
                }}>
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)',
                  }}>Margin notes</div>
                  {cur.notes.map((n, ni) => (
                    <div key={ni}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 13.5, color: 'var(--accent)', marginBottom: 3 }}>{n.anchor}</div>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{n.gloss}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Five rewrite-dimension list (45% stop only, req #7) — a plain list of the
                  dimensions the rewrite can move along, not a per-span attribution. */}
              {cur.band === 'below' && (
                <div style={{
                  borderLeft: narrow ? 'none' : '1px solid var(--hairline)',
                  borderTop: narrow ? '1px solid var(--hairline)' : 'none',
                  paddingLeft: narrow ? 0 : 'clamp(14px, 1.6vw, 20px)',
                  paddingTop: narrow ? 16 : 0,
                  display: 'grid', gap: 10, alignContent: 'start',
                }}>
                  <div style={{
                    fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)',
                  }}>Rewrite dimensions</div>
                  {REWRITE_DIMENSIONS.map((d, di) => (
                    <div key={di} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 13, color: 'var(--accent)' }}>{di + 1}</span>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, color: 'var(--fg-2)' }}>{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Original, for comparison — full-width, directly under the compressed
                example so the gap between stops is visible at a glance, not just
                described. Below-100 band only (req: pair the compressed stop with
                the 100% source in the same view). */}
            {cur.band === 'below' && (
              <div style={{
                marginTop: 'clamp(16px, 2vw, 22px)', paddingTop: 'clamp(14px, 1.8vw, 18px)',
                borderTop: '1px solid var(--hairline)',
              }}>
                <div style={{
                  fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)',
                  marginBottom: 8,
                }}>The original, for comparison — 100%</div>
                <p style={{
                  fontFamily: 'Archivo, sans-serif', fontSize: 13.5, lineHeight: 1.55,
                  color: 'var(--fg-3)', margin: 0, maxWidth: 620,
                }}>{renderHighlighted(ANCHORS.find((a) => a.band === 'original').text, cur.compareHighlights)}</p>
              </div>
            )}
            </>
          )}
        </div>
      </div>
      {/* Caption — kept as a grid sibling of the axis/card row above (same column
          template) so its text sits in the right-hand column and its left edge
          lines up exactly with the card's inner content (card padding-left applied
          here too), instead of the grid's outer edge. Narrow layout collapses to a
          single column like the row above, so alignment holds at both widths. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 0.42fr) minmax(0, 1fr)',
        gap: 'clamp(20px, 3vw, 44px)',
        marginTop: 'clamp(16px, 2vw, 22px)',
      }}>
        {!narrow && <div aria-hidden="true" />}
        <div style={{
          fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5,
          color: 'var(--fg-3)', maxWidth: 720,
          paddingLeft: 'clamp(22px, 2.6vw, 36px)', paddingRight: 'clamp(22px, 2.6vw, 36px)',
        }}>
          The same paragraph (the Introduction, from the Semantic Reader paper used in the prototype) shown at four points on the dial — real output from the linked prototype, not a mock-up. Highlighted phrases mark where the two versions say the same thing, not which rewrite dimension changed them.
        </div>
      </div>
    </div>
  );
}

function ProjectDetailView({ project }) {
  // Scroll to top when detail view loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [project.slug]);

  const currentIndex = PROJECTS.findIndex((p) => p.slug === project.slug);
  const nextProject = PROJECTS[(currentIndex + 1) % PROJECTS.length];

  // Click-to-zoom lightbox for case-study images
  const [lightbox, setLightbox] = useState(null);
  const narrow = useIsNarrow();

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
    <LightboxCtx.Provider value={setLightbox}>
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
          gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 0.72fr) minmax(0, 1.7fr)',
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
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', padding: '6px 12px', borderRadius: 999, color: 'var(--paper)', border: '1px solid rgba(237,242,244,0.32)' }}>{part}</span>
                    </React.Fragment>
                  ))}
                  {project.concept.result && (
                    <React.Fragment>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>=</span>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', padding: '6px 12px', borderRadius: 999, color: 'var(--ink)', background: 'var(--paper)' }}>{project.concept.result}</span>
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

        {/* ══════════════════════════════════════════════════════════════════
            TextTune — opening hero beats only (slug-gated exception, user-decided
            Option B, 2026-07-15). Every other section below this uses the same
            standard fields/renderer as the other case pages (see project.problem,
            researchMethods, insightGroups, product, methodReflection above).
           ══════════════════════════════════════════════════════════════════ */}
        {project.slug === 'texttune' && project.texttuneOpening && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <div style={{ display: 'grid', gap: 'clamp(20px, 3vw, 32px)', maxWidth: 760, marginBottom: 'clamp(32px, 4vw, 48px)' }}>
              {project.texttuneOpening.lines.map((line, i) => (
                <p key={i} style={{
                  fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(30px, 4vw, 46px)',
                  lineHeight: 1.1, letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: 0,
                }}>{line}</p>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'clamp(20px, 2.6vw, 32px)' }}>
              <p style={{ ...bodyText, fontSize: 'clamp(17px, 1.7vw, 20px)', maxWidth: 680 }}>{project.texttuneOpening.productLine}</p>
            </div>
          </div>
        )}

        {/* ── The Problem — full page (text + image). Falls back to image-only
             (full width) when a project carries no problem body text, just a
             quote label + supporting image — e.g. SnapWear. ── */}
        {(project.problem || project.problemImage) && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="01">{project.problemLabel || 'The Problem'}</SectionLabel>
            {project.problemImageFull ? (
              /* Stacked: quote as an editorial lead, then the image full-width
                 (natural height, no crop) so a wide/dense visual reads clearly. */
              <>
                {project.problem && (
                  <p style={{
                    ...bodyText,
                    fontSize: 'clamp(20px, 2.2vw, 28px)', lineHeight: 1.45,
                    color: 'var(--ink)', maxWidth: 820,
                    margin: '0 0 clamp(36px, 5vw, 64px)',
                    paddingLeft: 'clamp(16px, 2vw, 24px)',
                    borderLeft: '3px solid var(--accent)',
                  }}>{project.problem}</p>
                )}
                {project.problemImage && (
                  <figure style={{ margin: 0 }}>
                    <ImagePlaceholder src={project.problemImage.src} label={project.problemImage.label} />
                    {project.problemImage.label && (
                      <figcaption style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)', marginTop: 12 }}>{project.problemImage.label}</figcaption>
                    )}
                  </figure>
                )}
              </>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: (narrow || !project.problemImage || !project.problem) ? '1fr' : 'minmax(0, 1fr) minmax(0, 0.78fr)',
                gap: 'clamp(32px, 5vw, 72px)',
                alignItems: 'center',
              }}>
                {project.problem && (
                  <p style={{ ...bodyText, fontSize: 'clamp(19px, 2.1vw, 27px)', lineHeight: 1.5, maxWidth: 600 }}>{project.problem}</p>
                )}
                {project.problemImage && (
                  <ImagePlaceholder src={project.problemImage.src} label={project.problemImage.label}
                    height={project.problem ? 'clamp(320px, 38vw, 460px)' : 'clamp(360px, 44vw, 560px)'} />
                )}
              </div>
            )}
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
            <SectionLabel num="02">{project.methodsLabel || 'Research Methods'}</SectionLabel>
            {project.researchMethodsIntro && (
              <p style={{ ...bodyText, fontSize: 'clamp(17px, 1.8vw, 21px)', maxWidth: 780, marginBottom: 'clamp(32px, 4.5vw, 52px)' }}>{project.researchMethodsIntro}</p>
            )}
            <div style={{ display: 'grid', gap: 'clamp(12px, 1.5vw, 20px)' }}>
              {project.researchMethods.map((m, i) => {
                const hasImgs = (m.images && m.images.length > 0) || m.image;
                return (
                  <div key={i} style={{
                    border: '1px solid var(--hairline)', borderRadius: 12,
                    padding: 'clamp(26px, 3vw, 44px)',
                    display: 'grid',
                    gridTemplateColumns: (narrow || !hasImgs) ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.2fr)',
                    gap: 'clamp(28px, 4vw, 60px)',
                    alignItems: 'start',
                  }}>
                    {/* Left — text */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ ...eyebrow, marginBottom: 0 }}>{m.name}</span>
                        {m.meta && <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--accent)' }}>{m.meta}</span>}
                      </div>
                      <div style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800, fontSize: 'clamp(30px, 3.6vw, 44px)', color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.01em' }}>{m.title}</div>
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0 }}>{m.purpose}</p>
                    </div>
                    {/* Right — images (2-column mini grid) */}
                    {m.images && m.images.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(8px, 1.2vw, 16px)' }}>
                        {m.images.map((img, ii) => (
                          <ImagePlaceholder key={ii} label={img.label} note={img.note} src={img.src} aspectRatio={'4 / 3'} />
                        ))}
                      </div>
                    )}
                    {m.image && (
                      <div>
                        <ImagePlaceholder label={m.image.label} note={m.image.note} src={m.image.src} aspectRatio={'4 / 3'} />
                      </div>
                    )}
                  </div>
                );
              })}
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
                              <div key={pi} style={{ border: '1px solid var(--hairline)', borderRadius: 12, padding: 'clamp(16px, 1.8vw, 22px)' }}>
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
            <div className="findings-grid" style={{
              display: 'grid',
              '--fcount': project.findings.length,
              columnGap: 'clamp(24px, 4vw, 56px)',
              rowGap: 24,
              justifyItems: 'center',
            }}>
              {project.findings.map((f, i) => {
                const mPct = (f.title || '').match(/^(\d+)%\s+(.*)$/);
                const mFrac = (f.title || '').match(/^(\d+)\s+of\s+(\d+)\s+(.*)$/);
                const pct = mPct ? parseInt(mPct[1], 10)
                  : mFrac ? Math.round(parseInt(mFrac[1], 10) / parseInt(mFrac[2], 10) * 100)
                  : 100;
                const fig = mPct ? mPct[1] + '%' : mFrac ? `${mFrac[1]}/${mFrac[2]}` : '0' + (i + 1);
                const ttl = mPct ? mPct[2] : mFrac ? mFrac[3] : f.title;
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


        {/* ── Stat rings — three big-number findings, each inside a decorative
             ring (not a progress arc — these numbers aren't percentages, so the
             ring is a pure circle-selection mark, matching the same SVG-ring
             visual language as the Key Findings rings above). SnapWear only. ── */}
        {project.statRings && project.statRings.items && project.statRings.items.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>{(() => {
              const n = project.statRings.items.length;
              const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
              return `${words[n] || n} Insights`;
            })()}</SectionLabel>
            {project.statRings.intro && (
              <p style={{ ...bodyText, fontSize: 17, maxWidth: 760, marginBottom: 'clamp(44px, 6vw, 80px)' }}>{project.statRings.intro}</p>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              columnGap: 'clamp(24px, 4vw, 56px)', rowGap: 'clamp(40px, 5vw, 64px)',
            }}>
              {project.statRings.items.map((s, i) => {
                const R = 52, C = 2 * Math.PI * R;
                const figSize = s.figure.length > 5 ? 22 : 30;
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <svg viewBox="0 0 120 120" style={{ width: 'clamp(140px, 15vw, 190px)', height: 'auto', display: 'block', margin: '0 auto' }}>
                      <circle cx="60" cy="60" r={R} fill="none" stroke="var(--accent)" strokeWidth="9" />
                      <text x="60" y="62" textAnchor="middle" dominantBaseline="middle"
                        fontFamily="'Big Shoulders Display', Helvetica, sans-serif" fontWeight="900" fontSize={figSize} fill="var(--ink)">{s.figure}</text>
                    </svg>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: 'var(--fg-1)', lineHeight: 1.35, marginTop: 18 }}>{s.sub}</div>
                    {s.note && (
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14.5, lineHeight: 1.55, color: 'var(--fg-2)', margin: '10px auto 0', maxWidth: 280 }}>{s.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Insights — grouped grid, heading counts the actual items ── */}
        {project.insightGroups && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>{(() => {
              const n = project.insightGroups.groups.reduce((sum, g) => sum + g.items.length, 0);
              const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
              return `${words[n] || n} Insights`;
            })()}</SectionLabel>
            {project.insightGroups.intro && (
              <p style={{ ...bodyText, fontSize: 17, maxWidth: 760, marginBottom: 'clamp(36px, 5vw, 64px)' }}>{project.insightGroups.intro}</p>
            )}
            {project.findingsChart && (
              <div style={{ marginBottom: 'clamp(40px, 5.5vw, 64px)' }}>
                <ImagePlaceholder src={project.findingsChart.src} label={project.findingsChart.label} note={project.findingsChart.note} aspectRatio={'16 / 9'} />
                {project.findingsChart.note && (
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, color: 'var(--fg-3)', marginTop: 10 }}>{project.findingsChart.note}</div>
                )}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(32px, 5vw, 72px)' }}>
              {project.insightGroups.groups.map((g, gi) => (
                <div key={gi}>
                  <div style={{ ...eyebrow, color: 'var(--accent)', marginBottom: 18 }}>{g.label}</div>
                  <div style={{ display: 'grid', gap: 0 }}>
                    {g.items.map((it, ii) => (
                      <div key={ii} style={{
                        padding: '16px 0', borderTop: '1px solid var(--hairline)',
                        borderBottom: ii === g.items.length - 1 ? '1px solid var(--hairline)' : 'none',
                      }}>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--fg-1)', lineHeight: 1.3, marginBottom: 6 }}>{it.title}</div>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{it.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How Might We — bridge into the design response ── */}
        {project.howMightWe && project.howMightWe.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>How Might We…</SectionLabel>
            <div style={{ display: 'grid', gap: 0 }}>
              {project.howMightWe.map((q, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 2.5vw, 32px)',
                  padding: 'clamp(20px, 2.6vw, 34px) 0',
                  borderBottom: i < project.howMightWe.length - 1 ? '1px solid var(--hairline)' : 'none',
                }}>
                  {project.howMightWe.length > 1 && (
                    <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(24px, 3vw, 40px)', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  )}
                  <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 700, fontSize: 'clamp(22px, 3vw, 40px)', color: project.howMightWe.length === 1 ? 'var(--accent)' : 'var(--ink)', lineHeight: 1.12, letterSpacing: '-0.01em' }}>{q}</span>
                </div>
              ))}
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
                  <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 28 }}>
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

        {/* ── Design Evolution — numbered iterations with verdicts ── */}
        {project.designEvolution && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>Design Evolution</SectionLabel>
            {project.designEvolution.intro && (
              <p style={{ ...bodyText, maxWidth: 760, marginBottom: 'clamp(40px, 6vw, 72px)' }}>{project.designEvolution.intro}</p>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${project.designEvolution.iterations.length}, minmax(0, 1fr))`,
              columnGap: 'clamp(24px, 4vw, 48px)', rowGap: 'clamp(24px, 3vw, 36px)',
            }}>
              {project.designEvolution.iterations.map((it, i) => {
                const kept = it.verdictType === 'kept';
                return (
                  <div key={i} style={{ borderTop: `2px solid ${kept ? 'var(--accent)' : 'var(--hairline)'}`, paddingTop: 'clamp(16px, 2vw, 22px)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(22px, 2.6vw, 32px)', color: 'var(--accent)', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, color: kept ? 'var(--paper)' : 'var(--fg-3)', background: kept ? 'var(--accent)' : 'var(--paper-deep)' }}>{kept ? 'Final' : 'Dropped'}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800, fontSize: 'clamp(20px, 2.2vw, 28px)', color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.05, letterSpacing: '-0.01em' }}>{it.name}</h3>
                    {it.what && <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)', margin: '0 0 12px' }}>{it.what}</p>}
                    {it.verdict && (
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-1)', margin: 0 }}>
                        <span style={{ fontWeight: 700, color: kept ? 'var(--accent)' : 'var(--ink)' }}>{kept ? 'Why it stayed — ' : 'Why it failed — '}</span>{it.verdict}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── The Product ── */}
        {project.product && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <SectionLabel num="06">The Product</SectionLabel>
              {project.product.concept && (
                <div style={{ marginBottom: 'clamp(48px, 6vw, 80px)' }}>
                  <h3 style={{
                    fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800,
                    fontSize: 'clamp(28px, 3.4vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.015em',
                    color: 'var(--ink)', margin: '0 0 clamp(24px, 3vw, 40px) 0', maxWidth: 720,
                  }}>{project.product.concept.headline}</h3>
                  <img src={project.product.concept.image.src} alt={project.product.concept.image.label || ''} loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--hairline)', marginBottom: project.product.concept.imageCaption ? 16 : 'clamp(24px, 3vw, 40px)' }} />
                  {project.product.concept.imageCaption && (
                    <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 640, margin: '0 0 clamp(24px, 3vw, 40px) 0' }}>{project.product.concept.imageCaption}</p>
                  )}
                  {project.product.concept.points && project.product.concept.points.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                      gap: 'clamp(20px, 3vw, 36px)',
                    }}>
                      {project.product.concept.points.map((pt) => (
                        <div key={pt.title} style={{ borderTop: '2px solid var(--ink)', paddingTop: 14 }}>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 6 }}>{pt.title}</div>
                          <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>{pt.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p style={{ ...bodyText, whiteSpace: 'pre-line',
                ...(project.product.images && project.product.images.some((im) => im.caption)
                  ? { fontSize: 'clamp(20px, 2vw, 24px)', lineHeight: 1.45, marginBottom: project.product.features ? 28 : 32 }
                  : { marginBottom: project.product.features ? 24 : 28 }) }}>{project.product.text}</p>
              {project.product.features && project.product.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: project.product.images ? (project.product.images.some((im) => im.caption) ? 'clamp(56px, 7vw, 88px)' : 36) : 0 }}>
                  {project.product.features.map((f) => (
                    <span key={f} className="tag">{f}</span>
                  ))}
                </div>
              )}
              {/* Large narrative images with captions — replaces the old usage
                  stepper's step-by-step story for SnapWear. */}
              {project.product.narrativeImages && project.product.narrativeImages.length > 0 && (
                <div style={{ display: 'grid', gap: 'clamp(48px, 6vw, 88px)', marginBottom: 'clamp(48px, 6vw, 80px)' }}>
                  {project.product.narrativeImages.map((im, i) => (
                    <div key={i}>
                      <img src={im.src} alt={im.label || ''} loading="lazy"
                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--hairline)', marginBottom: 16 }} />
                      {im.caption && (
                        <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: 640, margin: 0 }}>{im.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {project.product.gesture && (
                <div style={{ marginBottom: 'clamp(36px, 5vw, 56px)' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                    gap: 'clamp(20px, 3vw, 36px)',
                    marginBottom: 'clamp(24px, 3vw, 36px)',
                  }}>
                    {project.product.gesture.items.map((g) => (
                      <div key={g.title} style={{ borderTop: '2px solid var(--ink)', paddingTop: 14 }}>
                        <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 6 }}>{g.title}</div>
                        <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>{g.text}</p>
                      </div>
                    ))}
                  </div>
                  {project.product.gesture.note && (
                    <p style={{
                      fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 700, fontStyle: 'italic',
                      fontSize: 'clamp(18px, 2vw, 24px)', color: 'var(--fg-3)', margin: 0, maxWidth: 640,
                    }}>{project.product.gesture.note}</p>
                  )}
                  {project.product.gesture.hint && (
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>{project.product.gesture.hint}</div>
                  )}
                </div>
              )}
              {project.product.video && (
                <div style={{ marginBottom: 'clamp(40px, 6vw, 72px)' }}>
                  <video
                    controls
                    preload="metadata"
                    playsInline
                    poster={project.product.video.poster}
                    src={project.product.video.src}
                    style={{ width: '100%', display: 'block', borderRadius: 12, background: 'var(--paper-deep)' }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    flexWrap: 'wrap', gap: 12, marginTop: 12,
                  }}>
                    {project.product.video.caption && (
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)' }}>{project.product.video.caption}</div>
                    )}
                    {project.product.video.link && (
                      <a href={project.product.video.link} target="_blank" rel="noreferrer" style={{
                        fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12,
                        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
                      }}>Open the prototype →</a>
                    )}
                  </div>
                </div>
              )}
              {project.slug === 'texttune' ? (
                <TextTuneDial />
              ) : project.slug === 'mere' && project.product.images && project.product.images.length > 1 ? (
                <ProductGallery images={project.product.images.filter((im) => im.src)} />
              ) : project.slug === 'snapwear' && project.product.images && project.product.images.length > 0 ? (
                // Two explicit grid rows (captions, then images) so both images
                // share one top edge and one bottom edge, regardless of caption
                // line-count differences between the two cards.
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
                  gridAutoRows: 'auto', columnGap: 'clamp(28px, 4.5vw, 72px)', rowGap: 'clamp(20px, 2.5vw, 32px)',
                }}>
                  {project.product.images.filter((im) => im.src).map((im, i) => (
                    <div key={'cap' + i} style={{ gridRow: 1, textAlign: 'center', alignSelf: 'end' }}>
                      {im.caption && (
                        <div>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 'clamp(17px, 1.6vw, 20px)', lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--fg-1)', marginBottom: 12 }}>{im.label}</div>
                          <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: '44ch', margin: '0 auto' }}>{im.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {project.product.images.filter((im) => im.src).map((im, i) => (
                    <div key={'img' + i} style={{ gridRow: 2, height: 'clamp(320px, 34vw, 460px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                      <img src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              ) : project.product.images && project.product.images.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: project.product.images.filter((im) => im.src).length > 1
                    ? 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))' : '1fr',
                  gap: 'clamp(28px, 4.5vw, 72px)',
                }}>
                  {project.product.images.filter((im) => im.src).map((im, i) => (
                    <div key={i}>
                      {im.caption && (
                        <div style={{ minHeight: 124, marginBottom: 'clamp(20px, 2.5vw, 32px)', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 'clamp(17px, 1.6vw, 20px)', lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--fg-1)', marginBottom: 12 }}>{im.label}</div>
                          <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', maxWidth: '44ch', margin: '0 auto' }}>{im.caption}</p>
                        </div>
                      )}
                      {project.slug === 'snapwear' ? (
                        <div style={{ height: 'clamp(320px, 34vw, 460px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                          <img src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: 12 }} />
                        </div>
                      ) : (
                        <img src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {project.product.cta && (
                <div style={{ marginTop: 'clamp(36px, 5vw, 56px)', textAlign: 'center' }}>
                  <a href={project.product.cta.href} target="_blank" rel="noreferrer" style={{
                    display: 'inline-block', padding: '13px 30px', borderRadius: 999,
                    background: 'var(--accent)', color: '#fff', textDecoration: 'none',
                    fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12.5,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>{project.product.cta.label}</a>
                  {project.product.cta.note && (
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, color: 'var(--fg-3)', marginTop: 10 }}>{project.product.cta.note}</div>
                  )}
                </div>
              )}
            </div>
              </div>
        )}

        {/* ── Three Principles ── */}
        {project.principles && project.principles.length > 0 && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>Three Principles</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 2,
            }}>
              {project.principles.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--paper-deep)',
                  padding: 'clamp(28px, 3.5vw, 48px)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  <div style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(40px, 5vw, 64px)', color: 'var(--accent)', lineHeight: 0.9, letterSpacing: '-0.02em' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 2.6vw, 34px)', color: 'var(--ink)', lineHeight: 1.0, letterSpacing: '-0.01em' }}>{p.label}</div>
                  <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)', margin: 0 }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How It Works ── */}
        {project.designSpec && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>How It Works</SectionLabel>
            {project.designSpec.intro && (
              <p style={{ ...bodyText, maxWidth: 760, marginBottom: 'clamp(36px, 5vw, 56px)' }}>{project.designSpec.intro}</p>
            )}
            {project.designSpec.images && project.designSpec.images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(8px, 1.2vw, 16px)' }}>
                {project.designSpec.images.filter((img) => img.src).map((img, i) => (
                  <img key={i} src={img.src} alt={img.label || ''} loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
                ))}
              </div>
            ) : project.designSpec.rows && (
              <div style={{ display: 'grid', gap: 0 }}>
                {project.designSpec.rows.map((r, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: 'minmax(140px, 0.32fr) minmax(0, 1fr)',
                    gap: 'clamp(16px, 3vw, 40px)', padding: 'clamp(16px, 2vw, 22px) 0',
                    borderTop: '1px solid var(--hairline)',
                    borderBottom: i === project.designSpec.rows.length - 1 ? '1px solid var(--hairline)' : 'none',
                    alignItems: 'baseline',
                  }}>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--fg-1)' }}>{r.label}</div>
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-2)' }}>{r.text}</div>
                  </div>
                ))}
              </div>
            )}
            {project.designSpec.cycleImage && (
              <div style={{ marginTop: 'clamp(28px, 4vw, 48px)' }}>
                <ImagePlaceholder label={project.designSpec.cycleImage.label} note={project.designSpec.cycleImage.note} src={project.designSpec.cycleImage.src} aspectRatio={'16 / 9'} />
              </div>
            )}
          </div>
        )}

        {/* ── Try It — interactive prototype (screenshot placeholder) ── */}
        {project.prototype && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel>Try It</SectionLabel>
            {project.prototype.text && (
              <p style={{ ...bodyText, maxWidth: 760, marginBottom: 'clamp(28px, 4vw, 44px)' }}>{project.prototype.text}</p>
            )}
            <ImagePlaceholder label={project.prototype.label} note={project.prototype.note} src={project.prototype.src} aspectRatio={'16 / 9'} />
            {project.prototype.caption && (
              <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)', marginTop: 12 }}>{project.prototype.caption}</div>
            )}
            {project.prototype.link && (
              <a href={project.prototype.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 18, fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>Open the prototype →</a>
            )}
          </div>
        )}

        {/* ── Details — big image + row ── */}
        {project.details && (
          <div style={{ marginBottom: 'clamp(48px, 8vw, 96px)' }}>
            <SectionLabel num="08">Details</SectionLabel>
            {project.details.hero && (
              <div style={{ marginBottom: 'clamp(12px, 1.5vw, 20px)' }}>
                <img src={project.details.hero.src} alt={project.details.hero.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
              </div>
            )}
            {project.details.images && project.details.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${project.details.images.length}, minmax(0, 1fr))`, gap: 'clamp(10px, 1.2vw, 16px)' }}>
                {project.details.images.map((im, i) => (
                  <img key={i} src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
                ))}
              </div>
            )}
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
        {project.controller && (
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
        {project.usage && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <div style={eyebrow}>How It Works</div>
              {project.usage.text && (
                <p style={{ ...bodyText, marginBottom: 32 }}>{project.usage.text}</p>
              )}
              {project.usage.video && (
                <div style={{ maxWidth: 860, margin: '0 auto', marginBottom: 'clamp(44px, 6vw, 72px)' }}>
                  <video controls playsInline preload="metadata"
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12, border: '1px solid var(--hairline)', background: 'var(--paper-deep)' }}>
                    <source src={project.usage.video} type="video/mp4" />
                  </video>
                  {project.usage.videoCaption && (
                    <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-3)', marginTop: 10 }}>{project.usage.videoCaption}</div>
                  )}
                </div>
              )}
              {project.usage.frames && project.usage.frames.length > 0 && (
                <UsageStepper frames={project.usage.frames} />
              )}
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
                      {s.img && (
                        <img src={s.img} alt={s.name} loading="lazy" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', borderRadius: 12, marginBottom: 16 }} />
                      )}
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
              {project.usage.image && (
                <ImagePlaceholder
                  src={project.usage.image.src}
                  label={project.usage.image.label}
                />
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

        {/* ── The App (moved after usage for the Mère §6 order: gallery → pad → controller → usage → app) ── */}
        {project.app && (
          <div style={{ marginBottom: 'clamp(80px, 13vw, 168px)' }}>
            <SectionLabel num="07">The App</SectionLabel>
            {project.app.text && <p style={{ ...bodyText, maxWidth: 680, marginBottom: 'clamp(32px, 4vw, 56px)' }}>{project.app.text}</p>}
            {project.app.images && project.app.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${project.app.images.length}, minmax(0, 1fr))`, gap: 'clamp(12px, 1.5vw, 20px)' }}>
                {project.app.images.map((im, i) => (
                  <img key={i} src={im.src} alt={im.label || ''} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 12 }} />
                ))}
              </div>
            )}
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
        {project.userTesting && (
          <div>
            <div style={{ marginBottom: 80 }}>
              <SectionLabel>Validation</SectionLabel>
              {/* Method + RQs strip */}
              {(project.userTesting.method || project.userTesting.rqs) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: project.userTesting.rqs ? `minmax(0, 1.6fr) repeat(${project.userTesting.rqs.length}, minmax(0, 1fr))` : '1fr',
                  gap: 2,
                  marginBottom: 'clamp(32px, 4vw, 52px)',
                }}>
                  {project.userTesting.method && (
                    <div style={{ background: 'var(--paper-deep)', padding: 'clamp(22px, 2.8vw, 36px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                        Method{project.userTesting.participants ? ' · ' + project.userTesting.participants : ''}
                      </div>
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.5, color: 'var(--fg-1)', margin: 0 }}>{project.userTesting.method}</p>
                    </div>
                  )}
                  {project.userTesting.rqs && project.userTesting.rqs.map((rq, ri) => (
                    <div key={ri} style={{ background: 'var(--paper-deep)', padding: 'clamp(22px, 2.8vw, 36px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                        RQ {String(ri + 1).padStart(2, '0')}
                      </div>
                      <p style={{ fontFamily: 'Archivo, sans-serif', fontSize: 15, lineHeight: 1.5, color: 'var(--fg-1)', margin: 0 }}>{rq}</p>
                    </div>
                  ))}
                </div>
              )}
              {project.userTesting.setup && (
                <p style={{ ...bodyText, marginBottom: 32 }}>{project.userTesting.setup}</p>
              )}
              {/* What Worked — full-width key-insight row */}
              {project.userTesting.positives && project.userTesting.positives.length > 0 && (
                <div style={{ marginBottom: 'clamp(40px, 5vw, 64px)' }}>
                  <div style={{ ...eyebrow, color: 'var(--accent)', marginBottom: 'clamp(18px, 2.5vw, 28px)' }}>What Worked</div>
                  <div style={{ display: 'grid', gap: 0 }}>
                    {project.userTesting.positives.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 2.5vw, 32px)',
                        padding: 'clamp(18px, 2.2vw, 28px) 0',
                        borderTop: '1px solid var(--hairline)',
                        borderBottom: i === project.userTesting.positives.length - 1 ? '1px solid var(--hairline)' : 'none',
                      }}>
                        <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 3.2vw, 44px)', color: 'var(--accent)', lineHeight: 1, flexShrink: 0 }}>+</span>
                        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 600, fontSize: 'clamp(16px, 1.5vw, 19px)', color: 'var(--fg-1)', lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* What to Improve — full-width key-insight row */}
              {project.userTesting.negatives && project.userTesting.negatives.length > 0 && (
                <div style={{ marginBottom: 'clamp(40px, 5vw, 64px)' }}>
                  <div style={{ ...eyebrow, marginBottom: 'clamp(18px, 2.5vw, 28px)' }}>What to Improve</div>
                  <div style={{ display: 'grid', gap: 0 }}>
                    {project.userTesting.negatives.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 2.5vw, 32px)',
                        padding: 'clamp(18px, 2.2vw, 28px) 0',
                        borderTop: '1px solid var(--hairline)',
                        borderBottom: i === project.userTesting.negatives.length - 1 ? '1px solid var(--hairline)' : 'none',
                      }}>
                        <span style={{ fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 3.2vw, 44px)', color: 'var(--fg-3)', lineHeight: 1, flexShrink: 0 }}>→</span>
                        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 600, fontSize: 'clamp(16px, 1.5vw, 19px)', color: 'var(--fg-1)', lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            borderRadius: 16,
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
    <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
    </LightboxCtx.Provider>
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
        <SectionHeader eyebrow="Selected Work" title="Work" caption={(() => {
          const years = PROJECTS.flatMap((p) => p.period.match(/\d{4}/g) || []).map(Number);
          return `${PROJECTS.length} projects · ${Math.min(...years)} – ${Math.max(...years)}`;
        })()} />
        <div style={{ marginTop: 8, paddingBottom: 24 }}>
          {PROJECTS.map((p, i) => (
            <Reveal key={p.slug}>
              <ProjectRow p={p} onOpen={onOpen} last={i === PROJECTS.length - 1} />
            </Reveal>
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
{ company: 'Pangolin', role: 'UX Researcher Intern', period: '2025.03 – 2026.02' },
{ company: 'Logitech', role: 'Industrial Design Intern', period: '2024.03 – 2024.07' }];


const EDUCATION = [
{ label: 'M.Sc. HCI · TH Augsburg', period: '2026.03 – Now' },
{ label: 'Exchange Student · Eindhoven University of Technology', period: '2024.09 – 2025.02' },
{ label: 'B.S. Industrial Design · NTUST', period: '2020 – 2024' }];


const SKILL_GROUPS = [
  { label: 'UX Methods', items: ['User Research', 'User Interviews', 'Usability Testing', 'Survey Design', 'Personas', 'Journey Mapping', 'Affinity Mapping', 'Qualitative Analysis', 'Prototyping'] },
  { label: 'Design', items: ['Figma', 'Rhino', 'Framer', 'KeyShot', '3D Modeling', 'Physical Prototyping', 'Marvelous Designer'] },
  { label: 'Development', items: ['HTML', 'CSS', 'JavaScript', 'Python', 'AI-assisted Dev'] },
  { label: 'Languages', items: ['Mandarin — native', 'English — C1'] },
];


function AboutSection() {
  const narrow = useIsNarrow();
  return (
    <section id="about" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(120px, 16vh, 200px)', fontWeight: "400"
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', lineHeight: "1.5" }}>
        <div style={{
          display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: narrow ? 40 : 64,
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
/* ---------- Skills — toolkit columns (own full section) ---------- */
function SkillsSection() {
  const narrow = useIsNarrow();
  return (
    <section id="skills" style={{
      paddingLeft: 'var(--gutter)', paddingRight: 'var(--gutter)',
      marginTop: 'clamp(120px, 16vh, 200px)'
    }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <Reveal>
          <div style={{
            fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--fg-3)', marginBottom: 24
          }}>Toolkit</div>
          <h2 style={{
            fontFamily: "'Big Shoulders Display', Helvetica, sans-serif", fontWeight: 800,
            fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.02em',
            margin: '0 0 clamp(40px, 6vw, 72px) 0', color: 'var(--ink)', maxWidth: 560
          }}>Ask, make, measure, repeat.</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 'clamp(28px, 4vw, 48px)'
          }}>
            {SKILL_GROUPS.map((g) => (
              <div key={g.label} style={{ borderTop: '1px solid var(--hairline)', paddingTop: 18 }}>
                <div style={{
                  fontFamily: 'Archivo, sans-serif', fontSize: 10.5, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--fg-3)', marginBottom: 16
                }}>{g.label}</div>
                <div style={{ display: 'grid', gap: 9 }}>
                  {g.items.map((s) => (
                    <div key={s} style={{
                      fontFamily: 'Archivo, sans-serif', fontSize: 13.5,
                      color: 'var(--fg-2)', lineHeight: 1.4
                    }}>{s}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>);
}

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

        {/* Display heading — click opens a mail draft; hover hollows the type */}
        <Reveal>
          <h2 style={{
            fontFamily: "'Big Shoulders Display', Helvetica, sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(96px, 18vw, 280px)',
            lineHeight: 0.85, letterSpacing: '-0.025em',
            margin: 0
          }}>
            <a href="mailto:babalimao5244@gmail.com?subject=Hello%20Nicole" className="lets-talk">Let's talk !</a>
          </h2>
        </Reveal>

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
  const narrow = useIsNarrow();
  if (narrow) return null;
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
/* Usage stepper — crossfade on frame change */
.usage-frame-img { animation: faFrameFade 320ms ease; }
@keyframes faFrameFade { from { opacity: 0 } to { opacity: 1 } }

/* Findings grid — one column per finding, stacks on narrow screens */
.findings-grid { grid-template-columns: repeat(var(--fcount, 3), minmax(0, 1fr)); }
@media (max-width: 680px) { .findings-grid { grid-template-columns: 1fr; } }

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
  const [dark, setDark] = useState(true); // dark is the default look (2026-07-18)
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
        <style>{TWEAK_CSS}</style><CustomCursor />
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
      <style>{TWEAK_CSS}</style><CustomCursor />
      <PortfolioNav dark={isNoir || dark} onToggleDark={() => setDark((d) => !d)} />
      <ScrollIndicator />
      <main>
        <Hero />
        <WorkSection />
        <AboutSection />
        <SkillsSection />
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
