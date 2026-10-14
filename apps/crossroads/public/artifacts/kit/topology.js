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
    nodes: [{ id, layer, x, y, w, label, sub, desc, status, evidence, refs,
              hue, h, solid, vertical, governance: { text, docs } }],  // optional: own hue, height, public-register fill,
                                                                 // vertical label (rails), governance distillation
    decor: [{ d, hue }],                 // optional decorative paths (e.g. rail ticks), drawn under edges
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

    // Scaffold: a pinned strip (intro beside the detail panel, then controls), the zoomable diagram, layer cards.
    // Build-state filter: chips that toggle like checkboxes; the active ones are bold.
    // Each label reserves its bold width (CSS ::after), so toggling never shifts the row.
    const chip = (key, label, dot) => `<button type="button" data-f="${key}" aria-pressed="true">${dot || ''}<span class="tk-chip-text" data-text="${esc(label)}">${esc(label)}</span></button>`;
    const filterKeys = status ? [...Object.keys(status.labels), ...(status.untracked ? ['untracked'] : [])] : [];
    const filterChips = status
      ? chip('all', 'All')
        + Object.entries(status.labels).map(([k, label]) => chip(k, label, `<i class="sdot" style="background:var(--st-${k})"></i>`)).join('')
        + (status.untracked ? chip('untracked', status.untracked, '<i class="sdot untracked"></i>') : '')
      : '';
    mount.innerHTML = `
      <div class="tk-sticky">
        <div class="tk-top">
          <div class="tk-intro"></div>
          <aside class="tk-panel" aria-live="polite"><p class="empty">${cfg.emptyText ||
            'Select a node, or a coloured layer band, to see its role and connections. Hover to trace its edges. <kbd>Tab</kbd> moves between nodes; <kbd>Esc</kbd> clears.'}</p></aside>
        </div>
        <div class="controls">
          ${status ? `<span class="tk-filter" role="group" aria-label="Filter by build state"><span class="tk-filter-label">Filter by build state:</span>${filterChips}</span>` : ''}
          <span class="tk-zoom" role="group" aria-label="Map size">
            <button type="button" data-zoom="out" aria-label="Smaller">−</button>
            <span class="tk-zoom-label" aria-live="polite"></span>
            <button type="button" data-zoom="in" aria-label="Larger">+</button>
            <button type="button" data-zoom="width">Fit width</button>
            <button type="button" data-zoom="all">Fit all</button>
          </span>
        </div>
      </div>
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
    const defs = el('defs', {}, svg);
    for (const [id, color] of [['tkArrow', 'var(--edge)'], ['tkArrowHot', 'var(--edge-hot)']]) {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
    }

    // Bands, then label tags, then edges (so arrowheads sit above the tags), then nodes.
    const gBands = el('g', {}, svg);
    const bandEls = {};
    for (const b of BANDS) {
      const h = hue(b.layer);
      const r = el('rect', { class: 'band', x: b.x, y: b.y, width: b.w, height: b.h, rx: 12, fill: `var(--${h}-b)`, stroke: `var(--${h}-s)`,
        tabindex: 0, role: 'button', 'aria-label': `${LAYERS[b.layer].full}, layer` }, gBands);
      (bandEls[b.layer] ||= []).push(r);
      r.addEventListener('focus', () => selectLayer(b.layer));
      r.addEventListener('click', e => { e.stopPropagation(); if (selected !== 'layer:' + b.layer) selectLayer(b.layer); });
    }
    const gDecor = el('g', {}, svg);
    for (const d of cfg.decor || []) el('path', { class: 'decor', d: d.d, stroke: `var(--${d.hue}-s)`, 'stroke-width': 1.6, 'stroke-dasharray': '3 4', opacity: 0.7 }, gDecor);
    const gLabels = el('g', { class: 'band-tag' }, svg);
    const gEdges = el('g', {}, svg);

    // Resolve each edge's sides, then spread ports along each side so lines don't pile up.
    const NH = n => n.h || H;
    const cx = n => n.x + n.w / 2, cy = n => n.y + NH(n) / 2;
    const routed = EDGES.map(e => {
      const a = byId[e.f], b = byId[e.t];
      if (!a || !b) throw new Error(`TopologyKit: edge ${e.f} → ${e.t} names an unknown node`);
      let sa, sb;
      if (e.mode === 'arc') { sa = 'top'; sb = 'top'; }
      else if (e.mode === 'sv') { sa = cx(b) < cx(a) ? 'left' : 'right'; sb = 'top'; }
      else if (e.mode === 'h') { const r = cx(b) > cx(a); sa = r ? 'right' : 'left'; sb = r ? 'left' : 'right'; }
      else if (b.y >= a.y + NH(a)) { sa = 'bottom'; sb = 'top'; }
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
          ? { x: node.x + 18 + t * (node.w - 36), y: side === 'top' ? node.y : node.y + NH(node) }
          : { x: side === 'left' ? node.x : node.x + node.w, y: node.y + 10 + t * (NH(node) - 20) };
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
      const h = n.hue || hue(n.layer), nh = NH(n);
      // Solid nodes use the public register (bold fill); others the backend register.
      const fill = n.solid ? `var(--${h}-p)` : `var(--${h}-n)`, ink = n.solid ? `var(--${h}-pt)` : `var(--${h}-t)`;
      const cls = 'node' + (n.status === 'planned' ? ' planned' : '') + (n.solid ? ' solid' : '') + (n.vertical ? ' vertical' : '');
      const g = el('g', { class: cls, tabindex: 0, role: 'button', 'aria-label': `${n.label}, ${LAYERS[n.layer].full}` }, gNodes);
      el('rect', { class: 'box', x: n.x, y: n.y, width: n.w, height: nh, rx: 8, fill, stroke: n.solid ? `var(--${h}-p)` : `var(--${h}-s)`, 'stroke-width': 1.8 }, g);
      if (n.vertical) {
        const tx = n.x + n.w / 2 + 4, ty = n.y + nh / 2;
        el('text', { x: tx, y: ty, fill: ink, 'text-anchor': 'middle', transform: `rotate(-90 ${tx} ${ty})` }, g).textContent = n.label;
      } else {
        el('rect', { x: n.x, y: n.y + 8, width: 5, height: nh - 16, rx: 2, fill: n.solid ? ink : `var(--${h}-s)`, opacity: n.solid ? 0.55 : 1 }, g);
        el('text', { x: n.x + 14, y: n.y + 20, fill: ink }, g).textContent = n.label;
        if (n.sub) el('text', { x: n.x + 14, y: n.y + 37, fill: ink, class: 'sub' }, g).textContent = n.sub;
      }
      if (status) {
        const badge = el('circle', { class: 'badge', cx: n.x + n.w - 12, cy: n.y + (n.vertical ? nh - 12 : 12), r: 6 }, g);
        if (n.status) badge.setAttribute('fill', `var(--st-${n.status})`);
        else { badge.setAttribute('fill', 'none'); badge.setAttribute('stroke', 'var(--fg-faint)'); badge.setAttribute('stroke-dasharray', '2 2'); badge.setAttribute('stroke-width', 1.5); }
      }
      nodeEls[n.id] = g;
      g.dataset.st = n.status || 'untracked';
      g.addEventListener('mouseenter', () => { if (!selected) focus(n.id); });
      g.addEventListener('mouseleave', () => { if (!selected) clear(); });
      g.addEventListener('focus', () => select(n.id));
      // A click focuses the node first (which selects it), so the click only selects, never toggles off.
      // One click moves from any node to any other; Esc or a click on the background clears.
      g.addEventListener('click', e => { e.stopPropagation(); if (selected !== n.id) select(n.id); });
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
      Object.values(bandEls).flat().forEach(r => r.classList.remove('selected'));
    }
    const emptyPanel = panel.innerHTML;
    const names = ids => [...new Set(ids)].map(i => esc(byId[i].label)).join(', ') || '—';
    // Governance view (experiment): a node may carry a short distillation of what governs it.
    // The chip swaps the description for it; the choice sticks as you move between nodes.
    let govView = false;
    function panelHTML(id, gov = govView) {
      const n = byId[id], L = LAYERS[n.layer];
      const showGov = gov && n.governance;
      const ins = EDGES.filter(e => e.t === id).map(e => e.f);
      const outs = EDGES.filter(e => e.f === id).map(e => e.t);
      let st = '';
      if (status) {
        // One line only: the panel clips the evidence with an ellipsis; the full text is in the tooltip.
        const line = n.status
          ? `<strong style="color:var(--st-${n.status})">● ${esc(status.labels[n.status] || n.status)}</strong>${n.evidence ? ' — ' + n.evidence : ''}`
          : `<strong>Not tracked</strong> in ${status.source}. No build claim is made here.`;
        const plain = line.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        st = `<div class="p-status" title="${esc(plain)}">${line}</div>`;
      }
      const refs = n.refs && n.refs.length ? `<div class="p-refs"><b>Sources:</b> ${n.refs.map(r => `<code>${esc(r)}</code>`).join(' ')}</div>` : '';
      return `
        <div class="p-head"><h2>${esc(n.label)}</h2><span class="p-layer" style="color:var(--${L.hue}-s)">${esc(L.full)}</span>${n.governance
          ? `<button type="button" class="p-chip" data-gov aria-pressed="${showGov ? 'true' : 'false'}">Show governance</button>` : ''}</div>
        ${showGov
          ? `<p class="p-gov">${n.governance.text}</p>
        <div class="p-links"><b>Governed by:</b> ${(n.governance.docs || []).map(d => `<code>${esc(d)}</code>`).join(' ')}</div>`
          : `<p>${n.desc}</p>
        <div class="p-links"><b>From:</b> ${names(ins)}<span class="sep">·</span><b>To:</b> ${names(outs)}</div>
        ${refs}`}${st ? '<div class="p-fill"></div>' + st : ''}`;
    }
    function select(id) {
      selected = id; clear(); focus(id); nodeEls[id].classList.add('selected');
      panel.innerHTML = panelHTML(id);
    }
    // A layer's panel: what the layer is, what it holds, and how much of it is built.
    function layerHTML(key) {
      const L = LAYERS[key], members = NODES.filter(n => n.layer === key);
      let st = '';
      if (status) {
        const counts = {};
        for (const n of members) { const k = n.status || 'untracked'; counts[k] = (counts[k] || 0) + 1; }
        st = '<div class="p-status">' + Object.entries(counts).map(([k, c]) => k === 'untracked'
          ? `<strong>${c} not tracked</strong>`
          : `<strong style="color:var(--st-${k})">● ${c} ${esc(status.labels[k] || k)}</strong>`).join(' · ') + '</div>';
      }
      return `
        <div class="p-head"><h2>${esc(L.full)}</h2><span class="p-layer" style="color:var(--${L.hue}-s)">Layer</span></div>
        <p>${L.desc}</p>
        <div class="p-links"><b>Holds:</b> ${names(members.map(n => n.id))}</div>
        ${st ? '<div class="p-fill"></div>' + st : ''}`;
    }
    function selectLayer(key) {
      selected = 'layer:' + key; clear();
      svg.classList.add('focusing');
      for (const n of NODES) if (n.layer === key) nodeEls[n.id].classList.add('lit');
      (bandEls[key] || []).forEach(r => r.classList.add('selected'));
      panel.innerHTML = layerHTML(key);
    }
    // Reserve the tallest panel's height so selecting a node never moves the diagram.
    // Measured at the panel's real width, and again whenever the width changes.
    function reservePanelHeight() {
      const current = panel.innerHTML;
      panel.style.minHeight = '';
      let tallest = 0;
      const govPanels = NODES.filter(n => n.governance).map(n => panelHTML(n.id, true));
      for (const html of [emptyPanel, ...NODES.map(n => panelHTML(n.id, false)), ...govPanels, ...Object.keys(bandEls).map(layerHTML)]) {
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
    panel.addEventListener('click', e => {
      if (!e.target.closest('[data-gov]') || !byId[selected]) return;
      govView = !govView;
      panel.innerHTML = panelHTML(selected);
    });
    function deselect() { selected = null; clear(); panel.innerHTML = emptyPanel; }
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      deselect();
      document.activeElement?.blur?.();
      // Keyboard events stay inside an iframe. Send only a close signal;
      // the article modal validates this frame's window and origin.
      if (window.parent !== window) window.parent.postMessage({ type: 'crossroads:topology:escape' }, '*');
    });
    diagram.addEventListener('click', () => { if (selected) deselect(); });

    // Filter: with every chip on, all badges show; with some on, the rest of the nodes fade;
    // with none on, badges hide and nothing fades. All turns every chip on, or off if they already are.
    const active = new Set(filterKeys);
    const chips = [...mount.querySelectorAll('[data-f]')];
    function applyFilter() {
      svg.classList.toggle('show-status', active.size > 0);
      const partialFilter = active.size > 0 && active.size < filterKeys.length;
      for (const g of Object.values(nodeEls)) g.classList.toggle('filtered-out', partialFilter && !active.has(g.dataset.st));
      for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.f === 'all' ? active.size === filterKeys.length : active.has(c.dataset.f)));
    }
    chips.forEach(c => c.addEventListener('click', () => {
      const k = c.dataset.f;
      if (k === 'all') { const all = active.size === filterKeys.length; active.clear(); if (!all) filterKeys.forEach(f => active.add(f)); }
      else active.has(k) ? active.delete(k) : active.add(k);
      applyFilter();
    }));
    applyFilter();

    // Theme toggle: any element with data-theme-toggle.
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
    }));

    // Map size. 'width' fits the frame's width (never below minWidth, so small screens scroll sideways);
    // 'all' fits the whole map under the pinned strip; − and + step from wherever it is.
    const sticky = mount.querySelector('.tk-sticky');
    const zoomLabel = mount.querySelector('.tk-zoom-label');
    const minW = cfg.minWidth || 820;
    let zoomMode = 'width', scale = 1;
    const frameW = () => diagram.clientWidth - 16;
    const pinnedH = () => getComputedStyle(sticky).position === 'sticky' ? sticky.offsetHeight : 0;
    function applyZoom() {
      if (zoomMode === 'width') scale = Math.max(frameW(), minW) / VW;
      if (zoomMode === 'all') scale = Math.min(frameW() / VW, (window.innerHeight - pinnedH() - 32) / VH);
      scale = Math.min(3, Math.max(0.3, scale));
      svg.style.width = Math.round(VW * scale) + 'px';
      zoomLabel.textContent = Math.round(scale * 100) + '%';
    }
    mount.querySelectorAll('[data-zoom]').forEach(btn => btn.addEventListener('click', () => {
      const z = btn.dataset.zoom;
      if (z === 'in' || z === 'out') { zoomMode = 'manual'; scale *= z === 'in' ? 1.2 : 1 / 1.2; }
      else zoomMode = z;
      applyZoom();
      if (z === 'all') window.scrollTo({ top: diagram.getBoundingClientRect().top + window.scrollY - pinnedH() - 8, behavior: 'smooth' });
    }));
    applyZoom();
    window.addEventListener('resize', () => { if (zoomMode !== 'manual') applyZoom(); });

    // Deep link: #ID selects that node.
    // Deep link: #layer-<key> selects a layer.
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (byId[id]) select(id);
      else if (id.startsWith('layer-') && bandEls[id.slice(6)]) selectLayer(id.slice(6));
    };
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
