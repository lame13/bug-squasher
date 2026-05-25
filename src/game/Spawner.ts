import { Bug } from "./Bug";
import type { BugType, Point, Size } from "./types";

type WeightedBug = {
  type: BugType;
  weight: number;
};

export class Spawner {
  private nextSpawnIn = 0.8;
  private nextId = 1;

  reset(): void {
    this.nextSpawnIn = 0.8;
    this.nextId = 1;
  }

  update(deltaTime: number, elapsedTime: number, bounds: Size): Bug[] {
    const spawned: Bug[] = [];

    this.nextSpawnIn -= deltaTime;

    while (this.nextSpawnIn <= 0 && spawned.length < 3) {
      spawned.push(this.createBug(elapsedTime, bounds));
      this.nextSpawnIn += this.getSpawnInterval(elapsedTime);
    }

    return spawned;
  }

  private createBug(elapsedTime: number, bounds: Size): Bug {
    const type = this.pickBugType(elapsedTime);
    const spawn = this.pickSpawnPoint(bounds);
    const difficultyMultiplier = 1 + Math.min(0.8, elapsedTime / 120);

    const bug = new Bug({
      id: `bug-${this.nextId}`,
      type,
      x: spawn.x,
      y: spawn.y,
      difficultyMultiplier,
    });

    this.nextId += 1;
    return bug;
  }

  private getSpawnInterval(elapsedTime: number): number {
    return Math.max(0.34, 1.18 - elapsedTime * 0.012);
  }

  private pickBugType(elapsedTime: number): BugType {
    const weights: WeightedBug[] = [
      { type: "normal", weight: 85 },
      { type: "fast", weight: elapsedTime > 8 ? 28 : 0 },
      { type: "tank", weight: elapsedTime > 16 ? 22 : 0 },
      { type: "exploder", weight: elapsedTime > 24 ? 18 : 0 },
    ];

    const total = weights.reduce((sum, option) => sum + option.weight, 0);
    let roll = Math.random() * total;

    for (const option of weights) {
      roll -= option.weight;

      if (roll <= 0) {
        return option.type;
      }
    }

    return "normal";
  }

  private pickSpawnPoint(bounds: Size): Point {
    const edge = Math.floor(Math.random() * 4);
    const margin = 42;

    if (edge === 0) {
      return { x: Math.random() * bounds.width, y: -margin };
    }

    if (edge === 1) {
      return { x: bounds.width + margin, y: Math.random() * bounds.height };
    }

    if (edge === 2) {
      return { x: Math.random() * bounds.width, y: bounds.height + margin };
    }

    return { x: -margin, y: Math.random() * bounds.height };
  }
}
