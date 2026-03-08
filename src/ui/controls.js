// ── UI controls

import { playSong, stopSong } from '../core/player.js';

let playButton;
let labelToggleBtns;
let currentTriggerNote = null;

function populateSongList(songs) {
  const songList = document.getElementById('song-list');
  if (!songList) return;

  songList.innerHTML = '';
  songs.forEach((song) => {
    const option = document.createElement('option');
    option.textContent = song.title;
    option.value = song.filepath;
    songList.appendChild(option);
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
  labelToggleBtns = document.querySelectorAll('.label-toggle__btn');

  document.getElementById('toggle-keys').addEventListener('click', () => {
    document
      .querySelectorAll('.key-label')
      .forEach((el) => (el.textContent = el.dataset.keyboard));
    labelToggleBtns.forEach((b) => b.classList.remove('active'));
    document.getElementById('toggle-keys').classList.add('active');
  });

  document.getElementById('toggle-notes').addEventListener('click', () => {
    document
      .querySelectorAll('.key-label')
      .forEach((el) => (el.textContent = el.dataset.note));
    labelToggleBtns.forEach((b) => b.classList.remove('active'));
    document.getElementById('toggle-notes').classList.add('active');
  });
}

function resetPlayButton() {
  if (!playButton) return;
  document.getElementById('play-icon').innerHTML = '&#9654;';
  playButton.classList.remove('playing');
}

function toggleSongsList(disabled) {
  document.getElementById('song-list').disabled = disabled;
}

export function setupPlayButtonListener() {
  playButton = document.getElementById('play-btn');

  playButton.addEventListener('click', () => {
    if (playButton.classList.contains('playing')) {
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
    playButton.classList.add('playing');
  });
}
