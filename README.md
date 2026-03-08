# PIANO JS

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-Vanilla%20JS%20%7C%20Web%20Audio%20API-lightgrey)
![Deploy](https://img.shields.io/badge/deploy-Railway-blueviolet)

A browser-based virtual piano with audio synthesis, song playback, and swappable skins. No frameworks, no bundler — just ES Modules and the Web Audio API.

## Overview

piano-js renders a playable piano keyboard in the browser. Notes are synthesized in real time using additive synthesis with ADSR envelopes. Songs are stored as JSON sequences and played back through an instrument-agnostic player. The UI is intentionally minimal and runs entirely as a static site.

## Tech Stack

- Vanilla JavaScript (ES Modules)
- Web Audio API (`OscillatorNode`, `GainNode`, ADSR)
- CSS3 (custom properties, animations)
- [serve](https://github.com/vercel/serve) — static file server
- Railway — production deployment

## Project Structure

```
src/
  main.js             entry point
  core/
    api.js            fetchJSON helper
    audio.js          audio engine — getAudioContext, playNote
    player.js         song player, instrument-agnostic via triggerNote callback
  piano/
    piano.js          builds piano DOM, exports triggerNote
  ui/
    controls.js       all UI event wiring
  index.html
  style.css
config/
  pianoData.json      key layout, harmonics, branding
  songsData.json      song manifest
songs/
  piano/              song files as JSON note sequences
```

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
