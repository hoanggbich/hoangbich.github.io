/* =========================================================
   Masan Consumer – Supply Chain Analysis
   All content below is rendered from the CSV files in /data
   ========================================================= */

const DATA_FILES = {
  financial:   { path: 'data/financial_summary.csv',    label: 'Financial summary' },
  annual:      { path: 'data/annual_revenue.csv',       label: 'Annual revenue' },
  quarterly:   { path: 'data/quarterly_revenue.csv',    label: 'Quarterly revenue' },
  category:    { path: 'data/category_performance.csv', label: 'Category performance' },
  channels:    { path: 'data/channels.csv',             label: 'Sales channels' },
  coverage:    { path: 'data/direct_coverage.csv',      label: 'Direct Coverage metrics' },
  aso:         { path: 'data/aso_rollout.csv',          label: 'ASO rollout' },
  stages:      { path: 'data/supply_chain_stages.csv',  label: 'Supply chain stages' },
  hubs:        { path: 'data/manufacturing_hubs.csv',   label: 'Manufacturing hubs' },
  risks:       { path: 'data/risks.csv',                label: 'Risks' },
  recos:       { path: 'data/recommendations.csv',      label: 'Recommendations' },
  sources:     { path: 'data/sources.csv',              label: 'Sources' },
};

/* Validated categorical palette (fixed order, never cycled) */
const PALETTE = ['#2C5AA0', '#E8711A', '#2B93C9', '#B7791F', '#13A08C', '#8E5CB5'];
const NAVY = PALETTE[0], ORANGE = PALETTE[1];
const INK = '#14213d', INK2 = '#44506a', INK3 = '#6b7489', GRID = '#e8ecf3';

const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (a, b) => ((b - a) / Math.abs(a)) * 100;
const splitList = s => String(s).split(';').map(x => x.trim()).filter(Boolean);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ---------- Chart.js defaults ---------- */
function setupChartDefaults() {
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = INK2;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.legend.labels.color = INK;
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: '#0a1d40', titleColor: '#fff', bodyColor: '#e6ecf6',
    padding: 12, cornerRadius: 8, boxPadding: 6, titleFont: { weight: '700' },
  });
  Chart.defaults.elements.bar.borderRadius = 4;
  Chart.defaults.scale.grid.color = GRID;
  Chart.defaults.scale.border.display = false;
}
const axisTitle = text => ({ display: true, text, color: INK3, font: { size: 11 } });

/* =========================================================
   KPIs
   ========================================================= */
function renderKPIs(d) {
  const f = Object.fromEntries(d.financial.records.map(r => [r.metric, r]));
  const cov = Object.fromEntries(d.coverage.records.map(r => [r.metric, r]));
  const rev = f['Net revenue'], gm = f['Gross margin'], ebit = f['EBIT'], intl = f['International revenue'];
  const out = cov['Outlets directly covered'], wh = cov['Wholesale share of revenue'];

  const kpis = [
    { label: 'Net revenue FY2025', value: fmt(rev.fy2025), unit: 'VND bn', delta: pct(rev.fy2024, rev.fy2025), suffix: '% YoY' },
    { label: 'Gross margin FY2025', value: fmt(gm.fy2025, 1), unit: '%', delta: gm.fy2025 - gm.fy2024, suffix: ' pts YoY', d: 1 },
    { label: 'EBIT FY2025', value: fmt(ebit.fy2025), unit: 'VND bn', delta: pct(ebit.fy2024, ebit.fy2025), suffix: '% YoY' },
    { label: 'International revenue', value: fmt(intl.fy2025), unit: 'VND bn', delta: pct(intl.fy2024, intl.fy2025), suffix: '% YoY' },
    { label: 'Outlets under Direct Coverage', value: fmt(out.after), unit: 'K', delta: pct(out.before, out.after), suffix: '% vs. before' },
    { label: 'Wholesale share of sales', value: fmt(wh.after), unit: '%', delta: wh.after - wh.before, suffix: ' pts (lower is better)', invert: true },
  ];
  const grid = document.getElementById('kpiGrid');
  kpis.forEach(k => {
    const good = k.invert ? k.delta < 0 : k.delta >= 0;
    const sign = k.delta > 0 ? '+' : '−';
    grid.append(el('div', 'kpi', `
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}<small>${k.unit}</small></div>
      <div class="kpi-delta ${good ? 'up' : 'down'}">${k.delta > 0 ? '▲' : '▼'} ${sign}${fmt(Math.abs(k.delta), 1)}${k.suffix}</div>`));
  });
}

