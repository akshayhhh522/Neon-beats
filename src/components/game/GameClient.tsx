
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import useLocalStorage from '@/hooks/useLocalStorage';
import { DIFFICULTY_SETTINGS, LANES, TILE_HEIGHT, HIT_ZONE_HEIGHT, GAME_AREA_BOTTOM_PADDING } from '@/lib/constants';
import type { Tile, Difficulty, GameState, HighScore } from '@/lib/types';
import { Play } from 'lucide-react';

export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [highScores, setHighScores] = useLocalStorage<HighScore[]>('highscores', []);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const difficultyRef = useRef(difficulty);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  const saveScore = useCallback(() => {
    if (scoreRef.current > 0) {
      const newHighScore: HighScore = {
        id: crypto.randomUUID(),
        songName: 'Random Mode',
        score: scoreRef.current,
        difficulty: difficultyRef.current,
        date: new Date().toISOString(),
      };
      setHighScores(prev => [...prev, newHighScore]);
    }
  }, [setHighScores]);

  const stopGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = undefined;
    }
    saveScore();
    setGameState('gameover');
  }, [saveScore]);
  
  const handleLaneClick = useCallback((laneIndex: number) => {
    if (gameState !== 'playing' || !gameAreaRef.current) return;

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
      setTiles(currentTiles => currentTiles.filter(t => t.id !== targetTileId));
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore(prevScore => prevScore + 10 + newCombo);
    } else {
      setCombo(0);
    }
  }, [tiles, combo, gameState]);


  const resetGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setTiles([]);
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
    }
  }, []);

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') {
      return;
    }

    lastSpawnTimeRef.current = performance.now();
    
    const gameLoop = () => {
      if (!gameAreaRef.current) return;

      const gameAreaHeight = gameAreaRef.current.clientHeight;
      const currentSettings = DIFFICULTY_SETTINGS[difficulty];
      let tileMissed = false;
  
      setTiles(prevTiles => {
        const updatedTiles = prevTiles.map(tile => ({ ...tile, y: tile.y + currentSettings.speed }));
        return updatedTiles.filter(tile => {
          if (tile.y > gameAreaHeight) {
            tileMissed = true;
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
          
          setTiles(prevTiles => {
              if (difficulty !== 'hard' && prevTiles.length > 0) {
                  const lastTile = prevTiles[prevTiles.length -1];
                  if (lastTile?.lane === newLane) {
                      newLane = (newLane + 1) % LANES;
                  }
              }
              return [
                  ...prevTiles,
                  { id: now, lane: newLane, y: -TILE_HEIGHT, height: TILE_HEIGHT },
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
  }, [gameState, difficulty, stopGame]);
  
  const renderMenu = () => (
    <div className="bg-card/80 backdrop-blur-lg p-8 rounded-xl border border-accent/30 glowing-card w-full max-w-md text-center">
      <h2 className="text-4xl font-headline text-accent mb-6" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>Game Setup</h2>
      
      <div className="mb-8">
        <Label className="text-lg text-primary mb-3 block">Difficulty</Label>
        <RadioGroup defaultValue="medium" value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)} className="flex justify-center gap-4">
          <Label htmlFor="easy" className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="easy" id="easy" /> Easy
          </Label>
          <Label htmlFor="medium" className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="medium" id="medium" /> Medium
          </Label>
          <Label htmlFor="hard" className="flex items-center gap-2 cursor-pointer p-3 rounded-md border-2 border-transparent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="hard" id="hard" /> Hard
          </Label>
        </RadioGroup>
      </div>

      <Button size="lg" onClick={startGame} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-bold h-14">
        <Play className="mr-2" /> Start
      </Button>
    </div>
  );

  const renderGame = () => (
    <div className="relative w-full h-full" ref={gameAreaRef}>
      {/* Score and Combo */}
      <div className="absolute top-4 left-4 text-left z-10 text-primary" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
        <p className="text-4xl font-bold">{score}</p>
        <p className="text-2xl text-accent" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>x{combo}</p>
      </div>

      {/* Game Lanes */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: LANES }).map((_, i) => (
          <div key={i} className="flex-1 border-x border-primary/20" />
        ))}
      </div>
      
      {/* Tiles */}
      {tiles.map(tile => (
        <div
          key={tile.id}
          className="absolute bg-primary rounded-md"
          style={{
            left: `${(tile.lane / LANES) * 100}%`,
            width: `${100 / LANES}%`,
            top: tile.y,
            height: tile.height,
            boxShadow: '0 0 15px hsl(var(--primary))',
          }}
        />
      ))}

      {/* Hit Zone and Click Handlers */}
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: `${HIT_ZONE_HEIGHT + GAME_AREA_BOTTOM_PADDING}px`}}>
        {Array.from({ length: LANES }).map((_, i) => (
          <div
            key={i}
            className="flex-1 cursor-pointer border-t-2 border-accent/50 rounded-t-lg transition-colors hover:bg-accent/20 active:bg-accent/40"
            style={{
                boxShadow: '0 -5px 20px -5px hsl(var(--accent) / 0.5)',
            }}
            onClick={() => handleLaneClick(i)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      
      <AlertDialog open={gameState === 'gameover'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-accent text-3xl">Game Over</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-lg">
              Your final score is: <span className="text-primary font-bold text-2xl">{score}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { resetGame(); setGameState('menu'); }}>Main Menu</Button>
            <AlertDialogAction onClick={startGame}>Play Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
