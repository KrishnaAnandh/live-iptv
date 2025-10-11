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
  favoriteItems: T[];
  nonFavoriteItems: T[];
  renderItem: (item: T) => React.ReactNode;
  itemHeight: number;
  gap: number;
  renderSeparator?: () => React.ReactNode;
  renderAfterFavorites?: () => React.ReactNode;
}

const VirtualizedGrid = <T extends { id: string | number }>({
  favoriteItems,
  nonFavoriteItems,
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
  
  const separatorHeight = 80;
  const afterFavoritesHeight = 50;

  const hasFavorites = favoriteItems.length > 0;
  const hasSeparator = hasFavorites && renderSeparator;
  const hasAfterFavorites = hasFavorites && renderAfterFavorites;

  const containerHeight = containerRef.current?.clientHeight || 0;
  
  // Calculate the total height
  let totalHeight = 0;
  if (hasFavorites) {
      if(hasSeparator) totalHeight += separatorHeight;
      const favoriteRows = Math.ceil(favoriteItems.length / numColumns);
      totalHeight += favoriteRows * (itemHeight + gap);
      if(hasAfterFavorites) totalHeight += afterFavoritesHeight;
  }

  if (nonFavoriteItems.length > 0) {
      const nonFavoriteRows = Math.ceil(nonFavoriteItems.length / numColumns);
      totalHeight += nonFavoriteRows * (itemHeight + gap);
  }

  // Calculate visible items
  const itemsToRender = [];
  let yOffset = 0;

  if (hasSeparator) {
      if (yOffset + separatorHeight > scrollTop - containerHeight && yOffset < scrollTop + containerHeight) {
          itemsToRender.push(
              <div key="separator" style={{ position: 'absolute', top: yOffset, width: '100%' }}>
                  {renderSeparator()}
              </div>
          );
      }
      yOffset += separatorHeight;
  }

  // Favorites
  const favoriteRows = Math.ceil(favoriteItems.length / numColumns);
  for (let i = 0; i < favoriteRows; i++) {
      const rowY = yOffset + i * (itemHeight + gap);
      if (rowY + itemHeight > scrollTop - containerHeight && rowY < scrollTop + containerHeight) {
          for (let j = 0; j < numColumns; j++) {
              const itemIndex = i * numColumns + j;
              if (itemIndex < favoriteItems.length) {
                  itemsToRender.push(
                      <div
                          key={`fav-${favoriteItems[itemIndex].id}`}
                          className="absolute"
                          style={{
                              top: rowY,
                              left: `${(100 / numColumns) * j}%`,
                              width: `${100 / numColumns}%`,
                              padding: `${gap / 2}px`,
                          }}
                      >
                          {renderItem(favoriteItems[itemIndex])}
                      </div>
                  );
              }
          }
      }
  }
  yOffset += favoriteRows * (itemHeight + gap);
  
  if (hasAfterFavorites) {
      if (yOffset + afterFavoritesHeight > scrollTop - containerHeight && yOffset < scrollTop + containerHeight) {
          itemsToRender.push(
              <div key="after-favorites" style={{ position: 'absolute', top: yOffset, width: '100%', padding: `0 ${gap/2}px` }}>
                  {renderAfterFavorites()}
              </div>
          );
      }
      yOffset += afterFavoritesHeight;
  }

  // Non-favorites
  const nonFavoriteRows = Math.ceil(nonFavoriteItems.length / numColumns);
  for (let i = 0; i < nonFavoriteRows; i++) {
      const rowY = yOffset + i * (itemHeight + gap);
      if (rowY + itemHeight > scrollTop - containerHeight && rowY < scrollTop + containerHeight) {
          for (let j = 0; j < numColumns; j++) {
              const itemIndex = i * numColumns + j;
              if (itemIndex < nonFavoriteItems.length) {
                  itemsToRender.push(
                      <div
                          key={`nonfav-${nonFavoriteItems[itemIndex].id}`}
                          className="absolute"
                          style={{
                              top: rowY,
                              left: `${(100 / numColumns) * j}%`,
                              width: `${100 / numColumns}%`,
                              padding: `${gap / 2}px`,
                          }}
                      >
                          {renderItem(nonFavoriteItems[itemIndex])}
                      </div>
                  );
              }
          }
      }
  }


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
