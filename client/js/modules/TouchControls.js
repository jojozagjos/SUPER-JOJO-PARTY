/**
 * Super JoJo Party - Touch Controls
 * On-screen D-pad and buttons for mobile devices
 */

export class TouchControls {
  constructor(minigameController) {
    this.minigame = minigameController;
    this.container = null;
    this.dpad = null;
    this.actionBtn = null;
    this.enabled = false;
    this.activeTouch = null;
  }

  init() {
    // Check if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
      return; // Don't show on desktop
    }

    this.createTouchUI();
    this.enabled = true;
  }

  createTouchUI() {
    // Remove existing if any
    if (this.container) {
      this.container.remove();
    }

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.className = 'touch-controls';
    this.container.innerHTML = `
      <div class="touch-dpad">
        <button class="dpad-btn dpad-up" data-key="ArrowUp">▲</button>
        <button class="dpad-btn dpad-down" data-key="ArrowDown">▼</button>
        <button class="dpad-btn dpad-left" data-key="ArrowLeft">◀</button>
        <button class="dpad-btn dpad-right" data-key="ArrowRight">▶</button>
        <div class="dpad-center"></div>
      </div>
      <div class="touch-actions">
        <button class="action-btn action-jump" data-key="Space">
          <span class="btn-label">JUMP</span>
        </button>
        <button class="action-btn action-interact" data-key="KeyE">
          <span class="btn-label">USE</span>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add event listeners
    this.attachHandlers();
  }

  attachHandlers() {
    const buttons = this.container.querySelectorAll('.dpad-btn, .action-btn');
    
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      
      // Touch events
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.handleInput(key, true);
      });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.handleInput(key, false);
      });

      // Mouse fallback for testing
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.handleInput(key, true);
      });

      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.handleInput(key, false);
      });
    });
  }

  handleInput(key, pressed) {
    if (this.minigame) {
      this.minigame.handleKeyInput(key, pressed);
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
