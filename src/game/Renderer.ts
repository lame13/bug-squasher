import type { Bug } from "./Bug";
import type { FloatingText, GameState, Particle, Point, Size } from "./types";

type RenderParams = {
  size: Size;
  state: GameState;
  bugs: Bug[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  serverCenter: Point;
  serverSize: number;
  screenShake: number;
};

export class Renderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  render(params: RenderParams): void {
    const { size, state, bugs, particles, floatingTexts, serverCenter, serverSize, screenShake } = params;

    this.ctx.save();
    this.ctx.clearRect(0, 0, size.width, size.height);
    this.drawBackground(size, state.elapsedTime);

    if (screenShake > 0 && state.status === "playing") {
      this.ctx.translate(
        (Math.random() - 0.5) * screenShake,
        (Math.random() - 0.5) * screenShake,
      );
    }

    this.drawServerZone(serverCenter, serverSize);

    for (const bug of bugs) {
      bug.render(this.ctx);
    }

    this.drawServer(serverCenter, serverSize, state.serverHealth);
    this.drawParticles(particles);
    this.drawFloatingTexts(floatingTexts);
    this.ctx.restore();

    this.drawVignette(size);
  }

  private drawBackground(size: Size, elapsedTime: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = "#090d10";
    ctx.fillRect(0, 0, size.width, size.height);

    ctx.strokeStyle = "rgba(122, 255, 184, 0.08)";
    ctx.lineWidth = 1;

    const gridSize = 46;
    const offset = (elapsedTime * 8) % gridSize;

    for (let x = -gridSize + offset; x < size.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.height);
      ctx.stroke();
    }

    for (let y = -gridSize + offset; y < size.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 209, 102, 0.18)";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size.width - 16, size.height - 16);
  }

  private drawServerZone(center: Point, size: number): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = "rgba(113, 227, 111, 0.22)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, size * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawServer(center: Point, size: number, health: number): void {
    const ctx = this.ctx;
    const x = center.x - size / 2;
    const y = center.y - size / 2;
    const healthRatio = Math.max(0, health) / 100;

    ctx.save();
    ctx.shadowColor = "rgba(119, 255, 179, 0.32)";
    ctx.shadowBlur = 22;
    ctx.fillStyle = healthRatio > 0.35 ? "#15251e" : "#2a1518";
    ctx.strokeStyle = healthRatio > 0.35 ? "#77ffb3" : "#ff637d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#dfffea";
    ctx.font = "700 12px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SERVER", center.x, center.y - 8);

    ctx.fillStyle = healthRatio > 0.35 ? "#77ffb3" : "#ff637d";
    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    ctx.fillText(`${Math.ceil(health)}%`, center.x, center.y + 13);

    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(x + 10, y + size - 12, size - 20, 5);
    ctx.fillStyle = healthRatio > 0.35 ? "#77ffb3" : "#ff637d";
    ctx.fillRect(x + 10, y + size - 12, (size - 20) * healthRatio, 5);
    ctx.restore();
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;

    for (const particle of particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * (1 + (1 - alpha) * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFloatingTexts(floatingTexts: FloatingText[]): void {
    const ctx = this.ctx;

    for (const floatingText of floatingTexts) {
      const alpha = Math.max(0, floatingText.life / floatingText.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = floatingText.color;
      ctx.font = "700 15px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
      ctx.restore();
    }
  }

  private drawVignette(size: Size): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      size.width / 2,
      size.height / 2,
      size.height * 0.1,
      size.width / 2,
      size.height / 2,
      size.width * 0.72,
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);
  }
}
