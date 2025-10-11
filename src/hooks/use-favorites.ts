'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'streamdeck-tv-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Could not load favorites from local storage", error);
      setFavorites([]);
    }
  }, []);

  const addFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
        if (prev.includes(channelId)) return prev;
        const newFavs = [...prev, channelId];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
        return newFavs;
    });
  }, []);

  const removeFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
        const newFavs = prev.filter(id => id !== channelId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
        return newFavs;
    });
  }, []);

  const isFavorite = useCallback((channelId: string) => {
    return favorites.includes(channelId);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
