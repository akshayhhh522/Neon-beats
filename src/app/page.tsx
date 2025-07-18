import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, Palette, Trophy } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="relative text-center">
        <h1
          className="text-7xl md:text-9xl font-headline font-bold text-primary"
          style={{ textShadow: '0 0 15px hsl(var(--primary)), 0 0 25px hsl(var(--primary))' }}
        >
          Neon Beats
        </h1>
        <p className="text-accent mt-4 text-lg md:text-xl" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>
          Tap to the rhythm of the cyber-future.
        </p>
      </div>
      <nav className="mt-16 flex flex-col sm:flex-row gap-6">
        <Link href="/play" passHref>
          <Button
            size="lg"
            className="w-64 border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary glowing-button"
            variant="outline"
          >
            <Gamepad2 className="mr-2" />
            Start Game
          </Button>
        </Link>
        <Link href="/themes" passHref>
          <Button
            size="lg"
            className="w-64 border-2 border-accent text-accent hover:bg-accent/10 hover:text-accent glowing-button"
            style={{'--border': 'hsl(var(--accent))'} as React.CSSProperties}
            variant="outline"
          >
            <Palette className="mr-2" />
            Theme Gallery
          </Button>
        </Link>
        <Link href="/highscores" passHref>
          <Button
            size="lg"
            className="w-64 border-2 glowing-button"
            variant="outline"
          >
            <Trophy className="mr-2" />
            High Scores
          </Button>
        </Link>
      </nav>
    </div>
  );
}
