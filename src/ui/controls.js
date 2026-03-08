// ── UI controls

import { playSong, stopSong } from '../core/player.js';

let btnPlay;
let toggleBtns;
let currentTriggerNote = null;

function populateSongList(songs) {
  const songListElement = document.getElementById('song-list');
  if (!songListElement) return;

  songListElement.innerHTML = '';
  songs.forEach((song) => {
    const listItem = document.createElement('option');
    listItem.textContent = song.title;
    listItem.value = song.filepath;
    songListElement.appendChild(listItem);
  });
}

export function setupPiano(songsData, triggerNote) {
  currentTriggerNote = triggerNote;
  populateSongList(songsData.songs.piano ?? []);
}

export function setupLayoutSelector() {
  const btns = document.querySelectorAll('.layout-selector__btn');
  const pianoWrapper = document.getElementById('piano-wrapper');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      pianoWrapper.classList.toggle(
        'layout--clean',
        btn.dataset.layout === 'clean'
      );
    });
  });
}

export function setupToggleListeners() {
  toggleBtns = document.querySelectorAll('.label-toggle__btn');

  document.getElementById('toggle-keys').addEventListener('click', () => {
    document
      .querySelectorAll('.key-label')
      .forEach((el) => (el.textContent = el.dataset.keyboard));
    toggleBtns.forEach((b) => b.classList.remove('active'));
    document.getElementById('toggle-keys').classList.add('active');
  });

  document.getElementById('toggle-notes').addEventListener('click', () => {
    document
      .querySelectorAll('.key-label')
      .forEach((el) => (el.textContent = el.dataset.note));
    toggleBtns.forEach((b) => b.classList.remove('active'));
    document.getElementById('toggle-notes').classList.add('active');
  });
}

function resetPlayButton() {
  if (!btnPlay) return;
  document.getElementById('play-icon').innerHTML = '&#9654;';
  btnPlay.classList.remove('playing');
}

function toggleSongsList(disabled) {
  document.getElementById('song-list').disabled = disabled;
}

export function setupPlayButtonListener() {
  btnPlay = document.getElementById('play-btn');

  btnPlay.addEventListener('click', () => {
    if (btnPlay.classList.contains('playing')) {
      stopSong();
      resetPlayButton();
      toggleSongsList(false);
      return;
    }

    const filepath = document.getElementById('song-list').value;
    playSong(filepath, currentTriggerNote, () => {
      resetPlayButton();
      toggleSongsList(false);
    });

    toggleSongsList(true);
    document.getElementById('play-icon').innerHTML = '&#9646;&#9646;';
    btnPlay.classList.add('playing');
  });
}
