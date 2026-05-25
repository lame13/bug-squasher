export type GameStatus = "menu" | "playing" | "paused" | "gameOver";

export type BugType = "normal" | "fast" | "tank" | "exploder";

export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type GameState = {
  status: GameStatus;
  score: number;
  serverHealth: number;
  elapsedTime: number;
  highScore: number;
  combo: number;
  bugsSquashed: number;
};

export type BugUpdateContext = {
  target: Point;
};

export interface Entity<TContext = void> {
  update(deltaTime: number, context: TContext): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
};

export type FloatingText = {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
};
