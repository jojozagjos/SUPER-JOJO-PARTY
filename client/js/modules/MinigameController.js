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
    
    this.setupInputHandlers();
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
    
    // In practice/tutorial mode, don't send to server
    if (!this.isPractice && !this.isTutorial && this.app.socket?.isConnected()) {
      const input = { key: code, pressed };
      this.app.socket.emit('minigame:input', input);
    }
    
    // Handle local input for responsive feel
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
    
    const speed = this.is3D ? 0.5 : 5;
    const inputMappings = {
      'KeyW': () => { this.playerState.y -= speed; if (this.is3D) this.playerState.vz = -speed; },
      'KeyS': () => { this.playerState.y += speed; if (this.is3D) this.playerState.vz = speed; },
      'KeyA': () => { this.playerState.x -= speed; if (this.is3D) this.playerState.vx = -speed; },
      'KeyD': () => { this.playerState.x += speed; if (this.is3D) this.playerState.vx = speed; },
      'ArrowUp': () => { this.playerState.y -= speed; if (this.is3D) this.playerState.vz = -speed; },
      'ArrowDown': () => { this.playerState.y += speed; if (this.is3D) this.playerState.vz = speed; },
      'ArrowLeft': () => { this.playerState.x -= speed; if (this.is3D) this.playerState.vx = -speed; },
      'ArrowRight': () => { this.playerState.x += speed; if (this.is3D) this.playerState.vx = speed; },
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
      this.playerState.vy = 8; // Jump
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
    
    // Base platform
    const platformGeometry = new THREE.CylinderGeometry(20, 22, 2, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x6c5ce7,
      metalness: 0.3,
      roughness: 0.7
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1;
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Grid pattern on platform
    const gridHelper = new THREE.GridHelper(40, 20, 0x9b59b6, 0x8e44ad);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Add minigame-specific elements
    switch (minigameId) {
      case 'coin_chaos':
        this.createCoinChaosArena();
        break;
      case 'platform_peril':
        this.createPlatformPerilArena();
        break;
      case 'bumper_balls':
        this.createBumperBallsArena();
        break;
      case 'hot_potato':
        this.createHotPotatoArena();
        break;
      default:
        this.createDefaultArena();
    }
  }

  createDefaultArena() {
    // Border walls (invisible but for collision)
    const wallHeight = 5;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x9b59b6,
      transparent: true,
      opacity: 0.3
    });

    // Decorative pillars at corners
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const pillarGeometry = new THREE.CylinderGeometry(1, 1.2, 8, 8);
      const pillar = new THREE.Mesh(pillarGeometry, wallMaterial);
      pillar.position.set(Math.cos(angle) * 18, 3, Math.sin(angle) * 18);
      pillar.castShadow = true;
      this.scene.add(pillar);

      // Glow on top of pillar
      const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00cec9 });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(pillar.position);
      glow.position.y = 7.5;
      this.scene.add(glow);
    }
  }

  createCoinChaosArena() {
    this.createDefaultArena();
    
    // Add coin spawners (visual indicators)
    for (let i = 0; i < 5; i++) {
      const spawnerGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16);
      const spawnerMaterial = new THREE.MeshBasicMaterial({ color: 0xfdcb6e });
      const spawner = new THREE.Mesh(spawnerGeometry, spawnerMaterial);
      spawner.rotation.x = Math.PI / 2;
      spawner.position.set(
        (Math.random() - 0.5) * 30,
        10,
        (Math.random() - 0.5) * 30
      );
      this.scene.add(spawner);
    }
  }

  createPlatformPerilArena() {
    // Multiple floating platforms
    this.platforms = [];
    const platformCount = 7;
    
    for (let i = 0; i < platformCount; i++) {
      const size = 3 + Math.random() * 4;
      const geometry = new THREE.BoxGeometry(size, 0.5, size);
      const material = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0x00b894 : 0x6c5ce7,
        metalness: 0.2,
        roughness: 0.8
      });
      const platform = new THREE.Mesh(geometry, material);
      platform.position.set(
        (Math.random() - 0.5) * 25,
        Math.random() * 3,
        (Math.random() - 0.5) * 25
      );
      platform.castShadow = true;
      platform.receiveShadow = true;
      platform.userData = { originalSize: size, shrinking: false };
      this.scene.add(platform);
      this.platforms.push(platform);
    }
  }

  createBumperBallsArena() {
    // Circular arena with edges
    const edgeGeometry = new THREE.TorusGeometry(20, 0.5, 8, 32);
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.25;
    this.scene.add(edge);
  }

  createHotPotatoArena() {
    this.createDefaultArena();
    
    // Hot potato (bomb) mesh - will be attached to players
    const bombGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const bombMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    this.hotPotato = new THREE.Mesh(bombGeometry, bombMaterial);
    this.hotPotato.visible = false;
    this.scene.add(this.hotPotato);
    
    // Fuse
    const fuseGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const fuseMaterial = new THREE.MeshBasicMaterial({ color: 0xf39c12 });
    const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
    fuse.position.y = 0.8;
    this.hotPotato.add(fuse);
  }

  createPlayerMesh() {
    // Create a cute character mesh
    this.playerMesh = new THREE.Group();

    // Prefer CapsuleGeometry when available, otherwise compose from cylinder + spheres
    if (typeof THREE.CapsuleGeometry === 'function') {
      const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        metalness: 0.1,
        roughness: 0.8
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.castShadow = true;
      this.playerMesh.add(body);
    } else {
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x6c5ce7,
        metalness: 0.1,
        roughness: 0.8
      });
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), bodyMaterial.clone());
      cyl.position.y = 1;
      cyl.castShadow = true;
      this.playerMesh.add(cyl);

      const top = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), bodyMaterial.clone());
      top.position.y = 1.6;
      top.castShadow = true;
      this.playerMesh.add(top);

      const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), bodyMaterial.clone());
      bottom.position.y = 0.4;
      bottom.castShadow = true;
      this.playerMesh.add(bottom);
    }
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x2d3436 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.5, 0.4);
    this.playerMesh.add(leftEye);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.2, 1.5, 0.52);
    this.playerMesh.add(leftPupil);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.5, 0.4);
    this.playerMesh.add(rightEye);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.2, 1.5, 0.52);
    this.playerMesh.add(rightPupil);

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

    // Create practice bots if in practice mode
    if (this.isPractice) {
      this.createPracticeBots();
    }

    // Initialize game state
    this.gameState = this.createGameState();
    
    this.startGameLoop();
  }

  createPracticeBots() {
    this.practiceBots = [];
    const botCount = 3;
    
    for (let i = 0; i < botCount; i++) {
      const bot = {
        id: `bot_${i}`,
        username: `Bot ${i + 1}`,
        x: (Math.random() - 0.5) * 20,
        y: 0,
        z: (Math.random() - 0.5) * 20,
        score: 0,
        alive: true,
        ai: {
          targetX: 0,
          targetZ: 0,
          changeTimer: 0
        }
      };
      
      this.practiceBots.push(bot);
      
      // Create bot mesh in 3D
      if (this.is3D) {
        this.createBotMesh(bot);
      }
    }
  }

  createBotMesh(bot) {
    const colors = [0x00cec9, 0xfd79a8, 0xfdcb6e];
    const colorIndex = parseInt(bot.id.split('_')[1]) % colors.length;
    
    let mesh = new THREE.Group();

    // Prefer THREE.CapsuleGeometry when available, otherwise build a composite capsule (cylinder + spheres)
    if (typeof THREE.CapsuleGeometry === 'function') {
      const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        metalness: 0.1,
        roughness: 0.8
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.castShadow = true;
      mesh.add(body);
    } else {
      // Fallback composite capsule
      const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      const sphGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        metalness: 0.1,
        roughness: 0.8
      });

      const cylinder = new THREE.Mesh(cylGeo, bodyMaterial.clone());
      cylinder.position.y = 1;
      cylinder.castShadow = true;
      mesh.add(cylinder);

      const top = new THREE.Mesh(sphGeo, bodyMaterial.clone());
      top.position.y = 1.6;
      top.castShadow = true;
      mesh.add(top);

      const bottom = new THREE.Mesh(sphGeo, bodyMaterial.clone());
      bottom.position.y = 0.4;
      bottom.castShadow = true;
      mesh.add(bottom);
    }
    
    // Eyes (robot style)
    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.1);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.5, 0.45);
    mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.5, 0.45);
    mesh.add(rightEye);
    
    mesh.position.set(bot.x, bot.y, bot.z);
    this.scene.add(mesh);
    this.otherPlayerMeshes.set(bot.id, mesh);
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
        collected: false
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
    const results = document.querySelector('.minigame-results');
    const winner = document.getElementById('minigame-winner');
    const list = document.getElementById('minigame-results-list');

    if (winner) winner.textContent = data.winner?.username || 'No winner';
    
    if (list && data.rankings) {
      list.innerHTML = data.rankings.map((player, index) => `
        <div class="result-row ${index === 0 ? 'winner' : ''}">
          <span class="result-position">${index + 1}</span>
          <span class="result-name">${player.username}</span>
          <span class="result-score">${player.score || 0}</span>
          <span class="result-reward">${player.reward || 0} 🪙</span>
        </div>
      `).join('');
    }

    results?.classList.add('active');

    // Play appropriate sound
    const myRanking = data.rankings?.findIndex(p => p.id === this.app.state.user?.id);
    if (myRanking === 0) {
      this.app.audio.playSFX('minigameWin');
    } else {
      this.app.audio.playSFX('minigameLose');
    }

    // Auto-close after delay
    setTimeout(() => {
      results?.classList.remove('active');
      if (!this.isPractice) {
        this.app.navigateTo('game');
      }
    }, 5000);
  }

  startGameLoop() {
    this.lastTime = performance.now();
    
    const loop = (currentTime) => {
      // Continue loop for tutorials and playing
      if (!this.isPlaying && !this.isTutorial && !this.cinematicPlaying) return;
      
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
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
  }

  // 3D player update with smooth movement physics
  update3DPlayer(delta) {
    const maxSpeed = 12;
    const acceleration = 40;
    const friction = 0.85;
    const gravity = 30;
    const jumpForce = 15;

    // Handle continuous movement input with acceleration
    let accelX = 0, accelZ = 0;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) accelZ = -acceleration;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) accelZ = acceleration;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) accelX = -acceleration;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) accelX = acceleration;
    
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
      // Jump on Space
      if (this.keys['Space'] && !this.playerState.jumpPressed) {
        this.playerState.vy = jumpForce;
        this.playerState.onGround = false;
        this.playerState.jumpPressed = true;
      }
    }
    
    if (!this.keys['Space']) this.playerState.jumpPressed = false;
    
    this.playerState.y += this.playerState.vy * delta;

    // Ground collision
    if (this.playerState.y <= 0) {
      this.playerState.y = 0;
      this.playerState.vy = 0;
      this.playerState.onGround = true;
    }

    // Arena bounds (circular, 18 unit radius)
    const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    if (dist > 18) {
      const scale = 18 / dist;
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
          this.playerState.score++;
          this.app.audio?.playSFX('coin');
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
    // Update camera to follow player slightly
    if (this.camera && this.playerMesh) {
      const targetX = this.playerMesh.position.x * 0.3;
      const targetZ = this.playerMesh.position.z * 0.3 + 25;
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
      this.camera.lookAt(this.playerMesh.position.x * 0.5, 0, this.playerMesh.position.z * 0.5);
    }

    // Animate coins
    this.animateCoins();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Render 2D HUD on top using overlay
    this.renderHUD();
  }

  animateCoins() {
    if (!this.scene || !this.gameState?.coins) return;
    
    const time = performance.now() * 0.001;
    
    this.gameState.coins.forEach(coin => {
      if (coin.collected) return;
      
      let coinMesh = this.scene.getObjectByName(`coin_${coin.id}`);
      
      // Create coin mesh if it doesn't exist
      if (!coinMesh) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const material = new THREE.MeshStandardMaterial({
          color: 0xfdcb6e,
          metalness: 0.8,
          roughness: 0.2
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
    
    // Manage bomb timer
    if (!this.gameState.bombTimer) {
      this.gameState.bombTimer = 30 + Math.random() * 10;
    }
    
    this.gameState.bombTimer -= delta;
    
    if (this.gameState.bombTimer <= 0) {
      this.playerState.alive = false;
      this.playerState.score = Math.max(0, this.playerState.score - 5);
      this.gameState.bombTimer = 30;
    }
    
    // Proximity detection to other players (in practice, check bots)
    if (this.practiceBots && this.practiceBots.length > 0) {
      this.practiceBots.forEach(bot => {
        const dx = this.playerState.x - bot.x;
        const dz = this.playerState.z - bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 2 && this.keys['Space']) {
          // Pass bomb to bot
          this.playerState.score += 1;
          this.gameState.bombTimer = 30;
          this.app.audio?.playSFX('pass');
        }
      });
    }
  }

  // Bumper Balls minigame - knock other players around
  updateBumperBalls(delta) {
    this.update3DPlayer(delta);
    
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
    if (dist > 20) {
      const scale = 20 / dist;
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
    
    // Coins already animated in animateCoins()
    // Add bomb spawning every few seconds if they exist
    if (!this.gameState.bombSpawnTimer) {
      this.gameState.bombSpawnTimer = 3;
    }
    
    this.gameState.bombSpawnTimer -= delta;
    if (this.gameState.bombSpawnTimer <= 0) {
      // Spawn a bomb (just for visual effect in practice mode)
      if (this.isPractice && this.gameState.coins) {
        // Add a special bomb coin
        const bombCoin = {
          id: 'bomb_' + Date.now(),
          x: (Math.random() - 0.5) * 30,
          y: 1,
          z: (Math.random() - 0.5) * 30,
          collected: false,
          isBomb: true
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
    
    // Create platforms if not exists
    if (!this.platforms) {
      this.platforms = [];
      const count = 7;
      for (let i = 0; i < count; i++) {
        this.platforms.push({
          x: (Math.random() - 0.5) * 25,
          z: (Math.random() - 0.5) * 25,
          y: i === 0 ? 0 : 2 + Math.random() * 6,
          width: 4 + Math.random() * 3,
          depth: 4 + Math.random() * 3,
          shrinking: false,
          shrinkAmount: 0,
          shirkingSpeed: 0.3 + Math.random() * 0.2
        });
      }
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
        platform.shrinkAmount += platform.shirkingSpeed * delta;
        platform.width = Math.max(0.5, platform.width - platform.shirkingSpeed * delta);
        platform.depth = Math.max(0.5, platform.depth - platform.shirkingSpeed * delta);
      }
    });

    // Fall off world
    if (this.playerState.y < -5) {
      this.playerState.alive = false;
      this.playerState.score = Math.max(0, this.playerState.score - 1);
    }

    // Arena bounds
    const dist = Math.sqrt(this.playerState.x ** 2 + this.playerState.z ** 2);
    if (dist > 25) {
      const scale = 25 / dist;
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
    // Update timer
    const timerEl = document.getElementById('minigame-timer');
    if (timerEl && this.gameState?.timeLeft !== undefined) {
      timerEl.textContent = Math.ceil(this.gameState.timeLeft);
    }

    // Update scores display
    const scoresEl = document.getElementById('minigame-scores');
    if (scoresEl && this.gameState?.players) {
      scoresEl.innerHTML = this.gameState.players.map(player => `
        <div class="minigame-score-item">
          <span>${player.username}</span>
          <span>${player.score || 0}</span>
        </div>
      `).join('');
    }
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
        const botColors = [0x00cec9, 0xfd79a8, 0xfdcb6e];
        
        for (let i = 0; i < botCount; i++) {
          const bot = {
            id: `bot_${i}`,
            username: botNames[i],
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
    this.practiceBots.forEach(bot => {
      if (!bot.alive) return;

      // Simple AI - move towards random targets
      bot.ai.changeTimer -= delta;
      if (bot.ai.changeTimer <= 0) {
        bot.ai.targetX = (Math.random() - 0.5) * 30;
        bot.ai.targetZ = (Math.random() - 0.5) * 30;
        bot.ai.changeTimer = 2 + Math.random() * 3;
      }

      // Move towards target
      const dx = bot.ai.targetX - bot.x;
      const dz = bot.ai.targetZ - bot.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 0.5) {
        const speed = 5 * delta;
        bot.x += (dx / dist) * speed;
        bot.z += (dz / dist) * speed;
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
            bot.score++;
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
