'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

type FavoriteType = 'events' | 'deals';

interface FavoritesContextType {
  favorites: {
    events: string[];
    deals: string[];
  };
  toggleFavorite: (type: FavoriteType, id: string) => void;
  isFavorite: (type: FavoriteType, id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<{
    events: string[];
    deals: string[];
  }>({
    events: [],
    deals: [],
  });

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to parse favorites from localStorage', error);
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (type: FavoriteType, id: string) => {
    setFavorites((prev) => {
      const isFavorited = prev[type].includes(id);

      if (isFavorited) {
        // Remove from favorites
        return {
          ...prev,
          [type]: prev[type].filter((itemId) => itemId !== id),
        };
      } else {
        // Add to favorites
        return {
          ...prev,
          [type]: [...prev[type], id],
        };
      }
    });
  };

  const isFavorite = (type: FavoriteType, id: string) => {
    return favorites[type].includes(id);
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
