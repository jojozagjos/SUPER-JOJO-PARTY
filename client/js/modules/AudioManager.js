/**
 * Super JoJo Party - Audio Manager
 * Handles all game audio including music, sound effects, and voice lines
 */

export class AudioManager {
  constructor(app) {
    this.app = app;
    
    // Audio context
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.voiceGain = null;
    
    // Positional audio
    this.listener = null;
    this.positionalSources = new Map();
    
    // Current music
    this.currentMusic = null;
    this.musicSource = null;
    
    // Volume levels (0-100)
    this.volumes = {
      master: 80,
      music: 70,
      sfx: 90,
      voice: 80
    };
    
    // Audio buffers cache
    this.buffers = new Map();
    
    // Preload queue
    this.preloadQueue = [
      'click', 'success', 'coin', 'diceRoll', 'star'
    ];
    
    // Ducking state
    this.isDucking = false;
    
    // SFX definitions (will be generated procedurally)
    this.sfxDefinitions = {
      click: { frequency: 800, duration: 0.05, type: 'sine' },
      success: { frequency: 523.25, duration: 0.2, type: 'sine', sequence: [523.25, 659.25, 783.99] },
      error: { frequency: 200, duration: 0.3, type: 'sawtooth' },
      back: { frequency: 400, duration: 0.1, type: 'triangle' },
      modalOpen: { frequency: 600, duration: 0.1, type: 'sine' },
      playerJoin: { frequency: 440, duration: 0.15, type: 'sine', sequence: [440, 554.37, 659.25] },
      diceRoll: { frequency: 200, duration: 0.05, type: 'noise', repeat: 10 },
      coin: { frequency: 1200, duration: 0.1, type: 'sine', sequence: [1200, 1400] },
      star: { frequency: 800, duration: 0.3, type: 'sine', sequence: [523.25, 659.25, 783.99, 1046.5] },
      itemGet: { frequency: 600, duration: 0.15, type: 'triangle', sequence: [600, 800, 1000] },
      moveStep: { frequency: 300, duration: 0.05, type: 'sine' },
      blueSpace: { frequency: 523.25, duration: 0.2, type: 'sine' },
      redSpace: { frequency: 233.08, duration: 0.3, type: 'sawtooth' },
      eventSpace: { frequency: 440, duration: 0.2, type: 'triangle', sequence: [440, 554.37, 698.46] },
      vsSpace: { frequency: 329.63, duration: 0.2, type: 'square' },
      shopOpen: { frequency: 500, duration: 0.2, type: 'sine', sequence: [500, 600, 700, 800] },
      purchase: { frequency: 800, duration: 0.15, type: 'sine', sequence: [800, 1000, 1200] },
      minigameWin: { frequency: 523.25, duration: 0.4, type: 'sine', sequence: [523.25, 659.25, 783.99, 1046.5] },
      minigameLose: { frequency: 293.66, duration: 0.4, type: 'sawtooth', sequence: [293.66, 233.08] },
      countdown: { frequency: 440, duration: 0.2, type: 'sine' },
      countdownGo: { frequency: 880, duration: 0.3, type: 'sine' },
      overseerAppear: { frequency: 150, duration: 0.5, type: 'sawtooth', sequence: [150, 120, 100] },
      wheelSpin: { frequency: 400, duration: 0.1, type: 'triangle' },
      emote: { frequency: 700, duration: 0.1, type: 'sine' },
      // New sounds for added features
      luckySpace: { frequency: 698.46, duration: 0.25, type: 'sine', sequence: [698.46, 880, 1046.5, 1318.5] },
      bowserSpace: { frequency: 130.81, duration: 0.5, type: 'sawtooth', sequence: [130.81, 110, 98.00, 82.41] },
      duelStart: { frequency: 329.63, duration: 0.15, type: 'square', sequence: [329.63, 392, 493.88, 587.33] },
      duelWin: { frequency: 523.25, duration: 0.3, type: 'sine', sequence: [523.25, 698.46, 880] },
      duelLose: { frequency: 220, duration: 0.4, type: 'sawtooth', sequence: [220, 196, 165] },
      bonusStar: { frequency: 659.25, duration: 0.5, type: 'sine', sequence: [659.25, 783.99, 987.77, 1174.66, 1318.5] },
      last5Turns: { frequency: 440, duration: 0.3, type: 'triangle', sequence: [440, 523.25, 659.25, 783.99, 1046.5] },
      itemUse: { frequency: 550, duration: 0.2, type: 'sine', sequence: [550, 700, 880] },
      coinLoss: { frequency: 300, duration: 0.2, type: 'sawtooth', sequence: [400, 300, 200] },
      starGain: { frequency: 880, duration: 0.4, type: 'sine', sequence: [523.25, 659.25, 783.99, 1046.5, 1318.5] },
      starLoss: { frequency: 392, duration: 0.4, type: 'sawtooth', sequence: [523.25, 392, 293.66, 196] },
      shopRare: { frequency: 600, duration: 0.25, type: 'sine', sequence: [600, 800, 1000, 1200, 1400] },
      shopLucky: { frequency: 700, duration: 0.2, type: 'triangle', sequence: [700, 880, 1046.5] },
      turnStart: { frequency: 440, duration: 0.15, type: 'sine', sequence: [440, 523.25] },
      gameEnd: { frequency: 523.25, duration: 0.6, type: 'sine', sequence: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568] },
      bump: { frequency: 220, duration: 0.15, type: 'square', sequence: [220, 330, 260] },
      dash: { frequency: 880, duration: 0.12, type: 'square', sequence: [880, 660] },
      hazard: { frequency: 180, duration: 0.35, type: 'sawtooth', sequence: [180, 150, 120] },
      rareCoin: { frequency: 1400, duration: 0.18, type: 'triangle', sequence: [1400, 1600, 1800] },
      potatoPass: { frequency: 640, duration: 0.2, type: 'square', sequence: [640, 760, 900] },
      potatoBoom: { frequency: 120, duration: 0.5, type: 'sawtooth', sequence: [240, 180, 120, 80] },
      pass: { frequency: 520, duration: 0.12, type: 'sine', sequence: [520, 640] },
      win: { frequency: 880, duration: 0.35, type: 'sine', sequence: [660, 880, 990] },
      go: { frequency: 880, duration: 0.3, type: 'triangle', sequence: [660, 880, 1046.5] }
    };
    
