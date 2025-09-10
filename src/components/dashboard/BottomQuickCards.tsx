import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardQuickCards } from './DashboardQuickCards';

interface BottomQuickCardsProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter?: "Produtor" | "Agenda" | "IA" | "Campo";
  isVisible: boolean;
}

/**
 * Bottom-positioned quick cards with Grok-style slide animation
 * Appears above chat input and hides when chat expands
 */
export const BottomQuickCards = memo<BottomQuickCardsProps>(({
  onChatFilterChange,
  currentFilter = "Produtor",
  isVisible
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-20 left-0 right-0 z-30 transition-all duration-300 ease-in-out transform-gpu",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="px-3 sm:px-4 pb-2">
        <DashboardQuickCards 
          onChatFilterChange={onChatFilterChange}
          currentFilter={currentFilter}
          className="shadow-lg"
        />
      </div>
    </div>
  );
});

BottomQuickCards.displayName = 'BottomQuickCards';
export default BottomQuickCards;