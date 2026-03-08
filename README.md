# piano-js

A virtual piano built with vanilla JavaScript, Web Audio API and zero dependencies.

## Features

- **Playable piano** — click keys or use the keyboard
- **Web Audio API** synthesis with ADSR envelope and harmonic partials
- **Auto-play songs** — Carol of the Bells, Interstellar, Married Life
- **Piano skins** — Classic (dark wood) and Clean (pastel linen)
- **Key labels** — toggle between keyboard shortcuts and note names
- **ES Modules** — fully modular codebase (`core/`, `piano/`, `ui/`)
- **Responsive scale** — adapts to window size via CSS custom property

## Structure

```
src/
  main.js           # entry point
  core/
    api.js          # fetchJSON helper
    audio.js        # Web Audio engine (getAudioContext, playNote)
    player.js       # song player (instrument-agnostic)
  piano/
    piano.js        # build DOM + triggerNote
  ui/
    controls.js     # all UI event wiring
  index.html
  style.css
config/
  pianoData.json    # keys, harmonics, brand
  songsData.json    # song list per instrument
songs/
  piano/            # song JSON files
```

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on [Railway](https://railway.app) — `npm start` uses `${PORT:-3000}`.

## License

MIT
