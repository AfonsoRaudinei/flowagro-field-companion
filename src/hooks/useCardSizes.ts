import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export type CardSize = 'small' | 'medium' | 'large';

interface CardSizeState {
  [cardId: string]: CardSize;
}

export function useCardSizes() {
  const [cardSizes, setCardSizes] = useState<CardSizeState>({});

  useEffect(() => {
    const saved = localStorage.getItem('cardSizes');
    if (saved) {
      try {
        setCardSizes(JSON.parse(saved));
      } catch (error) {
        logger.error('Error loading card sizes', { error });
      }
    }
  }, []);

  const updateCardSize = (cardId: string, size: CardSize) => {
    const newSizes = { ...cardSizes, [cardId]: size };
    setCardSizes(newSizes);
    localStorage.setItem('cardSizes', JSON.stringify(newSizes));
  };

  const getCardSize = (cardId: string): CardSize => {
    return cardSizes[cardId] || 'medium';
  };

  return {
    updateCardSize,
    getCardSize
  };
}