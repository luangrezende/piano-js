# PIANO JS

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%7C%20Web%20Audio%20API-lightgrey)
![Deploy](https://img.shields.io/badge/deploy-Railway-blueviolet)

A browser-based virtual piano with audio synthesis, song playback, and swappable skins. No frameworks, no bundler, just ES Modules and the Web Audio API.

## Overview

piano-js renders a playable piano keyboard in the browser. Notes are synthesized in real time using additive synthesis with ADSR envelopes. Songs are stored as JSON sequences and played back through an instrument-agnostic player. The UI is intentionally minimal and runs entirely as a static site.

## Tech Stack

- Vanilla JavaScript (ES Modules)
- Web Audio API (`OscillatorNode`, `GainNode`, ADSR)
- CSS3 (custom properties, animations)
- [serve](https://github.com/vercel/serve) — static file server
- Railway — production deployment

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/luangrezende/piano-js.git
cd piano-js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

```bash
npm start
```

Uses `${PORT:-3000}` — compatible with Railway and any platform that injects `$PORT` at runtime.

## Adding Songs

Songs are plain JSON files. Each entry in `musicSheet` defines which notes play simultaneously and for how long.

**1. Create the file** at `songs/piano/my-song.json`:

```json
{
  "title": "My Song - Artist Name",
  "musicSheet": [
    { "notes": ["E4"], "duration": 300 },
    { "notes": ["D4"], "duration": 300 },
    { "notes": ["C4", "E4"], "duration": 600 },
    { "notes": null, "duration": 200 }
  ]
}
```

- `notes` — array of note names (e.g. `"C4"`, `"F#3"`), or `null` for a rest
- `duration` — how long the step lasts in milliseconds
- `comment` fields are ignored by the player and can be used as section markers

**2. Register it** in `config/songsData.json`:

```json
{
  "songs": {
    "piano": [
      {
        "title": "My Song - Artist Name",
        "filepath": "/songs/piano/my-song.json"
      }
    ]
  }
}
```

The song will appear in the selector automatically — no code changes required.
