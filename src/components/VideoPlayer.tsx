'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import { type Channel } from '@/lib/iptv';
import { useFavorites } from '@/hooks/use-favorites';
import { Button } from './ui/button';
import { Star, Loader2, AlertTriangle } from 'lucide-react';
import ChannelListOverlay from './ChannelListOverlay';
import { cn } from '@/lib/utils';

export default function VideoPlayer({ channel, allChannels }: { channel: Channel; allChannels: Channel[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showUi, setShowUi] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  const bringUpUi = useCallback(() => {
    setShowUi(true);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => setShowUi(false), 5000);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          console.warn('Video playback failed to start automatically.');
        });
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setError('This stream is currently unavailable.');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {
            console.warn('Video playback failed to start automatically.');
        });
      });
    }

    const onCanPlay = () => setIsLoading(false);
    video.addEventListener('canplay', onCanPlay);

    bringUpUi();

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('canplay', onCanPlay);
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [channel.url, bringUpUi]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showChannelList) return;
    
    bringUpUi();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShowChannelList(true);
        break;
      case ' ': // Space or Play/Pause button
      case 'MediaPlayPause':
        e.preventDefault();
        videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
        break;
      case 'ArrowLeft':
      case 'MediaTrackPrevious':
        e.preventDefault();
        const prevIndex = Math.max(0, channel.index - 1);
        router.push(`/channels/${prevIndex}`);
        break;
      case 'ArrowRight':
      case 'MediaTrackNext':
        e.preventDefault();
        const nextIndex = Math.min(allChannels.length - 1, channel.index + 1);
        router.push(`/channels/${nextIndex}`);
        break;
    }
  }, [bringUpUi, showChannelList, channel.index, allChannels.length, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleFavorite = () => {
    isFavorite(channel.id) ? removeFavorite(channel.id) : addFavorite(channel.id);
    bringUpUi();
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center" onMouseMove={bringUpUi}>
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />
      
      <div className={cn("fixed inset-0 transition-opacity duration-500 pointer-events-none", showUi ? 'opacity-100' : 'opacity-0')}>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute top-6 right-6 pointer-events-auto">
          <Button onClick={toggleFavorite} variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50">
            <Star className={cn("w-6 h-6 transition-colors", isFavorite(channel.id) ? 'fill-accent text-accent' : 'text-white')} />
          </Button>
        </div>
        
        <div className="absolute top-6 left-6 text-white max-w-lg">
          <h1 className="text-3xl font-bold font-headline">{channel.name}</h1>
          <p className="text-lg text-muted-foreground">{channel.group}</p>
        </div>
      </div>

      {(isLoading || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
          {isLoading && <Loader2 className="h-16 w-16 animate-spin text-accent" />}
          {error && !isLoading && (
            <>
              <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-xl">{error}</p>
            </>
          )}
        </div>
      )}

      {showChannelList && (
        <ChannelListOverlay
          allChannels={allChannels}
          currentChannel={channel}
          onClose={() => setShowChannelList(false)}
        />
      )}
    </div>
  );
}
