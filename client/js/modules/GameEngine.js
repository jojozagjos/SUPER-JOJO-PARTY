/**
 * Super JoJo Party - Game Engine
 * Handles 3D rendering, board visualization, and gameplay
 */

export class GameEngine {
  constructor(app) {
    this.app = app;
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Texture cache and loader
    this.textureCache = new Map();
    this.textureLoader = null;
    
    // Game state
    this.gameState = null;
    this.players = [];
    this.currentPlayer = null;
    this.boardData = null;
    this.spaces = [];
    this.playerMeshes = new Map();
    
    // Animation
    this.animationQueue = [];
    this.isAnimating = false;
    this.clock = null;
    
    // Settings
    this.quality = 'high';
    this.particlesEnabled = true;
    
    // Particle systems
    this.particles = [];
  }

  initGame(data) {
    this.gameState = data.gameState || data.game;
    this.players = data.players || this.gameState?.players;
    this.boardData = data.board || this.gameState?.board;
    this.showedBoardIntro = false;
    
    this.initThreeJS();
    this.createBoard();
    this.createPlayers();
    this.setupCamera();
    this.startGameLoop();
    this.updateHUD();
    
    // Show board intro cinematic first, then start the game
    this.showBoardIntro();
  }

  showBoardIntro() {
    const boardId = this.gameState?.boardId || this.boardData?.id;
    const boardName = this.getBoardDisplayName(boardId);
    
    // Create board intro overlay
    const overlay = document.createElement('div');
    overlay.id = 'board-intro-overlay';
    overlay.className = 'board-intro-overlay';
    
    const boardFeatures = this.getBoardFeatures(boardId);
    
    overlay.innerHTML = `
      <div class="board-intro-container">
        <div class="board-intro-title">
          <h1>Welcome to</h1>
          <h2 class="board-name">${boardName}</h2>
        </div>
        
        <div class="board-intro-content">
          <div class="board-features">
            <h3>Board Features</h3>
            <ul class="feature-list">
              ${boardFeatures.map(f => `
                <li class="feature-item">
                  <span class="feature-icon">${f.icon}</span>
                  <span class="feature-text">${f.text}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          
          <div class="board-intro-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">${this.getBoardTip(boardId)}</span>
          </div>
        </div>
        
        <div class="board-intro-actions">
          <button class="btn btn-secondary" id="skip-intro-btn">Skip</button>
          <button class="btn btn-primary btn-large" id="watch-tour-btn">🎬 Watch Board Tour</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
    
    // Button handlers
    document.getElementById('skip-intro-btn')?.addEventListener('click', () => {
      this.closeBoardIntro();
    });
    
    document.getElementById('watch-tour-btn')?.addEventListener('click', () => {
      this.playBoardTour();
    });
  }

  getBoardDisplayName(boardId) {
    const names = {
      'tropical_paradise': 'Tropical Paradise',
      'crystal_caves': 'Crystal Caves',
      'haunted_manor': 'Haunted Manor',
      'sky_kingdom': 'Sky Kingdom'
    };
    return names[boardId] || boardId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown Board';
  }

  getBoardFeatures(boardId) {
    const features = {
      'tropical_paradise': [
        { icon: '🌊', text: 'Tide Mechanics - Paths change every 3 turns!' },
        { icon: '🥥', text: 'Coconut Grove - Get surprise coin gifts' },
        { icon: '🌴', text: 'Hidden shortcuts through the jungle' },
        { icon: '🏝️', text: 'Lucky Lagoon - Bonus rewards await' }
      ],
      'crystal_caves': [
        { icon: '💎', text: 'Crystal Spaces - Random bonus coins or items' },
        { icon: '🔮', text: 'Amethyst Hall - Special trading zone' },
        { icon: '⛏️', text: 'Minecart shortcuts between areas' },
        { icon: '🌟', text: 'Emerald Chamber - Rare item finds' }
      ],
      'haunted_manor': [
        { icon: '👻', text: 'Ghost Spaces - Coins can be stolen!' },
        { icon: '🏚️', text: 'Secret passages through the manor' },
        { icon: '🔮', text: 'Séance Room - Player positions may shuffle' },
        { icon: '⚰️', text: 'Crypt shortcuts with risky rewards' }
      ],
      'sky_kingdom': [
        { icon: '💨', text: 'Wind Gusts - Get blown extra spaces!' },
        { icon: '🌈', text: 'Rainbow Bridge connections' },
        { icon: '☁️', text: 'Cloud platforms that move' },
        { icon: '⚡', text: 'Thunder Pit - Risky but rewarding' }
      ]
    };
    return features[boardId] || [
      { icon: '⭐', text: 'Collect stars to win!' },
      { icon: '💰', text: 'Earn coins in minigames' },
      { icon: '🎲', text: 'Roll dice to move around' },
      { icon: '🎁', text: 'Use items for advantages' }
    ];
  }

  getBoardTip(boardId) {
    const tips = {
      'tropical_paradise': 'Watch the tide timer! Plan your route when paths are about to change.',
      'crystal_caves': 'Crystal spaces can give you great rewards - take risks!',
      'haunted_manor': 'Ghosts are dangerous but avoidable. Learn the safe paths!',
      'sky_kingdom': 'Use the wind to your advantage - it can help or hurt!'
    };
    return tips[boardId] || 'Explore the board and discover its secrets!';
  }

