import type { BugType, BugUpdateContext, Entity, Point } from "./types";

type BugDefinition = {
  name: string;
  shortLabel: string;
  radius: number;
  speed: number;
  hp: number;
  points: number;
  damage: number;
  body: string;
  shell: string;
  detail: string;
};

export const BUG_DEFINITIONS: Record<BugType, BugDefinition> = {
  normal: {
    name: "Production Bug",
    shortLabel: "BUG",
    radius: 17,
    speed: 48,
    hp: 1,
    points: 10,
    damage: 12,
    body: "#7be36f",
    shell: "#1e6f36",
    detail: "#d9ffd2",
  },
  fast: {
    name: "Friday Deploy",
    shortLabel: "FRI",
    radius: 13,
    speed: 92,
    hp: 1,
    points: 14,
    damage: 9,
    body: "#5fd0ff",
    shell: "#146184",
    detail: "#d9f6ff",
  },
  tank: {
    name: "Legacy Code",
    shortLabel: "LEG",
    radius: 23,
    speed: 34,
    hp: 3,
    points: 28,
    damage: 22,
    body: "#f0a444",
    shell: "#7a3d13",
    detail: "#fff0c9",
  },
  exploder: {
    name: "Bad Hotfix",
    shortLabel: "FIX",
    radius: 18,
    speed: 52,
    hp: 1,
    points: 18,
    damage: 16,
    body: "#ff637d",
    shell: "#8a1d34",
    detail: "#ffe1e7",
  },
};

export type BugConfig = {
  id: string;
  type: BugType;
  x: number;
  y: number;
  difficultyMultiplier: number;
};

export class Bug implements Entity<BugUpdateContext> {
  readonly id: string;
  readonly type: BugType;
  readonly radius: number;
  readonly speed: number;
  readonly maxHp: number;
  readonly points: number;
  readonly damage: number;

  x: number;
  y: number;
  hp: number;
  isDead = false;

  private angle = 0;
  private age = 0;
  private hitFlash = 0;

  constructor(config: BugConfig) {
    const definition = BUG_DEFINITIONS[config.type];

    this.id = config.id;
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.radius = definition.radius;
    this.speed = definition.speed * config.difficultyMultiplier;
    this.hp = definition.hp;
    this.maxHp = definition.hp;
    this.points = definition.points;
    this.damage = definition.damage;
  }

  update(deltaTime: number, context: BugUpdateContext): void {
    const dx = context.target.x - this.x;
    const dy = context.target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;

    this.angle = Math.atan2(dy, dx);
    this.x += (dx / distance) * this.speed * deltaTime;
    this.y += (dy / distance) * this.speed * deltaTime;
    this.age += deltaTime;
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const definition = BUG_DEFINITIONS[this.type];
    const wobble = Math.sin(this.age * 10) * 0.08;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + wobble);

    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 9;
    ctx.shadowOffsetY = 5;

    this.drawLegs(ctx, definition.shell);

    ctx.fillStyle = definition.shell;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, this.radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.fillStyle = definition.body;
    ctx.beginPath();
    ctx.ellipse(
      this.radius * 0.08,
      0,
      this.radius * 0.75,
      this.radius * 0.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (this.type === "tank") {
      this.drawTankArmor(ctx, definition.shell);
    }

    if (this.type === "exploder") {
      this.drawFuse(ctx);
    }

    if (this.type === "fast") {
      this.drawSpeedMark(ctx);
    }

    ctx.fillStyle = definition.detail;
    ctx.font = "700 9px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(definition.shortLabel, 0, 0);

    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlash * 4})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius, this.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (this.maxHp > 1 && this.hp < this.maxHp) {
      this.drawHealthBar(ctx);
    }
  }

  containsPoint(point: Point): boolean {
    return this.distanceTo(point) <= this.radius + 5;
  }

  distanceTo(point: Point): number {
    return Math.hypot(this.x - point.x, this.y - point.y);
  }

  reachedServer(serverCenter: Point, serverRadius: number): boolean {
    return this.distanceTo(serverCenter) <= serverRadius + this.radius * 0.45;
  }

  takeDamage(amount: number): boolean {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.14;

    if (this.hp === 0) {
      this.isDead = true;
    }

    return this.isDead;
  }

  private drawLegs(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (const side of [-1, 1]) {
      for (const offset of [-0.48, 0, 0.48]) {
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.25, side * this.radius * offset);
        ctx.lineTo(-this.radius * 0.95, side * this.radius * (offset + 0.25));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.radius * 0.25, side * this.radius * offset);
        ctx.lineTo(this.radius * 0.9, side * this.radius * (offset + 0.2));
        ctx.stroke();
      }
    }
  }

  private drawTankArmor(ctx: CanvasRenderingContext2D, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    for (const offset of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.55, this.radius * offset);
      ctx.lineTo(this.radius * 0.58, this.radius * offset);
      ctx.stroke();
    }
  }

  private drawFuse(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.5, -this.radius * 0.38);
    ctx.quadraticCurveTo(this.radius * 0.9, -this.radius * 0.8, this.radius, -this.radius * 1.05);
    ctx.stroke();

    ctx.fillStyle = "#fff4a8";
    ctx.beginPath();
    ctx.arc(this.radius * 1.05, -this.radius * 1.1, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSpeedMark(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#d9f6ff";
    ctx.lineWidth = 2;

    for (const y of [-0.35, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.85, this.radius * y);
      ctx.lineTo(-this.radius * 1.35, this.radius * y);
      ctx.stroke();
    }
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const width = this.radius * 1.9;
    const height = 5;
    const x = this.x - width / 2;
    const y = this.y - this.radius - 13;

    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 15, 0.78)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#f6d365";
    ctx.fillRect(x, y, width * (this.hp / this.maxHp), height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }
}
