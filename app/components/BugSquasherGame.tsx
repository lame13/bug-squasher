"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BUG_DEFINITIONS } from "@/src/game/Bug";
import { Game } from "@/src/game/Game";
import type { BugType, GameState } from "@/src/game/types";

const INITIAL_STATE: GameState = {
  status: "menu",
  score: 0,
  serverHealth: 100,
  elapsedTime: 0,
  highScore: 0,
  combo: 1,
  bugsSquashed: 0,
};

const BUG_ORDER: BugType[] = ["normal", "fast", "tank", "exploder"];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function BugSquasherGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!canvas || !stage) {
      return;
    }

    const game = new Game(canvas, setState);
    gameRef.current = game;

    const resizeGame = () => {
      const rect = stage.getBoundingClientRect();
      game.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    };

    const observer = new ResizeObserver(resizeGame);
    observer.observe(stage);
    window.addEventListener("resize", resizeGame);
    resizeGame();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeGame);
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const primaryAction = useMemo(() => {
    if (state.status === "gameOver") {
      return {
        label: "Restart Incident",
        action: () => gameRef.current?.restart(),
      };
    }

    if (state.status === "paused") {
      return {
        label: "Resume",
        action: () => gameRef.current?.resume(),
      };
    }

    return {
      label: "Start Incident",
      action: () => gameRef.current?.start(),
    };
  }, [state.status]);

  const statusText =
    state.status === "playing"
      ? "Live"
      : state.status === "paused"
        ? "Paused"
        : state.status === "gameOver"
          ? "Resolved"
          : "Standby";

  return (
    <main className="game-page">
      <header className="game-header">
        <div>
          <p className="kicker">Bug Squasher: DOM Defense</p>
          <h1>Production Incident</h1>
        </div>
        <div className="status-pill" aria-live="polite">
          <span className={`status-dot status-dot-${state.status}`} />
          {statusText}
        </div>
      </header>

      <section className="game-shell" aria-label="Bug Squasher game">
        <div className="stage-panel" ref={stageRef}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            aria-label="Production server defense canvas"
          />

          {state.status !== "playing" && (
            <div className="game-overlay">
              <div className="overlay-panel">
                <p className="overlay-kicker">{state.status === "gameOver" ? "Incident closed" : "On-call console"}</p>
                <h2>{state.status === "gameOver" ? "Uptime hit zero" : "Server under siege"}</h2>
                <div className="overlay-stats">
                  <span>Score {state.score}</span>
                  <span>Best {state.highScore}</span>
                  <span>Time {formatTime(state.elapsedTime)}</span>
                </div>
                <button className="primary-button" type="button" onClick={primaryAction.action}>
                  {primaryAction.label}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="control-panel">
          <div className="hud-grid">
            <div className="hud-tile">
              <span>Score</span>
              <strong>{state.score}</strong>
            </div>
            <div className="hud-tile">
              <span>Best</span>
              <strong>{state.highScore}</strong>
            </div>
            <div className="hud-tile">
              <span>Time</span>
              <strong>{formatTime(state.elapsedTime)}</strong>
            </div>
            <div className="hud-tile">
              <span>Combo</span>
              <strong>x{state.combo}</strong>
            </div>
          </div>

          <div className="uptime-panel">
            <div className="panel-row">
              <span>Uptime</span>
              <strong>{Math.ceil(state.serverHealth)}%</strong>
            </div>
            <div className="health-track" aria-hidden="true">
              <span style={{ width: `${Math.max(0, state.serverHealth)}%` }} />
            </div>
          </div>

          <div className="button-row">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                if (state.status === "playing") {
                  gameRef.current?.pause();
                } else if (state.status === "paused") {
                  gameRef.current?.resume();
                }
              }}
              disabled={state.status !== "playing" && state.status !== "paused"}
            >
              {state.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button className="secondary-button" type="button" onClick={() => gameRef.current?.restart()}>
              Restart
            </button>
          </div>

          <div className="bug-list">
            {BUG_ORDER.map((type) => {
              const bug = BUG_DEFINITIONS[type];

              return (
                <div className="bug-row" key={type}>
                  <span className="bug-swatch" style={{ backgroundColor: bug.body, borderColor: bug.shell }} />
                  <span>{bug.name}</span>
                  <strong>{bug.hp} HP</strong>
                </div>
              );
            })}
          </div>

          <div className="squash-count">
            <span>Bugs squashed</span>
            <strong>{state.bugsSquashed}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}
