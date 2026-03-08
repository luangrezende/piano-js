let pianoData;
let audioContext;
let masterGain;

async function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();

    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return audioContext;
}

async function getPianoDataConfig() {
  const response = await fetch('/config/pianoData.json');
  if (!response.ok) 
    throw new Error(`Failed to load pianoData.json: ${response.status}`);

  return await response.json();
}

function trigger(element, frequency) {
  playNote(frequency);
  element.classList.remove('active');
  void element.offsetWidth; // force reflow so the animation restarts (think in a better solution for this gambiarra)
  element.classList.add('active');
}

function setupKeyEventListeners(element, key) {
  const deactivate = () => element.classList.remove('active');

  const handleStart = (e) => {
    e.preventDefault();
    trigger(element, key.freq);
  };

  element.addEventListener('mousedown', handleStart);
  element.addEventListener('mouseup', deactivate);
  element.addEventListener('mouseleave', deactivate);

  element.addEventListener('touchstart', handleStart, { passive: false });
  element.addEventListener('touchend', deactivate);

  return element;
}

function createKeyLabel(key, element) {
  const label = document.createElement('span');

  label.id = `label-${key.note.toLowerCase()}`;
  label.className = 'key-label key-label--' + key.type;
  label.textContent = key.keyboardKey.toUpperCase();
  element.appendChild(label);
}

function createWhiteKey(key, pianoElement) {
  const element = document.createElement('div');
  element.className = 'key-white';
  key.el = element;
  createKeyLabel(key, element);
  pianoElement.appendChild(setupKeyEventListeners(element, key));
}

function createBlackKey(key, keys, pianoElement) {
  const BLACK_W = 34;
  const element = document.createElement('div');

  element.id = `label-${key.note.toLowerCase()}`;
  element.className = 'key-black';
  key.el = element;
  createKeyLabel(key, element);

  const nextWhite = keys.slice(keys.indexOf(key) + 1).find(k => k.type === 'white');
  element.style.left = nextWhite.el.offsetLeft - BLACK_W / 2 + 'px';

  pianoElement.appendChild(setupKeyEventListeners(element, key));
}

function setupKeyboardShortcuts(keys) {
  const keyMap = Object.fromEntries(
    keys
      .filter(key => key.keyboardKey)
      .map(key => [key.keyboardKey.toLowerCase(), key])
  );

  const getMappedKey = (e) => keyMap[e.key?.toLowerCase()];

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

    const key = getMappedKey(e);
    if (!key?.el) return;

    e.preventDefault();
    trigger(key.el, key.freq);
  });

  window.addEventListener('keyup', (e) => {
    const key = getMappedKey(e);
    if (!key?.el) return;

    key.el.classList.remove('active');
  });
}

function buildPiano() {
  const pianoElement = document.getElementById('piano');
  const pianoBrand = document.getElementById('piano-brand');
  const pianoSignature = document.getElementById('piano-signature');
  const keys = pianoData?.keyMap;

  if (!pianoElement || !pianoBrand || !pianoSignature || !Array.isArray(keys)) {
    return;
  }

  pianoBrand.textContent = pianoData.brand;
  pianoSignature.textContent = pianoData.signature;

  const whiteKeys = keys.filter(key => key.type === 'white');
  const blackKeys = keys.filter(key => key.type === 'black');

  whiteKeys.forEach(key => createWhiteKey(key, pianoElement));
  blackKeys.forEach(key => createBlackKey(key, keys, pianoElement));

  setupKeyboardShortcuts(keys);
}

async function playNote(frequency) {
  await getAudioContext();

  const harmonics = pianoData?.harmonics;
  if (!Array.isArray(harmonics) || !frequency) {
    return;
  }

  const currentTime = audioContext.currentTime;

  harmonics.forEach(({ mult, amp, decay }) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * mult, currentTime);

    gain.gain.setValueAtTime(amp, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0055, currentTime + decay);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + decay);
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
  const songFile = await fetch('/songs/song3.json');
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
async function init() {
  pianoData = await getPianoDataConfig();
  updateScale();
  buildPiano();

  window.addEventListener('orientationchange', () => {
    window.addEventListener('resize', updateScale, { once: true });
  });

  //TODO: just test, remove this block after
  document.getElementById('play-btn').addEventListener('click', () => {
    playSong();
  });
}

init();