"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  numFavorites: number;
  renderItem: (item: T) => React.ReactNode;
  itemHeight: number;
  itemWidth: number;
  gap: number;
  renderSeparator?: () => React.ReactNode;
  renderAfterFavorites?: () => React.ReactNode;
}

const VirtualizedGrid = <T extends { id: string | number }>({
  items,
  numFavorites,
  renderItem,
  itemHeight,
  itemWidth,
  gap,
  renderSeparator,
  renderAfterFavorites,
}: VirtualizedGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [numColumns, setNumColumns] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateLayout = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
      setNumColumns(Math.floor(window.innerWidth / itemWidth));
    }
  }, [itemWidth]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const separatorHeight = numFavorites > 0 && renderSeparator ? 40 : 0;
  const afterFavoritesHeight = numFavorites > 0 && renderAfterFavorites ? 50 : 0;
  
  const fullItemHeight = itemHeight + gap;

  const numFavoriteRows = Math.ceil(numFavorites / numColumns);
  const favoriteSectionHeight = numFavoriteRows * fullItemHeight;
  const numNonFavoriteRows = Math.ceil((items.length - numFavorites) / numColumns);
  const totalHeight = favoriteSectionHeight + separatorHeight + afterFavoritesHeight + (numNonFavoriteRows * fullItemHeight);

  const startIndex = Math.max(0, Math.floor(scrollTop / fullItemHeight) * numColumns - numColumns);
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + windowHeight) / fullItemHeight) * numColumns + numColumns);

  const itemsToRender = [];

  const favoriteItems = items.slice(0, numFavorites);
  const nonFavoriteItems = items.slice(numFavorites);
  const hasFavorites = numFavorites > 0;
  
  if (hasFavorites && renderSeparator) {
    itemsToRender.push(<div key="separator" className="w-full" style={{ height: separatorHeight }}>{renderSeparator()}</div>);
  }

  const renderItems = (itemsToProcess: T[], isFavorite: boolean) => {
    const baseRowOffset = isFavorite ? separatorHeight : favoriteSectionHeight + separatorHeight + afterFavoritesHeight;
    const baseIndexOffset = isFavorite ? 0 : numFavorites;

    const rows = [];
    for (let i = 0; i < itemsToProcess.length; i += numColumns) {
        const rowItems = itemsToProcess.slice(i, i + numColumns);
        const rowIndex = Math.floor(i / numColumns);
        const globalStartIndex = baseIndexOffset + i;
        const globalEndIndex = globalStartIndex + rowItems.length -1;

        if ((globalStartIndex >= startIndex && globalStartIndex <= endIndex) || (globalEndIndex >= startIndex && globalEndIndex <= endIndex)) {
            rows.push(
                <div key={`${isFavorite ? 'fav' : 'nonfav'}-row-${rowIndex}`} className="flex" style={{ top: baseRowOffset + rowIndex * fullItemHeight, height: fullItemHeight, position: 'absolute', width: '100%'}}>
                    {rowItems.map((item) => (
                       <div key={item.id} style={{width: `${100/numColumns}%`}}>{renderItem(item)}</div>
                    ))}
                </div>
            );
        }
    }
    return rows;
  }
  
  itemsToRender.push(...renderItems(favoriteItems, true));

  if (hasFavorites && renderAfterFavorites) {
    const afterFavsY = separatorHeight + favoriteSectionHeight;
    itemsToRender.push(
        <div key="after-favorites" style={{ position: 'absolute', top: afterFavsY, width: '100%', height: afterFavoritesHeight }}>
            {renderAfterFavorites()}
        </div>
    );
  }

  itemsToRender.push(...renderItems(nonFavoriteItems, false));

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
