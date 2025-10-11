"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

const getNumColumns = () => {
  if (typeof window === 'undefined') return 6;
  if (window.innerWidth >= 1536) return 7;
  if (window.innerWidth >= 1280) return 6;
  if (window.innerWidth >= 1024) return 5;
  if (window.innerWidth >= 768) return 4;
  if (window.innerWidth >= 640) return 3;
  return 2;
};

interface VirtualizedGridProps<T> {
  items: T[];
  numFavorites: number;
  renderItem: (item: T) => React.ReactNode;
  itemHeight: number;
  gap: number;
  renderSeparator?: () => React.ReactNode;
  renderAfterFavorites?: () => React.ReactNode;
}

const VirtualizedGrid = <T extends { id: string | number }>({
  items,
  numFavorites,
  renderItem,
  itemHeight,
  gap,
  renderSeparator,
  renderAfterFavorites,
}: VirtualizedGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback(() => {
    setNumColumns(getNumColumns());
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const separatorHeight = numFavorites > 0 && renderSeparator ? 80 : 0;
  const afterFavoritesHeight = numFavorites > 0 && renderAfterFavorites ? 50 : 0;
  
  const containerHeight = containerRef.current?.clientHeight || 0;
  const fullItemHeight = itemHeight + gap;

  // Calculate total height
  const numFavoriteRows = Math.ceil(numFavorites / numColumns);
  const numNonFavoriteRows = Math.ceil((items.length - numFavorites) / numColumns);
  const totalHeight = (numFavoriteRows + numNonFavoriteRows) * fullItemHeight + separatorHeight + afterFavoritesHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / fullItemHeight) * numColumns - numColumns);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / fullItemHeight) * numColumns + numColumns);

  const itemsToRender = [];

  const favoriteItems = items.slice(0, numFavorites);
  const nonFavoriteItems = items.slice(numFavorites);

  const hasFavorites = numFavorites > 0;
  
  // Separator
  if (hasFavorites && renderSeparator) {
    itemsToRender.push(<div key="separator" style={{ position: 'absolute', top: 0, width: '100%' }}>{renderSeparator()}</div>);
  }

  // Render logic
  const renderItems = (itemsToProcess: T[], isFavorite: boolean) => {
    const baseRowOffset = isFavorite ? separatorHeight : (Math.ceil(numFavorites / numColumns) * fullItemHeight) + separatorHeight + afterFavoritesHeight;
    const baseIndexOffset = isFavorite ? 0 : numFavorites;

    for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const globalIndex = i + baseIndexOffset;

        if (globalIndex >= startIndex && globalIndex <= endIndex) {
            const rowIndex = Math.floor(i / numColumns);
            const colIndex = i % numColumns;
            const yPos = baseRowOffset + rowIndex * fullItemHeight;
            const xPos = `${(100 / numColumns) * colIndex}%`;

            itemsToRender.push(
                <div
                    key={item.id}
                    className="absolute"
                    style={{
                        top: yPos,
                        left: xPos,
                        width: `${100 / numColumns}%`,
                        height: itemHeight,
                        padding: `${gap / 2}px`,
                    }}
                >
                    {renderItem(item)}
                </div>
            );
        }
    }
  }
  
  renderItems(favoriteItems, true);

  if (hasFavorites && renderAfterFavorites) {
    const afterFavsY = separatorHeight + Math.ceil(numFavorites / numColumns) * fullItemHeight;
    itemsToRender.push(
        <div key="after-favorites" style={{ position: 'absolute', top: afterFavsY, width: '100%', padding: `0 ${gap/2}px` }}>
            {renderAfterFavorites()}
        </div>
    );
  }

  renderItems(nonFavoriteItems, false);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto relative no-scrollbar"
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {itemsToRender}
      </div>
    </div>
  );
};

export default VirtualizedGrid;
