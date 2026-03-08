// ── Audio context

const DECAY_MULTIPLIER = 1.5;
const MIN_GAIN = 0.0025;
const OSCILATOR_TYPE = 'sine';
const SUSPENDED_STATE = 'suspended';
const AUDIO_VOLUME = 0.3;

let audioContext;
let masterGain;

export async function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(AUDIO_VOLUME, audioContext.currentTime);
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === SUSPENDED_STATE) {
    await audioContext.resume();
  }

  return audioContext;
}

export async function playNote(frequency, harmonics) {
  const ctx = await getAudioContext();
  const currentTime = ctx.currentTime;

  harmonics.forEach(({ freqMult, amplitude, decay }) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = OSCILATOR_TYPE;
    oscillator.frequency.setValueAtTime(frequency * freqMult, currentTime);

    gain.gain.setValueAtTime(amplitude, currentTime);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, currentTime + decay);

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + decay * DECAY_MULTIPLIER);
  });
}
