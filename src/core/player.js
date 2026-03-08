// ── Song player

import { fetchJSON } from './api.js';

let songAbortController = null;

export function stopSong() {
  songAbortController?.abort();
  songAbortController = null;
}

export async function playSong(filepath, triggerNote, onFinished) {
  stopSong();
  songAbortController = new AbortController();
  const signal = songAbortController.signal;

  const songData = await fetchJSON(filepath);
  const songNotes = songData.musicSheet;

  for (const note of songNotes) {
    if (signal.aborted) break;

    if (!note.notes || note.notes.length === 0) {
      await shortPause(note.duration, signal);
      continue;
    }

    note.notes.forEach((n) => triggerNote(n, 'start'));
    await shortPause(note.duration, signal);
    note.notes.forEach((n) => triggerNote(n, 'stop'));
  }

  if (!signal.aborted) onFinished?.();
}

function shortPause(timer, signal) {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timer);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
  });
}
