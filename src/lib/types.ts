
export type Tile = {
  id: number;
  lane: number;
  y: number;
  height: number;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameState = 'menu' | 'playing' | 'gameover';

export type HighScore = {
  id: string;
  songName: string;
  score: number;
  difficulty: Difficulty;
  date: string;
};
