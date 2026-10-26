/*
  Topology kit — renders a hand-laid layered map from plain data.
  Pattern source: puddlejump/reference/topology/topology-library.md
  First extracted from artifacts/loom/loom-topology-enhanced.html (2026-10-14).

  Usage: TopologyKit.render({
    mount: '#map',                       // element that receives controls, panel, diagram, layer cards
    viewBox: [1040, 790], minWidth: 820, // SVG coordinate space; below minWidth the diagram scrolls
    layers: { key: { name, full, hue, desc } },  // hue is a kit hue: teal violet orange blue gold slate rose grey green brick
    layerOrder: ['key', ...],            // order of the layer cards
    layerGroups: [{ name, member, note, layers: ['key', ...] }], // optional: the Map key under group headings, in this order (replaces layerOrder);
                                         // member names what each band is (for example 'Server'), shown on its popup in place of 'Layer'
    bands: [{ layer, x, y, w, h, label, solid, opacity, labelBelow, labelStack }], // coloured layer backgrounds; solid = public-register fill; labelBelow = label centred under the band;
                                         // labelStack = label inside at the left, one word per line, centred top to bottom
    nodes: [{ id, layer, x, y, w, label, sub, desc, status, evidence, refs,
              hue, h, solid, vertical, small, tiny, kind, governance: { text, docs } }],  // optional: own hue, height, public-register fill,
                                                                 // vertical label (rails), kind (what the node is when it differs
                                                                 // from its band, shown on its popup), governance distillation
    decor: [{ d, hue, layer, cls, dashed, width, opacity }], // optional decorative paths (e.g. rail ticks), drawn under edges;
                                         // dashed defaults to true; a path with a layer lights up when that layer, or one of its nodes, is in focus
    edges: [[from, to, mode, { dashed }]], // mode: undefined (vertical) | 'h' (side to side) | 'arc' (over the top) | 'under' (beneath)
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
    // What each band is: its group's member name when the map groups its key (the five groupings, CTO 2026-10-19), else 'Layer'.
    const memberOf = Object.fromEntries((cfg.layerGroups || []).flatMap(g => g.member ? g.layers.map(k => [k, g.member]) : []));
    const kind = key => memberOf[key] || 'Layer';

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
      <div class="tk-top">
        <div class="tk-intro"></div>
        <p class="tk-hint">${cfg.emptyText ||
          'Select a node, or a coloured layer band, to see its role and connections. Hover to trace its edges. <kbd>Tab</kbd> moves between nodes; <kbd>Esc</kbd> clears.'}</p>
      </div>
      <div class="tk-sticky">
        <div class="controls">
          ${status ? `<span class="tk-filter" role="group" aria-label="Filter by build state"><span class="tk-filter-label">Filter by build state:</span>${filterChips}</span>` : ''}
          <span class="tk-zoom" role="group" aria-label="Map size">
            <button type="button" data-zoom="out" aria-label="Smaller">−</button>
            <span class="tk-zoom-label" aria-live="polite"></span>
            <button type="button" data-zoom="in" aria-label="Larger">+</button>
            <button type="button" data-zoom="width">Fit width</button>
            <button type="button" data-zoom="all">Fit all</button>
            <button type="button" class="tk-full-btn" title="Open the map in a full-window view">Full view</button>
          </span>
        </div>
      </div>
      <div class="stage">
        <div class="tk-diagram" role="img" aria-label="${esc(cfg.ariaLabel || 'Topology diagram')}"></div>
      </div>
      <section class="layers"><h3>Map key</h3><p class="layers-hint">Top to bottom, as on the map. Select one to read it in full.</p><div class="layer-list"></div></section>`;
    const diagram = mount.querySelector('.tk-diagram');
    const introEl = cfg.intro === null ? null : document.querySelector(cfg.intro || 'body > header');
    if (introEl) mount.querySelector('.tk-intro').appendChild(introEl);
    // Title panel: h1 and subtitle together, on the surface colour; the mini-nav stays outside it.
    const titleH1 = introEl && introEl.querySelector('header > div:first-child > h1');
    if (titleH1) {
      const panel = document.createElement('div');
      panel.className = 'tk-title-panel';
      const sub = titleH1.parentElement.querySelector(':scope > .subtitle');
      titleH1.replaceWith(panel);
      panel.append(titleH1);
      if (sub) panel.append(sub);
    }
    else mount.querySelector('.tk-top').classList.add('no-intro');

    // Popover: a node's or layer's detail, beside it. One factory serves the page and the full view.
    // host is the positioned element the popover lives in; it may scroll sideways (the page diagram).
    function makePop(host) {
      const pop = document.createElement('div');
      pop.className = 'tk-pop tk-panel';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Details');
      pop.hidden = true;
      host.appendChild(pop);
      let anchor = null;
      function place() {
        if (pop.hidden || !anchor) return;
        const r = typeof anchor === 'function' ? anchor() : anchor;
        const hb = host.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 12;
        const left = hb.left - host.scrollLeft, top = hb.top - host.scrollTop;
        let x = r.right + gap - left;
        if (x + pw > host.scrollLeft + host.clientWidth - 8) x = r.left - gap - pw - left;
        x = Math.max(host.scrollLeft + 8, Math.min(x, host.scrollLeft + host.clientWidth - pw - 8));
        let y = r.top - top;
        y = Math.max(8, Math.min(y, Math.max(host.scrollHeight, host.clientHeight) - ph - 8));
        pop.style.left = x + 'px'; pop.style.top = y + 'px';
      }
      return {
        el: pop,
        get open() { return !pop.hidden; },
        show(html, a) {
          pop.innerHTML = '<button type="button" class="tk-pop-close" aria-label="Close details">×</button>' + html;
          pop.hidden = false; anchor = a; place();
        },
        hide() { pop.hidden = true; anchor = null; },
        place,
      };
    }

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
      // A solid band (e.g. the Canon and Guidance rail) uses the public-register fill, softened by b.opacity.
      const r = el('rect', { class: 'band' + (b.solid ? ' solid' : ''), x: b.x, y: b.y, width: b.w, height: b.h, rx: 12,
        fill: b.solid ? `var(--${h}-p)` : `var(--${h}-b)`, 'fill-opacity': b.solid ? (b.opacity ?? 1) : 1, stroke: `var(--${h}-s)`,
        tabindex: 0, role: 'button', 'aria-label': `${LAYERS[b.layer].full}, ${kind(b.layer).toLowerCase()}` }, gBands);
      r.dataset.layer = b.layer;
      (bandEls[b.layer] ||= []).push(r);
      r.addEventListener('focus', () => { if (selected !== 'layer:' + b.layer) selectLayer(b.layer, bandAnchor(r)); });
      r.addEventListener('click', e => { e.stopPropagation(); selectLayer(b.layer, { left: e.clientX, right: e.clientX, top: e.clientY }); });
    }
    function bandAnchor(r) { const b = r.getBoundingClientRect(); return { left: b.left + 24, right: b.left + 24, top: b.top + 24 }; }
    const gDecor = el('g', {}, svg);
    for (const d of cfg.decor || []) {
      const p = el('path', { class: 'decor' + (d.cls ? ' ' + d.cls : ''), d: d.d, stroke: `var(--${d.hue}-s)`, 'stroke-width': d.width ?? 1.6, opacity: d.opacity ?? 0.7 }, gDecor);
      if (d.dashed !== false) p.setAttribute('stroke-dasharray', '3 4');
      if (d.layer) p.dataset.layer = d.layer;
    }
    // Decor that belongs to a layer (for example Loom's and Warp's cables) lights with that layer.
    const lightDecor = (root, layer) => root.querySelectorAll('.decor[data-layer]').forEach(p => p.classList.toggle('lit', p.dataset.layer === layer));
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
      else if (e.mode === 'under') { sa = 'bottom'; sb = 'bottom'; }
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
      if (r.mode === 'under') { const y = Math.max(p.y, q.y) + 26; return `M${p.x},${p.y} C${p.x},${y} ${q.x},${y} ${q.x},${q.y}`; }
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
      const cls = 'node' + (n.status === 'planned' ? ' planned' : '') + (n.solid ? ' solid' : '') + (n.vertical ? ' vertical' : '') + (n.small ? ' small' : '') + (n.tiny ? ' tiny' : '');
      const g = el('g', { class: cls, tabindex: 0, role: 'button', 'aria-label': `${n.label}, ${LAYERS[n.layer].full}` }, gNodes);
      el('rect', { class: 'box', x: n.x, y: n.y, width: n.w, height: nh, rx: 8, fill, stroke: n.solid ? `var(--${h}-p)` : `var(--${h}-s)`, 'stroke-width': 1.8 }, g);
      if (n.vertical) {
        const tx = n.x + n.w / 2 + 4, ty = n.y + nh / 2;
        el('text', { x: tx, y: ty, fill: ink, 'text-anchor': 'middle', transform: `rotate(-90 ${tx} ${ty})` }, g).textContent = n.label;
      } else {
        el('rect', { x: n.x, y: n.y + 8, width: 5, height: nh - 16, rx: 2, fill: n.solid ? ink : `var(--${h}-s)`, opacity: n.solid ? 0.55 : 1 }, g);
        // Small nodes (for example, a supporting row) set their text about 12% smaller, so the baselines move up to match.
        // Tiny nodes are button-sized: one centred line, no sub-line; their detail is in the panel when selected.
        if (n.tiny) el('text', { x: n.x + 14, y: n.y + nh / 2 + 3.5, fill: ink }, g).textContent = n.label;
        else {
          el('text', { x: n.x + 14, y: n.y + (n.small ? 18 : 20), fill: ink }, g).textContent = n.label;
          if (n.sub) el('text', { x: n.x + 14, y: n.y + (n.small ? 33 : 37), fill: ink, class: 'sub' }, g).textContent = n.sub;
        }
      }
      if (status) {
        const badge = el('circle', { class: 'badge', cx: n.x + n.w - (n.tiny ? 10 : 12), cy: n.tiny ? n.y + nh / 2 : n.y + (n.vertical ? nh - 12 : 12), r: n.tiny ? 4.5 : 6 }, g);
        if (n.status) badge.setAttribute('fill', `var(--st-${n.status})`);
        else { badge.setAttribute('fill', 'none'); badge.setAttribute('stroke', 'var(--fg-faint)'); badge.setAttribute('stroke-dasharray', '2 2'); badge.setAttribute('stroke-width', 1.5); }
      }
      nodeEls[n.id] = g;
      g.dataset.st = n.status || 'untracked';
      g.dataset.id = n.id;
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
      // labelBelow: the label sits outside the band, centred underneath it, with no tag behind it.
      if (b.labelStack) {
        const words = (b.label || LAYERS[b.layer].full).split(' '), lh = 15;
        const y0 = b.y + b.h / 2 - (words.length - 1) * lh / 2 + 4;
        const t = el('text', { x: b.x + 14, y: y0, class: 'band-label', fill: `var(--${h}-s)` }, gLabels);
        words.forEach((w, i) => { el('tspan', { x: b.x + 14, y: y0 + i * lh }, t).textContent = w; });
        continue;
      }
      if (b.labelBelow) {
        el('text', { x: b.x + b.w / 2, y: b.y + b.h + 17, 'text-anchor': 'middle', class: 'band-label below', fill: `var(--${h}-s)` }, gLabels).textContent = b.label || LAYERS[b.layer].full;
        continue;
      }
      const t = el('text', { x: b.x + 14, y: b.y + 21, class: 'band-label', fill: b.solid ? `var(--${h}-pt)` : `var(--${h}-s)` }, gLabels);
      t.textContent = b.label || LAYERS[b.layer].full;
      const bg = el('rect', { x: b.x + 8, y: b.y + 7.5, width: t.getComputedTextLength() + 12, height: 20, rx: 5, fill: b.solid ? 'none' : `var(--${h}-b)` });
      gLabels.insertBefore(bg, t);
    }

    function focus(id) {
      svg.classList.add('focusing');
      Object.values(nodeEls).forEach(g => g.classList.remove('lit'));
      nodeEls[id].classList.add('lit');
      lightDecor(svg, byId[id].layer);
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
      lightDecor(svg, null);
    }
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
        <div class="p-head"><h2>${esc(n.label)}</h2><span class="p-layer" style="color:var(--${L.hue}-s)">${n.kind ? esc(L.name) + ' · ' + esc(n.kind) : esc(L.full)}</span>${n.governance
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
      pagePop.show(panelHTML(id), () => nodeEls[id].getBoundingClientRect());
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
        <div class="p-head"><h2>${esc(L.full)}</h2><span class="p-layer" style="color:var(--${L.hue}-s)">${esc(kind(key))}</span></div>
        <p>${L.desc}</p>
        <div class="p-links"><b>Holds:</b> ${names(members.map(n => n.id))}</div>
        ${st ? '<div class="p-fill"></div>' + st : ''}`;
    }
    function selectLayer(key, anchor) {
      selected = 'layer:' + key; clear();
      svg.classList.add('focusing');
      for (const n of NODES) if (n.layer === key) nodeEls[n.id].classList.add('lit');
      (bandEls[key] || []).forEach(r => r.classList.add('selected'));
      lightDecor(svg, key);
      pagePop.show(layerHTML(key), anchor || bandAnchor(bandEls[key][0]));
    }
    const pagePop = makePop(diagram);
    pagePop.el.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.closest('.tk-pop-close')) { deselect(); return; }
      if (e.target.closest('[data-gov]') && byId[selected]) { govView = !govView; select(selected); }
    });
    window.addEventListener('resize', () => pagePop.place());
    diagram.addEventListener('scroll', () => pagePop.place());
    function deselect() { selected = null; clear(); pagePop.hide(); }
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (fullDlg.open) return;  // the full view handles its own Escape: popover first, then the view
      if (selected) { deselect(); document.activeElement?.blur?.(); return; }  // first Esc closes the popover
      document.activeElement?.blur?.();
      // Keyboard events stay inside an iframe. Send only a close signal;
      // the article modal validates this frame's window and origin.
      if (window.parent !== window) window.parent.postMessage({ type: 'crossroads:topology:escape' }, '*');
    });
    diagram.addEventListener('click', e => { if (selected && !e.target.closest('.tk-pop')) deselect(); });

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
      if (byId[id]) { nodeEls[id].scrollIntoView({ block: 'center' }); select(id); }
      else if (id.startsWith('layer-') && bandEls[id.slice(6)]) selectLayer(id.slice(6));
    };
    window.addEventListener('hashchange', fromHash); fromHash();

    // Map key: a top-down list; each band shows its first line and expands in place.
    const list = mount.querySelector('.layer-list');
    const groups = cfg.layerGroups || [{ layers: cfg.layerOrder || Object.keys(LAYERS) }];
    for (const grp of groups) {
      if (grp.name) {
        const h = document.createElement('div');
        h.className = 'layer-group';
        h.innerHTML = esc(grp.name) + (grp.note ? `<span>${esc(grp.note)}</span>` : '');
        list.appendChild(h);
      }
      for (const k of grp.layers) {
        const L = LAYERS[k];
        const d = document.createElement('details');
        d.className = 'layer-item';
        d.style.setProperty('--li', `var(--${L.hue}-s)`);
        d.innerHTML = `<summary><span class="li-name">${esc(L.full)}</span><span class="li-first">${L.desc.replace(/<[^>]+>/g, '')}</span></summary><div class="li-body">${L.desc}</div>`;
        list.appendChild(d);
      }
    }

    // Upper right (CTO, 2026-10-18): the map's pill and the header buttons on one row, then the
    // page hint, in one column, so the left keeps title, subtitle and the maps mini-nav, and the map sits higher.
    // Runs after the buttons are built (below); see placeAside().
    function placeAside() {
      const header = mount.querySelector('.tk-intro header');
      const actions = header && header.querySelector('.tk-head-actions');
      if (!header || !actions) return;
      const aside = document.createElement('aside');
      aside.className = 'tk-aside';
      const row = document.createElement('div');
      row.className = 'tk-aside-row';
      const body = document.createElement('div');
      body.className = 'tk-aside-body';
      const pill = header.querySelector('.pill');
      const hint = mount.querySelector('.tk-hint');
      actions.replaceWith(aside);
      if (pill) row.appendChild(pill);
      row.appendChild(actions);
      if (hint) body.appendChild(hint);
      aside.append(row, body);
    }

    // Header buttons: the theme toggle plus, when the page has notes, an "About this map" modal.
    const toggleBtn = document.querySelector('[data-theme-toggle]');
    const notes = document.querySelector('section.notes');
    if (toggleBtn) {
      const actions = document.createElement('span');
      actions.className = 'tk-head-actions';
      toggleBtn.replaceWith(actions);
      if (notes) {
        const help = document.createElement('button');
        help.type = 'button';
        help.className = 'theme-toggle tk-iconbtn';
        help.textContent = '?';
        help.setAttribute('aria-label', 'About this map');
        help.dataset.tip = 'About this map';
        const dlg = document.createElement('dialog');
        dlg.className = 'tk-modal';
        dlg.setAttribute('aria-label', 'About this map');
        const body = notes.cloneNode(true);
        body.querySelector('h3')?.remove();
        dlg.innerHTML = `<div class="tk-modal-head"><h2>About this map</h2><button type="button" class="tk-iconbtn tk-modal-close" aria-label="Close" data-tip="Close">×</button></div><div class="tk-modal-body">${body.innerHTML}</div>`;
        document.body.appendChild(dlg);
        help.addEventListener('click', () => dlg.showModal());
        dlg.querySelector('.tk-modal-close').addEventListener('click', () => dlg.close());
        dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });  // click outside the box
        actions.appendChild(help);
      }
      toggleBtn.classList.add('tk-iconbtn');
      toggleBtn.dataset.tip = 'Light or dark';
      actions.appendChild(toggleBtn);
    }
    placeAside();
    // Full view: the same map in a modal filling 96vh and as much width as the map's shape uses.
    // Hover traces a node's edges; a click (or keyboard focus) opens a popover with the panel's content.
    // The popover closes with Esc, its × or a click on the map background; a second Esc, the view's ×,
    // or a click outside the view closes the view. One click on another node moves the popover there.
    const fullDlg = document.createElement('dialog');
    fullDlg.className = 'tk-full';
    fullDlg.setAttribute('aria-label', (cfg.ariaLabel || 'Topology diagram') + ', full view');
    fullDlg.innerHTML = `<div class="tk-full-head"><span class="tk-full-title">${esc(document.querySelector('h1')?.textContent || 'Map')}</span>
      <button type="button" class="tk-iconbtn tk-modal-close" aria-label="Close full view" data-tip="Close">×</button></div>
      <div class="tk-full-body"></div>`;
    document.body.appendChild(fullDlg);
    const fullBody = fullDlg.querySelector('.tk-full-body');
    const fullPop = makePop(fullBody);
    let fsvg = null, popFor = null;
    const fNodes = () => Object.fromEntries([...fsvg.querySelectorAll('g.node')].map(g => [g.dataset.id, g]));
    const fEdges = () => [...fsvg.querySelectorAll('path.edge')];
    function fClear() {
      if (!fsvg) return;
      fsvg.classList.remove('focusing');
      fEdges().forEach(p => { p.classList.remove('hot'); p.setAttribute('marker-end', 'url(#tkArrow)'); });
      fsvg.querySelectorAll('.lit, .selected').forEach(x => x.classList.remove('lit', 'selected'));
      lightDecor(fsvg, null);
    }
    function fFocus(id) {
      const ns = fNodes();
      fsvg.classList.add('focusing');
      Object.values(ns).forEach(g => g.classList.remove('lit'));
      ns[id].classList.add('lit');
      lightDecor(fsvg, byId[id].layer);
      for (const p of fEdges()) {
        const hot = p.dataset.from === id || p.dataset.to === id;
        p.classList.toggle('hot', hot);
        p.setAttribute('marker-end', hot ? 'url(#tkArrowHot)' : 'url(#tkArrow)');
        if (hot) { ns[p.dataset.from].classList.add('lit'); ns[p.dataset.to].classList.add('lit'); }
      }
    }
    function openPop(kind, key, anchor) {
      popFor = { kind, key, anchor };
      fClear();
      if (kind === 'node') { fFocus(key); fNodes()[key].classList.add('selected'); fullPop.show(panelHTML(key), () => fNodes()[key].getBoundingClientRect()); }
      else {
        fsvg.classList.add('focusing');
        for (const n of NODES) if (n.layer === key) fNodes()[n.id].classList.add('lit');
        fsvg.querySelectorAll(`rect.band[data-layer="${key}"]`).forEach(r => r.classList.add('selected'));
        lightDecor(fsvg, key);
        fullPop.show(layerHTML(key), anchor);
      }
    }
    function closePop() { fullPop.hide(); popFor = null; fClear(); }
    function openFull() {
      if (selected) deselect();  // one popover at a time: the page's closes when the view opens
      fsvg?.remove();
      fsvg = svg.cloneNode(true);
      fsvg.removeAttribute('style');
      fsvg.classList.add('tk-full-svg');
      fsvg.querySelectorAll('g.node').forEach(g => {
        const t = document.createElementNS(NS, 'title'); t.textContent = byId[g.dataset.id].label; g.prepend(t);
      });
      fullBody.insertBefore(fsvg, fullPop.el);
      fClear(); fullPop.hide(); popFor = null;
      fsvg.querySelectorAll('g.node').forEach(g => {
        const id = g.dataset.id;
        g.addEventListener('mouseenter', () => { if (!popFor) fFocus(id); });
        g.addEventListener('mouseleave', () => { if (!popFor) fClear(); });
        g.addEventListener('focus', () => { if (popFor?.key !== id) openPop('node', id, g.getBoundingClientRect()); });
        g.addEventListener('click', e => { e.stopPropagation(); if (popFor?.key !== id) openPop('node', id, g.getBoundingClientRect()); });
      });
      fsvg.querySelectorAll('rect.band').forEach(r => r.addEventListener('click', e => {
        e.stopPropagation();
        fsvg.querySelectorAll('g.node').forEach(g => g.blur?.());
        openPop('layer', r.dataset.layer, { left: e.clientX, right: e.clientX, top: e.clientY });
      }));
      sizeFull();
      fullDlg.showModal();
    }
    function sizeFull() {
      // As wide as the map's shape can use at 96vh, never wider than 96vw.
      const headH = 44, pad = 24;
      const w = Math.min(window.innerWidth * 0.96, (window.innerHeight * 0.96 - headH - pad) * VW / VH + pad);
      fullDlg.style.width = Math.round(w) + 'px';
    }
    window.addEventListener('resize', () => { if (fullDlg.open) { sizeFull(); fullPop.place(); } });
    mount.querySelector('.tk-full-btn').addEventListener('click', openFull);
    fullDlg.querySelector('.tk-modal-close').addEventListener('click', () => fullDlg.close());
    fullDlg.addEventListener('cancel', e => { if (popFor) { e.preventDefault(); closePop(); } });  // Esc: popover first
    fullDlg.addEventListener('close', () => { closePop(); });
    fullDlg.addEventListener('click', e => {
      if (e.target === fullDlg) { fullDlg.close(); return; }                  // outside the view
      if (e.target.closest('.tk-pop-close')) { closePop(); return; }
      if (e.target.closest('[data-gov]') && popFor?.kind === 'node') {        // governance chip, as in the panel
        govView = !govView; const a = popFor.anchor; openPop('node', popFor.key, a); return;
      }
      if (popFor && !e.target.closest('.tk-pop')) closePop();                 // the map's background
    });

    return { select, deselect };
  }

  global.TopologyKit = { render };
})(window);
