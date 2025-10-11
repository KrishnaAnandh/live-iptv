'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type Channel } from '@/lib/iptv';
import { Card, CardContent } from './ui/card';
import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelListOverlayProps {
  allChannels: Channel[];
  currentChannel: Channel;
  onClose: () => void;
}

const ChannelListOverlay = React.forwardRef<HTMLDivElement, ChannelListOverlayProps>(({ allChannels, currentChannel, onClose }, ref) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(currentChannel.index);
  const listRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const itemEl = document.getElementById(`channel-item-${selectedIndex}`);
    itemEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedIndex]);

  useEffect(() => {
    const itemEl = document.getElementById(`channel-item-${currentChannel.index}`);
    itemEl?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      switch (e.key) {
        case 'ArrowLeft':
          setSelectedIndex(prev => {
            const newIndex = Math.max(0, prev - 1);
            return allChannels[newIndex] ? newIndex : prev;
          });
          break;
        case 'ArrowRight':
          setSelectedIndex(prev => {
            const newIndex = Math.min(allChannels.length - 1, prev + 1);
            return allChannels[newIndex] ? newIndex : prev;
          });
          break;
        case 'Enter':
          const selectedChannel = allChannels.find(c => c.index === selectedIndex);
          if (selectedChannel) {
            router.push(`/channels/${selectedChannel.index}`);
            onClose();
          }
          break;
        case 'ArrowUp':
        case 'Backspace':
        case 'Escape':
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allChannels, onClose, router, selectedIndex, currentChannel.index]);


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 z-10" ref={ref}>
        <h2 className="text-xl font-bold text-white mb-4">Channels</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar" ref={listRef}>
            {allChannels.map((chan) => (
            <div 
                key={chan.id} 
                id={`channel-item-${chan.index}`} 
                onClick={() => {
                    router.push(`/channels/${chan.index}`);
                    onClose();
                }}
            >
                <Card
                className={cn(
                    'w-40 h-28 flex-shrink-0 cursor-pointer transition-all duration-200 bg-card/80 backdrop-blur-sm border-2',
                    selectedIndex === chan.index ? 'border-accent ring-2 ring-accent scale-105' : 'border-transparent',
                    currentChannel.index === chan.index && 'bg-primary/50'
                )}
                >
                <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
                    {chan.logo ? (
                    <Image 
                        src={chan.logo} 
                        alt={chan.name} 
                        width={80} 
                        height={45} 
                        className="object-contain max-h-12 w-auto" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    ) : (
                    <Tv className="w-10 h-10 mb-1 text-muted-foreground" />
                    )}
                    <p className="text-xs text-foreground truncate w-full mt-auto">{chan.name}</p>
                </CardContent>
                </Card>
            </div>
            ))}
        </div>
    </div>
  );
});

ChannelListOverlay.displayName = 'ChannelListOverlay';

export default ChannelListOverlay;
