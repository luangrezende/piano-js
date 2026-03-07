const WHITE_W = 52;
const BLACK_W = 34;
const GAP = 1;
let audioContext = null;
let keyData = null;

async function getAudioContext() {
  if (!audioContext) 
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') 
    await audioContext.resume();

  return audioContext;
}

async function getKeyDataConfig() {
  const response = await fetch('/config/keyData.json');
  if (!response.ok) 
    throw new Error(`Failed to load keyData.json: ${response.status}`);
  const data = await response.json();

  return data.keys;
}

function buildPiano(keyData) {
  const pianoElement  = document.getElementById('piano');
  const noteDisplay = document.getElementById('noteDisplay');
  let fadeTimer = null;

  function showNote(noteName) {
    noteDisplay.textContent = noteName;
    noteDisplay.classList.add('visible');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => noteDisplay.classList.remove('visible'), 1600);
  }

  function trigger(element, note, frequency) {
    playNote(frequency);
    showNote(note);
    element.classList.add('active');
  }

  // 1 — white keys (flex flow)
  keyData.filter(k => k.type === 'white').forEach(key => {
    const el = document.createElement('div');
    el.className = 'key-white';
    key.el = el;

    if (key.label) {
      const lbl = document.createElement('span');
      lbl.id = `label-${key.note.toLowerCase()}`;
      lbl.className = 'key-label';
      lbl.textContent = key.label;
      el.appendChild(lbl);
    }

    el.addEventListener('mousedown',  e => { e.preventDefault(); trigger(el, key.note, key.freq); });
    el.addEventListener('mouseup',    () => el.classList.remove('active'));
    el.addEventListener('mouseleave', () => el.classList.remove('active'));
    el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });
    el.addEventListener('touchend',   () => el.classList.remove('active'));

    pianoElement.appendChild(el);
  });

  // 2 — black keys (absolute)
  let wIdx = -1;
  keyData.forEach(key => {
    if (key.type === 'white') {
      wIdx++;
    } else {
      const el = document.createElement('div');
      el.id = `label-${key.note.toLowerCase()}`;
      el.className = 'key-black';
      key.el = el;

      // centre the black key over the boundary between two adjacent white keys
      const left = (wIdx + 1) * (WHITE_W + GAP) - BLACK_W / 2;
      el.style.left = left + 'px';

      el.addEventListener('mousedown',  e => { e.preventDefault(); trigger(el, key.note, key.freq); });
      el.addEventListener('mouseup',    () => el.classList.remove('active'));
      el.addEventListener('mouseleave', () => el.classList.remove('active'));
      el.addEventListener('touchstart', e => { e.preventDefault(); trigger(el, key.note, key.freq); }, { passive: false });
      el.addEventListener('touchend',   () => el.classList.remove('active'));

      pianoElement.appendChild(el);
    }
  });

  /* ── Keyboard shortcuts ── */
  const keyMap = Object.fromEntries(keyData.filter(k => k.key).map(k => [k.key, k]));

  window.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = keyMap[e.key.toLowerCase()];
    if (!k || !k.el) return;
    e.preventDefault();
    trigger(k.el, k.note, k.freq);
  });

  window.addEventListener('keyup', e => {
    const k = keyMap[e.key.toLowerCase()];
    if (!k || !k.el) return;
    k.el.classList.remove('active');
  });
}

async function playNote(freq) {
  await getAudioContext();
  const t = audioContext.currentTime;

  const master = audioContext.createGain();
  master.gain.setValueAtTime(0.30, t);
  master.connect(audioContext.destination);

  // Harmonics that approximate a struck string
  const harmonics = [
    { mult: 1, amp: 0.60, decay: 3.2 },
    { mult: 2, amp: 0.22, decay: 2.0 },
    { mult: 3, amp: 0.10, decay: 1.4 },
    { mult: 4, amp: 0.05, decay: 0.9 },
    { mult: 5, amp: 0.02, decay: 0.6 },
  ];

  harmonics.forEach(({ mult, amp, decay }) => {
    const osc = audioContext.createOscillator();
    const g   = audioContext.createGain();
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

function updateScale() {
  // Reset to 1 so we can measure the true natural dimensions from the DOM
  const contentWrapper = document.querySelector('.content-wrapper');
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

async function playSong() {
  const songFile = await fetch('/songs/song1.json');
  const songData = await songFile.json();
  const songNotes = songData.musicSheet;

  for (const note of songNotes) {
    if (note.notes === null) {
      await shortPause(note.duration);
      continue;
    }

    if (note.notes && note.notes.length > 0) {
      const keys = note.notes
        .map(n => document.getElementById(`label-${n.toLowerCase()}`))
        .filter(Boolean);

      keys.forEach(key => key.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      await shortPause(note.duration);
      keys.forEach(key => key.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true })));
      continue;
    }
  }
}

async function shortPause(timer) {
  await new Promise(resolve => setTimeout(resolve, timer)); // timer ms
}

// initialize heeeeeeeeeere
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateScale);
} else {
  window.addEventListener('resize', updateScale);
}

window.addEventListener('orientationchange', () => {
  window.addEventListener('resize', updateScale, { once: true });
});

async function init() {
  keyData = await getKeyDataConfig();

  updateScale();
  buildPiano(keyData);

  //just test, remove after
  document.getElementById('play-btn').addEventListener('click', () => {
    playSong();
  });
}

init();