/**
 * Super JoJo Party - Minigame Controller
 * Handles minigame logic and rendering with 3D support
 */

export class MinigameController {
  constructor(app) {
    this.app = app;
    
    // Current minigame state
    this.currentMinigame = null;
    this.gameState = null;
    this.isPlaying = false;
    this.isPractice = false;
    this.isTutorial = false;
    
    // Canvas and context (2D)
    this.canvas = null;
    this.ctx = null;
    
    // Three.js for 3D minigames
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.is3D = false;
    
    // Game loop
    this.animationFrame = null;
    this.lastTime = 0;
    
    // Cinematic state
    this.cinematicPlaying = false;
    this.cinematicTimer = 0;
    
    // Tutorial state
    this.tutorialStep = 0;
    this.tutorialSteps = [];
    
    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, pressed: false };
    this.touches = [];
    this.keybinds = this.loadKeybinds();
    this.activeActions = {
      moveUp: false,
      moveDown: false,
      moveLeft: false,
      moveRight: false,
      action: false,
      jump: false
    };
    this.gamepad = { deadzone: 0.2, lastButtons: {}, lastAction: false };
    
    // Player state (for local player)
    this.playerState = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      score: 0,
      alive: true
    };
    
    // 3D player mesh
    this.playerMesh = null;
    this.otherPlayerMeshes = new Map();
    
    // Practice bots
    this.practiceBots = [];

    // Arena bounds
    this.arenaRadius = 18;

    // Camera rig (shared/stationary camera per minigame)
    this.cameraRig = null;

    // Character style lookup so players/bots render with their selected avatars
    this.characterStyles = {
      jojo: { primary: 0xffc857, secondary: 0x2e294e, accent: 0xff6b6b },
      mimi: { primary: 0x7dd3fc, secondary: 0x1f2937, accent: 0xfbbf24 },
      default: { primary: 0x6c5ce7, secondary: 0x2d3436, accent: 0xfd79a8 }
    };

    // Texture cache for character portraits (loaded from /assets/characters/<id>/portrait.svg)
    this.characterTextureCache = new Map();
    this.textureLoader = typeof THREE !== 'undefined' ? new THREE.TextureLoader() : null;

    // Results overlay cache
    this.resultsUI = { initialized: false, container: null, list: null, continueBtn: null };
    this.resultsAutoHide = null;
    
    this.setupInputHandlers();
    this.setupResultsUI();
  }

  getCharacterStyle(characterId) {
    const base = this.characterStyles[characterId] || this.characterStyles.default;
    return { ...base, id: characterId || 'default' };
  }

  getCharacterTexture(characterId) {
    if (!this.textureLoader || typeof THREE === 'undefined') return null;
    const key = characterId || 'default';
    if (this.characterTextureCache.has(key)) return this.characterTextureCache.get(key);

    const texture = this.textureLoader.load(`/assets/characters/${key}/portrait.svg`, undefined, undefined, () => {
      console.warn(`Portrait for ${key} missing, using default.`);
    });
    texture.colorSpace = THREE.SRGBColorSpace || texture.colorSpace; // ensure sRGB when available
    this.characterTextureCache.set(key, texture);
    return texture;
  }

  loadKeybinds() {
    try {
      const stored = localStorage.getItem('minigameKeybinds');
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    // Defaults
    return {
      moveUp: ['KeyW', 'ArrowUp'],
      moveDown: ['KeyS', 'ArrowDown'],
      moveLeft: ['KeyA', 'ArrowLeft'],
      moveRight: ['KeyD', 'ArrowRight'],
      action: ['Space'],
      jump: ['Space']
    };
  }

  saveKeybinds(bindings) {
    try {
      localStorage.setItem('minigameKeybinds', JSON.stringify(bindings));
      this.keybinds = bindings;
    } catch (e) {}
  }

  rebindAction(action, keys) {
    const next = { ...this.keybinds, [action]: keys };
    this.saveKeybinds(next);
  }

  keyToActions(code) {
    const matches = [];
    Object.entries(this.keybinds || {}).forEach(([action, codes]) => {
      if (codes?.includes(code)) matches.push(action);
    });
    return matches;
  }

  setupResultsUI() {
    // Do not bail out if nodes were missing during early construction; try again each call.
    const container = document.getElementById('minigame-results');
    const list = document.getElementById('results-list');
    const continueBtn = document.getElementById('results-continue-btn');

    if (continueBtn && !continueBtn.dataset.bound) {
      continueBtn.addEventListener('click', () => this.onResultsContinue());
      continueBtn.dataset.bound = 'true';
    }

    if (container && list) {
      this.resultsUI = { initialized: true, container, list, continueBtn };
    }
  }

  buildCharacterModel(style) {
    const mesh = new THREE.Group();

    const texture = this.getCharacterTexture(style.id || 'default');
    const cardMat = texture
      ? new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
      : new THREE.MeshBasicMaterial({ color: style.primary, transparent: true, opacity: 0.95, side: THREE.DoubleSide });

    // Base puck
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: style.primary, metalness: 0.25, roughness: 0.5 })
    );
    base.position.y = 0.17;
    base.castShadow = true;
    base.receiveShadow = true;
    mesh.add(base);

    // Billboarded portrait card
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), cardMat);
    card.position.y = 1.15;
    card.userData.billboard = true;
    card.renderOrder = 2;
    mesh.add(card);

    return mesh;
  }

  setupInputHandlers() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying && !this.isTutorial) return;
      this.keys[e.code] = true;
      this.handleKeyInput(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isPlaying && !this.isTutorial) return;
      this.keys[e.code] = false;
      this.handleKeyInput(e.code, false);
    });

    // Mouse
    window.addEventListener('mousemove', (e) => {
      if ((!this.isPlaying && !this.isTutorial) || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', () => {
      if (!this.isPlaying && !this.isTutorial) return;
      this.mouse.pressed = true;
      this.handleClick();
    });

    window.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });

    // Touch
    window.addEventListener('touchstart', (e) => {
      if ((!this.isPlaying && !this.isTutorial) || !this.canvas) return;
      this.handleTouchStart(e);
    });

    window.addEventListener('touchmove', (e) => {
      if ((!this.isPlaying && !this.isTutorial) || !this.canvas) return;
      this.handleTouchMove(e);
    });

    window.addEventListener('touchend', () => {
      this.touches = [];
    });
  }

  handleKeyInput(code, pressed) {
    if (!this.isPlaying && !this.isTutorial) return;

    // Map key to actions
    const actions = this.keyToActions(code);
    actions.forEach(action => {
      this.activeActions[action] = pressed;
    });

    // In practice/tutorial mode, don't send to server
    if (!this.isPractice && !this.isTutorial && this.app.socket?.isConnected()) {
      const input = { key: code, pressed };
      this.app.socket.emit('minigame:input', input);
    }

    // Handle local input for responsive feel (2D only)
    this.processLocalInput(code, pressed);

    // Tutorial progression
    if (this.isTutorial && pressed) {
      this.checkTutorialProgress(code);
    }
  }

  handleClick() {
    if (!this.isPlaying && !this.isTutorial) return;
    
    // In practice/tutorial mode, don't send to server
    if (!this.isPractice && !this.isTutorial && this.app.socket?.isConnected()) {
      this.app.socket.emit('minigame:input', { type: 'click', x: this.mouse.x, y: this.mouse.y });
    }
    
    // Process local click
    this.processLocalClick();
  }

  handleTouchStart(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.touches = Array.from(e.touches).map(t => ({
      x: t.clientX - rect.left,
      y: t.clientY - rect.top
    }));
    
    if (this.touches.length > 0) {
      this.mouse.x = this.touches[0].x;
      this.mouse.y = this.touches[0].y;
      this.mouse.pressed = true;
      this.handleClick();
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.touches = Array.from(e.touches).map(t => ({
      x: t.clientX - rect.left,
      y: t.clientY - rect.top
    }));
    
    if (this.touches.length > 0) {
      this.mouse.x = this.touches[0].x;
      this.mouse.y = this.touches[0].y;
    }
  }

  processLocalInput(code, pressed) {
    if (!pressed) return;
    if (this.is3D) {
      // 3D movement is handled per-frame via activeActions
      return;
    }
    
    const speed = 5;
    const inputMappings = {
      'KeyW': () => { this.playerState.y -= speed; },
      'KeyS': () => { this.playerState.y += speed; },
      'KeyA': () => { this.playerState.x -= speed; },
      'KeyD': () => { this.playerState.x += speed; },
      'ArrowUp': () => { this.playerState.y -= speed; },
      'ArrowDown': () => { this.playerState.y += speed; },
      'ArrowLeft': () => { this.playerState.x -= speed; },
      'ArrowRight': () => { this.playerState.x += speed; },
      'Space': () => this.handleAction()
    };

    const handler = inputMappings[code];
    if (handler) handler();
  }

  processLocalClick() {
    // Handle click-based minigame actions locally
    if (this.currentMinigame?.id === 'button_bash') {
      this.playerState.score++;
      this.app.audio?.playSFX('click');
    }
  }

  handleAction() {
    // Only emit to server if not in practice/tutorial mode
    if (!this.isPractice && !this.isTutorial && this.app.socket?.isConnected()) {
      this.app.socket.emit('minigame:input', { type: 'action' });
    }
    
    // Local action handling for 3D games
    if (this.is3D && this.playerState.onGround) {
      this.playerState.vy = 10; // Jump
      this.playerState.onGround = false;
    }
  }

  initMinigame(data) {
    this.currentMinigame = data.minigame;
    this.gameState = data.state || {};
    this.isPractice = data.practice || false;
    this.isTutorial = data.tutorial || false;
    this.is3D = true; // Always use 3D
    
    // Load bots if in practice mode
    if (data.bots) {
      this.practiceBots = data.bots;
    }
    
    // Get canvas
    this.canvas = document.getElementById('minigame-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    // Initialize 3D scene
    this.init3DScene();
    
    // Create bot meshes for practice mode
    if (this.isPractice && this.practiceBots.length > 0) {
      this.practiceBots.forEach(bot => {
        this.createBotMesh(bot);
      });
    }

    // Play cinematic intro
    this.playCinematic(data.minigame);
  }

  // Initialize Three.js scene for 3D minigames
  init3DScene() {
    if (!this.canvas) {
      console.error('Canvas not found for 3D scene');
      this.app?.ui?.showToast('Failed to initialize minigame - canvas not found', 'error');
      return;
    }
    
    if (typeof THREE === 'undefined') {
      console.error('Three.js library not loaded');
      this.app?.ui?.showToast('Failed to initialize minigame - 3D library not loaded', 'error');
      return;
    }

    // Check WebGL support first
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported by this browser/device');
      this.app?.ui?.showToast('WebGL not supported - please use a modern browser with hardware acceleration enabled', 'error');
      return;
    }

    try {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a2e);
      this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 100);

      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        60,
        this.canvas.clientWidth / this.canvas.clientHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 15, 25);
      this.camera.lookAt(0, 0, 0);

      // Create renderer with error handling
        // Attempt robust WebGL context acquisition with several attribute permutations
        const contextAttempts = [
          { type: 'webgl2', attrs: { antialias: true, powerPreference: 'high-performance' } },
          { type: 'webgl', attrs: { antialias: true, powerPreference: 'high-performance' } },
          { type: 'webgl', attrs: { antialias: false, powerPreference: 'high-performance' } },
          { type: 'webgl', attrs: { antialias: false, powerPreference: 'default' } },
          { type: 'experimental-webgl', attrs: { antialias: false } }
        ];

        let glContext = null;
        for (const attempt of contextAttempts) {
          try {
            glContext = this.canvas.getContext(attempt.type, attempt.attrs);
            if (glContext) {
              console.log(`Acquired WebGL context using ${attempt.type} with`, attempt.attrs);
              break;
            }
          } catch (e) {
            console.warn(`Context attempt ${attempt.type} failed:`, e);
            glContext = null;
          }
        }

        if (!glContext) {
          // Try to ensure canvas is in the DOM and visible, set explicit size, then retry
          console.warn('Initial WebGL context acquisition failed. Attempting recovery steps...');

          // Ensure canvas has pixel size attributes
          try {
            this.canvas.width = Math.max(1, this.canvas.clientWidth || 800);
            this.canvas.height = Math.max(1, this.canvas.clientHeight || 600);
          } catch (e) {
            console.warn('Failed to set canvas size attributes:', e);
          }

          // If canvas is not attached, append it to body temporarily
          let replaced = false;
          if (!document.body.contains(this.canvas)) {
            console.warn('Canvas was not attached to document.body - attaching temporarily for context creation');
            document.body.appendChild(this.canvas);
            replaced = true;
          }

          // Try creating a fresh canvas element (replace id) and swap into DOM
          try {
            const newCanvas = document.createElement('canvas');
            newCanvas.id = this.canvas.id || `minigame-canvas-${Date.now()}`;
            newCanvas.style.width = this.canvas.style.width || `${this.canvas.clientWidth}px`;
            newCanvas.style.height = this.canvas.style.height || `${this.canvas.clientHeight}px`;
            newCanvas.width = this.canvas.width;
            newCanvas.height = this.canvas.height;
            this.canvas.parentNode?.replaceChild(newCanvas, this.canvas);
            this.canvas = newCanvas;
            console.log('Replaced minigame canvas with a fresh element and retrying context acquisition');
          } catch (swapErr) {
            console.warn('Canvas replacement failed:', swapErr);
          }

          // Retry context attempts once more
          for (const attempt of contextAttempts) {
            try {
              glContext = this.canvas.getContext(attempt.type, attempt.attrs);
              if (glContext) {
                console.log(`Acquired WebGL context after recovery using ${attempt.type} with`, attempt.attrs);
                break;
              }
            } catch (e) {
              console.warn(`Retry context attempt ${attempt.type} failed:`, e);
              glContext = null;
            }
          }

          if (!glContext) {
            // All attempts failed — provide detailed diagnostic and stop initialization
            const diag = {
              canvasId: this.canvas.id,
              clientWidth: this.canvas.clientWidth,
              clientHeight: this.canvas.clientHeight,
              styleDisplay: getComputedStyle(this.canvas).display,
              styleVisibility: getComputedStyle(this.canvas).visibility,
              attemptedTypes: contextAttempts.map(a => a.type)
            };
            console.error('Unable to obtain a WebGL context for the minigame canvas after retries. Diagnostics:', diag);
            this.app?.ui?.showToast('Critical: Unable to initialize WebGL for minigames. See console diagnostics.', 'error');
            // Throw to surface the error to global handlers (no 2D fallback)
            throw new Error('Unable to obtain WebGL context for minigame canvas. See console for diagnostics.');
          }

          if (replaced) {
            // If we appended canvas temporarily, leave it in place — it's now the active canvas
          }
        }

        // Create renderer using the acquired context to avoid repeated context allocation failures
        const rendererOptions = {
          canvas: this.canvas,
          context: glContext,
          antialias: Boolean(glContext.getContextAttributes?.().antialias),
          alpha: true,
          failIfMajorPerformanceCaveat: false
        };

        this.renderer = new THREE.WebGLRenderer(rendererOptions);
        // If renderer creation still fails, catch below
        this.renderer.setSize(Math.max(1, this.canvas.clientWidth), Math.max(1, this.canvas.clientHeight));
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        // Try enabling shadow map but don't fail if unsupported
        try {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } catch (e) {
          console.warn('Shadow map not supported or failed to set:', e);
        }

        // Handle context loss gracefully to avoid loud warnings
        this.canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          this.app?.ui?.showToast('Graphics context lost — attempting recovery...', 'warning');
        }, { passive: false });

        this.canvas.addEventListener('webglcontextrestored', () => {
          this.app?.ui?.showToast('Graphics context restored', 'success');
          this.renderer?.resetState?.();
        });
    } catch (error) {
      console.error('Failed to create WebGL context:', error);
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.app?.ui?.showToast('Failed to initialize 3D graphics. Please try: 1) Enable hardware acceleration in browser settings, 2) Update graphics drivers, 3) Try a different browser', 'error');
      return;
    }

    // Lighting
    this.setupMinigameLighting();

    // Create arena based on minigame
    this.createMinigameArena();

    // Create player mesh
    this.createPlayerMesh();

    // Clock for animations
    this.clock = new THREE.Clock();
  }

  setupMinigameLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x6c5ce7, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    this.scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x00cec9, 0.3);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.PointLight(0xfd79a8, 0.5, 50);
    rimLight.position.set(0, 15, -15);
    this.scene.add(rimLight);
  }

  createMinigameArena() {
    const minigameId = this.currentMinigame?.id;

    const themes = {
      coin_chaos: {
        background: 0x0b132b,
        fogColor: 0x0b132b,
        fog: [40, 160],
        ground: 0x14f1d9,
        accent: 0xffc857,
        radius: 20,
        cameraRig: {
          position: new THREE.Vector3(0, 32, 46),
          target: new THREE.Vector3(0, 6, 0),
          fov: 55,
          smoothing: 0.06
        }
      },
      platform_peril: {
        background: 0x0f0c29,
        fogColor: 0x302b63,
        fog: [30, 120],
        ground: 0x6c5ce7,
        accent: 0x00f5d4,
        radius: 22,
        cameraRig: {
          position: new THREE.Vector3(-6, 26, 32),
          target: new THREE.Vector3(0, 4, 0),
          fov: 60,
          smoothing: 0.08
        }
      },
      bumper_balls: {
        background: 0x1b1b1b,
        fogColor: 0x1f2937,
        fog: [25, 90],
        ground: 0xe74c3c,
        accent: 0xfad390,
        radius: 19,
        cameraRig: {
          position: new THREE.Vector3(0, 24, 34),
          target: new THREE.Vector3(0, 3, 0),
          fov: 58,
          smoothing: 0.07
        }
      },
      hot_potato: {
        background: 0x1b0b0b,
        fogColor: 0x3c1515,
        fog: [25, 80],
        ground: 0xf25f5c,
        accent: 0xffd166,
        radius: 20,
        cameraRig: {
          position: new THREE.Vector3(6, 28, 38),
          target: new THREE.Vector3(0, 5, 0),
          fov: 60,
          smoothing: 0.07
        }
      },
      ice_skating: {
        background: 0x0e1b2e,
        fogColor: 0x0e1b2e,
        fog: [35, 140],
        ground: 0x7dd3fc,
        accent: 0xffffff,
        radius: 21,
        cameraRig: {
          position: new THREE.Vector3(0, 30, 42),
          target: new THREE.Vector3(0, 1, 0),
          fov: 50,
          smoothing: 0.06
        }
      },
      maze_race: {
        background: 0x0a0f14,
        fogColor: 0x0a0f14,
        fog: [30, 120],
        ground: 0x1abc9c,
        accent: 0xf39c12,
        radius: 20,
        cameraRig: {
          position: new THREE.Vector3(0, 40, 0),
          target: new THREE.Vector3(0, 0, 0),
          fov: 45,
          smoothing: 0.05
        }
      },
      default: {
        background: 0x1a1a2e,
        fogColor: 0x1a1a2e,
        fog: [30, 120],
        ground: 0x6c5ce7,
        accent: 0x00cec9,
        radius: 18,
        cameraRig: {
          position: new THREE.Vector3(0, 24, 32),
          target: new THREE.Vector3(0, 2, 0),
          fov: 60,
          smoothing: 0.08
        }
      }
    };

    const theme = themes[minigameId] || themes.default;

    this.arenaRadius = theme.radius ?? 18;
    this.applyArenaTheme(theme);
    this.configureCameraRig(minigameId, theme.cameraRig);

    switch (minigameId) {
      case 'coin_chaos':
        this.createCoinChaosArena(theme);
        break;
      case 'platform_peril':
        this.createPlatformPerilArena(theme);
        break;
      case 'bumper_balls':
        this.createBumperBallsArena(theme);
        break;
      case 'hot_potato':
        this.createHotPotatoArena(theme);
        break;
      case 'ice_skating':
        this.createIceSkatingArena(theme);
        break;
      case 'maze_race':
        this.createMazeRaceArena(theme);
        break;
      default:
        this.createDefaultArena(theme);
    }
  }

  applyArenaTheme(theme = {}) {
    if (!this.scene || typeof THREE === 'undefined') return;

    const bgColor = new THREE.Color(theme.background ?? 0x1a1a2e);
    const fogColor = new THREE.Color(theme.fogColor ?? theme.background ?? 0x1a1a2e);
    const fogNear = theme.fog?.[0] ?? 30;
    const fogFar = theme.fog?.[1] ?? 120;

    this.scene.background = bgColor;
    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  }

  configureCameraRig(minigameId, overrides = {}) {
    if (!this.camera) return;

    const baseRig = {
      position: new THREE.Vector3(0, 24, 32),
      target: new THREE.Vector3(0, 2, 0),
      fov: 60,
      smoothing: 0.08,
      followPlayer: false
    };

    const rig = { ...baseRig, ...overrides };
    this.cameraRig = rig;

    // Immediately place camera to avoid initial frame pop
    if (rig.position) {
      this.camera.position.copy(rig.position);
    }
    if (rig.target) {
      this.camera.lookAt(rig.target);
    }
    this.camera.fov = rig.fov || 60;
    this.camera.updateProjectionMatrix();
  }

  createDefaultArena(theme = {}) {
    if (!this.scene) return;

    const groundColor = theme.ground ?? 0x6c5ce7;
    const accentColor = theme.accent ?? 0x00cec9;

    // Main stage
    const platformGeometry = new THREE.CylinderGeometry(24, 24, 1.2, 48);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: groundColor,
      metalness: 0.35,
      roughness: 0.4
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.6;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Accent ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(18.5, 0.5, 16, 64),
      new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.35 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    ring.castShadow = true;
    this.scene.add(ring);

    // Thin grid overlay for readability
    const gridHelper = new THREE.GridHelper(38, 24, accentColor, groundColor);
    gridHelper.position.y = 0.05;
    this.scene.add(gridHelper);

    // Spotlight pillars
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pillarHeight = 10 + Math.sin(angle * 2) * 1.5;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, pillarHeight, 10),
        new THREE.MeshStandardMaterial({ color: groundColor * 0.9 })
      );
      pillar.position.set(Math.cos(angle) * 17, pillarHeight / 2 - 0.4, Math.sin(angle) * 17);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      const light = new THREE.PointLight(accentColor, 0.4, 18);
      light.position.set(pillar.position.x, pillarHeight + 1, pillar.position.z);
      this.scene.add(light);
    }
  }

  createCoinChaosArena(theme = {}) {
    if (!this.scene) return;

    const ground = theme.ground ?? 0x14f1d9;
    const accent = theme.accent ?? 0xffc857;
    this.arenaRadius = 22;
    this.coinSpawners = [];

    // Hex floor
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(24, 24, 1.2, 6, 1, false),
      new THREE.MeshStandardMaterial({ color: ground, metalness: 0.35, roughness: 0.35 })
    );
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Raised catwalks in X pattern
    const catwalkMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.25, metalness: 0.2 });
    const buildCatwalk = (rot) => {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(28, 0.6, 3), catwalkMat.clone());
      walk.position.y = 1.2;
      walk.rotation.y = rot;
      walk.castShadow = true;
      walk.receiveShadow = true;
      this.scene.add(walk);
    };
    buildCatwalk(0);
    buildCatwalk(Math.PI / 3);
    buildCatwalk(-Math.PI / 3);

    // Pillar spawners
    for (let i = 0; i < 6; i++) {
      const radius = 10 + Math.random() * 6;
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.2, 6 + Math.random() * 2, 10),
        new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35 })
      );
      pillar.position.set(x, 3, z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.coinSpawners.push(new THREE.Vector3(x, 6, z));
    }

    // Center prism beacon
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 1.2, 5, 8, 1, true),
      new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: 0.28, emissive: accent, emissiveIntensity: 0.3, side: THREE.DoubleSide })
    );
    beacon.position.y = 2.5;
    this.scene.add(beacon);
  }

  createPlatformPerilArena(theme = {}) {
    if (!this.scene) return;

    const baseColor = theme.ground ?? 0x6c5ce7;
    const safeColor = theme.accent ?? 0x00f5d4;
    this.platforms = [];

    const buildPlatform = (opts) => {
      const geometry = new THREE.BoxGeometry(opts.width, 0.6, opts.depth);
      const material = new THREE.MeshStandardMaterial({
        color: opts.safe ? safeColor : baseColor,
        metalness: 0.25,
        roughness: 0.65
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(opts.x, opts.y, opts.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.platforms.push({
        ...opts,
        originalWidth: opts.width,
        originalDepth: opts.depth,
        mesh,
        shrinking: false,
        shrinkAmount: 0,
        shrinkSpeed: opts.shrinkSpeed ?? 0.2
      });
    };

    buildPlatform({ x: 0, z: 0, y: 0, width: 8, depth: 8, safe: true, shrinkSpeed: 0.15 });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 10 + Math.random() * 6;
      buildPlatform({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: 1 + Math.random() * 2,
        width: 3.5 + Math.random() * 2,
        depth: 3.5 + Math.random() * 2,
        safe: i % 2 === 0,
        shrinkSpeed: 0.22 + Math.random() * 0.1
      });
    }

    // Floating crystals as landmarks
    for (let i = 0; i < 4; i++) {
      const crystal = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1 + Math.random() * 0.5),
        new THREE.MeshStandardMaterial({ color: safeColor, emissive: safeColor, emissiveIntensity: 0.4 })
      );
      crystal.position.set((Math.random() - 0.5) * 20, 4 + Math.random() * 2, (Math.random() - 0.5) * 20);
      crystal.castShadow = true;
      this.scene.add(crystal);
    }
  }

  createBumperBallsArena(theme = {}) {
    if (!this.scene) return;

    const groundColor = theme.ground ?? 0xe74c3c;
    const accent = theme.accent ?? 0xfad390;

    // Stadium track using twin ovals
    const baseMat = new THREE.MeshStandardMaterial({ color: groundColor, metalness: 0.3, roughness: 0.35 });
    const padMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 });

    const buildOval = (x) => {
      const oval = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1.2, 32), baseMat.clone());
      oval.position.set(x, -0.6, 0);
      oval.rotation.y = Math.PI / 2;
      oval.receiveShadow = true;
      this.scene.add(oval);
    };
    buildOval(-10);
    buildOval(10);

    // Connect the ovals with straight track
    const connector = new THREE.Mesh(new THREE.BoxGeometry(20, 1.2, 14), baseMat.clone());
    connector.position.y = -0.6;
    connector.receiveShadow = true;
    this.scene.add(connector);

    // Safety walls
    const wallMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.25 });
    const walls = [
      { x: 0, z: 7.5, rot: 0 },
      { x: 0, z: -7.5, rot: 0 },
      { x: 18, z: 0, rot: Math.PI / 2 },
      { x: -18, z: 0, rot: Math.PI / 2 }
    ];
    walls.forEach((w) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(38, 1.4, 1), wallMat.clone());
      wall.position.set(w.x, 0.1, w.z);
      wall.rotation.y = w.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });

    // Boost strips on each straightaway
    const addBoost = (z) => {
      const boost = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 1.5), padMat.clone());
      boost.position.set(0, 0, z);
      boost.name = 'bumper_boost';
      this.scene.add(boost);
    };
    addBoost(4.5);
    addBoost(-4.5);
  }

  createHotPotatoArena(theme = {}) {
    if (!this.scene) return;

    const groundColor = theme.ground ?? 0xf25f5c;
    const accent = theme.accent ?? 0xffd166;

    // Cracked lava tiles with gaps
    const tileMat = new THREE.MeshStandardMaterial({ color: groundColor, emissive: groundColor, emissiveIntensity: 0.35, roughness: 0.6 });
    const safeMat = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.45, roughness: 0.35 });
    const tileSize = 5;
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        // Leave center hole and some random gaps
        if ((x === 0 && z === 0) || Math.random() < 0.12) continue;
        const isSafe = (Math.abs(x) + Math.abs(z)) % 2 === 0;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(tileSize, 0.8, tileSize), isSafe ? safeMat.clone() : tileMat.clone());
        tile.position.set(x * tileSize, -0.4, z * tileSize);
        tile.receiveShadow = true;
        tile.castShadow = true;
        this.scene.add(tile);
      }
    }

    // Edge cliffs
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(30, 32, 4, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: groundColor * 0.7, roughness: 0.8, side: THREE.DoubleSide })
    );
    rim.position.y = -2.4;
    this.scene.add(rim);

    // Hot potato (bomb) mesh - will be attached to players
    const bombGeometry = new THREE.SphereGeometry(0.9, 16, 16);
    const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2d42, metalness: 0.4, roughness: 0.3 });
    this.hotPotato = new THREE.Mesh(bombGeometry, bombMaterial);
    this.hotPotato.visible = false;
    this.hotPotato.castShadow = true;
    this.scene.add(this.hotPotato);
    
    // Fuse
    const fuseGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
    const fuseMaterial = new THREE.MeshBasicMaterial({ color: accent });
    const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
    fuse.position.y = 0.95;
    this.hotPotato.add(fuse);
  }

  createIceSkatingArena(theme = {}) {
    if (!this.scene) return;

    const iceColor = theme.ground ?? 0x7dd3fc;
    const accent = theme.accent ?? 0xffffff;

    // Figure-eight rink
    const padMat = new THREE.MeshStandardMaterial({ color: iceColor, metalness: 0.55, roughness: 0.2 });
    const loop = (x) => {
      const oval = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 0.8, 32), padMat.clone());
      oval.position.set(x, -0.4, 0);
      oval.rotation.x = -Math.PI / 2;
      oval.receiveShadow = true;
      this.scene.add(oval);
    };
    loop(-8);
    loop(8);

    // Connect loops with skinny bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 6), padMat.clone());
    bridge.position.set(0, -0.4, 0);
    bridge.receiveShadow = true;
    this.scene.add(bridge);

    // Frosted glass boards around each loop
    const glassMat = new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: 0.35 });
    const makeBoards = (x) => {
      const boards = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 1.2, 32, 1, true), glassMat.clone());
      boards.position.set(x, 0.6, 0);
      boards.rotation.x = -Math.PI / 2;
      this.scene.add(boards);
    };
    makeBoards(-8);
    makeBoards(8);

    // Center ribbon light
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.12, 1.4),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 })
    );
    ribbon.position.set(0, 0.1, 0);
    this.scene.add(ribbon);
  }

  createMazeRaceArena(theme = {}) {
    if (!this.scene) return;

    const wallColor = theme.ground ?? 0x1abc9c;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 44),
      new THREE.MeshStandardMaterial({ color: wallColor * 0.8, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.mazeWalls = [];
    const wallGeo = new THREE.BoxGeometry(2, 2, 10);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.6, metalness: 0.15 });

    // Grid-based labyrinth
    const cells = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    const cellSize = 5;
    const offset = (cells.length - 1) * cellSize * 0.5;

    cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat.clone());
          wall.position.set(c * cellSize - offset, 1, r * cellSize - offset);
          wall.castShadow = true;
          wall.receiveShadow = true;
          wall.name = `maze_wall_${r}_${c}`;
          this.scene.add(wall);
          this.mazeWalls.push(wall);
        }
      });
    });
  }

  createPlayerMesh() {
    const characterId = this.app.state.user?.profile?.selected_character || 'jojo';
    const style = this.getCharacterStyle(characterId);
    this.playerMesh = this.buildCharacterModel(style);

    // Character badge
    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      new THREE.MeshStandardMaterial({ color: style.accent, emissive: style.accent, emissiveIntensity: 0.4 })
    );
    badge.position.set(0, 1.15, 0.62);
    badge.rotation.x = -Math.PI / 2;
    this.playerMesh.add(badge);

    this.playerMesh.position.set(0, 0, 0);
    this.scene.add(this.playerMesh);
    
    // Reset player state for 3D
    this.playerState.x = 0;
    this.playerState.y = 0;
    this.playerState.z = 0;
    this.playerState.onGround = true;
  }

  // Play cinematic intro for minigame
  playCinematic(minigame) {
    this.cinematicPlaying = true;
    this.cinematicTimer = 0;
    
    // Hide regular intro, show cinematic
    const intro = document.getElementById('minigame-intro');
    const cinematicOverlay = this.createCinematicOverlay(minigame);
    
    if (intro) intro.classList.remove('active');
    
    // Animate cinematic
    this.animateCinematic(minigame, cinematicOverlay);
  }

  createCinematicOverlay(minigame) {
    // Create or get cinematic overlay
    let overlay = document.getElementById('minigame-cinematic');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'minigame-cinematic';
      overlay.className = 'minigame-cinematic';
      document.getElementById('minigame-screen')?.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="cinematic-content">
        <div class="cinematic-icon">${this.getMinigameIcon(minigame.type)}</div>
        <h1 class="cinematic-title">${minigame.name}</h1>
        <p class="cinematic-type">${minigame.type?.toUpperCase() || 'FREE FOR ALL'}</p>
        <div class="cinematic-rules">
          ${(minigame.rules || []).map(rule => `<div class="rule-item">• ${rule}</div>`).join('')}
        </div>
        <div class="cinematic-controls">
          <p><strong>Controls:</strong></p>
          <p>Movement: ${minigame.controls?.movement || 'WASD / Arrow Keys'}</p>
          <p>Action: ${minigame.controls?.action || 'Space'}</p>
        </div>
        <div class="cinematic-countdown" id="cinematic-countdown">GET READY!</div>
      </div>
    `;

    overlay.classList.add('active');
    return overlay;
  }

  getMinigameIcon(type) {
    const icons = {
      'ffa': '🎮',
      'team': '👥',
      '1v3': '⚔️',
      'coop': '🤝',
      'duel': '🆚'
    };
    return icons[type] || '🎮';
  }

  animateCinematic(minigame, overlay) {
    let countdown = 5;
    const countdownEl = document.getElementById('cinematic-countdown');
    
    this.app.audio?.playMusic('minigame');
    
    const countdownInterval = setInterval(() => {
      countdown--;
      
      if (countdownEl) {
        if (countdown > 0) {
          countdownEl.textContent = countdown.toString();
          countdownEl.classList.add('pulse');
          setTimeout(() => countdownEl.classList.remove('pulse'), 200);
          this.app.audio?.playSFX('countdown');
        } else if (countdown === 0) {
          countdownEl.textContent = 'GO!';
          countdownEl.classList.add('go');
          this.app.audio?.playSFX('go');
        }
      }
      
      if (countdown < 0) {
        clearInterval(countdownInterval);
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 500);
        this.cinematicPlaying = false;
        
        // Start the game
        this.startMinigame();
      }
    }, 1000);
  }

  startMinigame() {
    this.isPlaying = true;
    
    // Initialize player position
    if (this.is3D) {
      this.playerState.x = 0;
      this.playerState.y = 0;
      this.playerState.z = 0;
      if (this.playerMesh) {
        this.playerMesh.position.set(0, 0, 0);
      }
    } else if (this.canvas) {
      this.playerState.x = this.canvas.width / 2;
      this.playerState.y = this.canvas.height / 2;
    }

    // Create practice bots if in practice mode (or sync existing ones)
    if (this.isPractice) {
      if (!this.practiceBots || this.practiceBots.length === 0) {
        this.createPracticeBots();
      } else {
        this.syncPracticeBotMeshes();
      }
    }

    // Initialize game state
    this.gameState = this.createGameState();
    
    this.startGameLoop();
  }

  createPracticeBots() {
    this.clearBotMeshes();
    this.practiceBots = [];
    const botCount = 6;
    const characters = ['jojo', 'mimi'];
    
    for (let i = 0; i < botCount; i++) {
      const bot = {
        id: `bot_${i}`,
        username: `Bot ${i + 1}`,
        characterId: characters[i % characters.length],
        x: (Math.random() - 0.5) * 20,
        y: 0,
        z: (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        vz: 0,
        score: 0,
        alive: true,
        ai: {
          targetX: 0,
          targetZ: 0,
          changeTimer: 0
        }
      };
      
      this.practiceBots.push(bot);
    }

    // Create bot meshes in 3D
    if (this.is3D) {
      this.practiceBots.forEach(bot => this.createBotMesh(bot));
    }
  }

  createBotMesh(bot) {
    const style = this.getCharacterStyle(bot.characterId);
    const mesh = this.buildCharacterModel(style);

    // Add simple accessory to differentiate bots
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.18, 0.1),
      new THREE.MeshStandardMaterial({ color: style.secondary, emissive: style.secondary, emissiveIntensity: 0.25 })
    );
    visor.position.set(0, 1.55, 0.6);
    mesh.add(visor);

    mesh.position.set(bot.x, bot.y, bot.z);
    this.scene.add(mesh);
    this.otherPlayerMeshes.set(bot.id, mesh);
  }

  clearBotMeshes() {
    if (!this.scene) return;
    this.otherPlayerMeshes.forEach(mesh => {
      try { this.scene.remove(mesh); } catch (e) {}
    });
    this.otherPlayerMeshes.clear();
  }

  syncPracticeBotMeshes() {
    if (!this.is3D || !this.practiceBots) return;
    this.clearBotMeshes();
    this.practiceBots.forEach(bot => this.createBotMesh(bot));
  }

  createGameState() {
    return {
      players: [
        {
          id: this.app.state.user?.id || 'local',
          username: this.app.state.user?.username || 'Player',
          x: this.playerState.x,
          y: this.playerState.y,
          z: this.playerState.z,
          score: 0,
          alive: true
        },
        ...this.practiceBots
      ],
      coins: this.generateCoins(),
      timeLeft: this.currentMinigame?.duration / 1000 || 60,
      hotPotatoHolder: this.currentMinigame?.id === 'hot_potato' ? (this.app.state.user?.id || 'local') : null,
      bombTimer: this.currentMinigame?.id === 'hot_potato' ? 15 : undefined,
      started: true
    };
  }

  generateCoins() {
    const coins = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      coins.push({
        id: i,
        x: (Math.random() - 0.5) * 30,
        y: this.is3D ? 1 : Math.random() * (this.canvas?.height - 100 || 500) + 50,
        z: this.is3D ? (Math.random() - 0.5) * 30 : 0,
        collected: false,
        value: Math.random() > 0.8 ? 3 : 1
      });
    }
    
    return coins;
  }

  showIntro(minigame) {
    // Now handled by playCinematic
    this.playCinematic(minigame);
  }

  onCountdown(data) {
    const countdownEl = document.getElementById('cinematic-countdown');
    
    if (countdownEl) {
      countdownEl.textContent = data.count > 0 ? data.count : 'GO!';
      this.app.audio?.playSFX(data.count > 0 ? 'countdown' : 'go');
    }

    if (data.count <= 0) {
      this.cinematicPlaying = false;
    }
  }

  onStarted(data) {
    this.isPlaying = true;
    this.gameState = data.state;
    
    // Initialize player position
    if (this.is3D) {
      this.playerState.x = 0;
      this.playerState.y = 0;
      this.playerState.z = 0;
    } else if (this.canvas) {
      this.playerState.x = this.canvas.width / 2;
      this.playerState.y = this.canvas.height / 2;
    }
    
    this.startGameLoop();
  }

  onState(data) {
    this.gameState = data;
    this.updateUI();
  }

  onPlayerAction(data) {
    // Handle other player actions for visual feedback
  }

  onEnded(data) {
    this.isPlaying = false;
    this.stopGameLoop();
    
    this.showResults(data);
  }

  showResults(data) {
    this.setupResultsUI();

    if (this.resultsAutoHide) {
      clearTimeout(this.resultsAutoHide);
      this.resultsAutoHide = null;
    }

    const container = this.resultsUI.container;
    const list = this.resultsUI.list;
    const rankings = data.rankings || [];

    if (list) {
      list.innerHTML = rankings.map((player, index) => `
        <div class="result-row ${index === 0 ? 'winner' : ''}">
          <span class="result-position">${index + 1}</span>
          <span class="result-name">${player.username}</span>
          <span class="result-score">${player.score ?? 0}</span>
          <span class="result-reward">${player.reward ?? 0} 🪙</span>
        </div>
      `).join('');
    }

    container?.classList.add('active');

    const localId = this.isPractice ? 'local' : this.app.state.user?.id;
    const myRanking = rankings.findIndex(p => p.id === localId);
    if (myRanking === 0) {
      this.app.audio.playSFX('minigameWin');
    } else {
      this.app.audio.playSFX('minigameLose');
    }

    // Auto-close only for non-practice sessions; practice waits for Continue
    if (!this.isPractice) {
      this.resultsAutoHide = setTimeout(() => this.onResultsContinue(true), 5000);
    }
  }

  onResultsContinue(auto = false) {
    if (this.resultsAutoHide) {
      clearTimeout(this.resultsAutoHide);
      this.resultsAutoHide = null;
    }

    this.resultsUI.container?.classList.remove('active');

    // In practice, return to the practice menu; otherwise back to game screen
    if (this.isPractice) {
      this.app.navigateTo('practice');
    } else if (!auto) {
      this.app.navigateTo('game');
    } else {
      this.app.navigateTo('game');
    }
  }

  startGameLoop() {
    this.lastTime = performance.now();
    
    const loop = (currentTime) => {
      // Continue loop for tutorials and playing
      if (!this.isPlaying && !this.isTutorial && !this.cinematicPlaying) return;
      
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
      // Poll gamepads for input
      this.pollGamepads();

      this.update(delta);
      this.render();
      
      this.animationFrame = requestAnimationFrame(loop);
    };
    
    this.animationFrame = requestAnimationFrame(loop);
  }

  stopGameLoop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  update(delta) {
    // Allow updates during tutorial
    if (!this.currentMinigame) return;
    if (!this.isPlaying && !this.isTutorial) return;

    // Update practice bots
    if (this.isPractice && this.practiceBots.length > 0) {
      this.updatePracticeBots(delta);
    }

    // Update 3D player movement
    if (this.is3D) {
      this.update3DPlayer(delta);
    }

    // Update timer
    if (this.gameState?.timeLeft > 0) {
      this.gameState.timeLeft -= delta;
      if (this.gameState.timeLeft <= 0) {
        this.endPracticeGame();
      }
    }

    // Update based on minigame type
    const minigameUpdaters = {
      'button_bash': () => this.updateButtonBash(delta),
      'coin_chaos': () => this.updateCoinChaos(delta),
      'platform_peril': () => this.updatePlatformPeril(delta),
      'bumper_balls': () => this.updateBumperBalls(delta),
      'memory_match': () => this.updateMemoryMatch(delta),
      'balloon_burst': () => this.updateBalloonBurst(delta),
      'hot_potato': () => this.updateHotPotato(delta),
      'maze_race': () => this.updateMazeRace(delta),
      'target_practice': () => this.updateTargetPractice(delta),
      'rhythm_rumble': () => this.updateRhythmRumble(delta),
      'ice_skating': () => this.updateIceSkating(delta)
    };

    const updater = minigameUpdaters[this.currentMinigame.id];
    if (updater) {
      updater();
    } else {
      // Default minigame update
      if (this.is3D) {
        this.update3DDefaultMinigame(delta);
      } else {
        this.updateDefaultMinigame(delta);
      }
    }

    // Refresh HUD overlays with the latest state
    this.updateUI();
  }

  // 3D player update with smooth movement physics
  update3DPlayer(delta) {
    const maxSpeed = 12;
    const acceleration = 42;
    const friction = 0.88;
    const gravity = 30;
    const jumpForce = 16;

    const { moveX, moveZ, jumpPressed } = this.getInputAxes();
    let accelX = moveX * acceleration;
    let accelZ = moveZ * acceleration;
    
    // Apply acceleration
    this.playerState.vx += accelX * delta;
    this.playerState.vz += accelZ * delta;
    
    // Clamp max speed (allow diagonal movement up to maxSpeed)
    const speed = Math.sqrt(this.playerState.vx ** 2 + this.playerState.vz ** 2);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      this.playerState.vx *= scale;
      this.playerState.vz *= scale;
    }
    
    // Apply friction when no input
    if (accelX === 0) this.playerState.vx *= friction;
    if (accelZ === 0) this.playerState.vz *= friction;

    // Apply velocity
    this.playerState.x += this.playerState.vx * delta;
    this.playerState.z += this.playerState.vz * delta;

    // Apply gravity and jumping
    if (!this.playerState.onGround) {
      this.playerState.vy -= gravity * delta;
    } else {
      if (jumpPressed && !this.playerState.jumpPressed) {
        this.playerState.vy = jumpForce;
        this.playerState.onGround = false;
        this.playerState.jumpPressed = true;
      }
    }
    
    if (!jumpPressed) this.playerState.jumpPressed = false;
    
    this.playerState.y += this.playerState.vy * delta;

    // Ground collision
    if (this.playerState.y <= 0) {
      this.playerState.y = 0;
      this.playerState.vy = 0;
      this.playerState.onGround = true;
    }

    // Arena bounds (circular radius)
    const arenaRadius = this.arenaRadius || 18;
    const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    if (dist > arenaRadius) {
      const scale = arenaRadius / dist;
      this.playerState.x *= scale;
      this.playerState.z *= scale;
      // Bounce slightly
      this.playerState.vx *= -0.3;
      this.playerState.vz *= -0.3;
    }

    // Update player mesh position and rotation
    if (this.playerMesh) {
      this.playerMesh.position.x = this.playerState.x;
      this.playerMesh.position.y = this.playerState.y;
      this.playerMesh.position.z = this.playerState.z;

      // Face movement direction (smooth rotation)
      if (Math.abs(this.playerState.vx) > 0.1 || Math.abs(this.playerState.vz) > 0.1) {
        const targetAngle = Math.atan2(this.playerState.vx, this.playerState.vz);
        // Interpolate rotation smoothly
        const currentAngle = this.playerMesh.rotation.y;
        let angleDiff = targetAngle - currentAngle;
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.playerMesh.rotation.y += angleDiff * 0.1;
      }
    }

    // Check coin collection in 3D
    if (this.gameState?.coins) {
      this.gameState.coins.forEach(coin => {
        if (coin.collected) return;
        const dx = this.playerState.x - coin.x;
        const dz = this.playerState.z - coin.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2) {
          coin.collected = true;
          const value = coin.isBomb ? -2 : (coin.value || 1);
          this.playerState.score += value;
          this.app.audio?.playSFX(coin.isBomb ? 'hazard' : value > 1 ? 'rareCoin' : 'coin');
          const coinMesh = this.scene?.getObjectByName(`coin_${coin.id}`);
          if (coinMesh) this.scene.remove(coinMesh);
        }
      });
    }
  }

  update3DDefaultMinigame(delta) {
    // Already handled by update3DPlayer
  }

  render() {
    // 3D rendering only
    if (this.renderer && this.scene && this.camera) {
      this.render3D();
    } else {
      // Show error if 3D not available
      if (this.ctx && this.canvas) {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Nunito';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('3D rendering not available', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText('Please enable WebGL in your browser', this.canvas.width / 2, this.canvas.height / 2 + 20);
      }
    }

    // Render HUD overlay
    this.renderHUD();
  }

  render3D() {
    this.updateCameraRig();
    this.updateBillboards();

    // Animate coins
    this.animateCoins();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Render 2D HUD on top using overlay
    this.renderHUD();
  }

  updateBillboards() {
    if (!this.camera) return;
    const targetY = this.camera.position.y;
    const billboards = [];
    if (this.playerMesh) billboards.push(...this.playerMesh.children.filter(c => c.userData?.billboard));
    this.otherPlayerMeshes.forEach(mesh => {
      mesh.children.forEach(child => { if (child.userData?.billboard) billboards.push(child); });
    });

    billboards.forEach(card => {
      // Face the camera on Y axis only
      const dx = this.camera.position.x - card.parent.position.x;
      const dz = this.camera.position.z - card.parent.position.z;
      card.rotation.y = Math.atan2(dx, dz);
      // Keep upright
      card.rotation.x = 0;
      card.rotation.z = 0;
    });
  }

  updateCameraRig() {
    if (!this.camera || !this.cameraRig) return;

    const smoothing = this.cameraRig.smoothing ?? 0.08;
    const targetPos = this.cameraRig.position;
    if (targetPos) {
      this.camera.position.lerp(targetPos, smoothing);
    }

    const lookTarget = this.cameraRig.target?.clone ? this.cameraRig.target.clone() : new THREE.Vector3(0, 0, 0);
    if (this.cameraRig.followPlayer && this.playerMesh) {
      lookTarget.x += this.playerMesh.position.x * 0.15;
      lookTarget.z += this.playerMesh.position.z * 0.15;
    }

    this.camera.lookAt(lookTarget);
  }

  animateCoins() {
    if (!this.scene || !this.gameState?.coins) return;
    
    const time = performance.now() * 0.001;
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      let coinMesh = this.scene.getObjectByName(`coin_${coin.id}`);
      
      // Create coin mesh if it doesn't exist
      if (!coinMesh) {
        const color = coin.isBomb ? 0xe74c3c : (coin.value > 1 ? 0xb8ff5e : 0xfdcb6e);
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const material = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.8,
          roughness: 0.2,
          emissive: coin.isBomb ? 0xe74c3c : 0x000000,
          emissiveIntensity: coin.isBomb ? 0.35 : 0
        });
        coinMesh = new THREE.Mesh(geometry, material);
        coinMesh.name = `coin_${coin.id}`;
        coinMesh.position.set(coin.x, 1, coin.z);
        coinMesh.rotation.x = Math.PI / 2;
        coinMesh.castShadow = true;
        this.scene.add(coinMesh);
      }

      // Animate rotation and bobbing
      coinMesh.rotation.z = time * 2;
      coinMesh.position.y = 1 + Math.sin(time * 3 + coin.id) * 0.2;
    });
  }

  renderHUD() {
    // Update HUD elements
    const timerEl = document.getElementById('minigame-timer');
    const scoreEl = document.getElementById('minigame-scores');
    
    if (timerEl && this.gameState?.timeLeft !== undefined) {
      timerEl.textContent = Math.ceil(this.gameState.timeLeft);
    }

    if (scoreEl) {
      const allPlayers = this.isPractice 
        ? [{ id: 'local', username: 'You', score: this.playerState.score }, ...this.practiceBots]
        : this.gameState?.players || [];
      
      scoreEl.innerHTML = allPlayers.map(p => `
        <div class="score-item ${p.id === 'local' || p.id === this.app.state.user?.id ? 'local' : ''}">
          <span class="score-name">${p.username}</span>
          <span class="score-value">${p.score || 0}</span>
        </div>
      `).join('');
    }
  }

  endPracticeGame() {
    if (!this.isPractice) return;
    
    this.isPlaying = false;
    
    // Calculate rankings
    const allPlayers = [
      { id: 'local', username: 'You', score: this.playerState.score },
      ...this.practiceBots
    ].sort((a, b) => b.score - a.score);

    this.showResults({
      winner: allPlayers[0],
      rankings: allPlayers.map((p, i) => ({ ...p, reward: Math.max(0, (4 - i) * 5) }))
    });
  }

  // Platform rendering helper for 3D
  renderPlatforms3D() {
    if (!this.platforms) return;
    
    this.platforms.forEach(platform => {
      const geo = new THREE.BoxGeometry(platform.width, 0.5, platform.depth);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        roughness: 0.7
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(platform.x, platform.y, platform.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  // Balloons rendering helper for 3D
  renderBalloons3D() {
    if (!this.gameState?.balloons) return;
    
    this.gameState.balloons.forEach(balloon => {
      if (balloon.popped) return;
      
      let balloonMesh = this.scene.getObjectByName(`balloon_${balloon.id}`);
      if (!balloonMesh) {
        const geo = new THREE.SphereGeometry(balloon.size, 16, 16);
        const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6];
        const mat = new THREE.MeshStandardMaterial({ color: colors[balloon.id % colors.length] });
        balloonMesh = new THREE.Mesh(geo, mat);
        balloonMesh.name = `balloon_${balloon.id}`;
        balloonMesh.castShadow = true;
        this.scene.add(balloonMesh);
      }
      
      balloonMesh.position.set(balloon.x, balloon.y, balloon.z);
    });
  }

  // Goal rendering for 3D
  renderGoal3D() {
    if (!this.gameState?.goal) return;
    
    let goalMesh = this.scene.getObjectByName('goal');
    if (!goalMesh) {
      const geo = new THREE.CylinderGeometry(this.gameState.goal.size, this.gameState.goal.size, 0.5, 16);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfdcb6e });
      goalMesh = new THREE.Mesh(geo, mat);
      goalMesh.name = 'goal';
      this.scene.add(goalMesh);
    }
    
    goalMesh.position.set(this.gameState.goal.x, this.gameState.goal.y, this.gameState.goal.z);
    goalMesh.rotation.y += 0.02;
  }

  // Button Bash minigame - rapid clicking
  updateButtonBash(delta) {
    // Track clicks per frame
    if (!this.gameState.clicksThisFrame) {
      this.gameState.clicksThisFrame = 0;
    }
  }

  // Hot Potato minigame - pass the bomb
  updateHotPotato(delta) {
    this.update3DPlayer(delta);

    // Initialize holder and timer
    if (!this.gameState.hotPotatoHolder) {
      this.gameState.hotPotatoHolder = this.app.state.user?.id || 'local';
      this.gameState.bombTimer = 15;
    }
    if (!this.gameState.bombTimer) {
      this.gameState.bombTimer = 15;
    }

    this.gameState.bombTimer -= delta;

    // Attach bomb mesh to holder
    if (this.hotPotato) {
      const holderId = this.gameState.hotPotatoHolder;
      const holderMesh = holderId === 'local' ? this.playerMesh : this.otherPlayerMeshes.get(holderId);
      if (holderMesh) {
        this.hotPotato.visible = true;
        this.hotPotato.position.copy(holderMesh.position);
        this.hotPotato.position.y += 1.2;
      }
    }

    // Handle explosion
    if (this.gameState.bombTimer <= 0) {
      const holderId = this.gameState.hotPotatoHolder;
      if (holderId === 'local') {
        this.playerState.score = Math.max(0, this.playerState.score - 5);
        this.playerState.alive = false;
      } else {
        const bot = this.practiceBots?.find(b => b.id === holderId);
        if (bot) bot.alive = false;
      }
      this.app.audio?.playSFX('potatoBoom');

      // Pick a new living holder
      const candidates = [
        { id: 'local', alive: this.playerState.alive !== false },
        ...(this.practiceBots || [])
      ].filter(p => p.alive);

      if (candidates.length > 0) {
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        this.gameState.hotPotatoHolder = next.id;
        this.gameState.bombTimer = 15 + Math.random() * 5;
      } else {
        this.gameState.hotPotatoHolder = null;
      }
    }
    
    // Passing logic (practice only)
    if (this.practiceBots && this.practiceBots.length > 0 && this.gameState.hotPotatoHolder === 'local') {
      this.practiceBots.forEach(bot => {
        const dx = this.playerState.x - bot.x;
        const dz = this.playerState.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 2 && this.keys['Space']) {
          this.gameState.hotPotatoHolder = bot.id;
          this.gameState.bombTimer = 15;
          this.playerState.score += 1;
          this.app.audio?.playSFX('potatoPass');
        }
      });
    }

    // Bots pass back to player if they hold the bomb and are close
    if (this.practiceBots && this.practiceBots.length > 0 && this.gameState.hotPotatoHolder && this.gameState.hotPotatoHolder !== 'local') {
      const holderBot = this.practiceBots.find(b => b.id === this.gameState.hotPotatoHolder);
      if (holderBot) {
        const dx = holderBot.x - this.playerState.x;
        const dz = holderBot.z - this.playerState.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2) {
          this.gameState.hotPotatoHolder = 'local';
          this.gameState.bombTimer = 15;
          this.app.audio?.playSFX('potatoPass');
        }
      }
    }
  }

  // Bumper Balls minigame - knock other players around
  updateBumperBalls(delta) {
    this.update3DPlayer(delta);
    const arenaRadius = this.arenaRadius || 18;
    const boostRadius = 3.2;

    // Center boost pad impulse
    const distToCenter = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    if (distToCenter < boostRadius) {
      const angle = Math.atan2(this.playerState.z, this.playerState.x);
      this.playerState.vx += Math.cos(angle) * 12 * delta;
      this.playerState.vz += Math.sin(angle) * 12 * delta;
      this.app.audio?.playSFX('dash');
    }
    // Arena bounds bounce
    if (distToCenter > arenaRadius) {
      const scale = arenaRadius / distToCenter;
      this.playerState.x *= scale;
      this.playerState.z *= scale;
      this.playerState.vx *= -0.35;
      this.playerState.vz *= -0.35;
    }
    
    // Check collisions with bots
    if (this.practiceBots && this.practiceBots.length > 0) {
      this.practiceBots.forEach(bot => {
        const dx = this.playerState.x - bot.x;
        const dz = this.playerState.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 2) {
          // Collision! Push bot away
          const angle = Math.atan2(dz, dx);
          bot.vx = Math.cos(angle) * 8;
          bot.vz = Math.sin(angle) * 8;
          
          this.playerState.score++;
          this.app.audio?.playSFX('bump');
          
          // Knockback on player too
          this.playerState.vx -= Math.cos(angle) * 5;
          this.playerState.vz -= Math.sin(angle) * 5;
        }
      });
    }
  }

  // Maze Race minigame - reach the goal
  updateMazeRace(delta) {
    this.update3DPlayer(delta);
    
    // Create goal if not exists
    if (!this.gameState.goal) {
      this.gameState.goal = {
        x: (Math.random() - 0.5) * 25,
        z: (Math.random() - 0.5) * 25,
        size: 2
      };
    }
    
    // Check if reached goal
    const dx = this.playerState.x - this.gameState.goal.x;
    const dz = this.playerState.z - this.gameState.goal.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < this.gameState.goal.size + 1) {
      this.playerState.score += 10;
      this.app.audio?.playSFX('win');
      
      // Spawn new goal
      this.gameState.goal.x = (Math.random() - 0.5) * 25;
      this.gameState.goal.z = (Math.random() - 0.5) * 25;
    }
  }

  // Ice Skating minigame - slippery controls
  updateIceSkating(delta) {
    const acceleration = 25;
    const friction = 0.92; // More slippery
    const maxSpeed = 15;
    
    let accelX = 0, accelZ = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) accelX = -acceleration;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) accelX = acceleration;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) accelZ = -acceleration;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) accelZ = acceleration;
    
    this.playerState.vx += accelX * delta;
    this.playerState.vz += accelZ * delta;
    
    // Clamp speed
    const speed = Math.sqrt(this.playerState.vx ** 2 + this.playerState.vz ** 2);
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      this.playerState.vx *= scale;
      this.playerState.vz *= scale;
    }
    
    // Apply heavy friction
    this.playerState.vx *= friction;
    this.playerState.vz *= friction;

    // Update position
    this.playerState.x += this.playerState.vx * delta;
    this.playerState.z += this.playerState.vz * delta;

    // Clamp to arena
    const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    const radius = this.arenaRadius || 20;
    if (dist > radius) {
      const scale = radius / dist;
      this.playerState.x *= scale;
      this.playerState.z *= scale;
      // Bounce
      this.playerState.vx *= -0.5;
      this.playerState.vz *= -0.5;
    }

    // Collect items
    if (!this.gameState.collectibles) {
      this.gameState.collectibles = [];
      for (let i = 0; i < 10; i++) {
        this.gameState.collectibles.push({
          id: i,
          x: (Math.random() - 0.5) * 30,
          z: (Math.random() - 0.5) * 30,
          collected: false
        });
      }
    }
    
    this.gameState.collectibles.forEach(item => {
      if (item.collected) return;
      const dx = this.playerState.x - item.x;
      const dz = this.playerState.z - item.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.5) {
        item.collected = true;
        this.playerState.score++;
        this.app.audio?.playSFX('coin');
      }
    });

    // Update mesh
    if (this.playerMesh) {
      this.playerMesh.position.set(this.playerState.x, 0, this.playerState.z);
      if (Math.abs(this.playerState.vx) > 0.1 || Math.abs(this.playerState.vz) > 0.1) {
        this.playerMesh.rotation.y = Math.atan2(this.playerState.vx, this.playerState.vz);
      }
    }
  }

  // Memory Match minigame - flip cards
  updateMemoryMatch(delta) {
    // Handled by mouse clicks - no continuous update needed
  }

  // Balloon Burst minigame - shoot balloons
  updateBalloonBurst(delta) {
    // Create balloons if not exists
    if (!this.gameState.balloons) {
      this.gameState.balloons = [];
      for (let i = 0; i < 8; i++) {
        this.gameState.balloons.push({
          id: i,
          x: (Math.random() - 0.5) * 30,
          z: (Math.random() - 0.5) * 30,
          y: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 3,
          vz: (Math.random() - 0.5) * 5,
          size: 0.8 + Math.random() * 0.4,
          popped: false
        });
      }
    }
    
    // Update balloon positions
    this.gameState.balloons.forEach(balloon => {
      if (balloon.popped) return;
      
      balloon.x += balloon.vx * delta;
      balloon.y += balloon.vy * delta;
      balloon.z += balloon.vz * delta;
      
      // Gravity on balloons (slight)
      balloon.vy -= 2 * delta;
      
      // Bounds
      if (balloon.y < 0) {
        balloon.popped = true;
        this.playerState.score -= 1;
      }
    });
  }

  // Target Practice minigame - shoot targets
  updateTargetPractice(delta) {
    // Create targets if not exists
    if (!this.gameState.targets) {
      this.gameState.targets = [];
      for (let i = 0; i < 5; i++) {
        this.gameState.targets.push({
          id: i,
          x: (Math.random() - 0.5) * 30,
          z: (Math.random() - 0.5) * 30,
          y: 5 + Math.random() * 5,
          size: 1.5,
          hit: false,
          respawnTimer: 0
        });
      }
    }
    
    // Reset hit targets
    this.gameState.targets.forEach(target => {
      if (target.hit) {
        target.respawnTimer -= delta;
        if (target.respawnTimer <= 0) {
          target.hit = false;
          target.x = (Math.random() - 0.5) * 30;
          target.z = (Math.random() - 0.5) * 30;
        }
      }
    });
  }

  // Rhythm Rumble minigame - hit notes
  updateRhythmRumble(delta) {
    // Create note track if not exists
    if (!this.gameState.notes) {
      this.gameState.notes = [];
      this.gameState.combo = 0;
    }
    
    // Spawn notes periodically
    if (!this.gameState.noteSpawnTimer) {
      this.gameState.noteSpawnTimer = 0.5;
    }
    
    this.gameState.noteSpawnTimer -= delta;
    if (this.gameState.noteSpawnTimer <= 0) {
      const track = Math.floor(Math.random() * 4);
      this.gameState.notes.push({
        id: Date.now(),
        track,
        y: 0,
        vy: 150,
        hit: false
      });
      this.gameState.noteSpawnTimer = 0.6 + Math.random() * 0.3;
    }
    
    // Move notes down
    this.gameState.notes.forEach(note => {
      note.y += note.vy * delta;
    });
    
    // Remove off-screen notes
    this.gameState.notes = this.gameState.notes.filter(note => note.y < 600);
  }

  // Coin Chaos minigame - 3D collectibles game
  updateCoinChaos(delta) {
    this.update3DPlayer(delta);

    // Spawn coins from spawners
    if (!this.gameState.coinSpawnTimer) {
      this.gameState.coinSpawnTimer = 0.9;
    }
    this.gameState.coinSpawnTimer -= delta;
    if (this.gameState.coinSpawnTimer <= 0 && this.coinSpawners?.length) {
      const source = this.coinSpawners[Math.floor(Math.random() * this.coinSpawners.length)];
      const rare = Math.random() > 0.8;
      this.gameState.coins.push({
        id: 'drop_' + Date.now(),
        x: source.x + (Math.random() - 0.5) * 1.5,
        y: 1,
        z: source.z + (Math.random() - 0.5) * 1.5,
        collected: false,
        value: rare ? 3 : 1
      });
      this.gameState.coinSpawnTimer = 0.6 + Math.random() * 0.4;
    }

    // Add bomb spawning every few seconds (practice visual)
    if (!this.gameState.bombSpawnTimer) {
      this.gameState.bombSpawnTimer = 3.5;
    }
    
    this.gameState.bombSpawnTimer -= delta;
    if (this.gameState.bombSpawnTimer <= 0) {
      if (this.isPractice && this.gameState.coins) {
        const bombCoin = {
          id: 'bomb_' + Date.now(),
          x: (Math.random() - 0.5) * 30,
          y: 1,
          z: (Math.random() - 0.5) * 30,
          collected: false,
          isBomb: true,
          value: -2
        };
        this.gameState.coins.push(bombCoin);
      }
      this.gameState.bombSpawnTimer = 4 + Math.random() * 3;
    }
  }

  // Platform Peril minigame - Jump across floating platforms
  updatePlatformPeril(delta) {
    const acceleration = 30;
    const maxSpeed = 10;
    const friction = 0.88;
    const gravity = 35;
    const jumpForce = 16;

    // Horizontal movement with acceleration
    let accelX = 0, accelZ = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) accelX = -acceleration;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) accelX = acceleration;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) accelZ = -acceleration;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) accelZ = acceleration;
    
    this.playerState.vx += accelX * delta;
    this.playerState.vz += accelZ * delta;
    
    // Clamp speed
    const hSpeed = Math.sqrt(this.playerState.vx ** 2 + this.playerState.vz ** 2);
    if (hSpeed > maxSpeed) {
      const scale = maxSpeed / hSpeed;
      this.playerState.vx *= scale;
      this.playerState.vz *= scale;
    }
    
    if (accelX === 0) this.playerState.vx *= friction;
    if (accelZ === 0) this.playerState.vz *= friction;

    // Apply velocity
    this.playerState.x += this.playerState.vx * delta;
    this.playerState.z += this.playerState.vz * delta;

    // Gravity
    if (!this.playerState.onGround) {
      this.playerState.vy -= gravity * delta;
    } else {
      if (this.keys['Space'] && !this.playerState.jumpPressed) {
        this.playerState.vy = jumpForce;
        this.playerState.onGround = false;
        this.playerState.jumpPressed = true;
      }
    }
    
    if (!this.keys['Space']) this.playerState.jumpPressed = false;
    
    this.playerState.y += this.playerState.vy * delta;

    // Platform collision
    this.playerState.onGround = false;

    // Ensure platforms exist (should be built in arena creation)
    if (!this.platforms || this.platforms.length === 0) {
      this.createPlatformPerilArena();
    }
    
    // Check platform collisions
    this.platforms.forEach(platform => {
      const dx = Math.abs(this.playerState.x - platform.x);
      const dz = Math.abs(this.playerState.z - platform.z);
      const w = platform.width / 2;
      const d = platform.depth / 2;
      
      if (dx < w && dz < d && this.playerState.y >= platform.y && this.playerState.y <= platform.y + 1) {
        this.playerState.y = platform.y + 1;
        this.playerState.vy = 0;
        this.playerState.onGround = true;
        
        // Start shrinking this platform
        if (!platform.shrinking) {
          platform.shrinking = true;
          platform.shrinkTimer = 0.5;
        }
      }
    });

    // Shrink platforms over time
    this.platforms.forEach(platform => {
      if (platform.shrinking) {
        platform.shrinkAmount += platform.shrinkSpeed * delta;
        platform.width = Math.max(0.6, platform.width - platform.shrinkSpeed * delta);
        platform.depth = Math.max(0.6, platform.depth - platform.shrinkSpeed * delta);
        if (platform.mesh) {
          platform.mesh.scale.x = platform.width / platform.originalWidth;
          platform.mesh.scale.z = platform.depth / platform.originalDepth;
        }
      }
    });

    // Fall off world
    if (this.playerState.y < -5) {
      this.playerState.alive = false;
      this.playerState.score = Math.max(0, this.playerState.score - 1);
    }

    // Arena bounds
    const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    const radius = this.arenaRadius || 25;
    if (dist > radius) {
      const scale = radius / dist;
      this.playerState.x *= scale;
      this.playerState.z *= scale;
    }

    // Update mesh
    if (this.playerMesh) {
      this.playerMesh.position.set(this.playerState.x, this.playerState.y, this.playerState.z);
      if (Math.abs(this.playerState.vx) > 0.1 || Math.abs(this.playerState.vz) > 0.1) {
        this.playerMesh.rotation.y = Math.atan2(this.playerState.vx, this.playerState.vz);
      }
    }
  }



  updateUI() {
    const hud = this.getHUDRoot();

    // Update timer (legacy element support)
    const timerEl = document.getElementById('minigame-timer') || hud.querySelector('.hud-timer-value');
    if (timerEl && this.gameState?.timeLeft !== undefined) {
      timerEl.textContent = Math.max(0, Math.ceil(this.gameState.timeLeft));
    }

    // Scores
    const scoresEl = document.getElementById('minigame-scores') || hud.querySelector('.hud-scores');
    if (scoresEl && this.gameState?.players) {
      scoresEl.innerHTML = this.gameState.players.map(player => `
        <div class="minigame-score-item">
          <span>${player.username}</span>
          <span>${player.score || 0}</span>
        </div>
      `).join('');
    }

    // Per-minigame cues
    this.renderMinigameHUD(hud, this.currentMinigame?.id);
  }

  getHUDRoot() {
    let root = document.getElementById('minigame-hud');
    if (!root) {
      root = document.createElement('div');
      root.id = 'minigame-hud';
      root.className = 'minigame-hud';
      document.getElementById('minigame-screen')?.appendChild(root);

      // Create baseline blocks
      const timerBlock = document.createElement('div');
      timerBlock.className = 'hud-block hud-timer';
      timerBlock.innerHTML = '<div class="hud-label">Time</div><div class="hud-timer-value">--</div>';
      root.appendChild(timerBlock);

      const scoreBlock = document.createElement('div');
      scoreBlock.className = 'hud-block hud-scores';
      root.appendChild(scoreBlock);

      const detailBlock = document.createElement('div');
      detailBlock.className = 'hud-block hud-detail';
      root.appendChild(detailBlock);
    }
    return root;
  }

  renderMinigameHUD(root, minigameId) {
    const detail = root.querySelector('.hud-detail');
    if (!detail) return;

    const hud = {
      coin_chaos: () => {
        const coinsLeft = this.gameState?.coins?.filter(c => !c.collected && !c.isBomb).length ?? 0;
        const rareSoon = Math.max(0, (this.gameState?.coinSpawnTimer ?? 0)).toFixed(1);
        const bombSoon = Math.max(0, (this.gameState?.bombSpawnTimer ?? 0)).toFixed(1);
        detail.innerHTML = `
          <div class="hud-row"><span>Coins active</span><strong>${coinsLeft}</strong></div>
          <div class="hud-row"><span>Next drop</span><strong>${rareSoon}s</strong></div>
          <div class="hud-row warning"><span>Bomb check</span><strong>${bombSoon}s</strong></div>
        `;
      },
      hot_potato: () => {
        const holder = this.gameState?.hotPotatoHolder || 'None';
        const time = Math.max(0, Math.ceil(this.gameState?.bombTimer ?? 0));
        detail.innerHTML = `
          <div class="hud-row"><span>Holder</span><strong>${holder}</strong></div>
          <div class="hud-row danger"><span>Detonation</span><strong>${time}s</strong></div>
        `;
      },
      platform_peril: () => {
        const active = this.platforms?.filter(p => p.width > 0.7 && p.depth > 0.7).length ?? 0;
        const shrinking = this.platforms?.filter(p => p.shrinking).length ?? 0;
        detail.innerHTML = `
          <div class="hud-row"><span>Platforms safe</span><strong>${active}</strong></div>
          <div class="hud-row warning"><span>Shrinking</span><strong>${shrinking}</strong></div>
        `;
      },
      bumper_balls: () => {
        const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
        const boostReady = dist < 3.2 ? 'BOOST!' : 'Center pad';
        detail.innerHTML = `
          <div class="hud-row ${dist < 3.2 ? 'success' : ''}"><span>Pad</span><strong>${boostReady}</strong></div>
        `;
      },
      maze_race: () => {
        const goal = this.gameState?.goal;
        if (!goal) {
          detail.innerHTML = '<div class="hud-row"><span>Goal</span><strong>Scanning...</strong></div>';
          return;
        }
        const dx = goal.x - this.playerState.x;
        const dz = goal.z - this.playerState.z;
        const angle = Math.atan2(dz, dx);
        const dir = this.directionArrow(angle);
        const dist = Math.sqrt(dx * dx + dz * dz).toFixed(1);
        detail.innerHTML = `
          <div class="hud-row"><span>Direction</span><strong>${dir}</strong></div>
          <div class="hud-row"><span>Distance</span><strong>${dist}m</strong></div>
        `;
      },
      ice_skating: () => {
        const remaining = this.gameState?.collectibles?.filter(c => !c.collected).length ?? 0;
        detail.innerHTML = `
          <div class="hud-row"><span>Crystals</span><strong>${remaining}</strong></div>
        `;
      }
    };

    const renderer = hud[minigameId];
    if (renderer) {
      renderer();
    } else {
      detail.innerHTML = '';
    }
  }

  directionArrow(angleRad) {
    const dirs = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
    const idx = Math.round((((angleRad + Math.PI) / (Math.PI * 2)) * 8)) % 8;
    return dirs[idx];
  }

  getInputAxes() {
    let moveX = 0;
    let moveZ = 0;

    if (this.activeActions.moveLeft) moveX -= 1;
    if (this.activeActions.moveRight) moveX += 1;
    if (this.activeActions.moveUp) moveZ -= 1;
    if (this.activeActions.moveDown) moveZ += 1;

    // Normalize keyboard input
    const mag = Math.hypot(moveX, moveZ);
    if (mag > 1e-3) {
      moveX /= mag;
      moveZ /= mag;
    }

    // Gamepad contribution (already normalized in pollGamepads)
    if (this.gamepad.axes) {
      moveX += this.gamepad.axes.x;
      moveZ += this.gamepad.axes.y;
    }

    // Re-normalize after combining
    const combinedMag = Math.hypot(moveX, moveZ);
    if (combinedMag > 1) {
      moveX /= combinedMag;
      moveZ /= combinedMag;
    }

    const jumpPressed = this.activeActions.jump || this.gamepad.jump;

    return { moveX, moveZ, jumpPressed };
  }

  pollGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = pads?.find(p => p && p.connected);
    if (!pad) {
      this.gamepad.axes = null;
      this.gamepad.jump = false;
      this.gamepad.action = false;
      return;
    }

    const dz = this.gamepad.deadzone;
    const ax = pad.axes?.[0] || 0;
    const ay = pad.axes?.[1] || 0;
    const filteredX = Math.abs(ax) > dz ? ax : 0;
    const filteredY = Math.abs(ay) > dz ? ay : 0;
    this.gamepad.axes = { x: filteredX, y: filteredY };

    const buttons = pad.buttons || [];
    const pressed = (idx) => buttons[idx]?.pressed;
    const jumpBtn = pressed(0) || pressed(1) || pressed(2) || pressed(3); // Face buttons
    const actionBtn = pressed(5) || pressed(7) || pressed(0);

    this.gamepad.jump = !!jumpBtn;
    this.gamepad.action = !!actionBtn;

    if (this.gamepad.action && !this.gamepad.lastAction) {
      this.handleAction();
    }
    this.gamepad.lastAction = this.gamepad.action;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    // Also resize 3D renderer
    if (this.renderer && this.camera) {
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  // Practice mode - fixed to work without socket
  startPractice(minigameId) {
    this.isPractice = true;
    this.isTutorial = false;
    
    // Get minigame data
    fetch(`/api/minigames/${minigameId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.minigame) {
          throw new Error('Minigame not found');
        }
        
        this.currentMinigame = data.minigame;
        this.is3D = true; // Always 3D
        
        // Create practice bots (AI opponents)
        const botCount = 2 + Math.floor(Math.random() * 2); // 2-3 bots
        this.practiceBots = [];
        const botNames = ['Bot-1', 'Bot-2', 'Bot-3', 'Bot-4'];
        const botCharacters = ['jojo', 'mimi'];
        
        for (let i = 0; i < botCount; i++) {
          const bot = {
            id: `bot_${i}`,
            username: botNames[i],
            characterId: botCharacters[i % botCharacters.length],
            x: (Math.random() - 0.5) * 20,
            y: 0,
            z: (Math.random() - 0.5) * 20,
            vx: 0,
            vy: 0,
            vz: 0,
            score: 0,
            alive: true,
            ai: {
              targetX: 0,
              targetZ: 0,
              changeTimer: 2,
              difficulty: 'normal'
            }
          };
          this.practiceBots.push(bot);
        }
        
        // Navigate to minigame screen
        this.app.navigateTo('minigame', { 
          minigame: data.minigame, 
          practice: true,
          bots: this.practiceBots
        });
        
        // Initialize the minigame after navigation
        setTimeout(() => {
          this.initMinigame({ minigame: data.minigame, practice: true, bots: this.practiceBots });
          this.isPlaying = true;
          this.startGameLoop();
        }, 100);
      })
      .catch(err => {
        console.error('Failed to load minigame:', err);
        this.app.ui?.showToast('Failed to load minigame', 'error');
      });
  }

  // Tutorial mode - playable tutorial like Mario Party Jamboree
  startTutorial(minigameId) {
    this.isTutorial = true;
    this.isPractice = false;
    this.tutorialStep = 0;
    
    fetch(`/api/minigames/${minigameId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.minigame) {
          throw new Error('Minigame not found');
        }
        
        this.currentMinigame = data.minigame;
        this.is3D = true; // Always 3D
        
        // Set up tutorial steps
        this.tutorialSteps = this.createTutorialSteps(data.minigame);
        
        // Navigate to minigame screen
        this.app.navigateTo('minigame', { minigame: data.minigame, tutorial: true });
        
        // Initialize the minigame after navigation
        setTimeout(() => {
          this.initTutorial(data.minigame);
        }, 100);
      })
      .catch(err => {
        console.error('Failed to load minigame:', err);
        this.app.ui?.showToast('Failed to load minigame', 'error');
      });
  }

  createTutorialSteps(minigame) {
    // Create tutorial steps based on minigame type
    const baseSteps = [
      {
        message: `Welcome to ${minigame.name}!`,
        action: 'press_any',
        highlight: null
      },
      {
        message: minigame.description,
        action: 'press_any',
        highlight: null
      }
    ];

    // Add movement tutorial
    if (minigame.controls?.movement?.includes('WASD') || minigame.controls?.movement?.includes('Arrow')) {
      baseSteps.push({
        message: 'Use WASD or Arrow Keys to move around!',
        action: 'move',
        highlight: 'movement',
        requiredKeys: ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      });
    }

    // Add action tutorial
    if (minigame.controls?.action && minigame.controls.action !== 'None') {
      baseSteps.push({
        message: `Press Space to ${minigame.controls.action.toLowerCase()}!`,
        action: 'space',
        highlight: 'action',
        requiredKeys: ['Space']
      });
    }

    // Add minigame-specific tutorials
    switch (minigame.id) {
      case 'coin_chaos':
        baseSteps.push(
          { message: 'Collect gold coins for points!', action: 'collect', highlight: 'coins' },
          { message: 'Avoid the bombs - they stun you!', action: 'press_any', highlight: 'bombs' }
        );
        break;
      case 'platform_peril':
        baseSteps.push(
          { message: 'Stay on the platforms - they shrink over time!', action: 'press_any', highlight: 'platforms' },
          { message: 'Push other players off to eliminate them!', action: 'press_any', highlight: null }
        );
        break;
      case 'bumper_balls':
        baseSteps.push(
          { message: 'Bump into opponents to push them!', action: 'press_any', highlight: null },
          { message: 'Use dash (Space) for powerful pushes!', action: 'space', highlight: 'dash' }
        );
        break;
    }

    // Final step
    baseSteps.push({
      message: 'You\'re ready! Good luck!',
      action: 'press_any',
      highlight: null,
      isFinal: true
    });

    return baseSteps;
  }

  initTutorial(minigame) {
    // Get canvas
    this.canvas = document.getElementById('minigame-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    // Initialize 3D if needed
    if (this.is3D) {
      this.init3DScene();
    }

    // Show first tutorial step
    this.showTutorialStep();
    
    // Start game loop for tutorial
    this.isPlaying = false; // Not fully playing yet
    this.startGameLoop();
  }

  showTutorialStep() {
    const step = this.tutorialSteps[this.tutorialStep];
    if (!step) return;

    // Create or update tutorial overlay
    let overlay = document.getElementById('tutorial-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tutorial-overlay';
      overlay.className = 'tutorial-overlay';
      document.getElementById('minigame-screen')?.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="tutorial-message">
        <div class="tutorial-step">Step ${this.tutorialStep + 1}/${this.tutorialSteps.length}</div>
        <p>${step.message}</p>
        <div class="tutorial-hint">
          ${step.action === 'press_any' ? 'Press any key to continue...' : ''}
          ${step.action === 'move' ? 'Try moving around!' : ''}
          ${step.action === 'space' ? 'Press Space!' : ''}
          ${step.action === 'collect' ? 'Collect a coin!' : ''}
        </div>
      </div>
    `;
    
    overlay.classList.add('active');
  }

  checkTutorialProgress(code) {
    const step = this.tutorialSteps[this.tutorialStep];
    if (!step) return;

    let shouldAdvance = false;

    switch (step.action) {
      case 'press_any':
        shouldAdvance = true;
        break;
      case 'move':
        shouldAdvance = step.requiredKeys?.includes(code);
        break;
      case 'space':
        shouldAdvance = code === 'Space';
        break;
      default:
        break;
    }

    if (shouldAdvance) {
      this.tutorialStep++;
      
      if (this.tutorialStep >= this.tutorialSteps.length) {
        // Tutorial complete
        this.completeTutorial();
      } else {
        this.showTutorialStep();
      }
    }
  }

  completeTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 500);
    }

    this.isTutorial = false;
    this.app.ui?.showToast('Tutorial complete! Starting practice...', 'success');
    
    // Start practice mode
    setTimeout(() => {
      this.isPractice = true;
      this.startMinigame();
    }, 1000);
  }

  // Update bot AI in practice mode
  updatePracticeBots(delta) {
    const minigameId = this.currentMinigame?.id;

    this.practiceBots.forEach(bot => {
      if (!bot.alive) return;

      if (!bot.ai) {
        bot.ai = { targetX: bot.x, targetZ: bot.z, changeTimer: 1.5, difficulty: 'normal' };
      }

      const speed = 8 * delta;

      // Decide goal per minigame
      if (minigameId === 'coin_chaos' && this.gameState?.coins) {
        const available = this.gameState.coins.filter(c => !c.collected && !c.isBomb);
        if (available.length > 0) {
          // Prefer high-value and nearby coins
          const target = available.reduce((best, coin) => {
            const d = Math.hypot(bot.x - coin.x, bot.z - coin.z);
            const score = (coin.value || 1) / Math.max(1, d);
            return !best || score > best.score ? { coin, score } : best;
          }, null);
          if (target) {
            bot.ai.targetX = target.coin.x;
            bot.ai.targetZ = target.coin.z;
          }
        }
        // Steer away from bombs if close
        const bomb = this.gameState.coins.find(c => c.isBomb && !c.collected);
        if (bomb) {
          const bd = Math.hypot(bot.x - bomb.x, bot.z - bomb.z);
          if (bd < 5) {
            bot.ai.targetX = bot.x + (bot.x - bomb.x) * 0.6;
            bot.ai.targetZ = bot.z + (bot.z - bomb.z) * 0.6;
          }
        }
      } else if (minigameId === 'maze_race' && this.gameState?.goal) {
        bot.ai.targetX = this.gameState.goal.x;
        bot.ai.targetZ = this.gameState.goal.z;
      } else if (minigameId === 'bumper_balls') {
        // Circle near the player but avoid rails
        const towardsPlayer = { x: this.playerState.x * 0.7, z: this.playerState.z * 0.7 };
        bot.ai.targetX = towardsPlayer.x + (Math.random() - 0.5) * 4;
        bot.ai.targetZ = towardsPlayer.z + (Math.random() - 0.5) * 4;
      } else if (minigameId === 'hot_potato') {
        if (this.gameState.hotPotatoHolder === bot.id) {
          // Kite away from player when holding bomb
          const awayX = bot.x + (bot.x - this.playerState.x) * 0.8;
          const awayZ = bot.z + (bot.z - this.playerState.z) * 0.8;
          bot.ai.targetX = awayX;
          bot.ai.targetZ = awayZ;
        } else {
          bot.ai.targetX = (Math.random() - 0.5) * 25;
          bot.ai.targetZ = (Math.random() - 0.5) * 25;
        }
      } else if (minigameId === 'platform_peril' && this.platforms?.length) {
        const candidates = this.platforms.filter(p => p.width > 0.8 && p.depth > 0.8);
        const safe = candidates.reduce((best, p) => {
          const d = Math.hypot(bot.x - p.x, bot.z - p.z);
          return !best || d < best.dist ? { p, dist: d } : best;
        }, null);
        if (safe?.p) {
          bot.ai.targetX = safe.p.x;
          bot.ai.targetZ = safe.p.z;
        }
      } else {
        bot.ai.changeTimer -= delta;
        if (bot.ai.changeTimer <= 0 || Math.hypot(bot.ai.targetX - bot.x, bot.ai.targetZ - bot.z) < 0.5) {
          bot.ai.targetX = (Math.random() - 0.5) * 26;
          bot.ai.targetZ = (Math.random() - 0.5) * 26;
          bot.ai.changeTimer = 1 + Math.random() * 1.5;
        }
      }

      // Move towards target with simple acceleration
      const dx = bot.ai.targetX - bot.x;
      const dz = bot.ai.targetZ - bot.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 0.1) {
        bot.vx += (dx / dist) * speed;
        bot.vz += (dz / dist) * speed;
      }

      bot.vx *= 0.9;
      bot.vz *= 0.9;

      bot.x += bot.vx * delta;
      bot.z += bot.vz * delta;

      // Keep bots within arena bounds
      const radius = this.arenaRadius || 20;
      const botDist = Math.sqrt(bot.x ** 2 + bot.z ** 2);
      if (botDist > radius) {
        const scale = radius / botDist;
        bot.x *= scale;
        bot.z *= scale;
        bot.vx *= -0.25;
        bot.vz *= -0.25;
      }

      // Update mesh position
      const mesh = this.otherPlayerMeshes.get(bot.id);
      if (mesh) {
        mesh.position.x = bot.x;
        mesh.position.z = bot.z;
      }

      // Collect coins (for coin-based games)
      if (this.gameState?.coins) {
        this.gameState.coins.forEach(coin => {
          if (coin.collected) return;
          const cdx = bot.x - coin.x;
          const cdz = bot.z - coin.z;
          const cdist = Math.sqrt(cdx * cdx + cdz * cdz);
          if (cdist < 2) {
            coin.collected = true;
            bot.score += coin.value || 1;
          }
        });
      }
    });
  }

  // Cleanup
  destroy() {
    this.stopGameLoop();
    this.isPlaying = false;
    this.isTutorial = false;
    this.isPractice = false;
    this.currentMinigame = null;
    this.gameState = null;
    
    // Clean up 3D resources
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.playerMesh = null;
    this.otherPlayerMeshes.clear();
    this.practiceBots = [];
    
    // Remove overlays
    document.getElementById('minigame-cinematic')?.remove();
    document.getElementById('tutorial-overlay')?.remove();
  }
}
