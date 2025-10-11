'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type Channel } from '@/lib/iptv';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Tv, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OverlayState } from './VideoPlayer';

interface ChannelListOverlayProps {
  allChannels: Channel[];
  currentChannel: Channel;
  initialState: OverlayState;
  setOverlayState: (state: OverlayState) => void;
}

const ChannelImage = ({ channel }: { channel: Channel }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(channel.logo);

  useEffect(() => {
    setImgSrc(channel.logo);
  }, [channel.logo]);

  if (imgSrc) {
    return (
      <Image
        src={imgSrc}
        alt={channel.name}
        width={80}
        height={45}
        className="object-contain max-h-12 w-auto"
        onError={() => setImgSrc(null)}
      />
    );
  }

  return <Tv className="w-10 h-10 mb-1 text-muted-foreground" />;
};

const ChannelListOverlay = ({ allChannels, currentChannel, initialState, setOverlayState }: ChannelListOverlayProps) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(currentChannel.index);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredChannels = useMemo(() => {
    if (!searchTerm) return allChannels;
    return allChannels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allChannels, searchTerm]);

  useEffect(() => {
    if (initialState === 'grid') {
      searchInputRef.current?.focus();
    }
  }, [initialState]);

  useEffect(() => {
    const selectedId = filteredChannels.find(c => c.index === selectedIndex)?.id || filteredChannels[0]?.id;
    const itemEl = document.getElementById(`channel-item-${selectedId}`);
    itemEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedIndex, filteredChannels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const close = () => setOverlayState('hidden');

      if (initialState === 'list') {
        switch (e.key) {
          case 'ArrowLeft':
            setSelectedIndex(prev => {
              const currentIndex = allChannels.findIndex(c => c.index === prev);
              const newIndex = Math.max(0, currentIndex - 1);
              return allChannels[newIndex]?.index ?? prev;
            });
            break;
          case 'ArrowRight':
            setSelectedIndex(prev => {
                const currentIndex = allChannels.findIndex(c => c.index === prev);
                const newIndex = Math.min(allChannels.length - 1, currentIndex + 1);
                return allChannels[newIndex]?.index ?? prev;
            });
            break;
          case 'Enter':
            const selectedChannel = allChannels.find(c => c.index === selectedIndex);
            if (selectedChannel) {
              router.push(`/channels/${selectedChannel.index}`);
              close();
            }
            break;
          case 'ArrowDown':
            setOverlayState('grid');
            break;
          case 'ArrowUp':
          case 'Backspace':
          case 'Escape':
            close();
            break;
        }
      } else if (initialState === 'grid') {
        switch (e.key) {
          case 'Backspace':
            if (searchTerm === '') close();
            break;
          case 'Escape':
            close();
            break;
          case 'ArrowUp':
            // Logic to move selection up in the grid
            break;
          case 'ArrowDown':
            // Logic to move selection down in the grid
            break;
          case 'ArrowLeft':
            // Logic to move selection left in the grid
            break;
          case 'ArrowRight':
            // Logic to move selection right in the grid
            break;
          case 'Enter':
            const selectedChannel = allChannels.find(c => c.index === selectedIndex);
            if (selectedChannel) {
              router.push(`/channels/${selectedChannel.index}`);
              close();
            }
            break;
        }
      }
    };

    if (initialState !== 'grid') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
        const gridElement = gridRef.current;
        if(gridElement) {
            gridElement.addEventListener('keydown', handleKeyDown);
            return () => gridElement.removeEventListener('keydown', handleKeyDown);
        }
    }
  }, [allChannels, router, selectedIndex, initialState, searchTerm, setOverlayState]);

  const selectChannel = (channel: Channel) => {
    router.push(`/channels/${channel.index}`);
    setOverlayState('hidden');
  }

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/80 backdrop-blur-sm z-10 transition-all duration-300 ease-in-out",
        initialState === 'list' ? 'bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-none' : 'p-4 sm:p-8'
      )}
    >
        {initialState === 'list' && (
            <div className="fixed bottom-0 left-0 right-0 p-4">
                <h2 className="text-xl font-bold text-white mb-4">Channels</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar" ref={listRef}>
                    {allChannels.slice(0, 20).map((chan) => (
                    <div 
                        key={chan.id} 
                        id={`channel-item-${chan.id}`} 
                        onClick={() => selectChannel(chan)}
                    >
                        <Card
                        className={cn(
                            'w-40 h-28 flex-shrink-0 cursor-pointer transition-all duration-200 bg-card/80 border-2',
                            selectedIndex === chan.index ? 'border-accent ring-2 ring-accent scale-105' : 'border-transparent',
                            currentChannel.index === chan.index && 'bg-primary/50'
                        )}
                        >
                        <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
                            <ChannelImage channel={chan} />
                            <p className="text-xs text-foreground truncate w-full mt-auto">{chan.name}</p>
                        </CardContent>
                        </Card>
                    </div>
                    ))}
                </div>
                <div className="flex justify-center items-center mt-2 text-sm text-muted-foreground animate-pulse">
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Explore Channels
                </div>
            </div>
        )}

        {initialState === 'grid' && (
            <div className="flex flex-col h-full w-full" ref={gridRef}>
                <div className="mb-4">
                    <Input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search channels..."
                        className="w-full sm:w-1/2 lg:w-1/3 mx-auto bg-black/50 text-white border-gray-600 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {filteredChannels.map(chan => (
                            <div 
                                key={chan.id} 
                                id={`channel-item-${chan.id}`} 
                                onClick={() => selectChannel(chan)}
                            >
                                <Card
                                className={cn(
                                    'w-full aspect-[16/9] flex-shrink-0 cursor-pointer transition-all duration-200 bg-card/80 border-2',
                                    selectedIndex === chan.index ? 'border-accent ring-2 ring-accent scale-105' : 'border-transparent',
                                    currentChannel.index === chan.index && 'bg-primary/50'
                                )}
                                onMouseEnter={() => setSelectedIndex(chan.index)}
                                >
                                <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
                                    <ChannelImage channel={chan} />
                                    <p className="text-xs text-foreground truncate w-full mt-auto">{chan.name}</p>
                                </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ChannelListOverlay;
