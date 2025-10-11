'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { type Channel } from '@/lib/iptv';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Tv, ChevronDown, ArrowLeft, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import type { OverlayState } from './VideoPlayer';
import VirtualizedGrid from './VirtualizedGrid';

interface ChannelListOverlayProps {
  allChannels: Channel[];
  currentChannel: Channel;
  favoriteChannelIds: string[];
  initialState: OverlayState;
  setOverlayState: (state: OverlayState) => void;
}

export const ChannelImage = ({ channel }: { channel: Channel }) => {
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

const ChannelListOverlay = ({ allChannels, currentChannel, favoriteChannelIds, initialState, setOverlayState }: ChannelListOverlayProps) => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(currentChannel.index);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const favoriteChannels = useMemo(() => {
    const favMap = new Map(allChannels.filter(c => favoriteChannelIds.includes(c.id)).map(c => [c.id, c]));
    return favoriteChannelIds.map(id => favMap.get(id)).filter(Boolean) as Channel[];
  }, [allChannels, favoriteChannelIds]);
  
  const channelsForQuickAccess = useMemo(() => {
    return favoriteChannels.length > 0 ? favoriteChannels : allChannels.slice(0, 20);
  }, [allChannels, favoriteChannels]);
  
  const { favoriteItems, nonFavoriteItems } = useMemo(() => {
    let sourceChannels = allChannels;
    if (searchTerm) {
        sourceChannels = allChannels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const favoriteSet = new Set(favoriteChannelIds);
    const favs = sourceChannels.filter(c => favoriteSet.has(c.id));
    const nonFavs = sourceChannels.filter(c => !favoriteSet.has(c.id));

    // Re-order favorites based on favoriteChannelIds if not searching
    const orderedFavs = searchTerm ? favs : favoriteChannels.filter(c => favs.some(f => f.id === c.id));

    return { favoriteItems: orderedFavs, nonFavoriteItems: nonFavs };
  }, [allChannels, favoriteChannelIds, searchTerm, favoriteChannels]);

  useEffect(() => {
    if (initialState === 'grid') {
      searchInputRef.current?.focus();
    }
  }, [initialState]);

  useEffect(() => {
    const channels = initialState === 'list' ? channelsForQuickAccess : [...favoriteItems, ...nonFavoriteItems];
    const selectedId = channels.find(c => c.index === selectedIndex)?.id || channels[0]?.id;
    const itemEl = document.getElementById(`channel-item-${selectedId}`);
    itemEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedIndex, initialState, channelsForQuickAccess, favoriteItems, nonFavoriteItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const close = () => setOverlayState('hidden');
      const activeChannels = channelsForQuickAccess;

      if (initialState === 'list') {
        e.preventDefault();
        e.stopPropagation();
        switch (e.key) {
          case 'ArrowLeft':
            setSelectedIndex(prev => {
              const currentIndex = activeChannels.findIndex(c => c.index === prev);
              const newIndex = Math.max(0, currentIndex - 1);
              return activeChannels[newIndex]?.index ?? prev;
            });
            break;
          case 'ArrowRight':
            setSelectedIndex(prev => {
                const currentIndex = activeChannels.findIndex(c => c.index === prev);
                const newIndex = Math.min(activeChannels.length - 1, currentIndex + 1);
                return activeChannels[newIndex]?.index ?? prev;
            });
            break;
          case 'Enter':
            const selectedChannel = activeChannels.find(c => c.index === selectedIndex);
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
        const gridChannels = [...favoriteItems, ...nonFavoriteItems];
        const currentItemIndex = gridChannels.findIndex(c => c.index === selectedIndex);

        const getNumColumns = () => {
            if (window.innerWidth >= 1536) return 7;
            if (window.innerWidth >= 1280) return 6;
            if (window.innerWidth >= 1024) return 5;
            if (window.innerWidth >= 768) return 4;
            if (window.innerWidth >= 640) return 3;
            return 2;
        };

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                const numColumns = getNumColumns();
                let nextIndex = -1;

                if (e.key === 'ArrowUp') {
                    nextIndex = Math.max(0, currentItemIndex - numColumns);
                } else if (e.key === 'ArrowDown') {
                    nextIndex = Math.min(gridChannels.length - 1, currentItemIndex + numColumns);
                } else if (e.key === 'ArrowLeft') {
                    nextIndex = Math.max(0, currentItemIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    nextIndex = Math.min(gridChannels.length - 1, currentItemIndex + 1);
                }

                if (nextIndex !== -1 && gridChannels[nextIndex]) {
                    setSelectedIndex(gridChannels[nextIndex].index);
                }
                break;
            case 'Backspace':
                if (searchTerm === '') {
                  e.preventDefault();
                  e.stopPropagation();
                  close();
                }
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                close();
                break;
            case 'Enter':
                e.preventDefault();
                e.stopPropagation();
                const selectedChannel = gridChannels.find(c => c.index === selectedIndex);
                if (selectedChannel) {
                  router.push(`/channels/${selectedChannel.index}`);
                  close();
                }
                break;
        }
      }
    };
    
    const eventOptions = { capture: true };

    window.addEventListener('keydown', handleKeyDown, eventOptions);
    return () => window.removeEventListener('keydown', handleKeyDown, eventOptions);
    
  }, [channelsForQuickAccess, router, selectedIndex, initialState, searchTerm, setOverlayState, favoriteItems, nonFavoriteItems]);

  const selectChannel = (channel: Channel) => {
    router.push(`/channels/${channel.index}`);
    setOverlayState('hidden');
  }

  const renderChannelCard = (chan: Channel) => (
    <div 
        key={chan.id} 
        id={`channel-item-${chan.id}`} 
        onClick={() => selectChannel(chan)}
    >
        <Card
        className={cn(
            'w-full aspect-[16/9] flex-shrink-0 cursor-pointer transition-all duration-200 bg-white/70 border-2 border-transparent',
            selectedIndex === chan.index && 'scale-110 bg-white' ,
            currentChannel.index === chan.index && 'ring-1 ring-accent'
        )}
        onMouseEnter={() => setSelectedIndex(chan.index)}
        >
        <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
            <ChannelImage channel={chan} />
            <p className="text-xs text-black truncate w-full mt-auto">{chan.name}</p>
        </CardContent>
        </Card>
    </div>
  );

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/80 backdrop-blur-sm z-10 transition-all duration-300 ease-in-out",
        initialState === 'list' ? 'bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-none' : 'p-4 sm:p-8'
      )}
    >
        {initialState === 'list' && (
            <div className="fixed bottom-0 left-0 right-0 p-4">
                <h2 className="text-xl font-bold text-white mb-4">
                  {favoriteChannels.length > 0 ? 'Favorite Channels' : 'Channels'}
                </h2>
                <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar p-8 -m-8" ref={listRef}>
                    {channelsForQuickAccess.map((chan) => (
                    <div 
                        key={chan.id} 
                        id={`channel-item-${chan.id}`} 
                        onClick={() => selectChannel(chan)}
                        className="w-40"
                    >
                        <Card
                        className={cn(
                            'w-40 h-28 flex-shrink-0 cursor-pointer transition-all duration-200 bg-white/70 border-2 border-transparent',
                            selectedIndex === chan.index ? 'scale-110' : 'scale-100',
                            currentChannel.index === chan.index && 'bg-white ring-2 ring-accent'
                        )}
                        >
                        <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
                            <ChannelImage channel={chan} />
                            <p className="text-xs text-black truncate w-full mt-auto">{chan.name}</p>
                            {currentChannel.index === chan.index && <span className="absolute w-3 h-3 bg-red-500 rounded-full top-2 right-2 animate-pulse duration-4000" />}
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
            <div className="flex flex-col h-full w-full" tabIndex={-1}>
                <div className="flex items-center mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-4 text-white hover:bg-white/10"
                        onClick={() => setOverlayState('hidden')}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search channels..."
                        className="w-full sm:w-1/2 lg:w-1/3 bg-black/50 text-white border-gray-600 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar -mr-2">
                    <VirtualizedGrid
                        favoriteItems={favoriteItems}
                        nonFavoriteItems={nonFavoriteItems}
                        renderItem={renderChannelCard}
                        itemHeight={120} // Approximate height of a card, adjust as needed
                        gap={16}
                        renderSeparator={() => (
                            <div className="col-span-full flex items-center my-4">
                                <Star className="w-5 h-5 text-accent mr-2" />
                                <h3 className="text-lg font-semibold text-white">Favorites</h3>
                            </div>
                        )}
                        renderAfterFavorites={() => (
                             <div className="col-span-full">
                                <Separator className="my-6 bg-border/50" />
                            </div>
                        )}
                    />
                </div>
            </div>
        )}
    </div>
  );
};

export default ChannelListOverlay;