    this.init();
  }

  init() {
    // Create audio context on user interaction
    const initAudio = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.setupGainNodes();
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  setupGainNodes() {
    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = this.volumes.master / 100;

    // Music gain
    this.musicGain = this.audioContext.createGain();
    this.musicGain.connect(this.masterGain);
    this.musicGain.gain.value = this.volumes.music / 100;

    // SFX gain
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.connect(this.masterGain);
    this.sfxGain.gain.value = this.volumes.sfx / 100;

    // Voice gain
    this.voiceGain = this.audioContext.createGain();
    this.voiceGain.connect(this.masterGain);
    this.voiceGain.gain.value = this.volumes.voice / 100;
    
    // Positional audio listener
    this.listener = this.audioContext.listener;
    if (this.listener.positionX) {
      this.listener.positionX.value = 0;
      this.listener.positionY.value = 0;
      this.listener.positionZ.value = 0;
    } else {
      this.listener.setPosition(0, 0, 0);
    }
    
    // Preload critical sounds
    this.preloadSounds();
  }
  
  preloadSounds() {
    // Preload critical SFX to reduce latency
    this.preloadQueue.forEach(sfxName => {
      if (this.sfxDefinitions[sfxName]) {
        // Generate and cache the sound
        this.playSFX(sfxName, 0); // volume 0 to preload without playing
      }
    });
  }

  setMasterVolume(value) {
    this.volumes.master = value;
    if (this.masterGain) {
      this.masterGain.gain.value = value / 100;
    }
  }

  setMusicVolume(value) {
    this.volumes.music = value;
    if (this.musicGain) {
      this.musicGain.gain.value = value / 100;
    }
  }

  setSFXVolume(value) {
    this.volumes.sfx = value;
    if (this.sfxGain) {
      this.sfxGain.gain.value = value / 100;
    }
  }

  setVoiceVolume(value) {
    this.volumes.voice = value;
    if (this.voiceGain) {
      this.voiceGain.gain.value = value / 100;
    }
  }

  // Music file paths for tracks with actual audio files
  musicFiles = {
    menu: '/assets/audio/music/menu.mp3'
  };

  // Try to play music from file, fall back to procedural
  async playMusic(track) {
    if (!this.audioContext) return;
    
    // Stop current music
    this.stopMusic();

    this.currentMusic = track;
    
    // Try to load and play actual audio file first
    if (this.musicFiles[track]) {
      try {
        await this.playMusicFile(this.musicFiles[track]);
        return;
      } catch (error) {
        console.log(`Music file not available for ${track}, using procedural music`);
      }
    }
    
    // Fall back to procedural music
    const musicParams = this.getMusicParams(track);
    // this.playProceduralMusic(musicParams);
  }

  async playMusicFile(url) {
    if (!this.audioContext) throw new Error('No audio context');
    
    // Check if buffer is cached
    if (this.buffers.has(url)) {
      this.playMusicBuffer(this.buffers.get(url));
      return;
    }
    
    // Load the audio file
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    // Cache the buffer
    this.buffers.set(url, audioBuffer);
    
    // Play it
    this.playMusicBuffer(audioBuffer);
  }

  playMusicBuffer(buffer) {
    // Create source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    // Connect to music gain
    source.connect(this.musicGain);
    
    // Start playing
    source.start(0);
    
    // Store for later stopping
    this.musicSource = source;
    this.usingFileMusic = true;
  }

  getMusicParams(track) {
    const params = {
      menu: {
        tempo: 100,
        key: 'C',
        mood: 'upbeat',
        instruments: ['pad', 'bass', 'arp']
      },
      board: {
        tempo: 110,
        key: 'G',
        mood: 'adventurous',
        instruments: ['pad', 'bass', 'melody']
      },
      minigame: {
        tempo: 140,
        key: 'D',
        mood: 'energetic',
        instruments: ['bass', 'lead', 'drums']
      },
      results: {
        tempo: 90,
        key: 'F',
        mood: 'triumphant',
        instruments: ['pad', 'brass', 'strings']
      },
      shop: {
        tempo: 95,
        key: 'Bb',
        mood: 'jazzy',
        instruments: ['pad', 'bass', 'piano']
      },
      overseer: {
        tempo: 70,
        key: 'Dm',
        mood: 'ominous',
        instruments: ['pad', 'bass', 'drone']
      }
    };
    
    return params[track] || params.menu;
  }

  playProceduralMusic(params) {
    if (!this.audioContext || !this.musicGain) return;

    // Simple procedural music loop using oscillators
    const notes = this.getNotesForKey(params.key);
    const beatLength = 60 / params.tempo;
    
    // Create a looping pattern
    const playLoop = () => {
      if (this.currentMusic === null) return;
      
      const now = this.audioContext.currentTime;
      
      // Bass note - safely access and validate
      const bassNote = notes[0];
      if (isFinite(bassNote)) {
        this.playNote(bassNote, now, beatLength * 4, 'sine', this.musicGain, 0.3);
      }
      
      // Chord progression (simple I-IV-I-V) - using safe indices
      const chordProgression = [0, 3, 0, 4];
      chordProgression.forEach((degree, i) => {
        // Use modulo to wrap around safely within array bounds
        const root = notes[degree % notes.length];
        const third = notes[(degree + 2) % notes.length];
        const fifth = notes[(degree + 4) % notes.length];
        
        [root, third, fifth].forEach(note => {
          if (isFinite(note)) {
            this.playNote(note * 2, now + i * beatLength, beatLength * 0.9, 'triangle', this.musicGain, 0.15);
          }
        });
      });
      
      // Schedule next loop
      this.musicLoopTimeout = setTimeout(playLoop, beatLength * 4 * 1000);
    };

    playLoop();
  }

  getNotesForKey(key) {
    // Base frequencies for musical notes
    const noteFreqs = {
      'C': 130.81, 'C#': 138.59, 'D': 146.83, 'D#': 155.56,
      'E': 164.81, 'F': 174.61, 'F#': 185.00, 'G': 196.00,
      'G#': 207.65, 'A': 220.00, 'A#': 233.08, 'B': 246.94,
      'Dm': 146.83, 'Bb': 233.08
    };
    
    const baseFreq = noteFreqs[key] || noteFreqs['C'];
    
    // Major scale intervals
    const intervals = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2];
    
    return intervals.map(i => baseFreq * i);
  }

  playNote(frequency, startTime, duration, type, gainNode, volume = 0.5) {
    if (!this.audioContext) return;
    
    // Validate all parameters are finite numbers
    if (!isFinite(frequency) || !isFinite(startTime) || !isFinite(duration) || !isFinite(volume)) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    envelope.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration * 0.3);
    envelope.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.connect(envelope);
    envelope.connect(gainNode);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  stopMusic() {
    this.currentMusic = null;
    
    // Stop file-based music
    if (this.musicSource && this.usingFileMusic) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.musicSource = null;
      this.usingFileMusic = false;
    }
    
    // Stop procedural music loop
    if (this.musicLoopTimeout) {
      clearTimeout(this.musicLoopTimeout);
      this.musicLoopTimeout = null;
    }
  }

  // Play sound effect
  playSFX(sfxName) {
    if (!this.audioContext || !this.sfxGain) return;

    const def = this.sfxDefinitions[sfxName];
    if (!def) {
      console.warn(`Unknown SFX: ${sfxName}`);
      return;
    }

    const now = this.audioContext.currentTime;

    if (def.type === 'noise') {
      this.playNoise(def, now);
    } else if (def.sequence) {
      this.playSequence(def, now);
    } else {
      this.playTone(def, now);
    }
  }

  playTone(def, startTime) {
    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();
    
    oscillator.type = def.type;
    oscillator.frequency.setValueAtTime(def.frequency, startTime);
    
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    envelope.gain.linearRampToValueAtTime(0, startTime + def.duration);
    
    oscillator.connect(envelope);
    envelope.connect(this.sfxGain);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + def.duration);
  }

  playSequence(def, startTime) {
    const noteLength = def.duration / def.sequence.length;
    
    def.sequence.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();
      
      oscillator.type = def.type;
      oscillator.frequency.setValueAtTime(freq, startTime + i * noteLength);
      
      const noteStart = startTime + i * noteLength;
      envelope.gain.setValueAtTime(0, noteStart);
      envelope.gain.linearRampToValueAtTime(0.4, noteStart + 0.01);
      envelope.gain.linearRampToValueAtTime(0, noteStart + noteLength * 0.9);
      
      oscillator.connect(envelope);
      envelope.connect(this.sfxGain);
      
      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteLength);
    });
  }

  playNoise(def, startTime) {
    const repeat = def.repeat || 1;
    const interval = def.duration;
    
    for (let i = 0; i < repeat; i++) {
      const bufferSize = this.audioContext.sampleRate * interval;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioContext.createBufferSource();
      const envelope = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      noise.buffer = buffer;
      
      filter.type = 'bandpass';
      filter.frequency.value = def.frequency + Math.random() * 200;
      filter.Q.value = 10;
      
      const noteStart = startTime + i * interval * 1.2;
      envelope.gain.setValueAtTime(0.3, noteStart);
      envelope.gain.linearRampToValueAtTime(0, noteStart + interval);
      
      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.sfxGain);
      
      noise.start(noteStart);
      noise.stop(noteStart + interval);
    }
  }

  // Play voice line (placeholder - would load audio files in production)
  playVoice(characterId, lineType) {
    if (!this.audioContext || !this.voiceGain) return;

    // Generate a simple voice-like sound as placeholder
    const now = this.audioContext.currentTime;
    const baseFreq = 150 + Math.random() * 100; // Voice frequency range
    
    // Simple speech-like pattern
    const syllables = Math.floor(Math.random() * 3) + 2;
    const syllableLength = 0.15;
    
    for (let i = 0; i < syllables; i++) {
      const oscillator = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(baseFreq * (1 + Math.random() * 0.3), now + i * syllableLength);
      
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400;
      
      const syllableStart = now + i * syllableLength * 1.2;
      envelope.gain.setValueAtTime(0, syllableStart);
      envelope.gain.linearRampToValueAtTime(0.3, syllableStart + 0.02);
      envelope.gain.linearRampToValueAtTime(0.2, syllableStart + syllableLength * 0.5);
      envelope.gain.linearRampToValueAtTime(0, syllableStart + syllableLength);
      
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.voiceGain);
      
      oscillator.start(syllableStart);
      oscillator.stop(syllableStart + syllableLength);
    }
  }

  // Play countdown sound
  playCountdown(number) {
    if (number > 0) {
      this.playSFX('countdown');
    } else {
      this.playSFX('countdownGo');
    }
  }

  // Play dice roll
  playDiceRoll() {
    this.playSFX('diceRoll');
  }

  // Play coin sound
  playCoin(amount = 1) {
    // Play multiple coin sounds for larger amounts
    const plays = Math.min(amount, 5);
    for (let i = 0; i < plays; i++) {
      setTimeout(() => this.playSFX('coin'), i * 50);
    }
  }

  // Play star get
  playStar() {
    this.playSFX('star');
  }

  // Cleanup
  destroy() {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
