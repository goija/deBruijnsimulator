const CYCLE = "0000001000011000101000111001001011001101001111010101110110111111";

const HEX_NAMES = [
  "The Creative","The Receptive","Difficulty at the Beginning","Youthful Folly",
  "Waiting","Conflict","The Army","Holding Together","Small Taming","Treading",
  "Peace","Standstill","Fellowship","Great Possession","Modesty","Enthusiasm",
  "Following","Work on the Decayed","Approach","Contemplation","Biting Through",
  "Grace","Splitting Apart","Return","Innocence","Great Taming","Nourishment",
  "Great Preponderance","The Abysmal","The Clinging","Influence","Duration",
  "Retreat","Great Power","Progress","Darkening of the Light","The Family",
  "Opposition","Obstruction","Deliverance","Decrease","Increase","Breakthrough",
  "Coming to Meet","Gathering Together","Pushing Upward","Oppression","The Well",
  "Revolution","The Cauldron","The Arousing","Keeping Still","Development",
  "The Marrying Maiden","Abundance","The Wanderer","The Gentle","The Joyous",
  "Dispersion","Limitation","Inner Truth","Small Preponderance","After Completion",
  "Before Completion"
];

const TRIGRAMS = {
  7: "Heaven", 0: "Earth", 4: "Thunder", 2: "Water",
  1: "Mountain", 3: "Wind", 5: "Fire", 6: "Lake"
};

const STORE_KEY = "debruijn-sep-v10-1-ui";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (_) {
    return {};
  }
}

function savePrefs() {
  const prefs = { hexMode, topToBottom, trailMode, fadeMode };
  localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
}

const prefs = loadPrefs();

let idxS = 0;
let idxE = 0;
let randomMode = false;
let autoplay = false;
let hexMode = prefs.hexMode ?? false;
let topToBottom = prefs.topToBottom ?? true;
let trailMode = prefs.trailMode ?? true;
let fadeMode = prefs.fadeMode ?? true;
let history = [];
let historyCounter = 0;
let suppressNextHistory = false;

function getWordAt(idx) {
  let w = 0;
  for (let k = 0; k < 6; k++) {
    w = (w << 1) | Number(CYCLE[(idx + k) % 64]);
  }
  return w;
}

function bin6(w) {
  return w.toString(2).padStart(6, "0");
}

function reverse6(w) {
  let r = 0;
  for (let i = 0; i < 6; i++) {
    if ((w >> i) & 1) r |= 1 << (5 - i);
  }
  return r;
}

function hexInfo(word) {
  const mapped = topToBottom ? word : reverse6(word);
  const order = mapped + 1;
  const top = (mapped >> 3) & 7;
  const bottom = mapped & 7;
  return {
    order,
    name: HEX_NAMES[order - 1],
    bits: bin6(mapped),
    topTrigram: TRIGRAMS[top],
    bottomTrigram: TRIGRAMS[bottom]
  };
}

function overlapString(bs, be) {
  return [...bs].map((b, i) => b === be[i] ? b : "-").join("");
}

function overlapScore(ov) {
  return [...ov].filter(ch => ch !== "-").length;
}

function overlapClass(ov) {
  const start = ov[0] === "1";
  const end = ov[ov.length - 1] === "1";
  if (start && end) return "real";
  if (start && !end) return "sreal";
  if (!start && end) return "ereal";
  return "-";
}

function realOverlap(ov) {
  return overlapClass(ov) !== "-";
}

function bitLed(bit, text = bit) {
  return `<span class="blend-led ${bit === "1" ? "one" : "zero"}">${text}</span>`;
}

function overlapCell(ch) {
  if (ch === "-") return `<span class="blend-led overlap-none">-</span>`;
  if (ch === "1") return `<span class="blend-led overlap-1">1</span>`;
  return `<span class="blend-led overlap-0">0</span>`;
}

function scopeBox() {
  const box = document.querySelector(".scope").getBoundingClientRect();
  return { w: box.width, h: box.height, cx: box.width / 2, cy: box.height / 2 };
}

function posOnRing(index, radius) {
  const b = scopeBox();
  const a = (index / 64) * 2 * Math.PI - Math.PI / 2;
  return { x: b.cx + Math.cos(a) * radius, y: b.cy + Math.sin(a) * radius };
}

function makeRing(id, radius) {
  const ring = document.getElementById(id);
  if (!ring) return;
  ring.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const led = document.createElement("div");
    led.className = `led ${CYCLE[i] === "1" ? "one" : "zero"}`;
    led.id = `${id}_${i}`;

    const p = posOnRing(i, radius);
    led.style.left = `${p.x}px`;
    led.style.top = `${p.y}px`;

    ring.appendChild(led);
  }
}

function rebuildRings() {
  const b = scopeBox();
  makeRing("ringE", b.w * 0.43);
  makeRing("ringS", b.w * 0.31);
}

