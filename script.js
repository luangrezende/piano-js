const WHITE_W = 52;
const BLACK_W = 34;
const GAP     = 1;

// note, type, frequency (Hz), key label, keyboard shortcut
const KEY_DATA = [
  { note: 'C4',  type: 'white', freq: 261.63, label: 'C4', kb: 'a' },
  { note: 'C#4', type: 'black', freq: 277.18,              kb: 'w' },
  { note: 'D4',  type: 'white', freq: 293.66, label: 'D',  kb: 's' },
  { note: 'D#4', type: 'black', freq: 311.13,              kb: 'e' },
  { note: 'E4',  type: 'white', freq: 329.63, label: 'E',  kb: 'd' },
  { note: 'F4',  type: 'white', freq: 349.23, label: 'F',  kb: 'f' },
  { note: 'F#4', type: 'black', freq: 369.99,              kb: 't' },
  { note: 'G4',  type: 'white', freq: 392.00, label: 'G',  kb: 'g' },
  { note: 'G#4', type: 'black', freq: 415.30,              kb: 'y' },
  { note: 'A4',  type: 'white', freq: 440.00, label: 'A',  kb: 'h' },
  { note: 'A#4', type: 'black', freq: 466.16,              kb: 'u' },
  { note: 'B4',  type: 'white', freq: 493.88, label: 'B',  kb: 'j' },
  { note: 'C5',  type: 'white', freq: 523.25, label: 'C5', kb: 'k' },
  { note: 'C#5', type: 'black', freq: 554.37,              kb: 'o' },
  { note: 'D5',  type: 'white', freq: 587.33, label: 'D',  kb: 'l' },
  { note: 'D#5', type: 'black', freq: 622.25,              kb: 'p' },
  { note: 'E5',  type: 'white', freq: 659.25, label: 'E',  kb: ';' },
  { note: 'F5',  type: 'white', freq: 698.46, label: 'F',  kb: '' },
  { note: 'F#5', type: 'black', freq: 739.99,              kb: '' },
  { note: 'G5',  type: 'white', freq: 783.99, label: 'G',  kb: '' },
  { note: 'G#5', type: 'black', freq: 830.61,              kb: '' },
  { note: 'A5',  type: 'white', freq: 880.00, label: 'A',  kb: '' },
  { note: 'A#5', type: 'black', freq: 932.33,              kb: '' },
  { note: 'B5',  type: 'white', freq: 987.77, label: 'B',  kb: '' },
];

/* ── Audio ── */
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playNote(freq) {
  const ctx = getCtx();
  const t   = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.30, t);
  master.connect(ctx.destination);

  // Harmonics that approximate a struck string
  const harmonics = [
    { mult: 1, amp: 0.60, decay: 3.2 },
    { mult: 2, amp: 0.22, decay: 2.0 },
    { mult: 3, amp: 0.10, decay: 1.4 },
    { mult: 4, amp: 0.05, decay: 0.9 },
    { mult: 5, amp: 0.02, decay: 0.6 },
  ];

  harmonics.forEach(({ mult, amp, decay }) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * mult, t);
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + decay);
  });
}

/* ── Build DOM ── */
const pianoEl  = document.getElementById('piano');
const noteDisp = document.getElementById('noteDisplay');
const kbMap    = {};
let   fadeTimer = null;

function showNote(noteName) {
  noteDisp.textContent = noteName;
  noteDisp.classList.add('visible');
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => noteDisp.classList.remove('visible'), 1600);
}

function trigger(el, note, freq) {
  playNote(freq);
  showNote(note);
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 180);
}

// 1 — white keys (flex flow)
KEY_DATA.filter(k => k.type === 'white').forEach(key => {
  const el = document.createElement('div');
  el.className = 'key-white';

  if (key.label) {
    const lbl = document.createElement('span');
    lbl.className = 'key-label';
    lbl.textContent = key.label;
    el.appendChild(lbl);
  }

  el.addEventListener('mousedown', e => { e.preventDefault(); trigger(el, key.note, key.freq); });
  el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });

  pianoEl.appendChild(el);
  key.el = el;
  if (key.kb) kbMap[key.kb] = { el, note: key.note, freq: key.freq };
});

// 2 — black keys (absolute)
let wIdx = -1;
KEY_DATA.forEach(key => {
  if (key.type === 'white') {
    wIdx++;
  } else {
    const el = document.createElement('div');
    el.className = 'key-black';

    // centre the black key over the boundary between two adjacent white keys
    const left = (wIdx + 1) * (WHITE_W + GAP) - BLACK_W / 2;
    el.style.left = left + 'px';

    el.addEventListener('mousedown', e => { e.preventDefault(); trigger(el, key.note, key.freq); });
    el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });

    pianoEl.appendChild(el);
    key.el = el;
    if (key.kb) kbMap[key.kb] = { el, note: key.note, freq: key.freq };
  }
});

/* ── Keyboard ── */
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key === ';' ? ';' : e.key.toLowerCase();
  const entry = kbMap[k];
  if (entry) {
    e.preventDefault();
    trigger(entry.el, entry.note, entry.freq);
  }
});

/* ── Responsive scale ── */
// Total piano-case width: 14 keys × WHITE_W + 13 gaps × GAP + 26px padding × 2
const PIANO_CASE_W = 14 * WHITE_W + 13 * GAP + 52;
// Total piano-case height: key height + padding-top + padding-bottom
const PIANO_CASE_H = 215 + 24 + 46;

function updateScale() {
  const margin  = 16; // minimum breathing room (8px each side)
  const scaleW  = (window.innerWidth  - margin) / PIANO_CASE_W;
  const scaleH  = (window.innerHeight - margin) / (PIANO_CASE_H + 120); // +120 for title/hint
  const scale   = Math.min(1, scaleW, scaleH);
  document.documentElement.style.setProperty('--piano-scale', scale.toFixed(4));
  document.documentElement.style.setProperty('--piano-case-h', PIANO_CASE_H + 'px');
}

window.addEventListener('resize', updateScale);
window.addEventListener('orientationchange', () => setTimeout(updateScale, 150));
updateScale();
