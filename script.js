'use strict';

/* ================= Configuración ================= */
const MIN_STEPS = 2;
const MAX_STEPS = 24;
const BAR = '\u0304'; // barra superior combinada (S̄, R̄, Q̄)

const GATES = {
  AND:  { fn: (a, b) => a & b,       expr: 'A · B',      info: 'La salida es 1 solo si todas las entradas son 1.' },
  OR:   { fn: (a, b) => a | b,       expr: 'A + B',      info: 'La salida es 1 si al menos una entrada es 1.' },
  NOT:  { fn: (a) => 1 - a,          expr: 'A' + BAR,     info: 'La salida es la inversa de la entrada.' },
  NAND: { fn: (a, b) => 1 - (a & b), expr: '¬(A · B)',    info: 'La salida es 0 solo si todas las entradas son 1.' },
  NOR:  { fn: (a, b) => 1 - (a | b), expr: '¬(A + B)',    info: 'La salida es 1 solo si todas las entradas son 0.' },
  XOR:  { fn: (a, b) => a ^ b,       expr: 'A ⊕ B',       info: 'La salida es 1 cuando las entradas son distintas.' },
  XNOR: { fn: (a, b) => 1 - (a ^ b), expr: '¬(A ⊕ B)',    info: 'La salida es 1 cuando las entradas son iguales.' },
};

const ACTION = {
  M: { name: 'Mantiene',  color: '#3b82f6' },
  R: { name: 'Reset',     color: '#ef4444' },
  S: { name: 'Set',       color: '#10b981' },
  P: { name: 'Prohibido', color: '#f59e0b' },
};

const COLOR = { in1: '#3b82f6', in2: '#f97316', out: '#8b5cf6', green: '#12b76a', red: '#ef4444' };

/* ================= Estado ================= */
const state = {
  mode: 'comb',          // 'comb' | 'seq'
  gate: 'AND',
  latch: 'nor',          // 'nor' | 'nand'
  q0: '?',               // estado inicial de Q: '?', 0 o 1
  steps: 8,
  t: 0,
  timer: null,
  inputs: { comb: [[], []], seq: [[], []] },
};

/* ================= Utilidades ================= */
const $ = (selector) => document.querySelector(selector);
const isSeq = () => state.mode === 'seq';
const levelClass = (v) => (v === null ? 'unk' : v ? 'hi' : 'lo');
const idleLevel = () => (isSeq() && state.latch === 'nand' ? 1 : 0);

function signalNames() {
  if (!isSeq()) return state.gate === 'NOT' ? ['A'] : ['A', 'B'];
  return state.latch === 'nor' ? ['S', 'R'] : ['S' + BAR, 'R' + BAR];
}

function activeInputs() {
  return state.inputs[state.mode].slice(0, signalNames().length);
}

/** Ajusta todas las secuencias a la cantidad de pasos actual. */
function normalize() {
  Object.entries(state.inputs).forEach(([mode, pair]) => {
    const fill = mode === 'seq' && state.latch === 'nand' ? 1 : 0;
    pair.forEach((seq) => {
      while (seq.length < state.steps) seq.push(fill);
      seq.length = state.steps;
    });
  });
}

/* ================= Simulación ================= */
function simulateGate(inputs) {
  const [a, b = []] = inputs;
  return a.map((x, i) => GATES[state.gate].fn(x, b[i] ?? 0));
}

/** Latch S-R con NOR (activo en alto) o NAND (activo en bajo). */
function simulateLatch([s, r]) {
  const nor = state.latch === 'nor';
  let q = state.q0 === '?' ? null : state.q0;
  let qb = q === null ? null : 1 - q;
  let afterForbidden = false;
  const result = { q: [], qb: [], actions: [] };

  for (let i = 0; i < state.steps; i++) {
    const set = nor ? s[i] : 1 - s[i];
    const reset = nor ? r[i] : 1 - r[i];
    let action;

    if (set && reset)  { q = qb = nor ? 0 : 1; action = 'P'; afterForbidden = true; }
    else if (set)      { q = 1; qb = 0; action = 'S'; afterForbidden = false; }
    else if (reset)    { q = 0; qb = 1; action = 'R'; afterForbidden = false; }
    else {
      if (afterForbidden) q = qb = null; // condición de carrera: indeterminado
      afterForbidden = false;
      action = 'M';
    }
    result.q.push(q);
    result.qb.push(qb);
    result.actions.push(action);
  }
  return result;
}

