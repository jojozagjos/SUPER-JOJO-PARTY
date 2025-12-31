// Simple performance utilities: object pool and helpers
export class Pool {
  constructor() {
    this.map = new Map();
  }

  acquire(key) {
    const list = this.map.get(key);
    if (!list || list.length === 0) return null;
    return list.pop();
  }

  release(key, obj) {
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(obj);
  }

  size(key) {
    const list = this.map.get(key) || [];
    return list.length;
  }
}

export function createLowDetailSprite(colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${colorHex.toString(16).padStart(6,'0')}`;
  ctx.beginPath();
  ctx.arc(32, 32, 20, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, opacity: 0.9 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 1.2, 1);
  return sprite;
}