  playBoardTour() {
    // Close the intro modal
    const overlay = document.getElementById('board-intro-overlay');
    if (overlay) {
      overlay.querySelector('.board-intro-container').style.display = 'none';
    }
    
    // Show tour indicator
    const tourUI = document.createElement('div');
    tourUI.id = 'board-tour-ui';
    tourUI.className = 'board-tour-ui';
    tourUI.innerHTML = `
      <div class="tour-progress">
        <span class="tour-step">Tour: <span id="tour-step-num">1</span>/4</span>
        <button class="btn btn-sm" id="skip-tour-btn">Skip Tour</button>
      </div>
      <div class="tour-description" id="tour-description">
        Starting the board tour...
      </div>
    `;
    document.body.appendChild(tourUI);
    
    document.getElementById('skip-tour-btn')?.addEventListener('click', () => {
      this.skipBoardTour();
    });
    
    // Start cinematic camera tour
    this.startCameraTour();
  }

  startCameraTour() {
    const boardId = this.gameState?.boardId || this.boardData?.id;
    const tourPoints = this.getTourPoints(boardId);
    
    let currentStep = 0;
    
    const nextStep = () => {
      if (currentStep >= tourPoints.length) {
        this.endBoardTour();
        return;
      }
      
      const point = tourPoints[currentStep];
      const stepNum = document.getElementById('tour-step-num');
      const description = document.getElementById('tour-description');
      
      if (stepNum) stepNum.textContent = currentStep + 1;
      if (description) description.textContent = point.description;
      
      // Animate camera to this point
      this.animateCameraTo(point.position, point.lookAt, 2000, () => {
        // Hold for a moment
        setTimeout(() => {
          currentStep++;
          nextStep();
        }, 2000);
      });
    };
    
    nextStep();
  }

  getTourPoints(boardId) {
    // Generic tour points - can be customized per board
    return [
      {
        position: { x: 0, y: 60, z: 0 },
        lookAt: { x: 0, y: 0, z: 0 },
        description: 'This is the full board overview. Plan your route carefully!'
      },
      {
        position: { x: -20, y: 20, z: 20 },
        lookAt: { x: 0, y: 0, z: 0 },
        description: 'Blue spaces give you 3 coins. Red spaces take 3 coins away!'
      },
      {
        position: { x: 20, y: 15, z: -10 },
        lookAt: { x: 10, y: 0, z: -5 },
        description: 'Event spaces trigger special happenings - good or bad!'
      },
      {
        position: { x: 0, y: 30, z: 40 },
        lookAt: { x: 0, y: 0, z: 0 },
        description: 'Stars appear randomly. Buy them for 20 coins when you pass!'
      }
    ];
  }

  animateCameraTo(targetPos, lookAtPos, duration, onComplete) {
    const startPos = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      this.camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
      this.camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
      this.camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
      
      this.camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    
    animate();
  }

  skipBoardTour() {
    this.endBoardTour();
  }

  endBoardTour() {
    // Remove tour UI
    const tourUI = document.getElementById('board-tour-ui');
    if (tourUI) tourUI.remove();
    
    // Close intro overlay
    this.closeBoardIntro();
  }

  closeBoardIntro() {
    const overlay = document.getElementById('board-intro-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    }
    
    this.showedBoardIntro = true;
    
    // Now play the regular intro animation
    this.playIntroAnimation();
    
    // Notify server that player is ready
    this.app.socket.socket.emit('game:ready', (response) => {
      if (!response.success) {
        console.warn('Failed to signal game ready:', response.error);
      }
    });
  }

  initThreeJS() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Game canvas not found');
      return;
    }