function addClassAt(id, pos, cls) {
  const el = document.getElementById(`${id}_${pos}`);
  if (el) el.classList.add(cls);
}

function setRing(id, idx, oldIndexes = []) {
  for (let i = 0; i < 64; i++) {
    const el = document.getElementById(`${id}_${i}`);
    if (!el) continue;
    el.className = `led ${CYCLE[i] === "1" ? "one" : "zero"}`;
  }

  if (trailMode && Array.isArray(oldIndexes)) {
    oldIndexes.slice(-3).forEach((oldIdx, age) => {
      const trailClass = `trail${3 - age}`;
      for (let k = 0; k < 6; k++) {
        addClassAt(id, (oldIdx + k) % 64, trailClass);
      }
    });
  }

  for (let k = 0; k < 6; k++) {
    addClassAt(id, (idx + k) % 64, "active");
  }
}

function renderPStrip(p) {
  const pstrip = document.getElementById("pstrip");
  if (!pstrip) return;
  pstrip.innerHTML = "";

  const bits = bin6(p);
  for (let i = 0; i < 6; i++) {
    const led = document.createElement("div");
    led.className = `pbit ${bits[i] === "1" ? "one" : "zero"}`;
    pstrip.appendChild(led);
  }
}

function renderOverlapMeter(s, e) {
  const ov = overlapString(bin6(s), bin6(e));
  const score = overlapScore(ov);
  const pct = Math.max(0, Math.min(100, (score / 6) * 100));
  const cls = overlapClass(ov);

  const text = document.getElementById("overlapMeterText");
  const fill = document.getElementById("overlapMeterFill");
  const str = document.getElementById("overlapMeterString");
  const real = document.getElementById("realOverlapIndicator");

  if (text) text.textContent = `${score}/6`;
  if (fill) fill.style.width = `${pct}%`;
  if (str) str.textContent = ov;

  if (real) {
    real.textContent = cls;
    real.classList.remove("on", "off", "sreal", "ereal", "real", "none");
    real.classList.add(cls === "-" ? "none" : cls);
    real.setAttribute("title",
      cls === "real" ? "start and end overlap both with 1" :
      cls === "sreal" ? "start overlap with 1 only" :
      cls === "ereal" ? "end overlap with 1 only" :
      "no start/end overlap with 1");
  }
}

function renderBlend(s, e, p) {
  const bs = bin6(s);
  const be = bin6(e);
  const bp = bin6(p);
  const ov = overlapString(bs, be);

  const sLine = `<div class="xor-inline"><strong>S</strong>${[...bs].map(b => bitLed(b)).join("")}</div>`;
  const eLine = `<div class="xor-inline"><strong>E</strong>${[...be].map(b => bitLed(b)).join("")}</div>`;
  const pLine = `<div class="xor-inline"><strong>P</strong>${[...bp].map(b => bitLed(b)).join("")}</div>`;
  const oLine = `<div class="xor-inline"><strong>O</strong>${[...ov].map(ch => overlapCell(ch)).join("")}</div>`;

  const panel = document.getElementById("blendPanel");
  if (panel) {
    panel.innerHTML =
      `<div class="xor-pair-row">${sLine}${eLine}</div>` +
      `<div class="xor-pair-row">${pLine}${oLine}</div>` +
      `<div class="small">O color schema: '-' light yellow, '1' green, '0' brown. class: sreal=start 1 only, ereal=end 1 only, real=both, -=neither.</div>` +
      `<div class="small">XOR rule: same colors → red/0, different colors → blue/1.</div>`;
  }
}

function glyph(label, h) {
  const lines = [...h.bits].map(b => `<div class="${b === "1" ? "yang" : "yin"}"></div>`).join("");
  return `<div class="hex">
    <span class="hex-title"><strong>${label}</strong> · #${h.order} ${h.name}</span>
    <div class="small">${h.topTrigram} over ${h.bottomTrigram}</div>
    <div class="small">bits: ${h.bits}</div>
    <div class="hexlines">${lines}</div>
  </div>`;
}

function renderHexBox(s, e, p) {
  const hexBox = document.getElementById("hexBox");
  const hexPanel = document.getElementById("hexPanel");
  if (!hexBox || !hexPanel) return;

  if (hexMode) {
    hexBox.classList.remove("hidden");
    hexBox.setAttribute("aria-hidden", "false");
    hexPanel.innerHTML = glyph("S", hexInfo(s)) + glyph("E", hexInfo(e)) + glyph("P", hexInfo(p));
  } else {
    hexBox.classList.add("hidden");
    hexBox.setAttribute("aria-hidden", "true");
    hexPanel.innerHTML = "";
  }
}

