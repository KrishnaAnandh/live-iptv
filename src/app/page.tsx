import { getChannels } from '@/lib/iptv';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default async function Home() {
  const channels = await getChannels();
  if (channels.length > 0) {
    redirect(`/channels/${channels[0].index}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-24">
      <h1 className="text-4xl font-bold mb-4">StreamDeck TV</h1>
      {channels.length === 0 ? (
          <p className="text-muted-foreground">Could not load channel list. Please try again later.</p>
      ) : (
        <div className="flex items-center text-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Loading channels...</p>
        </div>
      )}
    </main>
  );
}