/* ================= Secuencias de ejemplo ================= */
function loadExample() {
  const a = [], b = [];
  if (isSeq()) {
    const S = [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0];
    const R = [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1];
    const nor = state.latch === 'nor';
    state.steps = S.length;
    S.forEach((v, i) => { a.push(nor ? v : 1 - v); b.push(nor ? R[i] : 1 - R[i]); });
  } else {
    for (let i = 0; i < state.steps; i++) { a.push((i >> 1) & 1); b.push(i & 1); }
  }
  state.inputs[state.mode] = [a, b];
  normalize();
}

function randomize() {
  const idle = idleLevel();
  state.inputs[state.mode] = [0, 1].map(() =>
    Array.from({ length: state.steps }, () => (Math.random() < 0.4 ? 1 - idle : idle)));
}

function clearInputs() {
  state.inputs[state.mode] = [[], []];
  normalize();
}

/* ================= Helpers SVG ================= */
const line = (x1, y1, x2, y2, cls, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${extra}/>`;

const wire = (x1, y1, x2, y2, v) => line(x1, y1, x2, y2, `wire ${levelClass(v)}`);
const poly = (points, v) => `<polyline points="${points}" class="wire ${levelClass(v)}"/>`;

const text = (x, y, content, { size = 14, fill = '', anchor = '' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}"
     ${fill ? `style="fill:${fill}"` : ''} ${anchor ? `text-anchor="${anchor}"` : ''}>${content}</text>`;

const led = (cx, cy, v, color) =>
  `<circle cx="${cx}" cy="${cy}" r="14" class="led ${v === 1 ? 'on' : ''} ${v === null ? 'unk' : ''}" style="color:${color}"/>` +
  text(cx, cy + 5, v === null ? '?' : v, { size: 13, fill: v === 1 ? '#fff' : '' });

/* ================= Cronograma ================= */
function timingSvg(rows, actions) {
  const W = 760, X0 = 64, ROW_H = 54, TOP = 8;
  const n = state.steps;
  const cw = (W - X0 - 8) / n;
  const H = TOP + rows.length * ROW_H + (actions ? 32 : 0) + 22;

  let svg = `<svg viewBox="0 0 ${W} ${H}" id="timing-svg">`;
  svg += `<rect class="sel" x="${X0 + state.t * cw}" y="0" width="${cw}" height="${H - 16}" rx="6"/>`;
  for (let i = 0; i <= n; i++) svg += line(X0 + i * cw, 4, X0 + i * cw, H - 18, 'grid-line');

  rows.forEach((row, k) => {
    const high = TOP + k * ROW_H + 8, low = high + 30;
    let prev;
    svg += text(8, high + 21, row.name, { size: 16, anchor: 'start' });

    row.values.forEach((v, c) => {
      const xa = X0 + c * cw, xb = xa + cw;
      if (v === null) {
        svg += line(xa, high + 15, xb, high + 15, 'wire unk');
        svg += text(xa + cw / 2, high + 9, '?', { size: 12, fill: 'var(--warn)' });
        prev = null;
        return;
      }
      const y = v ? high : low;
      if (prev !== undefined && prev !== v) {
        const from = prev === null ? high + 15 : prev ? high : low;
        svg += line(xa, from, xa, y, 'wire', `style="stroke:${row.color}"`);
      }
      svg += line(xa, y, xb, y, 'wire', `style="stroke:${row.color}"`);
      svg += text(xa + cw / 2, v ? high + 17 : low - 6, v, { size: 11, fill: row.color });
      prev = v;
    });
  });

  if (actions) {
    const y = TOP + rows.length * ROW_H + 22;
    svg += text(8, y, 'Estado', { size: 12, fill: 'var(--mute)', anchor: 'start' });
    actions.forEach((a, i) => { svg += text(X0 + i * cw + cw / 2, y, a, { size: 17, fill: ACTION[a].color }); });
  }
  for (let i = 0; i < n; i++) svg += text(X0 + i * cw + cw / 2, H - 3, i, { size: 11, fill: 'var(--mute)' });

  $('#timing').innerHTML = svg + '</svg>';
  $('#timing-svg').addEventListener('click', (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) * W) / box.width;
    state.t = Math.max(0, Math.min(n - 1, Math.floor((x - X0) / cw)));
    renderOutput();
  });
}