function pushHistory(s, e, p) {
  if (suppressNextHistory) {
    suppressNextHistory = false;
    return;
  }

  const prev = history[history.length - 1];
  const sBits = bin6(s);
  const eBits = bin6(e);
  const pBits = bin6(p);
  const ov = overlapString(sBits, eBits);

  const entry = {
    s: sBits,
    e: eBits,
    p: pBits,
    overlap: ov,
    overlapScore: overlapScore(ov),
    idxS,
    idxE,
    n: ++historyCounter,
    t: new Date().toLocaleTimeString(),
    changed: prev ? [...ov].map((ch, i) => ch !== prev.overlap[i]) : [true, true, true, true, true, true]
  };

  history.push(entry);
  if (history.length > 40) history.shift();
}

function renderHistory() {
  const panel = document.getElementById("historyPanel");
  if (!panel) return;

  panel.innerHTML = history.slice(-8).reverse().map((h) => {
    const bits = [...h.overlap].map((ch, i) => {
      const cls = ch === "-" ? "overlap-none" : (ch === "1" ? "overlap-1" : "overlap-0");
      return `<span class="${cls} ${h.changed && h.changed[i] ? "changed" : ""}"></span>`;
    }).join("");

    return `<div class="history-entry">
      <span>#${h.n}</span>
      <span class="history-time">${h.t}</span>
      <span class="history-bits" title="overlap ${h.overlap} score ${h.overlapScore}/6">${bits}</span>
    </div>`;
  }).join("");
}

function updateButtons() {
  const activeMap = {
    randomBtn: randomMode,
    autoBtn: autoplay,
    hexBtn: hexMode,
    orientBtn: !topToBottom,
    trailBtn: trailMode,
    fadeBtn: fadeMode
  };

  for (const [id, val] of Object.entries(activeMap)) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle("active", val);
  }

  const scope = document.querySelector(".scope");
  if (scope) scope.classList.toggle("no-fade", !fadeMode);

  const rIndicator = document.getElementById("rIndicator");
  if (rIndicator) {
    rIndicator.textContent = "R";
    rIndicator.classList.toggle("on", randomMode);
    rIndicator.setAttribute("title", randomMode ? "Random S/E mode: next iteration uses random S and E" : "Sequential S/E mode");
  }
}

function render(oldS = [], oldE = []) {
  const s = getWordAt(idxS);
  const e = getWordAt(idxE);
  const p = s ^ e;
  const ov = overlapString(bin6(s), bin6(e));

  pushHistory(s, e, p);

  setRing("ringS", idxS, oldS);
  setRing("ringE", idxE, oldE);
  renderPStrip(p);
  renderOverlapMeter(s, e);
  renderBlend(s, e, p);
  renderHistory();
  renderHexBox(s, e, p);

  const state = document.getElementById("state");
  if (state) {
    state.textContent =
      `#${historyCounter} | S=${bin6(s)} E=${bin6(e)} P=${bin6(p)} O=${ov} score=${overlapScore(ov)}/6 overlap_class=${overlapClass(ov)} idxS=${idxS} idxE=${idxE} ` +
      `S/E=${randomMode ? "RANDOM-NEXT" : "SEQUENTIAL"} autoplay=${autoplay ? "ON" : "OFF"} hex=${hexMode ? "ON" : "OFF"} ` +
      `orientation=${topToBottom ? "top-to-bottom" : "bottom-to-top"}`;
  }

  updateButtons();
  savePrefs();
}

function advanceIteration(direction = 1) {
  const oldS = [idxS];
  const oldE = [idxE];

  if (randomMode) {
    idxS = Math.floor(Math.random() * 64);
    idxE = Math.floor(Math.random() * 64);
  } else {
    idxS = (idxS + direction + 64) % 64;
    idxE = (idxE + direction + 64) % 64;
  }

  render(oldS, oldE);
}

function wireButtons() {
  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");
  const random = document.getElementById("randomBtn");
  const auto = document.getElementById("autoBtn");
  const hex = document.getElementById("hexBtn");
  const orient = document.getElementById("orientBtn");
  const trail = document.getElementById("trailBtn");
  const fade = document.getElementById("fadeBtn");
  const reset = document.getElementById("resetCounterBtn");

  if (prev) prev.onclick = () => advanceIteration(-1);
  if (next) next.onclick = () => advanceIteration(1);
  if (random) random.onclick = () => { randomMode = !randomMode; render(); };
  if (auto) auto.onclick = () => { autoplay = !autoplay; render(); };
  if (hex) hex.onclick = () => { hexMode = !hexMode; render(); };
  if (orient) orient.onclick = () => { topToBottom = !topToBottom; render(); };
  if (trail) trail.onclick = () => { trailMode = !trailMode; render(); };
  if (fade) fade.onclick = () => { fadeMode = !fadeMode; render(); };
  if (reset) reset.onclick = () => {
    historyCounter = 0;
    history = [];
    suppressNextHistory = true;
    render();
  };
}

function init() {
  wireButtons();
  rebuildRings();
  render();

  setInterval(() => {
    if (autoplay === true) advanceIteration(1);
  }, 800);

  window.addEventListener("resize", () => {
    rebuildRings();
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);
