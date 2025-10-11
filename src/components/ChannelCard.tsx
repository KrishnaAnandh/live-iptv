
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { type Channel } from '@/lib/iptv';
import { Card, CardContent } from './ui/card';
import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ChannelCardProps {
    channel: Channel;
    isSelected: boolean;
    isCurrent: boolean;
    onClick: () => void;
    onMouseEnter?: () => void;
    view: 'list' | 'grid';
}

export const ChannelCard = ({ channel, isSelected, isCurrent, onClick, onMouseEnter, view }: ChannelCardProps) => {
  const baseCardClasses = 'cursor-pointer transition-all duration-200';
  const gridCardClasses = 'w-full aspect-[16/9] flex-shrink-0 bg-white/70 border-2 border-transparent';
  const listCardClasses = 'w-40 h-28 flex-shrink-0 bg-white opacity-80 border-2 border-transparent';

  const selectedGridClasses = 'scale-110 bg-white';
  const selectedListClasses = 'scale-110 opacity-100 shadow-lg ring-2 ring-accent';

  return (
    <div
      id={`channel-item-${channel.id}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(view === 'list' && 'w-44 p-2')}
    >
      <Card
        className={cn(
          baseCardClasses,
          view === 'grid' ? gridCardClasses : listCardClasses,
          isSelected && (view === 'grid' ? selectedGridClasses : selectedListClasses),
          isCurrent && view === 'grid' && 'ring-1 ring-accent'
        )}
      >
        <CardContent className="flex flex-col items-center justify-center h-full p-2 text-center relative overflow-hidden">
          <div className='grow flex items-center justify-center'>
            <ChannelImage channel={channel} />
          </div>
          <p className="text-xs text-black truncate w-full mt-auto">{channel.name}</p>
          {isCurrent && (
            <span className="absolute top-2 right-2 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-600/70 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-pink-600"></span>
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