/* ================= Circuitos ================= */
function gateCircuit(inputs, y) {
  const t = state.t;
  const [a, b] = inputs.map((seq) => seq[t]);
  const two = inputs.length > 1;
  const inputsSvg = two
    ? wire(40, 55, 130, 55, a) + wire(40, 95, 130, 95, b) +
      text(30, 60, 'A', { anchor: 'end' }) + text(30, 100, 'B', { anchor: 'end' }) +
      text(85, 46, a, { size: 13, fill: 'var(--ink)' }) + text(85, 86, b, { size: 13, fill: 'var(--ink)' })
    : wire(40, 75, 130, 75, a) + text(30, 80, 'A', { anchor: 'end' }) + text(85, 66, a, { size: 13 });

  return `<svg viewBox="0 0 340 150">${inputsSvg}
    <rect class="box" x="130" y="30" width="80" height="90" rx="10"/>
    ${text(170, 80, state.gate, { size: 16 })}
    ${wire(210, 75, 300, 75, y[t])}${text(255, 66, y[t], { size: 13 })}
    ${text(314, 80, 'Y', { anchor: 'start' })}</svg>`;
}

function latchCircuit(sim, inputs) {
  const t = state.t, nor = state.latch === 'nor';
  const q = sim.q[t], qb = sim.qb[t];
  const [topIn, botIn] = nor ? [inputs[1][t], inputs[0][t]] : [inputs[0][t], inputs[1][t]];
  const label = nor ? state.latch.toUpperCase() : 'NAND';
  const [cq, cqb] = nor ? [COLOR.green, COLOR.red] : [COLOR.red, COLOR.green];

  return `<svg viewBox="0 0 380 190">
    ${wire(40, 38, 150, 38, topIn)}${wire(40, 162, 150, 162, botIn)}
    ${text(32, 43, nor ? 'R' : 'S' + BAR, { anchor: 'end' })}${text(32, 167, nor ? 'S' : 'R' + BAR, { anchor: 'end' })}
    ${poly('220,50 250,50 250,105 120,105 120,138 150,138', q)}
    ${poly('220,150 275,150 275,115 130,115 130,62 150,62', qb)}
    ${wire(220, 50, 322, 50, q)}${wire(220, 150, 322, 150, qb)}
    <rect class="box" x="150" y="20" width="70" height="60" rx="10"/>
    <rect class="box" x="150" y="120" width="70" height="60" rx="10"/>
    ${text(185, 56, label)}${text(185, 156, label)}
    ${led(347, 50, q, cq)}${text(347, 28, 'Q', { size: 13 })}
    ${led(347, 150, qb, cqb)}${text(347, 128, 'Q' + BAR, { size: 13 })}</svg>`;
}

/* ================= Tablas y paneles ================= */
function truthTable(inputs) {
  const names = signalNames(), m = names.length, t = state.t;
  let html = `<table><tr><th>${names.join('</th><th>')}</th><th>Y</th></tr>`;
  for (let r = 0; r < 1 << m; r++) {
    const combo = m > 1 ? [r >> 1, r & 1] : [r];
    const current = combo.every((v, j) => v === inputs[j][t]);
    html += `<tr class="${current ? 'cur' : ''}"><td>${combo.join('</td><td>')}</td>
             <td>${GATES[state.gate].fn(combo[0], combo[1] ?? 0)}</td></tr>`;
  }
  return html + '</table>';
}

