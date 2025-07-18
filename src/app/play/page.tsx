import GameClient from '@/components/game/GameClient';

export default function PlayPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background overflow-hidden">
      <GameClient />
    </div>
  );
}