/* =========================================================
   Value chain stepper
   ========================================================= */
function renderValueChain(d) {
  const stages = d.stages.records.sort((a, b) => a.order - b.order);
  const wrap = document.getElementById('chainSteps');
  const detail = document.getElementById('chainDetail');

  function show(i) {
    [...wrap.children].forEach((b, j) => { b.classList.toggle('active', i === j); b.setAttribute('aria-selected', i === j); });
    const s = stages[i];
    detail.innerHTML = `
      <div class="fade-in"><h4>Stage ${s.order} · ${s.stage}</h4><h3>${s.title}</h3><p>${s.description}</p></div>
      <div class="fade-in"><h4>Key enablers</h4><ul>${splitList(s.enablers).map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="fade-in"><h4>How it is measured</h4><ul>${splitList(s.kpi).map(x => `<li>${x}</li>`).join('')}</ul></div>`;
  }
  stages.forEach((s, i) => {
    const b = el('button', 'chain-step', `<span class="num">${s.order}</span><span class="name">${s.stage}</span><span class="title">${s.title}</span>`);
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => show(i));
    wrap.append(b);
  });
  show(0);
}

/* =========================================================
   Performance charts
   ========================================================= */
function renderQuarterChart(d) {
  const rows = d.quarterly.records;
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const pick = (y) => quarters.map(q => rows.find(r => r.year === y && r.quarter === q));
  const r24 = pick(2024), r25 = pick(2025);

  new Chart(document.getElementById('quarterChart'), {
    type: 'bar',
    data: {
      labels: quarters,
      datasets: [
        {
          label: '2024', data: r24.map(r => r.revenue_vnd_bn),
          backgroundColor: r24.map(r => /Derived/.test(r.status) ? 'rgba(44,90,160,.45)' : NAVY),
          borderColor: NAVY, borderWidth: r24.map(r => /Derived/.test(r.status) ? 1.5 : 0),
          borderDash: [4, 3], meta: r24,
        },
        { label: '2025', data: r25.map(r => r.revenue_vnd_bn), backgroundColor: ORANGE, borderWidth: 0, meta: r25 },
      ],
    },
    options: {
      datasets: { bar: { categoryPercentage: .7, barPercentage: .9 } },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'end' },
        tooltip: {
          callbacks: {
            label: c => {
              const m = c.dataset.meta[c.dataIndex];
              const yoy = m.yoy_growth_pct !== '' ? ` (${m.yoy_growth_pct > 0 ? '+' : ''}${m.yoy_growth_pct}% YoY)` : '';
              return ` ${c.dataset.label}: ${fmt(c.raw)} bn${yoy}${/Derived/.test(m.status) ? ' · derived' : ''}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: v => fmt(v) }, title: axisTitle('VND bn') },
      },
    },
  });
}

function renderCategoryChart(d) {
  const rows = d.category.records;
  new Chart(document.getElementById('categoryChart'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.category),
      datasets: [
        { label: 'FY2024', data: rows.map(r => r.revenue_2024), backgroundColor: NAVY },
        { label: 'FY2025', data: rows.map(r => r.revenue_2025), backgroundColor: ORANGE },
      ],
    },
    options: {
      indexAxis: 'y',
      datasets: { bar: { categoryPercentage: .72, barPercentage: .9 } },
      interaction: { mode: 'index', intersect: false, axis: 'y' },
      plugins: {
        legend: { position: 'top', align: 'end' },
        tooltip: {
          callbacks: {
            label: c => ` ${c.dataset.label}: ${fmt(c.raw)} bn`,
            footer: items => {
              const r = rows[items[0].dataIndex];
              const g = pct(r.revenue_2024, r.revenue_2025);
              return `Change: ${g > 0 ? '+' : ''}${fmt(g, 1)}%\nBrands: ${splitList(r.key_brands).join(', ')}`;
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => fmt(v) }, title: axisTitle('VND bn') },
        y: { grid: { display: false }, ticks: { color: INK } },
      },
    },
  });
}

function renderMarginChart(d) {
  const rows = d.category.records;
  const valuesFor = y => rows.map(r => r[`gross_margin_${y}`]);
  const chart = new Chart(document.getElementById('marginChart'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.category),
      datasets: [{ label: 'Gross margin FY2025', data: valuesFor(2025), backgroundColor: NAVY, maxBarThickness: 64 }],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: c => ` Gross margin: ${fmt(c.raw, 1)}%`,
            footer: items => {
              const r = rows[items[0].dataIndex];
              const diff = r.gross_margin_2025 - r.gross_margin_2024;
              return `FY2024 → FY2025: ${diff > 0 ? '+' : ''}${fmt(diff, 1)} pts`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: INK } },
        y: { beginAtZero: true, max: 60, ticks: { callback: v => v + '%' } },
      },
    },
    plugins: [valueLabelPlugin(v => fmt(v, 1) + '%')],
  });

  document.querySelectorAll('#performance .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#performance .seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      const y = btn.dataset.year;
      chart.data.datasets[0].data = valuesFor(y);
      chart.data.datasets[0].label = `Gross margin FY${y}`;
      chart.data.datasets[0].backgroundColor = y === '2025' ? NAVY : '#7f97c4';
      chart.update();
    });
  });
}

/* Draws the value above each bar (used sparingly: single-series charts only) */
function valueLabelPlugin(format) {
  return {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = `600 12px ${Chart.defaults.font.family}`;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      chart.getDatasetMeta(0).data.forEach((bar, i) => {
        const v = chart.data.datasets[0].data[i];
        if (v == null || v === '') { if (chart.options.indexAxis === 'y') { ctx.textAlign = 'left'; ctx.fillStyle = INK3; ctx.fillText('Online marketplaces (Shopee, TikTok Shop, Lazada)', chart.chartArea.left + 6, bar.y + 4); ctx.fillStyle = INK; } return; }
        if (chart.options.indexAxis === 'y') { ctx.textAlign = 'left'; ctx.fillText(format(v), bar.x + 6, bar.y + 4); }
        else ctx.fillText(format(v), bar.x, bar.y - 6);
      });
      ctx.restore();
    },
  };
}

/* =========================================================
   Distribution
   ========================================================= */
function renderChannelChart(d) {
  const rows = d.channels.records;
  new Chart(document.getElementById('channelChart'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.channel),
      datasets: [{ label: 'Points of sale', data: rows.map(r => r.points_of_sale === '' ? null : r.points_of_sale), backgroundColor: NAVY, maxBarThickness: 34 }],
    },
    options: {
      indexAxis: 'y',
      layout: { padding: { right: 60 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: c => ` Points of sale: ${c.raw == null ? 'online marketplaces' : fmt(c.raw)}`,
            afterLabel: c => {
              const r = rows[c.dataIndex];
              return [`Market size: US$${r.market_size_usd_bn}B`, r.description.replace(/;/g, ',')];
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => fmt(v / 1000) + 'K' } },
        y: { grid: { display: false }, ticks: { color: INK } },
      },
    },
    plugins: [valueLabelPlugin(v => fmt(v / 1000, v < 10000 ? 1 : 0) + 'K')],
  });
}

function renderAsoChart(d) {
  const rows = d.aso.records;
  const isTarget = r => /target/i.test(r.status);
  new Chart(document.getElementById('asoChart'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.period),
      datasets: [{
        label: 'ASO members (K)',
        data: rows.map(r => r.aso_members_thousand),
        backgroundColor: rows.map(r => isTarget(r) ? 'rgba(232,113,26,.15)' : ORANGE),
        borderColor: rows.map(r => isTarget(r) ? ORANGE : ORANGE),
        borderWidth: rows.map(r => isTarget(r) ? 2 : 0),
        borderDash: [5, 4],
        maxBarThickness: 72,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${fmt(c.raw)}K retailers · ${rows[c.dataIndex].status}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: INK } },
        y: { beginAtZero: true, max: 600, ticks: { callback: v => v + 'K' } },
      },
    },
    plugins: [valueLabelPlugin(v => v + 'K')],
  });
}

function renderCoverageCompare(d) {
  const grid = document.getElementById('compareGrid');
  d.coverage.records.forEach(r => {
    const max = Math.max(r.before, r.after) || 1;
    const change = r.better_when === 'lower' ? r.after - r.before : pct(r.before, r.after);
    const isPts = r.unit === '%';
    const good = r.better_when === 'neutral' ? 'neutral' : 'good';
    const changeText = r.better_when === 'neutral'
      ? 'No change'
      : isPts ? `${change > 0 ? '+' : '−'}${fmt(Math.abs(change))} pts` : `${change > 0 ? '+' : '−'}${fmt(Math.abs(change))}%`;
    const dec = (r.before % 1 || r.after % 1) ? 1 : 0;
    const unit = r.unit === 'thousand outlets' ? 'K' : r.unit === '%' ? '%' : '';
    grid.append(el('div', 'compare', `
      <div class="compare-label">${r.metric}</div>
      <div class="compare-values">
        <span class="compare-before">${fmt(r.before, dec)}${unit}</span>
        <span class="compare-arrow">→</span>
        <span class="compare-after">${fmt(r.after, dec)}${unit}</span>
        ${unit ? '' : `<span class="compare-unit">${r.unit}</span>`}
      </div>
      <div class="bar-track" title="Grey: before · Orange: after">
        <div class="bar-before" style="width:${(r.before / max) * 100}%"></div>
        <div class="bar-after" style="width:${(r.after / max) * 100}%"></div>
      </div>
      <div class="compare-change ${good}">${changeText}</div>
      <div class="compare-note">${r.note}</div>`));
  });
}

/* =========================================================
   Manufacturing hubs
   ========================================================= */
function renderHubs(d) {
  const hubs = d.hubs.records;
  const regions = ['All', ...new Set(hubs.map(h => h.region))];
  const filter = document.getElementById('regionFilter');
  const grid = document.getElementById('hubGrid');

  function draw(region) {
    grid.innerHTML = '';
    hubs.filter(h => region === 'All' || h.region === region).forEach(h => {
      grid.append(el('article', 'hub fade-in', `<div class="hub-region">${h.region}</div><h3>${h.province}</h3><p>${h.focus.replace(/;/g, ',')}</p>`));
    });
    [...filter.children].forEach(c => c.classList.toggle('active', c.dataset.region === region));
  }
  regions.forEach(rg => {
    const n = rg === 'All' ? hubs.length : hubs.filter(h => h.region === rg).length;
    const b = el('button', 'chip', `${rg}<span class="count">${n}</span>`);
    b.dataset.region = rg;
    b.addEventListener('click', () => draw(rg));
    filter.append(b);
  });
  draw('All');
}

/* =========================================================
   Risk matrix
   ========================================================= */
function renderRisks(d) {
  const risks = d.risks.records.map((r, i) => ({ ...r, id: i + 1, score: r.likelihood * r.impact }));
  const areas = [...new Set(risks.map(r => r.area))];
  const colorOf = area => PALETTE[areas.indexOf(area) % PALETTE.length];

  // nudge points that share the same cell so none are hidden
  const seen = {};
  risks.forEach(r => {
    const key = `${r.likelihood}-${r.impact}`;
    const n = seen[key] = (seen[key] || 0) + 1;
    r.x = r.likelihood + (n - 1) * 0.22;
    r.y = r.impact + (n - 1) * 0.0;
  });

  const zonePlugin = {
    id: 'zones',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { x, y } } = chart;
      ctx.save();
      for (let lx = 1; lx <= 5; lx++) for (let iy = 1; iy <= 5; iy++) {
        const s = lx * iy;
        ctx.fillStyle = s >= 15 ? 'rgba(192,57,43,.10)' : s >= 8 ? 'rgba(232,113,26,.08)' : 'rgba(44,90,160,.04)';
        const x0 = x.getPixelForValue(lx - .5), x1 = x.getPixelForValue(lx + .5);
        const y0 = y.getPixelForValue(iy + .5), y1 = y.getPixelForValue(iy - .5);
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      ctx.restore();
    },
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = `700 11px ${Chart.defaults.font.family}`;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((pt, i) => ctx.fillText(ds.data[i].id, pt.x, pt.y));
      });
      ctx.restore();
    },
  };

  const chart = new Chart(document.getElementById('riskChart'), {
    type: 'scatter',
    data: {
      datasets: areas.map(area => ({
        label: area,
        data: risks.filter(r => r.area === area).map(r => ({ x: r.x, y: r.y, id: r.id, r })),
        backgroundColor: colorOf(area),
        borderColor: '#fff', borderWidth: 2,
        pointRadius: 13, pointHoverRadius: 16,
      })),
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => `#${items[0].raw.id} ${items[0].raw.r.risk}`,
            label: c => ` Likelihood ${c.raw.r.likelihood}/5 · Impact ${c.raw.r.impact}/5 · Score ${c.raw.r.score}`,
            afterLabel: c => `Area: ${c.raw.r.area}`,
          },
        },
      },
      scales: {
        x: { min: .5, max: 5.5, afterBuildTicks: ax => { ax.ticks = [1, 2, 3, 4, 5].map(v => ({ value: v })); }, grid: { display: false }, title: axisTitle('Likelihood (1 = rare, 5 = almost certain) →') },
        y: { min: .5, max: 5.5, afterBuildTicks: ax => { ax.ticks = [1, 2, 3, 4, 5].map(v => ({ value: v })); }, grid: { display: false }, title: axisTitle('Impact (1 = minor, 5 = severe) →') },
      },
      onHover: (e, items) => highlight(items.length ? items[0].element.$context.raw.id : null),
    },
    plugins: [zonePlugin],
  });

  const list = document.getElementById('riskList');
  [...risks].sort((a, b) => b.score - a.score).forEach(r => {
    const level = r.score >= 15 ? ['high', 'High'] : r.score >= 8 ? ['med', 'Medium'] : ['low', 'Low'];
    const item = el('div', 'risk', `
      <div class="risk-top"><span class="risk-name">#${r.id} ${r.risk}</span><span class="risk-score score-${level[0]}">${level[1]} · ${r.score}</span></div>
      <div class="risk-meta">${r.area} · Likelihood ${r.likelihood}/5 · Impact ${r.impact}/5</div>
      <p class="risk-mit"><b>Mitigation:</b> ${r.mitigation.replace(/;/g, ',')}</p>`);
    item.dataset.id = r.id;
    item.addEventListener('mouseenter', () => focusPoint(r.id));
    item.addEventListener('mouseleave', () => focusPoint(null));
    list.append(item);
  });

  function highlight(id) {
    list.querySelectorAll('.risk').forEach(it => it.classList.toggle('active', Number(it.dataset.id) === id));
  }
  function focusPoint(id) {
    highlight(id);
    if (id == null) { chart.setActiveElements([]); chart.tooltip.setActiveElements([], { x: 0, y: 0 }); chart.update(); return; }
    chart.data.datasets.forEach((ds, di) => ds.data.forEach((p, i) => {
      if (p.id === id) {
        const els = [{ datasetIndex: di, index: i }];
        chart.setActiveElements(els);
        chart.tooltip.setActiveElements(els, chart.getDatasetMeta(di).data[i].getProps(['x', 'y']));
        chart.update();
      }
    }));
  }
}