function functionTable(actionNow) {
  const [s, r] = signalNames();
  const rows = state.latch === 'nor'
    ? [[0, 0, 'Qt', 'Q̄t', 'M'], [0, 1, 0, 1, 'R'], [1, 0, 1, 0, 'S'], [1, 1, 0, 0, 'P']]
    : [[1, 1, 'Qt', 'Q̄t', 'M'], [1, 0, 0, 1, 'R'], [0, 1, 1, 0, 'S'], [0, 0, 1, 1, 'P']];

  return `<table><tr><th>${s}</th><th>${r}</th><th>Qt+1</th><th>Q̄t+1</th><th>Acción</th></tr>` +
    rows.map(([a, b, q, qb, k]) =>
      `<tr class="${k === actionNow ? 'cur' : ''}"><td>${a}</td><td>${b}</td><td>${q}</td><td>${qb}</td>
       <td style="color:${ACTION[k].color}">${ACTION[k].name}</td></tr>`).join('') + '</table>';
}

function operationsPanel(actions) {
  const count = { M: 0, R: 0, S: 0, P: 0 };
  actions.forEach((a) => count[a]++);
  const cards = Object.keys(count).map((k) =>
    `<div class="op"><b style="color:${ACTION[k].color}">${k}</b> ${ACTION[k].name}
     <div class="mute">${count[k]} veces</div></div>`).join('');
  const warning = count.P
    ? '<div class="warn">Tras un estado prohibido, si las entradas pasan a “mantiene”, las dos compuertas compiten (condición de carrera) y Q queda indeterminada (?).</div>'
    : '';
  return `<div class="ops">${cards}</div>${warning}`;
}

const panel = (title, body) => `<div class="card"><h2>${title}</h2>${body}</div>`;

/* ================= Render ================= */
function renderControls() {
  const names = signalNames();
  let html = '';

  if (!isSeq()) {
    html += '<h2>Compuerta lógica</h2><div class="row">' +
      Object.keys(GATES).map((g) =>
        `<button data-act="gate" data-v="${g}" class="${g === state.gate ? 'active' : ''}">${g}</button>`).join('') + '</div>';
  } else {
    const types = [['nor', 'Con NOR (activo en alto)'], ['nand', 'Con NAND (activo en bajo)']];
    html += '<h2>Biestable S-R asíncrono</h2><div class="row">' +
      types.map(([v, l]) => `<button data-act="latch" data-v="${v}" class="${v === state.latch ? 'active' : ''}">${l}</button>`).join('') + '</div>';
    html += '<div class="row"><span class="mute">Estado inicial de Q:</span>' +
      ['?', 0, 1].map((v) => `<button data-act="q0" data-v="${v}" class="${v === state.q0 ? 'active' : ''}">${v}</button>`).join('') + '</div>';
  }

  html += '<h2 class="sub">Señales de entrada</h2>';
  names.forEach((name, k) => {
    const seq = state.inputs[state.mode][k];
    html += `<div class="row"><span class="label">${name}</span>
      <input type="text" id="seq-${k}" data-k="${k}" maxlength="${MAX_STEPS}" value="${seq.join('')}">
      <div class="bits">${seq.map((v, i) =>
        `<button class="bit ${v ? 'on' : ''}" data-act="bit" data-k="${k}" data-i="${i}">${v}</button>`).join('')}</div></div>`;
  });

  html += `<div class="row">
      <button data-act="dec">−</button><b>${state.steps} pasos</b><button data-act="inc">+</button>
      <button data-act="example">Ejemplo</button><button data-act="random">Aleatorio</button><button data-act="clear">Limpiar</button>
    </div><div class="hint">Escribe la secuencia o haz clic en cada bit. El cronograma se actualiza al instante.</div>`;

  $('#controls').innerHTML = html;
}

