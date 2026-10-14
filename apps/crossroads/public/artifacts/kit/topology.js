/*
  Topology kit — renders a hand-laid layered map from plain data.
  Pattern source: puddlejump/reference/topology/topology-library.md
  First extracted from artifacts/loom/loom-topology-enhanced.html (2026-10-14).

  Usage: TopologyKit.render({
    mount: '#map',                       // element that receives controls, panel, diagram, layer cards
    viewBox: [1040, 790], minWidth: 820, // SVG coordinate space; below minWidth the diagram scrolls
    layers: { key: { name, full, hue, desc } },  // hue is a kit hue: teal violet orange blue gold slate rose grey green brick
    layerOrder: ['key', ...],            // order of the layer cards
    bands: [{ layer, x, y, w, h }],      // coloured layer backgrounds
    nodes: [{ id, layer, x, y, w, label, sub, desc, status, evidence, refs }],
    edges: [[from, to, mode, { dashed }]], // mode: undefined (vertical) | 'h' (side to side) | 'arc' (over the top)
                                         //       | 'sv' (out of the side facing the target, then down into its top)
    status: { source, labels: { built: 'Built', ... }, untracked } | null,
    ariaLabel, emptyText, nodeHeight: 48,
    intro: 'body > header',              // element moved beside the panel, in one row; null to leave it in place
  });
  status values are keys of status.labels; each needs a --st-<key> colour in topology.css.
  A node whose status is 'planned' is drawn with a dashed border. null means "not tracked".
*/
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a = {}, parent) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render(cfg) {
    const mount = typeof cfg.mount === 'string' ? document.querySelector(cfg.mount) : cfg.mount;
    const H = cfg.nodeHeight || 48;
    const [VW, VH] = cfg.viewBox;
    const { layers: LAYERS, bands: BANDS, nodes: NODES } = cfg;
    const EDGES = cfg.edges.map(e => ({ f: e[0], t: e[1], mode: e[2], opts: e[3] || {} }));
    const status = cfg.status || null;
    const hue = l => LAYERS[l].hue;
    const byId = Object.fromEntries(NODES.map(n => [n.id, n]));

    // Scaffold: intro and detail panel share the top row, then controls, the full-width diagram, layer cards.
    const keyItems = status
      ? Object.entries(status.labels).map(([k, label]) => `<span><i class="sdot" style="background:var(--st-${k})"></i>${esc(label)}</span>`).join('')
        + (status.untracked ? `<span><i class="sdot untracked"></i>${esc(status.untracked)}</span>` : '')
      : '';
    mount.innerHTML = `
      <div class="tk-top">
        <div class="tk-intro"></div>
        <aside class="tk-panel" aria-live="polite"><p class="empty">${cfg.emptyText ||
          'Select a node to see its role and connections. Hover to trace its edges. <kbd>Tab</kbd> moves between nodes; <kbd>Esc</kbd> clears.'}</p></aside>
      </div>
      ${status ? `<div class="controls">
        <label><input type="checkbox" data-tk="showStatus" checked> Show build state</label>
        <span class="status-key">${keyItems}</span>
      </div>` : ''}
      <div class="stage">
        <div class="tk-diagram" role="img" aria-label="${esc(cfg.ariaLabel || 'Topology diagram')}"></div>
      </div>
      <section class="layers"><h3>Layer reference</h3><div class="layer-grid"></div></section>`;
    const panel = mount.querySelector('.tk-panel');
    const diagram = mount.querySelector('.tk-diagram');
    const introEl = cfg.intro === null ? null : document.querySelector(cfg.intro || 'body > header');
    if (introEl) mount.querySelector('.tk-intro').appendChild(introEl);
    else mount.querySelector('.tk-top').classList.add('no-intro');

    const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, xmlns: NS });
    svg.style.minWidth = (cfg.minWidth || 820) + 'px';
    const defs = el('defs', {}, svg);
    for (const [id, color] of [['tkArrow', 'var(--edge)'], ['tkArrowHot', 'var(--edge-hot)']]) {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
    }

    // Bands, then label tags, then edges (so arrowheads sit above the tags), then nodes.
    const gBands = el('g', {}, svg);
    for (const b of BANDS) {
      const h = hue(b.layer);
      el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, fill: `var(--${h}-b)`, stroke: `var(--${h}-s)`, 'stroke-opacity': 0.35 }, gBands);
    }
    const gLabels = el('g', { class: 'band-tag' }, svg);
    const gEdges = el('g', {}, svg);

    // Resolve each edge's sides, then spread ports along each side so lines don't pile up.
    const cx = n => n.x + n.w / 2, cy = n => n.y + H / 2;
    const routed = EDGES.map(e => {
      const a = byId[e.f], b = byId[e.t];
      if (!a || !b) throw new Error(`TopologyKit: edge ${e.f} → ${e.t} names an unknown node`);
      let sa, sb;
      if (e.mode === 'arc') { sa = 'top'; sb = 'top'; }
      else if (e.mode === 'sv') { sa = cx(b) < cx(a) ? 'left' : 'right'; sb = 'top'; }
      else if (e.mode === 'h') { const r = cx(b) > cx(a); sa = r ? 'right' : 'left'; sb = r ? 'left' : 'right'; }
      else if (b.y >= a.y + H) { sa = 'bottom'; sb = 'top'; }
      else { sa = 'top'; sb = 'bottom'; }
      return { ...e, a, b, sa, sb };
    });
    const ports = {};
    const addPort = (node, side, other, key) => ((ports[node.id + '|' + side] ||= []).push({ other, key }));
    routed.forEach((r, i) => { addPort(r.a, r.sa, r.b, i + 'a'); addPort(r.b, r.sb, r.a, i + 'b'); });
    const portPos = {};
    for (const k in ports) {
      const [id, side] = k.split('|'), node = byId[id], list = ports[k];
      const horiz = side === 'top' || side === 'bottom';
      list.sort((p, q) => horiz ? cx(p.other) - cx(q.other) : cy(p.other) - cy(q.other));
      list.forEach((p, i) => {
        const t = (i + 1) / (list.length + 1);
        portPos[p.key] = horiz
          ? { x: node.x + 18 + t * (node.w - 36), y: side === 'top' ? node.y : node.y + H }
          : { x: side === 'left' ? node.x : node.x + node.w, y: node.y + 10 + t * (H - 20) };
      });
    }
    const pathFor = (r, i) => {
      const p = portPos[i + 'a'], q = portPos[i + 'b'];
      if (r.mode === 'arc') { const y = Math.min(p.y, q.y) - 30; return `M${p.x},${p.y} C${p.x},${y} ${q.x},${y} ${q.x},${q.y}`; }
      if (r.mode === 'sv') return `M${p.x},${p.y} C${q.x},${p.y} ${q.x},${p.y} ${q.x},${q.y}`;
      if (r.mode === 'h') { const mx = (p.x + q.x) / 2; return `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`; }
      const my = (p.y + q.y) / 2;
      return `M${p.x},${p.y} C${p.x},${my} ${q.x},${my} ${q.x},${q.y}`;
    };
    const edgeEls = routed.map((r, i) => {
      const path = el('path', { d: pathFor(r, i), class: 'edge' + (r.opts.dashed ? ' dashed' : ''), 'marker-end': 'url(#tkArrow)' }, gEdges);
      path.dataset.from = r.f; path.dataset.to = r.t;
      return path;
    });

    const gNodes = el('g', {}, svg);
    const nodeEls = {};
    let selected = null;
    for (const n of NODES) {
      const h = hue(n.layer);
      const g = el('g', { class: 'node' + (n.status === 'planned' ? ' planned' : ''), tabindex: 0, role: 'button', 'aria-label': `${n.label}, ${LAYERS[n.layer].full}` }, gNodes);
      el('rect', { class: 'box', x: n.x, y: n.y, width: n.w, height: H, rx: 8, fill: `var(--${h}-n)`, stroke: `var(--${h}-s)`, 'stroke-width': 1.6 }, g);
      el('rect', { x: n.x, y: n.y + 8, width: 4, height: H - 16, rx: 2, fill: `var(--${h}-s)` }, g);
      el('text', { x: n.x + 14, y: n.y + 20, fill: `var(--${h}-t)` }, g).textContent = n.label;
      if (n.sub) el('text', { x: n.x + 14, y: n.y + 37, fill: `var(--${h}-t)`, class: 'sub' }, g).textContent = n.sub;
      if (status) {
        const badge = el('circle', { class: 'badge', cx: n.x + n.w - 12, cy: n.y + 12, r: 6 }, g);
        if (n.status) badge.setAttribute('fill', `var(--st-${n.status})`);
        else { badge.setAttribute('fill', 'none'); badge.setAttribute('stroke', 'var(--fg-faint)'); badge.setAttribute('stroke-dasharray', '2 2'); badge.setAttribute('stroke-width', 1.5); }
      }
      nodeEls[n.id] = g;
      g.addEventListener('mouseenter', () => { if (!selected) focus(n.id); });
      g.addEventListener('mouseleave', () => { if (!selected) clear(); });
      g.addEventListener('focus', () => select(n.id));
      g.addEventListener('click', e => { e.stopPropagation(); selected === n.id ? deselect() : select(n.id); });
    }

    diagram.appendChild(svg);
    // Label tags need text measurement, so they are drawn once the SVG is in the document.
    for (const b of BANDS) {
      const h = hue(b.layer);
      const t = el('text', { x: b.x + 14, y: b.y + 21, class: 'band-label', fill: `var(--${h}-s)` }, gLabels);
      t.textContent = b.label || LAYERS[b.layer].full;
      const bg = el('rect', { x: b.x + 8, y: b.y + 8, width: t.getComputedTextLength() + 12, height: 19, rx: 5, fill: `var(--${h}-b)` });
      gLabels.insertBefore(bg, t);
    }

    function focus(id) {
      svg.classList.add('focusing');
      Object.values(nodeEls).forEach(g => g.classList.remove('lit'));
      nodeEls[id].classList.add('lit');
      for (const p of edgeEls) {
        const hot = p.dataset.from === id || p.dataset.to === id;
        p.classList.toggle('hot', hot);
        p.setAttribute('marker-end', hot ? 'url(#tkArrowHot)' : 'url(#tkArrow)');
        if (hot) { nodeEls[p.dataset.from].classList.add('lit'); nodeEls[p.dataset.to].classList.add('lit'); }
      }
    }
    function clear() {
      svg.classList.remove('focusing');
      edgeEls.forEach(p => { p.classList.remove('hot'); p.setAttribute('marker-end', 'url(#tkArrow)'); });
      Object.values(nodeEls).forEach(g => g.classList.remove('lit', 'selected'));
    }
    const emptyPanel = panel.innerHTML;
    const names = ids => [...new Set(ids)].map(i => esc(byId[i].label)).join(', ') || '—';
    function panelHTML(id) {
      const n = byId[id], L = LAYERS[n.layer];
      const ins = EDGES.filter(e => e.t === id).map(e => e.f);
      const outs = EDGES.filter(e => e.f === id).map(e => e.t);
      let st = '';
      if (status) {
        st = n.status
          ? `<div class="p-status"><strong style="color:var(--st-${n.status})">● ${esc(status.labels[n.status] || n.status)}</strong>${n.evidence ? ' — ' + n.evidence : ''}</div>`
          : `<div class="p-status"><strong>Not tracked</strong> in ${status.source}. No build claim is made here.</div>`;
      }
      const refs = n.refs && n.refs.length ? `<div class="p-refs"><b>Sources:</b> ${n.refs.map(r => `<code>${esc(r)}</code>`).join(' ')}</div>` : '';
      return `
        <div class="p-layer" style="color:var(--${L.hue}-s)">${esc(L.full)}</div>
        <h2>${esc(n.label)}</h2>
        <p>${n.desc}</p>
        <div class="p-links"><b>From:</b> ${names(ins)}<br><b>To:</b> ${names(outs)}</div>
        ${refs}${st}`;
    }
    function select(id) {
      selected = id; clear(); focus(id); nodeEls[id].classList.add('selected');
      panel.innerHTML = panelHTML(id);
    }
    // Reserve the tallest panel's height so selecting a node never moves the diagram.
    // Measured at the panel's real width, and again whenever the width changes.
    function reservePanelHeight() {
      const current = panel.innerHTML;
      panel.style.minHeight = '';
      let tallest = 0;
      for (const html of [emptyPanel, ...NODES.map(n => panelHTML(n.id))]) {
        panel.innerHTML = html;
        tallest = Math.max(tallest, panel.offsetHeight);
      }
      panel.innerHTML = current;
      panel.style.minHeight = tallest + 'px';
    }
    reservePanelHeight();
    let lastWidth = panel.clientWidth, resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (panel.clientWidth !== lastWidth) { lastWidth = panel.clientWidth; reservePanelHeight(); } }, 120);
    });
    function deselect() { selected = null; clear(); panel.innerHTML = emptyPanel; }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { deselect(); document.activeElement?.blur?.(); } });
    diagram.addEventListener('click', () => { if (selected) deselect(); });

    const showStatus = mount.querySelector('[data-tk="showStatus"]');
    if (showStatus) {
      const sync = () => svg.classList.toggle('show-status', showStatus.checked);
      showStatus.addEventListener('change', sync); sync();
    }

    // Theme toggle: any element with data-theme-toggle.
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
    }));

    // Deep link: #ID selects that node.
    const fromHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (byId[id]) select(id); };
    window.addEventListener('hashchange', fromHash); fromHash();

    const grid = mount.querySelector('.layer-grid');
    for (const k of cfg.layerOrder || Object.keys(LAYERS)) {
      const L = LAYERS[k];
      const d = document.createElement('div');
      d.className = 'layer-card';
      d.style.borderLeftColor = `var(--${L.hue}-s)`;
      d.innerHTML = `<b style="color:var(--${L.hue}-s)">${esc(L.full)}</b><span>${L.desc}</span>`;
      grid.appendChild(d);
    }
    return { select, deselect };
  }

  global.TopologyKit = { render };
})(window);
