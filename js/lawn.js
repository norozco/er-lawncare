// Live lawns, seen from above.
//   <section class="lawn" data-lawn="logo" data-spot="#spot">  a mower cuts the ER logo and name into the grass, then it grows back
//   <section class="lawn" data-lawn="stripes">                 a mower cuts classic light and dark stripes across the whole area
//   add data-still to skip the animation (or #still in the address, or reduced motion)
// Also sets --grass on <html> (a grass texture used by the photo placeholders).
(function () {
  const hosts = [...document.querySelectorAll('[data-lawn]')];
  const allStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash === '#still';
  const rand = (a, b) => a + Math.random() * (b - a);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // Seamless tile of grass blades
  function grassTile(size, o) {
    const c = mk(size, size), g = c.getContext('2d');
    g.fillStyle = o.base; g.fillRect(0, 0, size, size);
    g.lineCap = 'round';
    for (let i = 0; i < o.count; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const len = rand(o.len[0], o.len[1]), a = Math.random() * Math.PI * 2, bend = rand(-0.5, 0.5);
      const hi = Math.random() < o.hiRate;
      g.strokeStyle = `hsl(${rand(o.h[0], o.h[1])} ${rand(o.s[0], o.s[1])}% ${hi ? rand(o.hi[0], o.hi[1]) : rand(o.l[0], o.l[1])}%)`;
      g.lineWidth = rand(o.w[0], o.w[1]);
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      const cx = ex / 2 - Math.sin(a) * len * bend * 0.4, cy = ey / 2 + Math.cos(a) * len * bend * 0.4;
      for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
        if ((dx && Math.abs(x + dx - size / 2) > size / 2 + len) || (dy && Math.abs(y + dy - size / 2) > size / 2 + len)) continue;
        g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + cx, y + dy + cy, x + dx + ex, y + dy + ey); g.stroke();
      }
    }
    return c;
  }
  const tileCache = {};
  function tiles(dpr) {
    if (tileCache[dpr]) return tileCache[dpr];
    const t = Math.round(420 * dpr), k = dpr * dpr;
    return (tileCache[dpr] = {
      tall: grassTile(t, { base: '#1d3a14', count: 6600 * k, len: [7 * dpr, 15 * dpr], w: [0.9 * dpr, 1.7 * dpr], h: [92, 122], s: [42, 68], l: [12, 30], hi: [36, 46], hiRate: 0.07 }),
      cut: grassTile(t, { base: '#6d9a3c', count: 7500 * k, len: [2.5 * dpr, 6 * dpr], w: [0.9 * dpr, 1.5 * dpr], h: [78, 98], s: [38, 58], l: [46, 68], hi: [74, 82], hiRate: 0.12 }),
      // mowing stripes: one direction leaves the grass looking light, the other darker
      light: grassTile(t, { base: '#3f6f25', count: 7000 * k, len: [4 * dpr, 9 * dpr], w: [0.9 * dpr, 1.6 * dpr], h: [84, 104], s: [40, 60], l: [32, 50], hi: [56, 64], hiRate: 0.1 }),
      dark: grassTile(t, { base: '#24481a', count: 7000 * k, len: [4 * dpr, 9 * dpr], w: [0.9 * dpr, 1.6 * dpr], h: [96, 116], s: [42, 62], l: [18, 32], hi: [38, 46], hiRate: 0.08 }),
    });
  }

  // Grass texture for the photo placeholders (small, made once)
  try {
    const t = grassTile(260, { base: '#264a1b', count: 3400, len: [4, 9], w: [0.9, 1.6], h: [86, 116], s: [40, 62], l: [18, 40], hi: [48, 56], hiRate: 0.08 });
    document.documentElement.style.setProperty('--grass', `url(${t.toDataURL('image/jpeg', 0.82)})`);
  } catch (e) { /* placeholders keep their plain green */ }

  if (!hosts.length) return;
  const logo = new Image();
  if (hosts.some(h => h.dataset.lawn === 'logo')) logo.src = 'images/logo-full.png';
  const LOGO_ASPECT = 800 / 714;

  function drawMower(ctx, p, s) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.ang);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetX = 5 * s; ctx.shadowOffsetY = 7 * s;
    ctx.fillStyle = '#1b1715';                       // operator
    ctx.beginPath(); ctx.ellipse(-64 * s, 0, 9 * s, 17 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a1a2b';
    ctx.beginPath(); ctx.arc(-63 * s, 0, 7.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#141110'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';   // handle
    ctx.beginPath(); ctx.moveTo(-20 * s, -13 * s); ctx.lineTo(-52 * s, -15 * s); ctx.moveTo(-20 * s, 13 * s); ctx.lineTo(-52 * s, 15 * s);
    ctx.moveTo(-52 * s, -17 * s); ctx.lineTo(-52 * s, 17 * s); ctx.stroke();
    ctx.fillStyle = '#121010';                       // wheels
    for (const [x, y] of [[14, -24], [14, 24], [-15, -24], [-15, 24]]) { ctx.beginPath(); ctx.roundRect((x - 6) * s, (y - 3.5) * s, 12 * s, 7 * s, 2 * s); ctx.fill(); }
    ctx.fillStyle = '#8a1a2b';                       // deck
    ctx.beginPath(); ctx.roundRect(-21 * s, -21 * s, 42 * s, 42 * s, 9 * s); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#a3263a';
    ctx.beginPath(); ctx.roundRect(-17 * s, -17 * s, 34 * s, 34 * s, 7 * s); ctx.fill();
    ctx.fillStyle = '#141110'; ctx.beginPath(); ctx.arc(2 * s, 0, 11 * s, 0, Math.PI * 2); ctx.fill();   // engine
    ctx.fillStyle = '#3b3532'; ctx.beginPath(); ctx.arc(2 * s, 0, 5.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3ede2'; ctx.beginPath(); ctx.arc(4 * s, -2 * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function Lawn(host) {
    const mode = host.dataset.lawn;
    const still = allStill || host.hasAttribute('data-still');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const spot = mode === 'logo' ? document.querySelector(host.dataset.spot) : null;
    let W, H, dpr, S, pat, result, logoCut, path, total, box, swath, ms, speed;
    let d = 0, phase = 'wait', timer = 0, regrow = 0;
    const clips = [];
    const self = { visible: true, ready: false };

    function setup() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hr = host.getBoundingClientRect();
      if (!hr.width || !hr.height) return false;
      W = canvas.width = Math.round(hr.width * dpr); H = canvas.height = Math.round(hr.height * dpr);
      S = dpr * Math.max(0.7, Math.min(1.1, hr.width / 1300));
      const t = tiles(dpr);
      pat = {}; for (const k in t) pat[k] = ctx.createPattern(t[k], 'repeat');

      let pts;
      if (mode === 'logo') {
        // Fit the logo (with its name) inside the spot box
        const sr = spot.getBoundingClientRect();
        let bw = sr.width, bh = sr.height;
        if (bw / bh > LOGO_ASPECT) bw = bh * LOGO_ASPECT; else bh = bw / LOGO_ASPECT;
        bw *= 0.94; bh *= 0.94;
        box = { x: (sr.left - hr.left + (sr.width - bw) / 2) * dpr, y: (sr.top - hr.top + (sr.height - bh) / 2) * dpr, w: bw * dpr, h: bh * dpr };
        logoCut = mk(W, H);
        const lc = logoCut.getContext('2d');
        lc.fillStyle = pat.cut; lc.fillRect(0, 0, W, H);
        lc.globalCompositeOperation = 'destination-in';
        lc.drawImage(logo, box.x, box.y, box.w, box.h);
        swath = Math.max(40 * dpr, Math.min(60 * S, box.h / 7));
        speed = Math.max(340 * dpr, box.w * 1.15);
        // Back and forth over the logo; comes in from the side nearest the logo, leaves off the right edge
        const pad = 26 * S, x0 = box.x - pad, x1 = box.x + box.w + pad;
        const fromRight = box.x + box.w / 2 > W * 0.55;
        let rows = Math.ceil(box.h / swath) + 1;
        const l2rAt = r => (fromRight ? r % 2 === 1 : r % 2 === 0);
        if (!l2rAt(rows - 1)) rows++;
        const top = box.y + box.h / 2 - ((rows - 1) * swath) / 2;
        pts = [[fromRight ? W + 110 * S : -110 * S, top, 0]];
        for (let r = 0; r < rows; r++) {
          const y = top + r * swath, l2r = l2rAt(r);
          pts.push([l2r ? x1 : x0, y, r]);
          if (r < rows - 1) {
            const cx = l2r ? x1 : x0, cy = y + swath / 2;
            for (let k = 1; k <= 10; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI; pts.push([cx + (l2r ? 1 : -1) * Math.cos(a) * swath / 2, cy + Math.sin(a) * swath / 2, r]); }
          }
        }
        pts.push([W + 130 * S, top + (rows - 1) * swath, rows - 1]);
      } else {
        // Full-width stripes, turning just outside the edges so the turns are not seen
        // data-swath sets the stripe width in CSS pixels (short banners use narrower stripes)
        swath = host.dataset.swath ? Number(host.dataset.swath) * dpr : Math.max(56 * dpr, Math.min(96 * S, H / 4));
        speed = Math.max(520 * dpr, W * 0.55);
        const rows = Math.ceil(H / swath) + 1, x0 = -90 * S, x1 = W + 90 * S;
        pts = [[x0 - 40 * S, swath / 2, 0]];
        for (let r = 0; r < rows; r++) {
          const y = swath / 2 + r * swath, l2r = r % 2 === 0;
          pts.push([l2r ? x1 : x0, y, r]);
          if (r < rows - 1) {
            const cx = l2r ? x1 : x0, cy = y + swath / 2;
            for (let k = 1; k <= 8; k++) { const a = -Math.PI / 2 + (k / 8) * Math.PI; pts.push([cx + (l2r ? 1 : -1) * Math.cos(a) * swath / 2, cy + Math.sin(a) * swath / 2, r]); }
          }
        }
      }
      ms = swath / 46;
      path = [{ x: pts[0][0], y: pts[0][1], row: pts[0][2], s: 0 }];
      for (let i = 1; i < pts.length; i++) {
        const p = path[i - 1];
        path.push({ x: pts[i][0], y: pts[i][1], row: pts[i][2], s: p.s + Math.hypot(pts[i][0] - p.x, pts[i][1] - p.y) });
      }
      total = path[path.length - 1].s;
      reset();
      // Home logo: start with about a third already mowed, so the lawn is never empty when the page opens
      if (mode === 'logo' && !still) {
        const start = total * 0.35;
        let prev = at(0);
        for (let s = 0; s <= start; s += 6) { const p = at(s); stamp(prev, p); prev = p; }
        d = start; phase = 'mow';
        render(at(d));
      }
      self.ready = true;
      return true;
    }

    function reset() {
      result = mk(W, H);
      const r = result.getContext('2d');
      r.fillStyle = pat.tall; r.fillRect(0, 0, W, H);
      d = 0; phase = 'wait'; timer = 0; regrow = 0; clips.length = 0;
    }

    function at(dist) {
      let i = 1;
      while (i < path.length - 1 && path[i].s < dist) i++;
      const a = path[i - 1], b = path[i], t = Math.max(0, Math.min(1, (dist - a.s) / Math.max(1e-6, b.s - a.s)));
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x), row: b.row };
    }

    // Mow the strip between two points
    function stamp(p, q) {
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (len < 0.01) return;
      const r = result.getContext('2d');
      r.save();
      r.translate(p.x, p.y); r.rotate(Math.atan2(q.y - p.y, q.x - p.x));
      r.beginPath(); r.rect(-1, -swath / 2, len + 2, swath);
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.clip();
      if (mode === 'logo') {
        r.fillStyle = 'rgba(210, 235, 160, 0.035)'; r.fillRect(0, 0, W, H);   // wheels flatten the tall grass a little
        r.drawImage(logoCut, 0, 0);
      } else {
        r.fillStyle = q.row % 2 === 0 ? pat.light : pat.dark; r.fillRect(0, 0, W, H);
      }
      r.restore();
    }

    function render(mower) {
      ctx.globalAlpha = 1;
      ctx.drawImage(result, 0, 0);
      if (regrow > 0) { ctx.globalAlpha = regrow; ctx.fillStyle = pat.tall; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      for (const c of clips) { ctx.globalAlpha = Math.max(0, c.life / 0.7); ctx.fillStyle = c.col; ctx.fillRect(c.x, c.y, 2.4 * dpr, 2.4 * dpr); }
      ctx.globalAlpha = 1;
      if (mower) drawMower(ctx, mower, ms);
      const g = ctx.createRadialGradient(W * 0.8, H * 0.05, 0, W * 0.8, H * 0.05, Math.max(W, H) * 0.9);
      g.addColorStop(0, 'rgba(255, 240, 200, 0.10)'); g.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    function step(dt) {
      timer += dt;
      if (phase === 'wait') { render(null); if (timer > 0.5) { phase = 'mow'; timer = 0; } return; }
      if (phase === 'mow') {
        const prev = at(d);
        d = Math.min(total, d + speed * dt);
        const now = at(d);
        stamp(prev, now);
        const onScreen = now.x > 0 && now.x < W;
        const inside = mode === 'logo' ? now.x > box.x - 10 && now.x < box.x + box.w + 10 && now.y > box.y - 30 && now.y < box.y + box.h + 30 : onScreen;
        if (inside) for (let k = 0; k < 3; k++) {
          const side = now.ang + Math.PI / 2, v = rand(40, 110) * ms * dpr;
          clips.push({ x: now.x + Math.cos(side) * 22 * ms, y: now.y + Math.sin(side) * 22 * ms, vx: Math.cos(side) * v + rand(-30, 30) * dpr, vy: Math.sin(side) * v + rand(-30, 30) * dpr,
            life: rand(0.4, 0.7), col: `hsl(${rand(80, 100)} 50% ${rand(48, 66)}%)` });
        }
        for (const c of clips) { c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.92; c.vy *= 0.92; }
        for (let i = clips.length - 1; i >= 0; i--) if (clips[i].life <= 0) clips.splice(i, 1);
        render(d < total ? now : null);
        if (d >= total && !clips.length) { phase = mode === 'logo' ? 'hold' : 'done'; timer = 0; }
        return;
      }
      if (phase === 'hold') { render(null); if (timer > 7) { phase = 'regrow'; timer = 0; } return; }
      if (phase === 'regrow') { regrow = Math.min(1, timer / 1.8); render(null); if (regrow >= 1) reset(); }
      // 'done': stripes stay put, nothing to redraw
    }

    function finish() {
      let prev = at(0);
      for (let s = 0; s <= total; s += 6) { const p = at(s); stamp(prev, p); prev = p; }
      phase = 'done';
      render(null);
    }

    self.layout = () => { if (setup() && still) finish(); };
    self.tick = dt => { if (self.ready && !still && phase !== 'done' && self.visible) step(dt); };
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { self.visible = e[e.length - 1].isIntersecting; }, { rootMargin: '80px' }).observe(host);
    // Redo the layout when the width changes (not on phone toolbar height changes)
    let rt, lastW = 0;
    const relayout = () => { clearTimeout(rt); rt = setTimeout(self.layout, 200); };
    if ('ResizeObserver' in window) new ResizeObserver(() => { const w = host.clientWidth; if (w !== lastW) { lastW = w; relayout(); } }).observe(host);
    else window.addEventListener('resize', relayout);
    window.addEventListener('relayout', relayout);
    return self;
  }

  const lawns = hosts.map(Lawn);
  function begin() {
    lawns.forEach(l => l.layout());
    let last = performance.now();
    requestAnimationFrame(function frame(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      if (!document.hidden) lawns.forEach(l => l.tick(dt));
      requestAnimationFrame(frame);
    });
  }
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const logoReady = !logo.src || (logo.complete && logo.naturalWidth) ? Promise.resolve() : new Promise(r => { logo.onload = r; logo.onerror = r; });
  Promise.all([fontsReady, logoReady]).then(begin);
})();
