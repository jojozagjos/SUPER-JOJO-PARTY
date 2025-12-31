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
    
    // Get canvas
    this.canvas = document.getElementById('minigame-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    }

    // Initialize 3D scene
    this.init3DScene();

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

  // 3D player update
  update3DPlayer(delta) {
    const speed = 8 * delta;
    const friction = 0.9;
    const gravity = 20 * delta;

    // Apply input
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.playerState.vz = -speed;
    else if (this.keys['KeyS'] || this.keys['ArrowDown']) this.playerState.vz = speed;
    else this.playerState.vz *= friction;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.playerState.vx = -speed;
    else if (this.keys['KeyD'] || this.keys['ArrowRight']) this.playerState.vx = speed;
    else this.playerState.vx *= friction;

    // Apply velocity
    this.playerState.x += this.playerState.vx;
    this.playerState.z += this.playerState.vz;

    // Apply gravity
    if (!this.playerState.onGround) {
      this.playerState.vy -= gravity;
    }
    this.playerState.y += this.playerState.vy * delta;

    // Ground collision
    if (this.playerState.y <= 0) {
      this.playerState.y = 0;
      this.playerState.vy = 0;
      this.playerState.onGround = true;
    }

    // Arena bounds (circular)
    const dist = Math.sqrt(this.playerState.x * this.playerState.x + this.playerState.z * this.playerState.z);
    if (dist > 18) {
      const scale = 18 / dist;
      this.playerState.x *= scale;
      this.playerState.z *= scale;
    }

    // Update player mesh position
    if (this.playerMesh) {
      this.playerMesh.position.x = this.playerState.x;
      this.playerMesh.position.y = this.playerState.y;
      this.playerMesh.position.z = this.playerState.z;

      // Face movement direction
      if (Math.abs(this.playerState.vx) > 0.01 || Math.abs(this.playerState.vz) > 0.01) {
        const angle = Math.atan2(this.playerState.vx, this.playerState.vz);
        this.playerMesh.rotation.y = angle;
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
          // Remove coin mesh
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

  // Default minigame (simple arena) - 2D
  updateDefaultMinigame(delta) {
    // Handle continuous key input
    const speed = 200 * delta;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.playerState.y -= speed;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.playerState.y += speed;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.playerState.x -= speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.playerState.x += speed;

    // Clamp to canvas bounds
    this.playerState.x = Math.max(20, Math.min(this.canvas.width - 20, this.playerState.x));
    this.playerState.y = Math.max(20, Math.min(this.canvas.height - 20, this.playerState.y));
  }

  renderDefaultMinigame() {
    // Draw arena border
    this.ctx.strokeStyle = '#6c5ce7';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);

    // Draw other players
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        if (player.id === this.app.state.user?.id) return;
        
        this.ctx.fillStyle = '#00cec9';
        this.ctx.beginPath();
        this.ctx.arc(player.x || 100, player.y || 100, 20, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Draw local player
    this.ctx.fillStyle = '#6c5ce7';
    this.ctx.beginPath();
    this.ctx.arc(this.playerState.x, this.playerState.y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.playerState.score}`, 20, 50);
  }

  // Button Bash minigame
  updateButtonBash(delta) {
    // Count tracked on server
  }

  renderButtonBash() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Draw button
    const buttonSize = 100;
    const isPressed = this.mouse.pressed || this.keys['Space'];
    
    this.ctx.fillStyle = isPressed ? '#5541d7' : '#6c5ce7';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, buttonSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Button text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('MASH!', centerX, centerY);

    // Draw player scores
    if (this.gameState?.players) {
      this.gameState.players.forEach((player, index) => {
        const y = 80 + index * 50;
        this.ctx.fillStyle = player.id === this.app.state.user?.id ? '#fdcb6e' : '#ffffff';
        this.ctx.font = '20px Nunito';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${player.username}: ${player.score || 0}`, 50, y);
      });
    }
  }

  // Coin Chaos minigame
  updateCoinChaos(delta) {
    this.updateDefaultMinigame(delta);
    
    // Check coin collection (client-side prediction)
    if (this.gameState?.coins) {
      this.gameState.coins.forEach((coin, index) => {
        const dx = this.playerState.x - coin.x;
        const dy = this.playerState.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
          // Coin collected - server will validate
          this.app.audio.playSFX('coin');
        }
      });
    }
  }

  renderCoinChaos() {
    // Draw arena
    this.ctx.strokeStyle = '#fdcb6e';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);

    // Draw coins
    if (this.gameState?.coins) {
      this.gameState.coins.forEach(coin => {
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.beginPath();
        this.ctx.arc(coin.x, coin.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Coin shine
        this.ctx.fillStyle = '#fff3c4';
        this.ctx.beginPath();
        this.ctx.arc(coin.x - 5, coin.y - 5, 5, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Draw players
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        const isLocal = player.id === this.app.state.user?.id;
        const x = isLocal ? this.playerState.x : player.x;
        const y = isLocal ? this.playerState.y : player.y;
        
        this.ctx.fillStyle = isLocal ? '#6c5ce7' : '#00cec9';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Draw scores
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Coins: ${this.playerState.score}`, 20, 50);
  }

  // Platform Peril minigame
  updatePlatformPeril(delta) {
    const speed = 200 * delta;
    const gravity = 500 * delta;
    
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.playerState.x -= speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.playerState.x += speed;
    
    // Simple gravity
    this.playerState.vy = (this.playerState.vy || 0) + gravity;
    this.playerState.y += this.playerState.vy * delta;
    
    // Ground collision (simplified)
    if (this.playerState.y > this.canvas.height - 50) {
      this.playerState.y = this.canvas.height - 50;
      this.playerState.vy = 0;
      this.playerState.grounded = true;
    }
    
    // Jump
    if ((this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) && this.playerState.grounded) {
      this.playerState.vy = -300;
      this.playerState.grounded = false;
    }
    
    // Clamp X
    this.playerState.x = Math.max(20, Math.min(this.canvas.width - 20, this.playerState.x));
  }

  renderPlatformPeril() {
    // Draw platforms
    if (this.gameState?.platforms) {
      this.ctx.fillStyle = '#16213e';
      this.gameState.platforms.forEach(plat => {
        this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      });
    }

    // Draw danger zone (rising lava)
    const lavaHeight = this.gameState?.lavaHeight || 100;
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(0, this.canvas.height - lavaHeight, this.canvas.width, lavaHeight);

    // Draw players
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        if (!player.alive) return;
        
        const isLocal = player.id === this.app.state.user?.id;
        const x = isLocal ? this.playerState.x : player.x;
        const y = isLocal ? this.playerState.y : player.y;
        
        this.ctx.fillStyle = isLocal ? '#6c5ce7' : '#00cec9';
        this.ctx.fillRect(x - 15, y - 30, 30, 30);
      });
    }
  }

  // Other minigame implementations (simplified versions)
  updateMemoryMatch(delta) {
    // Card flip game - handled by mouse clicks
  }

  renderMemoryMatch() {
    const cards = this.gameState?.cards || [];
    const cols = 4;
    const rows = Math.ceil(cards.length / cols);
    const cardWidth = 80;
    const cardHeight = 100;
    const gap = 20;
    
    const startX = (this.canvas.width - (cols * (cardWidth + gap))) / 2;
    const startY = (this.canvas.height - (rows * (cardHeight + gap))) / 2;

    cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      // Card back or front
      if (card.revealed || card.matched) {
        this.ctx.fillStyle = card.matched ? '#00b894' : '#6c5ce7';
        this.ctx.fillRect(x, y, cardWidth, cardHeight);
        
        // Draw symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(card.symbol || '?', x + cardWidth/2, y + cardHeight/2);
      } else {
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(x, y, cardWidth, cardHeight);
        this.ctx.strokeStyle = '#6c5ce7';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, cardWidth, cardHeight);
      }
    });
  }

  updateBalloonBurst(delta) {
    // Aim and shoot game
  }

  renderBalloonBurst() {
    // Draw balloons
    if (this.gameState?.balloons) {
      this.gameState.balloons.forEach(balloon => {
        if (balloon.popped) return;
        
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
        this.ctx.fillStyle = colors[balloon.color % colors.length];
        this.ctx.beginPath();
        this.ctx.arc(balloon.x, balloon.y, balloon.size || 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Balloon string
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(balloon.x, balloon.y + (balloon.size || 30));
        this.ctx.lineTo(balloon.x, balloon.y + (balloon.size || 30) + 20);
        this.ctx.stroke();
      });
    }

    // Draw crosshair
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouse.x - 15, this.mouse.y);
    this.ctx.lineTo(this.mouse.x + 15, this.mouse.y);
    this.ctx.moveTo(this.mouse.x, this.mouse.y - 15);
    this.ctx.lineTo(this.mouse.x, this.mouse.y + 15);
    this.ctx.stroke();

    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Popped: ${this.playerState.score}`, 20, 50);
  }

  updateHotPotato(delta) {
    this.updateDefaultMinigame(delta);
  }

  renderHotPotato() {
    // Draw arena
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width/2, this.canvas.height/2, 200, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Draw players
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        const isLocal = player.id === this.app.state.user?.id;
        const x = isLocal ? this.playerState.x : player.x;
        const y = isLocal ? this.playerState.y : player.y;
        const hasPotato = player.hasPotato;
        
        this.ctx.fillStyle = hasPotato ? '#e74c3c' : (isLocal ? '#6c5ce7' : '#00cec9');
        this.ctx.beginPath();
        this.ctx.arc(x, y, hasPotato ? 30 : 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (hasPotato) {
          // Draw potato
          this.ctx.fillStyle = '#f1c40f';
          this.ctx.fillText('🥔', x - 10, y - 40);
        }
      });
    }

    // Timer
    const timeLeft = this.gameState?.timer || 10;
    this.ctx.fillStyle = timeLeft < 3 ? '#e74c3c' : '#ffffff';
    this.ctx.font = 'bold 48px Nunito';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(timeLeft.toFixed(1), this.canvas.width/2, 60);
  }

  updateMazeRace(delta) {
    this.updateDefaultMinigame(delta);
  }

  renderMazeRace() {
    // Draw maze walls
    if (this.gameState?.walls) {
      this.ctx.fillStyle = '#16213e';
      this.gameState.walls.forEach(wall => {
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      });
    }

    // Draw goal
    if (this.gameState?.goal) {
      this.ctx.fillStyle = '#fdcb6e';
      this.ctx.fillRect(this.gameState.goal.x, this.gameState.goal.y, 40, 40);
      this.ctx.fillText('🏁', this.gameState.goal.x + 5, this.gameState.goal.y + 30);
    }

    // Draw players
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        const isLocal = player.id === this.app.state.user?.id;
        const x = isLocal ? this.playerState.x : player.x;
        const y = isLocal ? this.playerState.y : player.y;
        
        this.ctx.fillStyle = isLocal ? '#6c5ce7' : '#00cec9';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }
  }

  updateTargetPractice(delta) {
    // Aim and timing game
  }

  renderTargetPractice() {
    // Draw targets
    if (this.gameState?.targets) {
      this.gameState.targets.forEach(target => {
        if (target.hit) return;
        
        // Target rings
        const rings = [target.size, target.size * 0.7, target.size * 0.4];
        const colors = ['#e74c3c', '#ffffff', '#e74c3c'];
        
        rings.forEach((size, i) => {
          this.ctx.fillStyle = colors[i];
          this.ctx.beginPath();
          this.ctx.arc(target.x, target.y, size, 0, Math.PI * 2);
          this.ctx.fill();
        });
      });
    }

    // Crosshair
    this.ctx.strokeStyle = '#00cec9';
    this.ctx.lineWidth = 2;
    const size = 20;
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouse.x - size, this.mouse.y);
    this.ctx.lineTo(this.mouse.x + size, this.mouse.y);
    this.ctx.moveTo(this.mouse.x, this.mouse.y - size);
    this.ctx.lineTo(this.mouse.x, this.mouse.y + size);
    this.ctx.arc(this.mouse.x, this.mouse.y, size * 0.8, 0, Math.PI * 2);
    this.ctx.stroke();

    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.playerState.score}`, 20, 50);
  }

  updateRhythmRumble(delta) {
    // Rhythm game - timed inputs
  }

  renderRhythmRumble() {
    const trackWidth = 100;
    const numTracks = 4;
    const startX = (this.canvas.width - numTracks * trackWidth) / 2;
    const hitZoneY = this.canvas.height - 100;

    // Draw tracks
    for (let i = 0; i < numTracks; i++) {
      const x = startX + i * trackWidth;
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(x, 0, trackWidth - 10, this.canvas.height);
      
      // Hit zone
      this.ctx.fillStyle = '#6c5ce7';
      this.ctx.fillRect(x, hitZoneY - 20, trackWidth - 10, 40);
    }

    // Draw notes
    if (this.gameState?.notes) {
      this.gameState.notes.forEach(note => {
        const x = startX + note.track * trackWidth + (trackWidth - 10) / 2;
        
        this.ctx.fillStyle = note.hit ? '#00b894' : '#fdcb6e';
        this.ctx.beginPath();
        this.ctx.arc(x - 5, note.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Key indicators
    const keys = ['A', 'S', 'D', 'F'];
    keys.forEach((key, i) => {
      const x = startX + i * trackWidth + (trackWidth - 10) / 2;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px Nunito';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(key, x - 5, hitZoneY);
    });

    // Combo
    this.ctx.fillStyle = '#fdcb6e';
    this.ctx.font = 'bold 32px Nunito';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.gameState?.combo || 0}x`, this.canvas.width / 2, 50);
  }

  updateIceSkating(delta) {
    // Slippery movement
    const acceleration = 300 * delta;
    const friction = 0.98;
    
    this.playerState.vx = this.playerState.vx || 0;
    this.playerState.vy = this.playerState.vy || 0;
    
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.playerState.vx -= acceleration;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.playerState.vx += acceleration;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.playerState.vy -= acceleration;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.playerState.vy += acceleration;
    
    // Apply friction
    this.playerState.vx *= friction;
    this.playerState.vy *= friction;
    
    // Update position
    this.playerState.x += this.playerState.vx * delta;
    this.playerState.y += this.playerState.vy * delta;
    
    // Clamp
    this.playerState.x = Math.max(20, Math.min(this.canvas.width - 20, this.playerState.x));
    this.playerState.y = Math.max(20, Math.min(this.canvas.height - 20, this.playerState.y));
  }

  renderIceSkating() {
    // Ice rink
    this.ctx.fillStyle = '#add8e6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Ice pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }

    // Collectibles
    if (this.gameState?.collectibles) {
      this.gameState.collectibles.forEach(item => {
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.beginPath();
        this.ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Players with trails
    if (this.gameState?.players) {
      this.gameState.players.forEach(player => {
        const isLocal = player.id === this.app.state.user?.id;
        const x = isLocal ? this.playerState.x : player.x;
        const y = isLocal ? this.playerState.y : player.y;
        
        // Trail
        this.ctx.strokeStyle = isLocal ? 'rgba(108, 92, 231, 0.3)' : 'rgba(0, 206, 201, 0.3)';
        this.ctx.lineWidth = 3;
        if (player.trail) {
          this.ctx.beginPath();
          player.trail.forEach((point, i) => {
            if (i === 0) this.ctx.moveTo(point.x, point.y);
            else this.ctx.lineTo(point.x, point.y);
          });
          this.ctx.stroke();
        }
        
        // Player
        this.ctx.fillStyle = isLocal ? '#6c5ce7' : '#00cec9';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    // Score
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.font = 'bold 24px Nunito';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.playerState.score}`, 20, 40);
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
        
        // Navigate to minigame screen
        this.app.navigateTo('minigame', { minigame: data.minigame, practice: true });
        
        // Initialize the minigame after navigation
        setTimeout(() => {
          this.initMinigame({ minigame: data.minigame, practice: true });
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
