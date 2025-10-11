import { getChannels } from '@/lib/iptv';
import VideoPlayer from '@/components/VideoPlayer';
import { notFound } from 'next/navigation';

type Props = {
  params: { index: string };
};

export default async function ChannelPage({ params }: Props) {
  const channelIndex = parseInt(params.index, 10);
  if (isNaN(channelIndex)) {
    notFound();
  }

  const channels = await getChannels();
  const channel = channels.find(c => c.index === channelIndex);

  if (!channel) {
    notFound();
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <VideoPlayer channel={channel} allChannels={channels} />
    </main>
  );
}

export async function generateStaticParams() {
  try {
    const channels = await getChannels();
    return channels.map((channel) => ({
      index: channel.index.toString(),
    }));
  } catch (error) {
    console.error("Failed to generate static params:", error);
    return [];
  }
}

export const dynamicParams = true;
