export type Tile = {
  id: number;
  lane: number;
  y: number;
  height: number;
};

export type Difficulty = "easy" | "medium" | "hard";

export type GameState = "menu" | "playing" | "paused" | "gameover";

export type HighScore = {
  id: string;
  songName: string;
  score: number;
  difficulty: Difficulty;
  date: string;
};

export type FeedbackEffect = {
  id: number;
  type: "hit" | "miss";
  lane: number;
  timestamp: number;
};

export type HitFeedback = {
  id: number;
  lane: number;
  score: number;
  timestamp: number;
  isPerfect?: boolean;
};
