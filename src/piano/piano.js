// ── Piano instrument

import { playNote } from '../core/audio.js';

const BLACK_KEY_WIDTH = 34;

function createKeyLabel(key, element) {
  const label = document.createElement('span');

  label.id = `label-${key.note.toLowerCase()}`;
  label.className = 'key-label key-label--' + key.type;
  label.dataset.keyboard = key.keyboardKey.toUpperCase();
  label.dataset.note = key.note;
  label.textContent = key.keyboardKey.toUpperCase();
  element.appendChild(label);
}

function triggerKey(element, frequency, harmonics) {
  playNote(frequency, harmonics);
  element.classList.remove('active');
  void element.offsetWidth; // force reflow to restart animation
  element.classList.add('active');
}

function setupKeyEventListeners(element, key, harmonics) {
  const deactivate = () => element.classList.remove('active');

  const handleStart = (e) => {
    e.preventDefault();
    triggerKey(element, key.freq, harmonics);
  };

  element.addEventListener('mousedown', handleStart);
  element.addEventListener('mouseup', deactivate);
  element.addEventListener('mouseleave', deactivate);

  element.addEventListener('touchstart', handleStart, { passive: false });
  element.addEventListener('touchend', deactivate);

  return element;
}

function createWhiteKey(key, pianoElement, harmonics) {
  const element = document.createElement('div');
  element.className = 'key-white';
  key.el = element;
  createKeyLabel(key, element);
  pianoElement.appendChild(setupKeyEventListeners(element, key, harmonics));
}

function createBlackKey(key, keys, pianoElement, harmonics) {
  const element = document.createElement('div');

  element.id = `label-${key.note.toLowerCase()}`;
  element.className = 'key-black';
  key.el = element;
  createKeyLabel(key, element);

  const nextWhite = keys
    .slice(keys.indexOf(key) + 1)
    .find((k) => k.type === 'white');
  element.style.left = nextWhite.el.offsetLeft - BLACK_KEY_WIDTH / 2 + 'px';

  pianoElement.appendChild(setupKeyEventListeners(element, key, harmonics));
}

function setupKeyboardShortcuts(keys, harmonics) {
  const keyMap = Object.fromEntries(
    keys
      .filter((key) => key.keyboardKey)
      .map((key) => [key.keyboardKey.toLowerCase(), key])
  );

  const getMappedKey = (e) => keyMap[e.key?.toLowerCase()];

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;

    const key = getMappedKey(e);
    if (!key?.el) return;

    e.preventDefault();
    triggerKey(key.el, key.freq, harmonics);
  });

  window.addEventListener('keyup', (e) => {
    const key = getMappedKey(e);
    if (!key?.el) return;

    key.el.classList.remove('active');
  });
}

export function triggerNote(note, action) {
  const el = document.getElementById(`label-${note.toLowerCase()}`);
  if (!el) return;
  el.dispatchEvent(
    new MouseEvent(action === 'start' ? 'mousedown' : 'mouseup', {
      bubbles: true,
    })
  );
}

export function buildPiano(pianoData) {
  const pianoElement = document.getElementById('piano');
  const pianoBrand = document.getElementById('piano-brand');
  const pianoSignature = document.getElementById('piano-signature');
  const keys = pianoData?.keyMap;

  if (!pianoElement || !pianoBrand || !pianoSignature || !Array.isArray(keys))
    return;

  pianoBrand.textContent = pianoData.brand;
  pianoSignature.textContent = pianoData.signature;

  const { harmonics } = pianoData;
  const whiteKeys = keys.filter((key) => key.type === 'white');
  const blackKeys = keys.filter((key) => key.type === 'black');

  whiteKeys.forEach((key) => createWhiteKey(key, pianoElement, harmonics));
  blackKeys.forEach((key) =>
    createBlackKey(key, keys, pianoElement, harmonics)
  );

  setupKeyboardShortcuts(keys, harmonics);
}
