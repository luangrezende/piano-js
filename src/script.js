// State
const DECAY_MULTIPLIER = 1.5;
const MIN_GAIN = 0.0025;
let pianoData;
let audioContext;
let masterGain;
let songsData = [];
let songAbortController = null;
let toggleBtns;
let btnPlay;

// Audio
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

async function playNote(frequency) {
  await getAudioContext();

  const harmonics = pianoData?.harmonics;
  const currentTime = audioContext.currentTime;

  harmonics.forEach(({ freqMult, amplitude, decay }) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency * freqMult, currentTime);

    gain.gain.setValueAtTime(amplitude, currentTime);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, currentTime + decay);

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + decay * DECAY_MULTIPLIER);
  });
}

// Data loading
async function getPianoDataConfig() {
  const response = await fetchJSON('/config/pianoData.json');
  return response;
}

async function getSongsData() {
  const response = await fetchJSON('/config/songsData.json');
  return response;
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) 
    throw new Error(`Failed to load ${path}: ${response.status}`);
  
  return response.json();
}

// Piano
function createKeyLabel(key, element) {
  const label = document.createElement('span');

  label.id = `label-${key.note.toLowerCase()}`;
  label.className = 'key-label key-label--' + key.type;
  label.dataset.keyboard = key.keyboardKey.toUpperCase();
  label.dataset.note = key.note;
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

function triggerKey(element, frequency) {
  playNote(frequency);
  element.classList.remove('active');
  void element.offsetWidth; // force reflow to restart animation (need to think a better solution for this gambiarra)
  element.classList.add('active');
}

function setupKeyEventListeners(element, key) {
  const deactivate = () => element.classList.remove('active');

  const handleStart = (e) => {
    e.preventDefault();
    triggerKey(element, key.freq);
  };

  element.addEventListener('mousedown', handleStart);
  element.addEventListener('mouseup', deactivate);
  element.addEventListener('mouseleave', deactivate);

  element.addEventListener('touchstart', handleStart, { passive: false });
  element.addEventListener('touchend', deactivate);

  return element;
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
    triggerKey(key.el, key.freq);
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

// Song player
async function shortPause(timer, signal) {
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, timer);
    signal?.addEventListener('abort', () => { clearTimeout(timeout); resolve(); }, { once: true });
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

  const songData = await fetchJSON(`${selectedSong.value}`);
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

  resetPlayButton();
  toggleSongsList(false);
}

// UI
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

function setupToggleListeners() {
  toggleBtns = document.querySelectorAll('.label-toggle__btn');

  document.getElementById('toggle-keys').addEventListener('click', () => {
    document.querySelectorAll('.key-label').forEach(el => el.textContent = el.dataset.keyboard);
    toggleBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toggle-keys').classList.add('active');
  });

  document.getElementById('toggle-notes').addEventListener('click', () => {
    document.querySelectorAll('.key-label').forEach(el => el.textContent = el.dataset.note);
    toggleBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('toggle-notes').classList.add('active');
  });
}

function setupPlayButtonListener() {
  btnPlay = document.getElementById('play-btn');

  btnPlay.addEventListener('click', () => {
    if (btnPlay.classList.contains('playing')) {
      stopSong();
      resetPlayButton();
      toggleSongsList(false);
      return;
    }

    const selectedSong = document.getElementById('song-list');
    playSong(selectedSong);
    toggleSongsList(true);
    document.getElementById('play-icon').innerHTML = '&#9646;&#9646;';
    btnPlay.classList.add('playing');
  });
}

function resetPlayButton() {
  document.getElementById('play-icon').innerHTML = '&#9654;';
  btnPlay.classList.remove('playing');
}

function toggleSongsList(disabled) {
  const songListElement = document.getElementById('song-list');
  songListElement.disabled = disabled;
  toggleBtns.forEach(btn => btn.disabled = disabled);
}

// Init
async function init() {
  pianoData = await getPianoDataConfig();
  songsData = await getSongsData();

  buildPiano();
  setupToggleListeners();
  setupPlayButtonListener();
  populateSongList(songsData);
}

init();