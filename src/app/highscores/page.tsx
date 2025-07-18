"use client";

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useLocalStorage from '@/hooks/useLocalStorage';
import { type HighScore } from '@/lib/types';
import { Trash2 } from 'lucide-react';

export default function HighscoresPage() {
  const [highScores, setHighScores] = useLocalStorage<HighScore[]>('highscores', []);

  const clearScores = () => {
    setHighScores([]);
  };

  const sortedScores = [...highScores].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-background text-foreground">
      <Header title="High Scores" />
      <main className="flex-1 w-full max-w-4xl p-8">
        <Card className="bg-card border-primary/30 glowing-card" style={{ '--border': 'hsl(var(--primary))' } as React.CSSProperties}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary">Leaderboard</CardTitle>
            {sortedScores.length > 0 && (
              <Button variant="destructive" size="sm" onClick={clearScores}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sortedScores.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-accent/20 hover:bg-transparent">
                      <TableHead className="text-accent">Rank</TableHead>
                      <TableHead className="text-accent">Score</TableHead>
                      <TableHead className="text-accent">Song</TableHead>
                      <TableHead className="text-accent">Difficulty</TableHead>
                      <TableHead className="text-accent text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedScores.map((score, index) => (
                      <TableRow key={score.id} className="border-primary/20">
                        <TableCell className="font-medium text-lg text-primary">{index + 1}</TableCell>
                        <TableCell className="font-bold text-xl">{score.score.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">{score.songName}</TableCell>
                        <TableCell className="capitalize">{score.difficulty}</TableCell>
                        <TableCell className="text-right">{new Date(score.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">No high scores yet.</p>
                <p>Play a game to see your name in lights!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
