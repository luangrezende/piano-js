const WHITE_W = 52;
const BLACK_W = 34;
const GAP     = 1;

// note, type, frequency (Hz) and key label
const KEY_DATA = [
  { note: 'C4',  type: 'white', freq: 261.63, label: 'C4' },
  { note: 'C#4', type: 'black', freq: 277.18 },
  { note: 'D4',  type: 'white', freq: 293.66, label: 'D' },
  { note: 'D#4', type: 'black', freq: 311.13 },
  { note: 'E4',  type: 'white', freq: 329.63, label: 'E' },
  { note: 'F4',  type: 'white', freq: 349.23, label: 'F' },
  { note: 'F#4', type: 'black', freq: 369.99 },
  { note: 'G4',  type: 'white', freq: 392.00, label: 'G' },
  { note: 'G#4', type: 'black', freq: 415.30 },
  { note: 'A4',  type: 'white', freq: 440.00, label: 'A' },
  { note: 'A#4', type: 'black', freq: 466.16 },
  { note: 'B4',  type: 'white', freq: 493.88, label: 'B' },
  { note: 'C5',  type: 'white', freq: 523.25, label: 'C5' },
  { note: 'C#5', type: 'black', freq: 554.37 },
  { note: 'D5',  type: 'white', freq: 587.33, label: 'D' },
  { note: 'D#5', type: 'black', freq: 622.25 },
  { note: 'E5',  type: 'white', freq: 659.25, label: 'E' },
  { note: 'F5',  type: 'white', freq: 698.46, label: 'F' },
  { note: 'F#5', type: 'black', freq: 739.99 },
  { note: 'G5',  type: 'white', freq: 783.99, label: 'G' },
  { note: 'G#5', type: 'black', freq: 830.61 },
  { note: 'A5',  type: 'white', freq: 880.00, label: 'A' },
  { note: 'A#5', type: 'black', freq: 932.33 },
  { note: 'B5',  type: 'white', freq: 987.77, label: 'B' },
];

/* ── Audio ── */
let audioContext = null;

function getAudioContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playNote(freq) {
  const ctx = getAudioContext();
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
    lbl.id = `label-${key.note.toLowerCase()}`;
    lbl.className = 'key-label';
    lbl.textContent = key.label;
    el.appendChild(lbl);
  }

  el.addEventListener('mousedown', e => { e.preventDefault(); trigger(el, key.note, key.freq); });
  el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });

  pianoEl.appendChild(el);
});

// 2 — black keys (absolute)
let wIdx = -1;
KEY_DATA.forEach(key => {
  if (key.type === 'white') {
    wIdx++;
  } else {
    const el = document.createElement('div');
    el.id = `label-${key.note.toLowerCase()}`;
    el.className = 'key-black';

    // centre the black key over the boundary between two adjacent white keys
    const left = (wIdx + 1) * (WHITE_W + GAP) - BLACK_W / 2;
    el.style.left = left + 'px';

    el.addEventListener('mousedown', e => { e.preventDefault(); trigger(el, key.note, key.freq); });
    el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });

    pianoEl.appendChild(el);
  }
});

/* ── Responsive scale ── */
const contentWrapper = document.querySelector('.content-wrapper');

function updateScale() {
  // Reset to 1 so we can measure the true natural dimensions from the DOM
  document.documentElement.style.setProperty('--piano-scale', '1');

  const nW = contentWrapper.offsetWidth;
  const nH = contentWrapper.offsetHeight;

  // visualViewport is more accurate on iOS (excludes browser chrome)
  const vp = window.visualViewport;
  const vw = vp ? vp.width  : window.innerWidth;
  const vh = vp ? vp.height : window.innerHeight;

  const margin = 24;
  const scale  = Math.min(1, (vw - margin) / nW, (vh - margin) / nH);

  document.documentElement.style.setProperty('--piano-scale', scale.toFixed(4));
}

// Use visualViewport resize if available (catches iOS keyboard / chrome changes)
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateScale);
} else {
  window.addEventListener('resize', updateScale);
}

// orientationchange fires before the new dimensions are ready;
// wait for the resize that always follows it
window.addEventListener('orientationchange', () => {
  window.addEventListener('resize', updateScale, { once: true });
});

updateScale();

// test env button to check if JS is running
const testBtn = document.getElementById('test-btn');

async function playSong() {
  const response = await fetch('../songs/testsong.json');
  const data = await response.json();
  const pianoSong = data.notes;

  for (const element of pianoSong) {
    if (element.notes === null) {
      await shortPause(element.duration);
      continue;
    }

    if (element.notes && element.notes.length > 0) {
      for (const note of element.notes) {
        const key = document.getElementById(`label-${note.toLowerCase()}`);
        if (key) {
          key.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        } else {
          const keyData = KEY_DATA.find(k => k.note === note);
          if (keyData) playNote(keyData.freq);
        }
      }
    }

    await shortPause(element.duration);
  }
}

async function shortPause(timer) {
  await new Promise(resolve => setTimeout(resolve, timer)); // timer ms
}

testBtn.addEventListener('click', playSong);