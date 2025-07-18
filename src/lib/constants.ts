import { type Difficulty } from './types';

export const LANES = 4;
export const TILE_HEIGHT = 150;

// The area at the bottom where a tile can be successfully hit
export const HIT_ZONE_HEIGHT = 100;
export const GAME_AREA_BOTTOM_PADDING = 20;

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  { speed: number; spawnRate: number }
> = {
  easy: {
    speed: 4,
    spawnRate: 900, // ms
  },
  medium: {
    speed: 7,
    spawnRate: 550,
  },
  hard: {
    speed: 10,
    spawnRate: 350,
  },
};
