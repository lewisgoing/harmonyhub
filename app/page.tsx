import dynamic from 'next/dynamic';

// Import the default export from PlayerContainer directly
const MusicPlayer = dynamic(
  () => import('@/components/music-player/PlayerContainer'),
  { ssr: false }
);

export default function Page() {
  return (
    <div className="min-h-screen p-4 flex flex-col justify-center items-center bg-neutral-50">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Hearing Heroes</h1>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <MusicPlayer />
      </main>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Hearing Heroes. All rights reserved.</p>
      </footer>
    </div>
  );
}