    // Initialize texture loader
    this.textureLoader = new THREE.TextureLoader();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 40);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality !== 'low',
      alpha: true
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(this.quality === 'high' ? window.devicePixelRatio : 1);
    this.renderer.shadowMap.enabled = this.quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.setupLighting();

    // Clock for animations
    this.clock = new THREE.Clock();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x6C5CE7, 0.5);
    this.scene.add(ambient);

    // Main directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(30, 50, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = this.quality === 'high' ? 2048 : 1024;
    sun.shadow.mapSize.height = this.quality === 'high' ? 2048 : 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);

    // Secondary light for fill
    const fill = new THREE.DirectionalLight(0x00CEC9, 0.3);
    fill.position.set(-20, 20, -20);
    this.scene.add(fill);

    // Point lights for board highlights
    const boardLight = new THREE.PointLight(0xFDCB6E, 0.5, 50);
    boardLight.position.set(0, 10, 0);
    this.scene.add(boardLight);
  }

  createBoard() {
    if (!this.boardData) return;

    // Create board base
    const boardGeometry = new THREE.CircleGeometry(40, 64);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x16213E,
      roughness: 0.8,
      metalness: 0.2
    });
    const boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
    boardMesh.rotation.x = -Math.PI / 2;
    boardMesh.receiveShadow = true;
    this.scene.add(boardMesh);

    // Create spaces
    this.boardData.spaces?.forEach((space, index) => {
      const spaceMesh = this.createSpace(space, index);
      this.spaces.push({ mesh: spaceMesh, data: space });
      this.scene.add(spaceMesh);
    });

    // Create paths between spaces
    this.createPaths();

    // Add decorative elements
    this.addBoardDecorations();
  }

  createSpace(space, index) {
    const colors = {
      BLUE: 0x4A90D9,
      RED: 0xE74C3C,
      EVENT: 0x9B59B6,
      SHOP: 0xF39C12,
      VS: 0xE91E63,
      STAR: 0xFFD700,
      OVERSEER: 0x2C3E50,
      START: 0x00B894
    };

    const color = colors[space.type] || 0x808080;
    
    // Create hexagonal space
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 6);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(space.position.x, 0.15, space.position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { spaceIndex: index, spaceData: space };

    // Add glow ring for star space
    if (space.type === 'STAR') {
      const ringGeometry = new THREE.TorusGeometry(1.8, 0.1, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.2;
      mesh.add(ring);

      // Add floating star
      const starGeometry = new THREE.OctahedronGeometry(0.5);
      const starMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5
      });
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.y = 2;
      star.userData.isFloating = true;
      mesh.add(star);
    }

    // Add icon indicator
    if (space.type === 'SHOP') {
      this.addSpaceIndicator(mesh, '🏪');
    } else if (space.type === 'OVERSEER') {
      this.addSpaceIndicator(mesh, '👁️');
    } else if (space.type === 'EVENT') {
      this.addSpaceIndicator(mesh, '❓');
    } else if (space.type === 'VS') {
      this.addSpaceIndicator(mesh, '⚔️');
    }

    return mesh;
  }

  addSpaceIndicator(parentMesh, emoji) {
    // Create sprite with emoji texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.y = 1.5;
    sprite.scale.set(1.5, 1.5, 1);
    parentMesh.add(sprite);
  }

  createPaths() {
    if (!this.boardData.spaces) return;

    const material = new THREE.MeshStandardMaterial({
      color: 0x444466,
      roughness: 0.8
    });

    this.boardData.spaces.forEach((space, index) => {
      space.connections?.forEach(connIndex => {
        const nextSpace = this.boardData.spaces[connIndex];
        if (!nextSpace || connIndex <= index) return;

        const start = new THREE.Vector3(space.position.x, 0.05, space.position.z);
        const end = new THREE.Vector3(nextSpace.position.x, 0.05, nextSpace.position.z);
        
        const distance = start.distanceTo(end);
        const geometry = new THREE.BoxGeometry(0.5, 0.1, distance);
        const path = new THREE.Mesh(geometry, material);
        
        path.position.copy(start).add(end).multiplyScalar(0.5);
        path.lookAt(end);
        path.rotation.x = 0;
        path.receiveShadow = true;
        
        this.scene.add(path);
      });
    });
  }

  addBoardDecorations() {
    // Add some floating particles/decorations around the board
    if (!this.particlesEnabled) return;

    const particleCount = this.quality === 'high' ? 100 : 50;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 20 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData.isParticle = true;
    this.scene.add(particles);
    this.particles.push(particles);
  }

  createPlayers() {
    this.players.forEach((player, index) => {
      const mesh = this.createPlayerMesh(player, index);
      this.playerMeshes.set(player.id, mesh);
      this.scene.add(mesh);

      // Position at start or current space
      const spaceIndex = player.position || 0;
      const space = this.boardData.spaces?.[spaceIndex];
      if (space) {
        mesh.position.set(
          space.position.x + (index - 1.5) * 0.5,
          0.8,
          space.position.z
        );
      }
    });
  }

  createPlayerMesh(player, index) {
    const colors = [0x6C5CE7, 0x00CEC9, 0xFDCB6E, 0xFF6B6B];
    const color = colors[index % colors.length] || 0x6C5CE7;

    // Create character group (for positioning/animation)
    const group = new THREE.Group();

    // Create a 2D character sprite (billboard) with a cute emoji/simple character
    const charSprite = this.createCharacterSprite(player.username, color);
    charSprite.position.y = 0;
    group.add(charSprite);

    // Add shadow plane under the character
    const shadowGeometry = new THREE.PlaneGeometry(0.6, 0.3);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    group.add(shadow);

    group.userData = { playerId: player.id, playerData: player, sprite: charSprite };
    
    return group;
  }

  createCharacterSprite(username, color) {
    // Create a 2D character sprite with simple, cute style
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Character body color
    const colorStr = `#${color.toString(16).padStart(6, '0')}`;

    // Draw simple cute character
    // Head
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(128, 100, 60, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = colorStr;
    ctx.fillRect(80, 160, 96, 140);
    ctx.fillRect(70, 300, 116, 80);

    // Arms
    ctx.fillRect(40, 180, 40, 100);
    ctx.fillRect(176, 180, 40, 100);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(110, 80, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(146, 80, 12, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(128, 110, 25, 0, Math.PI);
    ctx.stroke();

    // Username text at bottom
    ctx.fillStyle = colorStr;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillText(username.slice(0, 15), 128, 420);

    // Create sprite from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    // Scale sprite to be taller than wide (character-like proportions)
    sprite.scale.set(0.6, 1.2, 1);
    
    return sprite;
  }

  createNameTag(name, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.roundRect(0, 0, 256, 64, 16);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 12), 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    
    return sprite;
  }

  setupCamera() {
    // Look at board center
    this.camera.lookAt(0, 0, 0);
  }

  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = this.clock.getDelta();
      
      this.updateAnimations(delta);
      this.updateParticles(delta);
      this.render();
    };
    
    animate();
  }

  updateAnimations(delta) {
    // Animate floating elements
    this.scene.traverse(obj => {
      if (obj.userData?.isFloating) {
        obj.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.3;
        obj.rotation.y += delta;
      }
    });

    // Process animation queue
    if (this.animationQueue.length > 0 && !this.isAnimating) {
      const anim = this.animationQueue.shift();
      this.playAnimation(anim);
    }
  }

  updateParticles(delta) {
    this.particles.forEach(particle => {
      particle.rotation.y += delta * 0.1;
      
      const positions = particle.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
      }
      particle.geometry.attributes.position.needsUpdate = true;
    });
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  handleResize() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !this.camera || !this.renderer) return;

    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  playIntroAnimation() {
    // Camera fly-in animation
    const startPos = { x: 0, y: 80, z: 80 };
    const endPos = { x: 0, y: 30, z: 40 };
    
    this.camera.position.set(startPos.x, startPos.y, startPos.z);
    
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      this.camera.position.x = startPos.x + (endPos.x - startPos.x) * eased;
      this.camera.position.y = startPos.y + (endPos.y - startPos.y) * eased;
      this.camera.position.z = startPos.z + (endPos.z - startPos.z) * eased;
      this.camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Game event handlers
  onGameState(data) {
    this.gameState = data;
    this.updateHUD();
  }

  onPhaseChanged(data) {
    this.gameState = data.game;
    this.updateHUD();
    
    // Handle phase-specific actions
    const phase = data.newPhase;
    const currentPlayer = this.gameState?.players?.[this.gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === this.app.state.user?.id;
    
    if (phase === 'turn_start' && isMyTurn) {
      this.app.ui.showToast("It's your turn!", 'info');
    } else if (phase === 'dice_roll' && isMyTurn) {
      this.showDiceModal();
    } else if (phase === 'minigame_intro') {
      // Minigame is about to start
      this.app.ui.showToast('Minigame time!', 'info');
    }
  }

  onTurnStart(data) {
    this.currentPlayer = data.playerId;
    this.updateHUD();
    
    // Focus camera on current player
    const playerMesh = this.playerMeshes.get(data.playerId);
    if (playerMesh) {
      this.focusCamera(playerMesh.position);
    }

    // Show turn indicator
    const isMyTurn = data.playerId === this.app.state.user?.id;
    if (isMyTurn) {
      this.app.ui.showToast("It's your turn!", 'info');
      this.showDiceModal();
    }
  }

  onStarOffer(data) {
    const isMyTurn = data.playerId === this.app.state.user?.id;
    if (isMyTurn) {
      this.showStarModal(data);
    }
  }

  onStarPurchased(data) {
    this.app.audio.playSFX('starGet');
    this.showStarAnimation(data.playerId);
    
    // Update player data
    const player = this.players.find(p => p.id === data.playerId);
    if (player) {
      player.stars = data.newStars;
      player.coins = data.newCoins;
    }
    
    this.app.ui.showToast(`${player?.username || 'Player'} got a star!`, 'success');
    this.updateHUD();
  }

  onItemPurchased(data) {
    this.app.audio.playSFX('itemGet');
    
    const player = this.players.find(p => p.id === data.playerId);
    if (player) {
      player.item = data.itemId;
      player.coins = data.newCoins;
    }
    
    this.app.ui.showToast(`${player?.username || 'Player'} bought an item!`, 'info');
    this.updateHUD();
  }

  onOverseerEncounter(data) {
    this.showOverseerModal({ dialogue: "The Overseer spins the wheel of fate..." });
  }

  onOverseerResult(data) {
    const player = this.players.find(p => p.id === data.playerId);
    this.app.ui.showToast(`${data.result}: ${player?.username || 'Player'}`, 'info');
    
    // Update affected players
    if (data.affectedPlayers) {
      data.affectedPlayers.forEach(affected => {
        const p = this.players.find(pl => pl.id === affected.id);
        if (p) {
          p.coins = affected.coins;
          p.stars = affected.stars;
        }
      });
    }
    
    this.updateHUD();
  }

  onMinigameSelected(data) {
    this.app.ui.showToast(`Next minigame: ${data.minigame.name}!`, 'info');
    
    // Navigate to minigame screen after a delay
    setTimeout(() => {
      this.app.navigateTo('minigame', { minigame: data.minigame, teams: data.teams });
    }, 2000);
  }  onTurnStart(data) {
    this.currentPlayer = data.playerId;
    this.updateHUD();
    
    // Focus camera on current player
    const playerMesh = this.playerMeshes.get(data.playerId);
    if (playerMesh) {
      this.focusCamera(playerMesh.position);
    }

    // Show turn indicator
    const isMyTurn = data.playerId === this.app.state.user?.id;
    if (isMyTurn) {
      this.app.ui.showToast("It's your turn!", 'info');
      this.showDiceModal();
    }
  }

  onDiceResult(data) {
    this.app.audio.playDiceRoll();
    
    // Update dice display
    const diceEl = document.getElementById('dice-value');
    if (diceEl) {
      const dice = document.querySelector('.dice');
      dice?.classList.add('rolling');
      
      let rolls = 0;
      const rollInterval = setInterval(() => {
        diceEl.textContent = Math.floor(Math.random() * 10) + 1;
        rolls++;
        
        if (rolls >= 15) {
          clearInterval(rollInterval);
          dice?.classList.remove('rolling');
          diceEl.textContent = data.result;
          
          // Hide dice modal after delay
          setTimeout(() => {
            this.hideDiceModal();
          }, 1000);
        }
      }, 100);
    }
  }

  onPlayerMoved(data) {
    const playerMesh = this.playerMeshes.get(data.playerId);
    if (!playerMesh) return;

    // Animate movement through each space
    this.animatePlayerMovement(playerMesh, data.path, () => {
      // Update player data
      const player = this.players.find(p => p.id === data.playerId);
      if (player) {
        player.position = data.finalPosition;
        player.coins = data.coins;
      }
      this.updateHUD();
    });
  }

  animatePlayerMovement(mesh, path, onComplete) {
    if (!path || path.length === 0) {
      onComplete?.();
      return;
    }

    this.isAnimating = true;
    let currentIndex = 0;

    const moveToNext = () => {
      if (currentIndex >= path.length) {
        this.isAnimating = false;
        onComplete?.();
        return;
      }

      const spaceIndex = path[currentIndex];
      const space = this.boardData.spaces?.[spaceIndex];
      
      if (!space) {
        currentIndex++;
        moveToNext();
        return;
      }

      const targetPos = new THREE.Vector3(space.position.x, 0.8, space.position.z);
      const startPos = mesh.position.clone();
      const duration = 300;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutCubic(progress);

        // Hop animation
        const hopHeight = Math.sin(progress * Math.PI) * 0.5;
        
        mesh.position.lerpVectors(startPos, targetPos, eased);
        mesh.position.y = 0.8 + hopHeight;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.app.audio.playSFX('moveStep');
          currentIndex++;
          moveToNext();
        }
      };

      animate();
    };

    moveToNext();
  }

  onSpaceEvent(data) {
    const eventHandlers = {
      blue: () => {
        this.showCoinEvent(data.coinsChange || 3, true);
        this.app.audio.playSFX('blueSpace');
      },
      red: () => {
        this.showCoinEvent(Math.abs(data.coinsChange) || 3, false);
        this.app.audio.playSFX('redSpace');
      },
      event: () => {
        this.showEventModal(data.event || { name: data.eventName, description: data.message });
        this.app.audio.playSFX('eventSpace');
      },
      star: () => this.showStarModal(data),
      shop: () => this.showShopModal(data.items || []),
      overseer: () => this.showOverseerModal(data),
      vs: () => this.showVSModal(data),
      lucky: () => {
        this.showLuckyModal(data);
        this.app.audio.playSFX('luckySpace');
      },
      bowser: () => {
        this.showBowserModal(data);
        this.app.audio.playSFX('bowserSpace');
      }
    };

    const handler = eventHandlers[data.type?.toLowerCase()] || eventHandlers[data.type];
    if (handler) handler();
  }

  showLuckyModal(data) {
    // Create a modal for lucky space events
    const modal = document.getElementById('event-modal') || this.createModal('event-modal');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-description');
    
    if (title) title.textContent = '🍀 Lucky Space!';
    if (desc) desc.textContent = data.message || `${data.eventName}`;
    
    if (modal) {
      modal.classList.add('active', 'lucky-event');
      
      // Show coins/stars gained
      if (data.coinsChange) {
        this.app.ui.showToast(`+${data.coinsChange} coins!`, 'success');
      }
      if (data.starsChange) {
        this.app.ui.showToast(`+${data.starsChange} stars!`, 'success');
        this.app.audio.playSFX('starGain');
      }
      
      setTimeout(() => {
        modal.classList.remove('active', 'lucky-event');
      }, 3000);
    }
  }

  showBowserModal(data) {
    // Create a modal for bowser space events
    const modal = document.getElementById('event-modal') || this.createModal('event-modal');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-description');
    
    if (title) title.textContent = '🔥 Bowser Space!';
    if (desc) desc.textContent = data.message || `${data.eventName}`;
    
    if (modal) {
      modal.classList.add('active', 'bowser-event');
      
      // Show coins/stars lost
      if (data.coinsChange) {
        this.app.ui.showToast(`${data.coinsChange} coins!`, 'error');
        this.app.audio.playSFX('coinLoss');
      }
      if (data.starsChange) {
        this.app.ui.showToast(`${data.starsChange} stars!`, 'error');
        this.app.audio.playSFX('starLoss');
      }
      
      setTimeout(() => {
        modal.classList.remove('active', 'bowser-event');
      }, 3000);
    }
  }

  // Handle Last 5 Turns event
  onLast5Turns(data) {
    this.app.ui.showToast(`⚠️ ${data.event.name}`, 'warning');
    
    // Show full-screen announcement
    const overlay = document.createElement('div');
    overlay.className = 'last5-overlay';
    overlay.innerHTML = `
      <div class="last5-content">
        <h1>⚡ FINAL 5 TURNS! ⚡</h1>
        <h2>${data.event.name}</h2>
        <p>${data.event.description}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 500);
    }, 4000);
  }

  // Duel handlers
  onDuelInitiated(data) {
    this.app.ui.showToast(`${data.challengerName} challenges ${data.targetName} to a duel!`, 'info');
    
    // Show duel modal
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-description');
    
    if (title) title.textContent = '🥊 DUEL!';
    if (desc) desc.textContent = `${data.challengerName} vs ${data.targetName}\n${data.coinsAtStake} coins at stake!`;
    
    if (modal) {
      modal.classList.add('active', 'duel-event');
      setTimeout(() => modal.classList.remove('active', 'duel-event'), 3000);
    }
  }

  onDuelMinigameStarted(data) {
    this.app.ui.showToast('Duel minigame starting!', 'info');
  }

  onDuelResolved(data) {
    const message = `${data.winnerName} wins the duel! ${data.coinsTransferred} coins transferred!`;
    this.app.ui.showToast(message, 'info');
    
    // Update player coins
    const winner = this.players.find(p => p.id === data.winnerId);
    const loser = this.players.find(p => p.id === data.loserId);
    if (winner) winner.coins = data.newWinnerCoins;
    if (loser) loser.coins = data.newLoserCoins;
    
    this.updateHUD();
  }

  onItemUsed(data) {
    this.app.ui.showToast(`${data.username} used ${data.itemName}!`, 'info');
    this.app.audio.playSFX('itemGet');
    
    // Update player data
    const player = this.players.find(p => p.id === data.playerId);
    if (player) {
      player.items = data.remainingItems;
    }
  }

  onStarEvent(data) {
    if (data.purchased) {
      this.app.audio.playStar();
      this.showStarAnimation(data.playerId);
    }
  }

  onShopOpened(data) {
    this.showShopModal(data.items);
  }

  onOverseerEvent(data) {
    this.showOverseerModal(data);
  }

  onVSEvent(data) {
    this.showVSModal(data);
  }

  onTurnEnd(data) {
    this.updateHUD();
  }

  onRoundEnd(data) {
    // Update all player data
    this.players = data.players;
    this.gameState.round = data.round;
    this.updateHUD();
  }

  // UI updates
  updateHUD() {
    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator && this.gameState) {
      turnIndicator.textContent = `Turn ${this.gameState.turn || 1}/${this.gameState.totalTurns || 10}`;
    }

    // Update phase indicator
    const phaseIndicator = document.getElementById('phase-indicator');
    if (phaseIndicator && this.gameState) {
      const phaseNames = {
        INTRO: 'Game Start',
        TURN_START: 'Turn Start',
        ITEM_USE: 'Item Phase',
        DICE_ROLL: 'Dice Roll',
        MOVING: 'Moving',
        SPACE_EVENT: 'Space Event',
        MINIGAME_INTRO: 'Minigame',
        MINIGAME: 'Playing',
        TURN_END: 'Turn End',
        GAME_END: 'Game Over'
      };
      phaseIndicator.textContent = phaseNames[this.gameState.phase] || this.gameState.phase;
    }

    // Update player cards
    const playerCards = document.getElementById('hud-players');
    if (playerCards && this.players) {
      playerCards.innerHTML = this.players.map(player => `
        <div class="player-card ${player.id === this.currentPlayer ? 'active' : ''}">
          <div class="card-avatar">${player.character?.icon || '👤'}</div>
          <div class="card-info">
            <div class="card-name">${player.username}</div>
            <div class="card-stats">
              <span class="stat-coins">🪙 ${player.coins || 0}</span>
              <span class="stat-stars">⭐ ${player.stars || 0}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Modal methods
  showDiceModal() {
    const modal = document.getElementById('dice-modal');
    if (modal) {
      modal.classList.add('active');
      
      const rollBtn = document.getElementById('roll-dice-btn');
      rollBtn?.addEventListener('click', () => {
        this.app.socket.socket.emit('game:rollDice', (response) => {
          if (!response.success) {
            this.app.ui.showToast(response.error || 'Failed to roll dice', 'error');
          }
        });
        rollBtn.disabled = true;
      }, { once: true });
    }
  }

  hideDiceModal() {
    const modal = document.getElementById('dice-modal');
    if (modal) modal.classList.remove('active');
  }

  showCoinEvent(amount, isGain) {
    if (isGain) {
      this.app.audio.playCoin(amount);
      this.app.ui.showToast(`+${amount} coins!`, 'success');
    } else {
      this.app.audio.playSFX('redSpace');
      this.app.ui.showToast(`-${amount} coins!`, 'error');
    }
  }

  showEventModal(event) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-description');
    
    if (modal && title && desc) {
      title.textContent = event.name || 'Random Event!';
      desc.textContent = event.description || '';
      modal.classList.add('active');
      this.app.audio.playSFX('eventSpace');
      
      // Auto-close after delay
      setTimeout(() => {
        modal.classList.remove('active');
      }, 3000);
    }
  }

  showStarModal(data) {
    const modal = document.getElementById('star-modal');
    const priceEl = document.getElementById('star-price');
    
    if (modal) {
      if (priceEl) priceEl.textContent = `${data.cost || 20} coins`;
      modal.classList.add('active');
      this.app.audio.playSFX('star');
      
      const buyBtn = document.getElementById('buy-star-btn');
      const skipBtn = document.getElementById('skip-star-btn');
      
      buyBtn?.addEventListener('click', () => {
        this.app.socket.socket.emit('game:purchaseStar', true, (response) => {
          if (!response.success) {
            this.app.ui.showToast(response.error || 'Failed to buy star', 'error');
          }
        });
        modal.classList.remove('active');
      }, { once: true });
      
      skipBtn?.addEventListener('click', () => {
        this.app.socket.socket.emit('game:purchaseStar', false, (response) => {
          // Continue game
        });
        modal.classList.remove('active');
      }, { once: true });
    }
  }

  showShopModal(items) {
    const modal = document.getElementById('shop-modal');
    const grid = document.getElementById('shop-items');
    
    if (modal && grid) {
      grid.innerHTML = items.map(item => `
        <div class="shop-item" data-item-id="${item.id}">
          <div class="item-icon">${item.icon || '❓'}</div>
          <div class="item-name">${item.name}</div>
          <div class="item-price">${item.price} 🪙</div>
        </div>
      `).join('');
      
      grid.querySelectorAll('.shop-item').forEach(el => {
        el.addEventListener('click', () => {
          this.app.socket.socket.emit('game:purchaseItem', el.dataset.itemId, (response) => {
            if (!response.success) {
              this.app.ui.showToast(response.error || 'Failed to buy item', 'error');
            }
          });
          modal.classList.remove('active');
        });
      });
      
      modal.classList.add('active');
      this.app.audio.playSFX('shopOpen');
      
      const closeBtn = document.getElementById('skip-shop-btn');
      closeBtn?.addEventListener('click', () => {
        this.app.socket.socket.emit('game:skipShop', () => {});
        modal.classList.remove('active');
      }, { once: true });
    }
  }

  showOverseerModal(data) {
    const modal = document.getElementById('overseer-modal');
    const dialogue = document.getElementById('overseer-dialogue');
    const resultEl = document.getElementById('overseer-result');
    
    if (modal && dialogue) {
      dialogue.textContent = data.dialogue || "The Overseer watches...";
      modal.classList.add('active');
      this.app.audio.playSFX('overseerAppear');
      
      // Spin wheel
      const wheel = document.querySelector('.overseer-wheel');
      if (wheel) {
        wheel.classList.add('spinning');
        
        setTimeout(() => {
          wheel.classList.remove('spinning');
          if (resultEl) {
            resultEl.textContent = data.result || 'Something happened!';
          }
          
          // Close after showing result
          setTimeout(() => {
            modal.classList.remove('active');
          }, 2000);
        }, 3000);
      }
    }
  }

  showVSModal(data) {
    const modal = document.getElementById('vs-modal');
    if (modal) {
      modal.classList.add('active');
      this.app.audio.playSFX('vsSpace');
      
      setTimeout(() => {
        modal.classList.remove('active');
        // Minigame will start via socket event
      }, 2000);
    }
  }

  showStarAnimation(playerId) {
    const playerMesh = this.playerMeshes.get(playerId);
    if (!playerMesh) return;

    // Create star burst effect
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.OctahedronGeometry(0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
      const star = new THREE.Mesh(geometry, material);
      
      star.position.copy(playerMesh.position);
      star.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.3 + 0.2,
        (Math.random() - 0.5) * 0.3
      );
      
      this.scene.add(star);
      particles.push(star);
    }

    // Animate particles
    let frame = 0;
    const animate = () => {
      frame++;
      
      particles.forEach(star => {
        star.position.add(star.userData.velocity);
        star.userData.velocity.y -= 0.01;
        star.rotation.x += 0.1;
        star.rotation.y += 0.1;
        star.material.opacity = 1 - frame / 60;
      });

      if (frame < 60) {
        requestAnimationFrame(animate);
      } else {
        particles.forEach(star => this.scene.remove(star));
      }
    };
    
    animate();
  }

  showEmote(data) {
    const playerMesh = this.playerMeshes.get(data.playerId);
    if (!playerMesh) return;

    // Create emote sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '96px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.emote, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.copy(playerMesh.position);
    sprite.position.y += 2.5;
    sprite.scale.set(2, 2, 1);
    
    this.scene.add(sprite);
    this.app.audio.playSFX('emote');

    // Animate and remove
    let frame = 0;
    const animate = () => {
      frame++;
      sprite.position.y += 0.02;
      sprite.material.opacity = 1 - frame / 60;
      
      if (frame < 60) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(sprite);
      }
    };
    
    animate();
  }

  focusCamera(position, duration = 1000) {
    const targetPos = new THREE.Vector3(position.x, 30, position.z + 20);
    const startPos = this.camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.camera.lookAt(position.x, 0, position.z);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Settings
  setQuality(quality) {
    this.quality = quality;
    
    if (this.renderer) {
      this.renderer.setPixelRatio(quality === 'high' ? window.devicePixelRatio : 1);
      this.renderer.shadowMap.enabled = quality !== 'low';
    }
  }

  setParticles(enabled) {
    this.particlesEnabled = enabled;
    this.particles.forEach(p => {
      p.visible = enabled;
    });
  }

  // Texture management
  loadTexture(path, onLoad, onError) {
    // Check cache first
    if (this.textureCache.has(path)) {
      const cached = this.textureCache.get(path);
      if (onLoad) onLoad(cached);
      return cached;
    }

    // Load new texture
    if (!this.textureLoader) {
      this.textureLoader = new THREE.TextureLoader();
    }

    this.textureLoader.load(
      path,
      (texture) => {
        this.textureCache.set(path, texture);
        if (onLoad) onLoad(texture);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load texture: ${path}`, error);
        if (onError) onError(error);
      }
    );
  }

  preloadBoardTextures(boardId) {
    const texturePaths = [
      `/assets/textures/boards/${boardId}/ground.png`,
      `/assets/textures/boards/${boardId}/decoration.png`,
      `/assets/boards/${boardId}/preview.png`
    ];

    const promises = texturePaths.map(path => {
      return new Promise((resolve) => {
        this.loadTexture(path, resolve, () => resolve(null));
      });
    });

    return Promise.all(promises);
  }

  getBoardThemeData(boardId) {
    const themes = {
      tropical_paradise: {
        backgroundColor: 0x87ceeb,
        fogColor: 0xa4d8f0,
        groundColor: 0xf4d35e,
        accentColor: 0x2ec4b6,
        ambientLight: 0xfff8dc,
        sunColor: 0xffa500,
        particleColor: 0x00ffff,
        mechanic: 'tide'
      },
      crystal_caves: {
        backgroundColor: 0x1e1e3f,
        fogColor: 0x2a2a5f,
        groundColor: 0x4a5568,
        accentColor: 0xa855f7,
        ambientLight: 0x8b5cf6,
        sunColor: 0xc084fc,
        particleColor: 0xfbbf24,
        mechanic: 'crystals'
      },
      haunted_manor: {
        backgroundColor: 0x1a1a2e,
        fogColor: 0x16213e,
        groundColor: 0x2d3436,
        accentColor: 0x6c5ce7,
        ambientLight: 0x4a5568,
        sunColor: 0x8b92a7,
        particleColor: 0x34d399,
        mechanic: 'ghosts'
      },
      sky_kingdom: {
        backgroundColor: 0x81ecec,
        fogColor: 0xa4d8f0,
        groundColor: 0xdfe6e9,
        accentColor: 0x74b9ff,
        ambientLight: 0xffffff,
        sunColor: 0xffeaa7,
        particleColor: 0xffffff,
        mechanic: 'wind'
      }
    };

    return themes[boardId] || themes.tropical_paradise;
  }

  applyBoardMechanic(boardId, player) {
    const theme = this.getBoardThemeData(boardId);
    
    switch (theme.mechanic) {
      case 'tide':
        // Tide mechanic - affects path availability every 3 turns
        if (this.gameState.turn % 3 === 0) {
          this.triggerTideEffect();
        }
        break;
      
      case 'crystals':
        // Crystal spaces give random bonuses
        if (player.currentSpace?.type === 'BLUE' && Math.random() < 0.2) {
          this.triggerCrystalBonus(player);
        }
        break;
      
      case 'ghosts':
        // Ghost spaces can steal coins
        if (player.currentSpace?.type === 'EVENT' && Math.random() < 0.3) {
          this.triggerGhostEffect(player);
        }
        break;
      
      case 'wind':
        // Wind gusts push players extra spaces
        if (Math.random() < 0.15) {
          this.triggerWindGust(player);
        }
        break;
    }
  }

  triggerTideEffect() {
    this.app.ui.showMessage('🌊 The tide is changing! Some paths have shifted!', 'info');
    // Visual effect
    this.createWaveParticles();
  }

  triggerCrystalBonus(player) {
    const bonus = Math.floor(Math.random() * 5) + 3;
    this.app.ui.showMessage(`💎 Crystal Bonus! +${bonus} coins!`, 'success');
    this.app.socket.socket.emit('game:addCoins', { amount: bonus });
  }

  triggerGhostEffect(player) {
    const stolen = Math.floor(Math.random() * 5) + 2;
    this.app.ui.showMessage(`👻 A ghost steals ${stolen} coins!`, 'warning');
    this.app.socket.socket.emit('game:removeCoins', { amount: stolen });
  }

  triggerWindGust(player) {
    const push = Math.random() < 0.5 ? 2 : -1;
    const direction = push > 0 ? 'forward' : 'backward';
    this.app.ui.showMessage(`💨 Wind gust! Pushed ${Math.abs(push)} spaces ${direction}!`, 'info');
    // Server handles actual movement
  }

  createWaveParticles() {
    // Create wave effect particles
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
      const particle = new THREE.Mesh(geometry, material);
      
      const angle = (i / 20) * Math.PI * 2;
      particle.position.set(
        Math.cos(angle) * 15,
        0.5,
        Math.sin(angle) * 15
      );
      
      this.scene.add(particle);
      
      // Animate and remove
      let frame = 0;
      const animate = () => {
        frame++;
        particle.position.y += 0.1;
        particle.material.opacity = 1 - (frame / 60);
        
        if (frame < 60) {
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        }
      };
      animate();
    }
  }

  // Cleanup
  destroy() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Dispose all cached textures
    this.textureCache.forEach(texture => {
      if (texture && texture.dispose) texture.dispose();
    });
    this.textureCache.clear();
    
    this.scene?.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
