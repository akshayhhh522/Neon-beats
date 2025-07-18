import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  return (
    <header className="w-full p-4 flex items-center justify-between border-b border-primary/20 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <Link href="/" passHref>
        <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Menu
        </Button>
      </Link>
      <h1 className="text-3xl font-headline font-bold text-accent" style={{ textShadow: '0 0 10px hsl(var(--accent))' }}>
        {title}
      </h1>
      <div className="w-48" />
    </header>
  );
}
