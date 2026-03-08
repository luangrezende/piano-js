import { fetchJSON } from './core/api.js';
import { buildPiano, triggerNote as pianoTriggerNote } from './piano/piano.js';
import {
  setupLayoutSelector,
  setupPiano,
  setupToggleListeners,
  setupPlayButtonListener,
} from './ui/controls.js';

async function init() {
  const [pianoData, songsData] = await Promise.all([
    fetchJSON('/config/pianoData.json'),
    fetchJSON('/config/songsData.json'),
  ]);

  buildPiano(pianoData);
  setupPiano(songsData, pianoTriggerNote);
  setupLayoutSelector();
  setupToggleListeners();
  setupPlayButtonListener();
}

init();
