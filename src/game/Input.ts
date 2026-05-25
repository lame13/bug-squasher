import type { Point } from "./types";

export class Input {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onClick: (point: Point) => void,
  ) {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();

    this.onClick({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
}
