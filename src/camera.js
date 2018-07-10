export class Camera {
  constructor(vektarContext) {
    this.ctx = vektarContext;
  }

  setCenterPosition({ x, y }) {
    const centerX = x - this.ctx.getWidth() / 2;
    const centerY = y + this.ctx.getHeight() / 2;

    this.ctx.setViewportPosition({ x: centerX, y: centerY });
  }
}
