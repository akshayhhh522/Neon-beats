import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function ThemesPage() {
  const themes = [
    {
      name: 'Cyberpunk Neon',
      image: 'https://placehold.co/600x400.png',
      hint: 'cyberpunk neon',
      active: true,
    },
    {
      name: 'Cosmic Void',
      image: 'https://placehold.co/600x400.png',
      hint: 'galaxy space',
      active: false,
    },
    {
      name: 'Synthwave Sunset',
      image: 'https://placehold.co/600x400.png',
      hint: 'synthwave sunset',
      active: false,
    },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-background text-foreground">
      <Header title="Theme Gallery" />
      <main className="flex-1 w-full max-w-6xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme) => (
            <Card key={theme.name} className="bg-card border-accent/30 glowing-card overflow-hidden">
                <div className="relative">
                  <Image
                    src={theme.image}
                    alt={theme.name}
                    width={600}
                    height={400}
                    className="rounded-t-lg aspect-video object-cover"
                    data-ai-hint={theme.hint}
                  />
                  {theme.active && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground border-primary/50">Active</Badge>
                  )}
                </div>
              <CardContent className="p-4">
                <CardTitle className="text-2xl font-headline text-primary">{theme.name}</CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
