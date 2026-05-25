import { Bug, BUG_DEFINITIONS } from "./Bug";
import { Input } from "./Input";
import { Renderer } from "./Renderer";
import { Spawner } from "./Spawner";
import { loadHighScore, saveHighScore } from "./storage";
import type { FloatingText, GameState, Particle, Point, Size } from "./types";

type GameListener = (state: GameState) => void;

const INITIAL_HEALTH = 100;
const EXPLOSION_RADIUS = 106;

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderer: Renderer;
  private readonly spawner = new Spawner();
  private readonly input: Input;
  private readonly onStateChange: GameListener;

  private bugs: Bug[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private size: Size = { width: 960, height: 540 };
  private screenShake = 0;
  private comboCount = 0;
  private comboTimer = 0;
  private stateEmitTimer = 0;

  private state: GameState = {
    status: "menu",
    score: 0,
    serverHealth: INITIAL_HEALTH,
    elapsedTime: 0,
    highScore: 0,
    combo: 1,
    bugsSquashed: 0,
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    onStateChange: GameListener,
  ) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is not available.");
    }

    this.ctx = context;
    this.renderer = new Renderer(this.ctx);
    this.input = new Input(canvas, this.handleClick);
    this.onStateChange = onStateChange;
    this.state.highScore = loadHighScore();

    this.resize(canvas.clientWidth || this.size.width, canvas.clientHeight || this.size.height);
    this.emitState();
    this.animationFrameId = window.requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.input.destroy();

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }

  resize(width: number, height: number, devicePixelRatio = window.devicePixelRatio || 1): void {
    this.size = {
      width: Math.max(320, Math.floor(width)),
      height: Math.max(260, Math.floor(height)),
    };

    this.canvas.width = Math.floor(this.size.width * devicePixelRatio);
    this.canvas.height = Math.floor(this.size.height * devicePixelRatio);
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.render();
  }

  start(): void {
    this.resetRun();
    this.state.status = "playing";
    this.lastTimestamp = performance.now();
    this.emitState();
  }

  restart(): void {
    this.start();
  }

  pause(): void {
    if (this.state.status !== "playing") {
      return;
    }

    this.state.status = "paused";
    this.emitState();
  }

  resume(): void {
    if (this.state.status !== "paused") {
      return;
    }

    this.state.status = "playing";
    this.lastTimestamp = performance.now();
    this.emitState();
  }

  private readonly loop = (timestamp: number): void => {
    const deltaTime = this.lastTimestamp === 0 ? 0 : Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    if (this.state.status === "playing") {
      this.update(deltaTime);
    }

    this.render();
    this.animationFrameId = window.requestAnimationFrame(this.loop);
  };

  private resetRun(): void {
    this.bugs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawner.reset();
    this.screenShake = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.stateEmitTimer = 0;
    this.state = {
      status: "menu",
      score: 0,
      serverHealth: INITIAL_HEALTH,
      elapsedTime: 0,
      highScore: Math.max(this.state.highScore, loadHighScore()),
      combo: 1,
      bugsSquashed: 0,
    };
  }

  private update(deltaTime: number): void {
    this.state.elapsedTime += deltaTime;
    this.stateEmitTimer += deltaTime;

    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;

      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.state.combo = 1;
      }
    }

    this.screenShake = Math.max(0, this.screenShake - deltaTime * 18);

    const serverCenter = this.getServerCenter();
    const spawnedBugs = this.spawner.update(deltaTime, this.state.elapsedTime, this.size);
    this.bugs.push(...spawnedBugs);

    for (const bug of this.bugs) {
      bug.update(deltaTime, { target: serverCenter });

      if (bug.reachedServer(serverCenter, this.getServerSize() * 0.42)) {
        this.damageServer(bug);
        bug.isDead = true;
      }
    }

    this.bugs = this.bugs.filter((bug) => !bug.isDead);
    this.updateParticles(deltaTime);
    this.updateFloatingTexts(deltaTime);

    if (this.state.serverHealth <= 0) {
      this.endGame();
      return;
    }

    if (this.stateEmitTimer >= 0.12) {
      this.stateEmitTimer = 0;
      this.emitState();
    }
  }

  private readonly handleClick = (point: Point): void => {
    if (this.state.status !== "playing") {
      return;
    }

    const bug = this.pickClickedBug(point);

    if (!bug) {
      this.comboCount = 0;
      this.comboTimer = 0;
      this.state.combo = 1;
      this.createFloatingText(point.x, point.y, "MISS", "#aeb8b2");
      this.emitState();
      return;
    }

    const killed = bug.takeDamage(1);
    this.createBurst(bug.x, bug.y, BUG_DEFINITIONS[bug.type].body, 10, 115);

    if (killed) {
      this.squashBug(bug);
      this.bugs = this.bugs.filter((currentBug) => !currentBug.isDead);
    } else {
      this.createFloatingText(bug.x, bug.y - bug.radius - 18, "HIT", "#fff0c9");
      this.screenShake = Math.max(this.screenShake, 2);
    }

    this.emitState();
  };

  private pickClickedBug(point: Point): Bug | null {
    let selectedBug: Bug | null = null;
    let selectedDistance = Number.POSITIVE_INFINITY;

    for (const bug of this.bugs) {
      const distance = bug.distanceTo(point);

      if (bug.containsPoint(point) && distance < selectedDistance) {
        selectedBug = bug;
        selectedDistance = distance;
      }
    }

    return selectedBug;
  }

  private squashBug(bug: Bug): void {
    bug.isDead = true;
    const multiplier = this.bumpCombo();
    const gainedPoints = bug.points * multiplier;

    this.state.score += gainedPoints;
    this.state.bugsSquashed += 1;
    this.state.highScore = Math.max(this.state.highScore, this.state.score);

    this.createFloatingText(
      bug.x,
      bug.y - bug.radius - 16,
      `+${gainedPoints}`,
      multiplier > 1 ? "#ffd166" : "#dfffea",
    );
    this.createBurst(bug.x, bug.y, BUG_DEFINITIONS[bug.type].body, 16, 165);
    this.screenShake = Math.max(this.screenShake, bug.type === "tank" ? 4 : 2.5);

    if (bug.type === "exploder") {
      this.detonateExploder(bug);
    }
  }

  private bumpCombo(): number {
    this.comboCount += 1;
    this.comboTimer = 2.25;
    this.state.combo = Math.min(5, 1 + Math.floor((this.comboCount - 1) / 3));
    return this.state.combo;
  }

  private detonateExploder(exploder: Bug): void {
    this.createRing(exploder.x, exploder.y, "#ff637d");
    this.screenShake = Math.max(this.screenShake, 8);

    for (const bug of this.bugs) {
      if (bug.id === exploder.id || bug.isDead) {
        continue;
      }

      const distance = bug.distanceTo(exploder);

      if (distance <= EXPLOSION_RADIUS) {
        const damage = distance < EXPLOSION_RADIUS * 0.55 ? 2 : 1;
        const killed = bug.takeDamage(damage);

        this.createBurst(bug.x, bug.y, "#ff9aa8", 8, 125);

        if (killed) {
          this.squashBug(bug);
        }
      }
    }
  }

  private damageServer(bug: Bug): void {
    this.state.serverHealth = Math.max(0, this.state.serverHealth - bug.damage);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.state.combo = 1;

    const serverCenter = this.getServerCenter();
    this.screenShake = Math.max(this.screenShake, 10);
    this.createFloatingText(serverCenter.x, serverCenter.y - this.getServerSize() * 0.72, `-${bug.damage}%`, "#ff637d");
    this.createBurst(serverCenter.x, serverCenter.y, "#ff637d", 18, 190);
  }

  private endGame(): void {
    this.state.status = "gameOver";
    this.state.highScore = Math.max(this.state.highScore, this.state.score);
    saveHighScore(this.state.highScore);
    this.emitState();
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += 180 * deltaTime;
      particle.life -= deltaTime;
    }

    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private updateFloatingTexts(deltaTime: number): void {
    for (const floatingText of this.floatingTexts) {
      floatingText.y += floatingText.vy * deltaTime;
      floatingText.life -= deltaTime;
    }

    this.floatingTexts = this.floatingTexts.filter((floatingText) => floatingText.life > 0);
  }

  private createBurst(x: number, y: number, color: string, count: number, power: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.35 + Math.random() * 0.65);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
      });
    }
  }

  private createRing(x: number, y: number, color: string): void {
    const count = 34;

    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 220,
        vy: Math.sin(angle) * 220,
        radius: 3,
        color,
        life: 0.58,
        maxLife: 0.58,
      });
    }
  }

  private createFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      vy: -34,
      text,
      color,
      life: 0.8,
      maxLife: 0.8,
    });
  }

  private getServerCenter(): Point {
    return {
      x: this.size.width / 2,
      y: this.size.height / 2,
    };
  }

  private getServerSize(): number {
    return Math.max(68, Math.min(94, Math.min(this.size.width, this.size.height) * 0.16));
  }

  private render(): void {
    this.renderer.render({
      size: this.size,
      state: this.state,
      bugs: this.bugs,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      serverCenter: this.getServerCenter(),
      serverSize: this.getServerSize(),
      screenShake: this.screenShake,
    });
  }

  private emitState(): void {
    this.onStateChange({ ...this.state });
  }
}
