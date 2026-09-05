/* ============================================================
   WEATHER APP — Procedural Audio Engine (Web Audio API)
   ============================================================ */

const AudioEngine = (() => {
  let audioCtx = null;
  let masterGain = null;
  let currentSoundscape = null;
  let activeNodes = [];
  let isMuted = true;
  let masterVolume = 0.5;
  let playCueEnabled = true;

  /* ──────────────────────────────────────────
     INITIALIZATION & UTILS
     ────────────────────────────────────────── */

  function _getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = isMuted ? 0 : masterVolume;
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function _createNoiseBuffer(type = 'pink') {
    const ctx = _getAudioContext();
    if (!ctx) return null;

    const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // scale down
        b6 = white * 0.115926;
      } else {
        output[i] = white;
      }
    }
    return buffer;
  }

  function _stopActiveNodes() {
    activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // Node already stopped
      }
    });
    activeNodes = [];
  }

  /* ──────────────────────────────────────────
     SOUNDSCAPE GENERATORS
     ────────────────────────────────────────── */

  // 1. Rain Sound Generator
  function _startRainSoundscape(isHeavy = false) {
    const ctx = _getAudioContext();
    if (!ctx) return;

    const noiseBuffer = _createNoiseBuffer('pink');
    if (!noiseBuffer) return;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isHeavy ? 1200 : 800;

    const gain = ctx.createGain();
    gain.gain.value = isHeavy ? 0.35 : 0.2;

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start();
    activeNodes.push(noiseSource, filter, gain);

    // Periodic raindrops
    const dropInterval = setInterval(() => {
      if (isMuted || !audioCtx) return;
      _playSingleRaindrop(isHeavy);
    }, isHeavy ? 150 : 350);

    activeNodes.push({ stop: () => clearInterval(dropInterval) });
  }

  function _playSingleRaindrop(isHeavy = false) {
    const ctx = _getAudioContext();
    if (!ctx || isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = 600 + Math.random() * 1200;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(isHeavy ? 0.08 : 0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // 2. Thunderstorm Generator
  function _startThunderstormSoundscape() {
    const ctx = _getAudioContext();
    if (!ctx) return;

    _startRainSoundscape(true);

    // Periodic thunder rumbles
    const thunderTimer = setInterval(() => {
      if (isMuted || !audioCtx) return;
      if (Math.random() < 0.6) {
        _triggerThunderRumble();
      }
    }, 6000);

    activeNodes.push({ stop: () => clearInterval(thunderTimer) });
  }

  function _triggerThunderRumble() {
    const ctx = _getAudioContext();
    if (!ctx || isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 2.0);
  }

  // 3. Wind Sound Generator
  function _startWindSoundscape() {
    const ctx = _getAudioContext();
    if (!ctx) return;

    const noiseBuffer = _createNoiseBuffer('pink');
    if (!noiseBuffer) return;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    // LFO for whistling gust modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2; // slow gust cycles
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300; // modulate filter frequency ±300Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start();
    lfo.start();
    activeNodes.push(noiseSource, filter, gain, lfo, lfoGain);
  }

  // 4. Sunny / Clear Day Soundscape (Warm chimes + ambient pad)
  function _startSunnySoundscape() {
    const ctx = _getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 493.88]; // C, E, G, B major 7 warm chord

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.value = 0.02;

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      activeNodes.push(osc, gain);
    });

    // Gentle bird/nature chimes
    const chimeTimer = setInterval(() => {
      if (isMuted || !audioCtx) return;
      _playBirdChime();
    }, 2500);

    activeNodes.push({ stop: () => clearInterval(chimeTimer) });
  }

  function _playBirdChime() {
    const ctx = _getAudioContext();
    if (!ctx || isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    const note = notes[Math.floor(Math.random() * notes.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, now);
    osc.frequency.exponentialRampToValueAtTime(note * 1.1, now + 0.15);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 5. Snow Soundscape (Soft winter breeze & crisp sparkles)
  function _startSnowSoundscape() {
    const ctx = _getAudioContext();
    if (!ctx) return;

    const noiseBuffer = _createNoiseBuffer('pink');
    if (!noiseBuffer) return;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2500;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.start();
    activeNodes.push(noiseSource, filter, gain);
  }

  // 6. Fog / Mist Soundscape (Soft atmospheric drone)
  function _startMistSoundscape() {
    const ctx = _getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 110; // A2
    osc2.type = 'sine';
    osc2.frequency.value = 110.5; // slight detune

    gain.gain.value = 0.04;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);

    osc1.start();
    osc2.start();
    activeNodes.push(osc1, osc2, gain);
  }

  /* ──────────────────────────────────────────
     AUDIO CONDITION CUE (Distinct notification sound)
     ────────────────────────────────────────── */

  function playAudioCue(condition) {
    if (!playCueEnabled || isMuted) return;
    const ctx = _getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const c = (condition || '').toLowerCase();

    if (c.includes('thunder') || c.includes('storm')) {
      // Short thunder clap cue
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.6);

    } else if (c.includes('rain') || c.includes('drizzle')) {
      // Rain drops chime sequence
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });

    } else if (c.includes('clear') || c.includes('sunny')) {
      // Arpeggiated happy sunny chime
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });

    } else if (c.includes('wind')) {
      // Whistling wind sweep cue
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.6);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.6);

    } else {
      // Gentle swell cue
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  /* ──────────────────────────────────────────
     PUBLIC SOUNDSCAPE CONTROL
     ────────────────────────────────────────── */

  function playWeatherSound(condition, isDay = true) {
    currentSoundscape = condition;
    _stopActiveNodes();

    if (isMuted) return;

    const c = (condition || '').toLowerCase();
    if (c.includes('thunder') || c.includes('storm')) {
      _startThunderstormSoundscape();
    } else if (c.includes('heavy rain') || c.includes('downpour')) {
      _startRainSoundscape(true);
    } else if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      _startRainSoundscape(false);
    } else if (c.includes('wind')) {
      _startWindSoundscape();
    } else if (c.includes('snow') || c.includes('sleet') || c.includes('blizzard')) {
      _startSnowSoundscape();
    } else if (c.includes('mist') || c.includes('fog') || c.includes('haze')) {
      _startMistSoundscape();
    } else if (c.includes('clear') || c.includes('sunny')) {
      _startSunnySoundscape();
    } else {
      _startSunnySoundscape();
    }
  }

  function setMuted(muted) {
    isMuted = muted;
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : masterVolume, audioCtx.currentTime);
    }
    if (isMuted) {
      _stopActiveNodes();
    } else if (currentSoundscape) {
      playWeatherSound(currentSoundscape);
    }
  }

  function toggleMute() {
    _getAudioContext();
    setMuted(!isMuted);
    return isMuted;
  }

  function setVolume(vol) {
    const parsed = Number(vol);
    masterVolume = Math.max(0, Math.min(1, isNaN(parsed) ? 0.5 : parsed));
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : masterVolume, audioCtx.currentTime);
    }
  }

  function setCueEnabled(enabled) {
    playCueEnabled = Boolean(enabled);
  }

  function isAudioMuted() {
    return isMuted;
  }

  function getCurrentCondition() {
    return currentSoundscape;
  }

  /* ── Public API ── */
  return {
    playWeatherSound,
    playAudioCue,
    setMuted,
    toggleMute,
    setVolume,
    setCueEnabled,
    isAudioMuted,
    getCurrentCondition,
  };
})();