function renderOutput() {
  state.t = Math.min(state.t, state.steps - 1);
  const inputs = activeInputs();
  const names = signalNames();
  let panels = '';

  if (!isSeq()) {
    const y = simulateGate(inputs);
    const rows = inputs.map((values, k) => ({ name: names[k], values, color: k ? COLOR.in2 : COLOR.in1 }));
    rows.push({ name: 'Y', values: y, color: COLOR.out });
    $('#timing-title').textContent = `Cronograma · ${state.gate}`;
    timingSvg(rows, null);
    panels = panel('Circuito en el instante t', gateCircuit(inputs, y)) +
      panel('Expresión booleana', `<div class="expr">Y = ${GATES[state.gate].expr}</div><div class="mute">${GATES[state.gate].info}</div>`) +
      panel('Tabla de verdad', truthTable(inputs));
  } else {
    const sim = simulateLatch(inputs);
    const nor = state.latch === 'nor';
    const [cq, cqb] = nor ? [COLOR.green, COLOR.red] : [COLOR.red, COLOR.green];
    const rows = [
      { name: names[0], values: inputs[0], color: COLOR.in1 },
      { name: names[1], values: inputs[1], color: COLOR.in2 },
      { name: 'Q', values: sim.q, color: cq },
      { name: 'Q' + BAR, values: sim.qb, color: cqb },
    ];
    $('#timing-title').textContent = `Cronograma · latch S-R con ${state.latch.toUpperCase()}`;
    timingSvg(rows, sim.actions);
    panels = panel('Circuito en el instante t', latchCircuit(sim, inputs)) +
      panel('Operaciones', operationsPanel(sim.actions)) +
      panel('Tabla de funcionamiento', functionTable(sim.actions[state.t]));
  }

  $('#panels').innerHTML = panels;
  $('#slider').max = state.steps - 1;
  $('#slider').value = state.t;
  $('#t-label').textContent = `t = ${state.t}`;
  $('#play').textContent = state.timer ? '⏸' : '▶';
  $('#tab-comb').classList.toggle('active', !isSeq());
  $('#tab-seq').classList.toggle('active', isSeq());
}

function renderAll() {
  renderControls();
  renderOutput();
}

/* ================= Reproducción ================= */
function stop() {
  clearInterval(state.timer);
  state.timer = null;
}

function play() {
  stop();
  if (state.t >= state.steps - 1) state.t = 0;
  state.timer = setInterval(() => {
    if (state.t >= state.steps - 1) { stop(); renderOutput(); return; }
    state.t++;
    renderOutput();
  }, +$('#speed').value);
  renderOutput();
}

/* ================= Eventos ================= */
const actions = {
  gate:    (v) => { state.gate = v; },
  latch:   (v) => { state.latch = v; loadExample(); },
  q0:      (v) => { state.q0 = v === '?' ? '?' : +v; },
  bit:     (_, el) => { const seq = state.inputs[state.mode][+el.dataset.k]; seq[+el.dataset.i] ^= 1; },
  dec:     () => { if (state.steps > MIN_STEPS) { state.steps--; normalize(); } },
  inc:     () => { if (state.steps < MAX_STEPS) { state.steps++; normalize(); } },
  example: loadExample,
  random:  randomize,
  clear:   clearInputs,
};

$('#controls').addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  actions[el.dataset.act](el.dataset.v, el);
  renderAll();
});

$('#controls').addEventListener('input', (e) => {
  if (e.target.type !== 'text') return;
  const bits = e.target.value.replace(/[^01]/g, '');
  const { id, selectionStart } = e.target;
  if (bits.length) {
    state.steps = Math.max(MIN_STEPS, Math.min(MAX_STEPS, bits.length));
    state.inputs[state.mode][+e.target.dataset.k] = bits.slice(0, state.steps).split('').map(Number);
    normalize();
  }
  renderAll();
  const field = $('#' + id);
  field.focus();
  field.setSelectionRange(selectionStart, selectionStart);
});

function switchMode(mode) {
  stop();
  state.mode = mode;
  if (isSeq() && !state.inputs.seq[0].some((v) => v)) loadExample();
  renderAll();
}

$('#tab-comb').addEventListener('click', () => switchMode('comb'));
$('#tab-seq').addEventListener('click', () => switchMode('seq'));
$('#play').addEventListener('click', () => (state.timer ? (stop(), renderOutput()) : play()));
$('#first').addEventListener('click', () => { stop(); state.t = 0; renderOutput(); });
$('#last').addEventListener('click', () => { stop(); state.t = state.steps - 1; renderOutput(); });
$('#slider').addEventListener('input', (e) => { stop(); state.t = +e.target.value; renderOutput(); });
$('#speed').addEventListener('change', () => { if (state.timer) play(); });

$('#theme').addEventListener('click', () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
});

/* ================= Inicio ================= */
if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.dataset.theme = 'dark';
normalize();
loadExample();
renderAll();
