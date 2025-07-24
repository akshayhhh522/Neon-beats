"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  DIFFICULTY_SETTINGS,
  LANES,
  TILE_HEIGHT,
  HIT_ZONE_HEIGHT,
  GAME_AREA_BOTTOM_PADDING,
} from "@/lib/constants";
import type {
  Tile,
  Difficulty,
  GameState,
  HighScore,
  FeedbackEffect,
  HitFeedback,
} from "@/lib/types";
import { Play, Pause, Home, RotateCcw } from "lucide-react";

export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [feedbackEffects, setFeedbackEffects] = useState<FeedbackEffect[]>([]);
  const [hitFeedbacks, setHitFeedbacks] = useState<HitFeedback[]>([]);
  const [activeLanes, setActiveLanes] = useState<number[]>([]);
  const [highScores, setHighScores] = useLocalStorage<HighScore[]>(
    "highscores",
    []
  );

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const feedbackIdCounterRef = useRef<number>(0);
  const hitFeedbackIdCounterRef = useRef<number>(0);
  const tileIdCounterRef = useRef<number>(0);

  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const difficultyRef = useRef(difficulty);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  const createHitFeedback = useCallback(
    (lane: number, scoreGain: number, isPerfect = false) => {
      const feedback: HitFeedback = {
        id: ++hitFeedbackIdCounterRef.current,
        lane,
        score: scoreGain,
        timestamp: performance.now(),
        isPerfect,
      };
      setHitFeedbacks((prev) => [...prev, feedback]);

      // Remove after animation duration
      setTimeout(() => {
        setHitFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id));
      }, 1000);
    },
    []
  );

  const createFeedbackEffect = useCallback(
    (type: "hit" | "miss", lane: number) => {
      const effect: FeedbackEffect = {
        id: ++feedbackIdCounterRef.current,
        type,
        lane,
        timestamp: performance.now(),
      };
      setFeedbackEffects((prev) => [...prev, effect]);

      // Remove after animation duration
      setTimeout(() => {
        setFeedbackEffects((prev) => prev.filter((e) => e.id !== effect.id));
      }, 600);
    },
    []
  );

  const saveScore = useCallback(() => {
    if (scoreRef.current > 0) {
      const newHighScore: HighScore = {
        id: crypto.randomUUID(),
        songName: "Random Mode",
        score: scoreRef.current,
        difficulty: difficultyRef.current,
        date: new Date().toISOString(),
      };
      setHighScores((prev) => [...prev, newHighScore]);
    }
  }, [setHighScores]);

  const stopGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
    saveScore();
    setGameState("gameover");
  }, [saveScore]);

  const handleLaneClick = useCallback(
    (laneIndex: number) => {
      if (gameState !== "playing" || !gameAreaRef.current) return;

      // Add visual feedback to lane
      setActiveLanes((prev) => [...prev, laneIndex]);
      setTimeout(() => {
        setActiveLanes((prev) => prev.filter((lane) => lane !== laneIndex));
      }, 150);

      const gameAreaHeight = gameAreaRef.current.clientHeight;
      const hitZoneBottom = gameAreaHeight - GAME_AREA_BOTTOM_PADDING;
      const hitZoneTop = hitZoneBottom - HIT_ZONE_HEIGHT;

      let hit = false;
      let targetTileId: number | null = null;

      const newTiles = [...tiles];
      for (const tile of newTiles) {
        if (tile.lane === laneIndex) {
          const tileBottom = tile.y + tile.height;
          if (tileBottom > hitZoneTop && tile.y < hitZoneBottom) {
            hit = true;
            targetTileId = tile.id;
            break;
          }
        }
      }

      if (hit && targetTileId !== null) {
        setTiles((currentTiles) =>
          currentTiles.filter((t) => t.id !== targetTileId)
        );

        // Check for perfect hit (center of hit zone)
        const hitZoneCenter = hitZoneTop + HIT_ZONE_HEIGHT / 2;
        const targetTile = newTiles.find((t) => t.id === targetTileId);
        const tileCenter = targetTile
          ? targetTile.y + targetTile.height / 2
          : 0;
        const distanceFromCenter = Math.abs(tileCenter - hitZoneCenter);
        const isPerfect = distanceFromCenter < HIT_ZONE_HEIGHT * 0.15; // Within 15% of center

        const newCombo = combo + 1;
        const baseScore = isPerfect ? 15 : 10;
        const scoreGain = baseScore + newCombo;
        setCombo(newCombo);
        setScore((prevScore) => prevScore + scoreGain);

        // Create hit feedback
        createFeedbackEffect("hit", laneIndex);
        createHitFeedback(laneIndex, scoreGain, isPerfect);
      } else {
        setCombo(0);
        // Create miss feedback
        createFeedbackEffect("miss", laneIndex);
      }
    },
    [tiles, combo, gameState, createFeedbackEffect, createHitFeedback]
  );

  const resetGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setTiles([]);
    setFeedbackEffects([]);
    setHitFeedbacks([]);
    setActiveLanes([]);
    feedbackIdCounterRef.current = 0;
    hitFeedbackIdCounterRef.current = 0;
    tileIdCounterRef.current = 0;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
  }, []);

  const startGame = () => {
    resetGame();
    setGameState("playing");
  };

  const pauseGame = () => {
    setGameState("paused");
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  const exitToMenu = () => {
    resetGame();
    setGameState("menu");
  };

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    lastSpawnTimeRef.current = performance.now();

    const gameLoop = () => {
      if (!gameAreaRef.current) return;

      const gameAreaHeight = gameAreaRef.current.clientHeight;
      const currentSettings = DIFFICULTY_SETTINGS[difficulty];
      let tileMissed = false;

      setTiles((prevTiles) => {
        const updatedTiles = prevTiles.map((tile) => ({
          ...tile,
          y: tile.y + currentSettings.speed,
        }));
        return updatedTiles.filter((tile) => {
          if (tile.y > gameAreaHeight) {
            tileMissed = true;
            // Create miss feedback for the tile that was missed
            createFeedbackEffect("miss", tile.lane);
            return false;
          }
          return true;
        });
      });

      if (tileMissed) {
        setCombo(0);
        stopGame();
        return;
      }

      const now = performance.now();
      if (now - lastSpawnTimeRef.current > currentSettings.spawnRate) {
        lastSpawnTimeRef.current = now;
        let newLane = Math.floor(Math.random() * LANES);

        setTiles((prevTiles) => {
          if (difficulty !== "hard" && prevTiles.length > 0) {
            const lastTile = prevTiles[prevTiles.length - 1];
            if (lastTile?.lane === newLane) {
              newLane = (newLane + 1) % LANES;
            }
          }
          return [
            ...prevTiles,
            {
              id: ++tileIdCounterRef.current,
              lane: newLane,
              y: -TILE_HEIGHT,
              height: TILE_HEIGHT,
            },
          ];
        });
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, difficulty, stopGame, createFeedbackEffect]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== "playing") return;

      const keyMap: { [key: string]: number } = {
        a: 0,
        A: 0,
        s: 1,
        S: 1,
        d: 2,
        D: 2,
        f: 3,
        F: 3,
        ArrowLeft: 0,
        ArrowUp: 1,
        ArrowDown: 2,
        ArrowRight: 3,
      };

      const lane = keyMap[event.key];
      if (lane !== undefined) {
        event.preventDefault();
        handleLaneClick(lane);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, handleLaneClick]);

  const renderMenu = () => (
    <div className="bg-card/80 backdrop-blur-lg p-8 rounded-xl border border-accent/30 glowing-card w-full max-w-md text-center">
      <h2
        className="text-4xl font-headline text-accent mb-6"
        style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
      >
        Game Setup
      </h2>

      <div className="mb-8">
        <Label className="text-lg text-primary mb-3 block">Difficulty</Label>
        <RadioGroup
          defaultValue="medium"
          value={difficulty}
          onValueChange={(v: Difficulty) => setDifficulty(v)}
          className="flex justify-center gap-4"
        >
          <Label
            htmlFor="easy"
            className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all"
          >
            <RadioGroupItem value="easy" id="easy" /> Easy
          </Label>
          <Label
            htmlFor="medium"
            className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all"
          >
            <RadioGroupItem value="medium" id="medium" /> Medium
          </Label>
          <Label
            htmlFor="hard"
            className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all"
          >
            <RadioGroupItem value="hard" id="hard" /> Hard
          </Label>
        </RadioGroup>
      </div>

      <Button
        size="lg"
        onClick={startGame}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-bold h-14"
      >
        <Play className="mr-2" /> Start
      </Button>

      <div className="mt-6 text-sm text-muted-foreground">
        <p className="mb-2 font-medium">Controls:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Click lanes or use:</div>
          <div></div>
          <div>A, S, D, F keys</div>
          <div>Arrow keys ←↑↓→</div>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="relative w-full h-full" ref={gameAreaRef}>
      {/* Game Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={pauseGame}
          className="bg-card/80 backdrop-blur-sm border-accent/50 text-accent hover:bg-accent/10"
        >
          <Pause className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => startGame()}
          className="bg-card/80 backdrop-blur-sm border-primary/50 text-primary hover:bg-primary/10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exitToMenu}
          className="bg-card/80 backdrop-blur-sm border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Score and Combo */}
      <div
        className="absolute top-4 left-4 text-left z-10 text-primary"
        style={{ textShadow: "0 0 10px hsl(var(--primary))" }}
      >
        <p className="text-4xl font-bold">{score}</p>
        <p
          className="text-2xl text-accent"
          style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
        >
          x{combo}
        </p>
      </div>

      {/* Game Lanes */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: LANES }).map((_, i) => (
          <div key={i} className="flex-1 border-x border-primary/20" />
        ))}
      </div>

      {/* Tiles */}
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="absolute bg-primary rounded-md"
          style={{
            left: `${(tile.lane / LANES) * 100}%`,
            width: `${100 / LANES}%`,
            top: tile.y,
            height: tile.height,
            boxShadow: "0 0 15px hsl(var(--primary))",
          }}
        />
      ))}

      {/* Feedback Effects */}
      {feedbackEffects.map((effect) => (
        <div
          key={effect.id}
          className={`absolute pointer-events-none transition-all duration-600 ease-out ${
            effect.type === "hit" ? "animate-pulse" : "animate-bounce"
          }`}
          style={{
            left: `${(effect.lane / LANES) * 100}%`,
            width: `${100 / LANES}%`,
            bottom: `${GAME_AREA_BOTTOM_PADDING + HIT_ZONE_HEIGHT / 2}px`,
            height: `${HIT_ZONE_HEIGHT}px`,
            background:
              effect.type === "hit"
                ? "radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)"
                : "radial-gradient(circle, hsl(var(--destructive) / 0.6) 0%, transparent 70%)",
            borderRadius: "50%",
            transform: `scale(${effect.type === "hit" ? "1.5" : "0.8"})`,
            opacity: "0.8",
            animation:
              effect.type === "hit"
                ? "hit-flash 0.6s ease-out forwards"
                : "miss-shake 0.6s ease-out forwards",
          }}
        />
      ))}

      {/* Hit Score Feedback */}
      {hitFeedbacks.map((feedback) => (
        <div
          key={feedback.id}
          className={`absolute pointer-events-none text-2xl font-bold ${
            feedback.isPerfect ? "text-accent" : "text-primary"
          }`}
          style={{
            left: `${(feedback.lane / LANES) * 100 + 100 / LANES / 2}%`,
            bottom: `${GAME_AREA_BOTTOM_PADDING + HIT_ZONE_HEIGHT + 20}px`,
            transform: "translateX(-50%)",
            textShadow: feedback.isPerfect
              ? "0 0 15px hsl(var(--accent))"
              : "0 0 10px hsl(var(--primary))",
            animation: "score-float 1s ease-out forwards",
          }}
        >
          {feedback.isPerfect ? "PERFECT!" : `+${feedback.score}`}
        </div>
      ))}

      {/* Hit Zone and Click Handlers */}
      <div
        className="absolute bottom-0 left-0 right-0 flex"
        style={{ height: `${HIT_ZONE_HEIGHT + GAME_AREA_BOTTOM_PADDING}px` }}
      >
        {Array.from({ length: LANES }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 cursor-pointer border-t-2 border-accent/50 rounded-t-lg transition-all duration-150 hover:bg-accent/20 active:bg-accent/40 ${
              activeLanes.includes(i) ? "bg-accent/30 scale-95" : ""
            }`}
            style={{
              boxShadow: activeLanes.includes(i)
                ? "0 -8px 25px -5px hsl(var(--accent) / 0.8)"
                : "0 -5px 20px -5px hsl(var(--accent) / 0.5)",
            }}
            onClick={() => handleLaneClick(i)}
          />
        ))}
      </div>
    </div>
  );

  const renderPausedGame = () => (
    <div className="relative w-full h-full" ref={gameAreaRef}>
      {/* Paused Game Background (dimmed) */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30" />

      {/* Game Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={resumeGame}
          className="bg-card/80 backdrop-blur-sm border-primary/50 text-primary hover:bg-primary/10"
        >
          <Play className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => startGame()}
          className="bg-card/80 backdrop-blur-sm border-accent/50 text-accent hover:bg-accent/10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exitToMenu}
          className="bg-card/80 backdrop-blur-sm border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Score and Combo */}
      <div
        className="absolute top-4 left-4 text-left z-10 text-primary"
        style={{ textShadow: "0 0 10px hsl(var(--primary))" }}
      >
        <p className="text-4xl font-bold">{score}</p>
        <p
          className="text-2xl text-accent"
          style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
        >
          x{combo}
        </p>
      </div>

      {/* Game Lanes */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: LANES }).map((_, i) => (
          <div key={i} className="flex-1 border-x border-primary/20" />
        ))}
      </div>

      {/* Tiles */}
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className="absolute bg-primary rounded-md"
          style={{
            left: `${(tile.lane / LANES) * 100}%`,
            width: `${100 / LANES}%`,
            top: tile.y,
            height: tile.height,
            boxShadow: "0 0 15px hsl(var(--primary))",
          }}
        />
      ))}

      {/* Hit Zone and Click Handlers */}
      <div
        className="absolute bottom-0 left-0 right-0 flex"
        style={{ height: `${HIT_ZONE_HEIGHT + GAME_AREA_BOTTOM_PADDING}px` }}
      >
        {Array.from({ length: LANES }).map((_, i) => (
          <div
            key={i}
            className="flex-1 cursor-pointer border-t-2 border-accent/50 rounded-t-lg transition-colors hover:bg-accent/20 active:bg-accent/40"
            style={{
              boxShadow: "0 -5px 20px -5px hsl(var(--accent) / 0.5)",
            }}
          />
        ))}
      </div>

      {/* Pause Menu */}
      <div className="absolute inset-0 flex items-center justify-center z-40">
        <div className="bg-card/90 backdrop-blur-lg p-8 rounded-xl border border-accent/30 glowing-card text-center">
          <h2
            className="text-4xl font-headline text-accent mb-6"
            style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
          >
            Game Paused
          </h2>

          <div className="flex flex-col gap-4 min-w-[200px]">
            <Button
              size="lg"
              onClick={resumeGame}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-2" /> Resume
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => startGame()}
              className="border-accent text-accent hover:bg-accent/10"
            >
              <RotateCcw className="mr-2" /> Restart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={exitToMenu}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <Home className="mr-2" /> Exit to Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {gameState === "menu" && renderMenu()}
      {gameState === "playing" && renderGame()}
      {gameState === "paused" && renderPausedGame()}

      <AlertDialog open={gameState === "gameover"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-accent text-3xl">
              Game Over
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-lg">
              Your final score is:{" "}
              <span className="text-primary font-bold text-2xl">{score}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetGame();
                setGameState("menu");
              }}
            >
              Main Menu
            </Button>
            <AlertDialogAction onClick={startGame}>
              Play Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