/* =========================================================
   Recommendations
   ========================================================= */
function renderRecos(d) {
  const list = document.getElementById('recoList');
  d.recos.records.sort((a, b) => a.priority - b.priority).forEach(r => {
    list.append(el('li', 'reco', `
      <span class="reco-num">${r.priority}</span>
      <span class="reco-horizon">${r.horizon}</span>
      <h3>${r.title}</h3>
      <p>${r.detail.replace(/;/g, ',')}</p>
      <div class="reco-impact"><span>Impact:</span> ${r.expected_impact.replace(/;/g, ',')}</div>`));
  });
}

/* =========================================================
   Data explorer + sources
   ========================================================= */
function renderDataExplorer(d) {
  const tabs = document.getElementById('dataTabs');
  const table = document.getElementById('dataTable');
  const meta = document.getElementById('tableMeta');
  const dl = document.getElementById('tableDownload');

  function show(key) {
    const ds = d[key];
    [...tabs.children].forEach(t => t.classList.toggle('active', t.dataset.key === key));
    const numericCols = ds.header.filter(h => ds.records.every(r => r[h] === '' || typeof r[h] === 'number') && !/year|order|priority/i.test(h));
    table.innerHTML = `
      <thead><tr>${ds.header.map(h => `<th class="${numericCols.includes(h) ? 'num' : ''}">${h.replace(/_/g, ' ')}</th>`).join('')}</tr></thead>
      <tbody>${ds.records.map(r => `<tr>${ds.header.map(h => {
        const v = r[h];
        if (h === 'url') return `<td><a href="${v}" target="_blank" rel="noopener">link ↗</a></td>`;
        return numericCols.includes(h) ? `<td class="num">${v === '' ? '–' : fmt(v, v % 1 ? 1 : 0)}</td>` : `<td>${String(v).replace(/;/g, ',')}</td>`;
      }).join('')}</tr>`).join('')}</tbody>`;
    meta.textContent = `${ds.path} · ${ds.records.length} rows · ${ds.header.length} columns`;
    dl.href = ds.path;
  }
  Object.entries(DATA_FILES).forEach(([key, f]) => {
    const b = el('button', 'chip', f.label);
    b.dataset.key = key;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => show(key));
    tabs.append(b);
  });
  show('category');

  const src = document.getElementById('sourceList');
  d.sources.records.forEach(s => {
    src.append(el('li', null, `<a href="${s.url}" target="_blank" rel="noopener">${s.source.replace(/;/g, ',')}</a> · ${s.publisher}${s.date !== 'n/a' ? ', ' + s.date : ''}`));
  });
}

/* =========================================================
   Navigation (mobile menu + active section)
   ========================================================= */
function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded', false);
  }));

  const links = [...nav.querySelectorAll('a')];
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => obs.observe(s));
}

/* =========================================================
   Boot
   ========================================================= */
async function init() {
  setupNav();
  let data;
  try {
    const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([k, f]) => [k, await CSV.load(f.path)]));
    data = Object.fromEntries(entries);
  } catch (err) {
    console.error(err);
    document.getElementById('loadError').hidden = false;
    return;
  }
  setupChartDefaults();
  renderKPIs(data);
  renderValueChain(data);
  renderQuarterChart(data);
  renderCategoryChart(data);
  renderMarginChart(data);
  renderChannelChart(data);
  renderAsoChart(data);
  renderCoverageCompare(data);
  renderHubs(data);
  renderRisks(data);
  renderRecos(data);
  renderDataExplorer(data);
}
document.addEventListener('DOMContentLoaded', init);
