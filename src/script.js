let pianoData;
let audioContext;
let masterGain;
let songsData = [];
let songAbortController = null;

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

async function getSongsJsonFiles() {
  const response = await fetch('/config/songsData.json');

  if (!response.ok) 
    throw new Error(`Failed to load songsData.json: ${response.status}`);

  return await response.json();
}

async function populateSongList(songsData) {
  const songListElement = document.getElementById('song-list');
  if (!songListElement) 
    return;

  songsData.songs.forEach(song => {
    const listItem = document.createElement('option');
    listItem.textContent = song.title;
    listItem.value = song.filepath;
    songListElement.appendChild(listItem);
  });
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
    gain.gain.exponentialRampToValueAtTime(0.0025, currentTime + decay);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + decay);
  });
}

function stopSong() {
  songAbortController?.abort();
  songAbortController = null;
}

async function playSong(selectedSong) {
  stopSong();
  songAbortController = new AbortController();
  const signal = songAbortController.signal;

  const songFile = await fetch(`${selectedSong.value}`);
  const songData = await songFile.json();
  const songNotes = songData.musicSheet;

  for (const note of songNotes) {
    if (signal.aborted) break;

    if (!note.notes || note.notes.length === 0) {
      await shortPause(note.duration, signal);
      continue;
    }

    const keys = note.notes
      .map(n => document.getElementById(`label-${n.toLowerCase()}`))
      .filter(Boolean);

    keys.forEach(key => key.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
    await shortPause(note.duration, signal);
    keys.forEach(key => key.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })));
  }
}

async function shortPause(timer, signal) {
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, timer);
    signal?.addEventListener('abort', () => { clearTimeout(timeout); resolve(); }, { once: true });
  });
}

// initialize heeeeeeeeeere
async function init() {
  const btnPlay = document.getElementById('play-btn');
  pianoData = await getPianoDataConfig();
  songsData = await getSongsJsonFiles();
  buildPiano();
  populateSongList(songsData);

  btnPlay.addEventListener('click', () => {
    if (btnPlay.classList.contains('playing')) {
      stopSong();
      btnPlay.textContent = 'play';
      btnPlay.classList.remove('playing');
      return;
    }

    const selectedSong = document.getElementById('song-list');
    playSong(selectedSong);

    btnPlay.textContent = 'stop';
    btnPlay.classList.add('playing');
  });
}

init();