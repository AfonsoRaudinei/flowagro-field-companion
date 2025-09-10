import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { HorizontalCardCarousel } from './HorizontalCardCarousel';

interface DashboardQuickCardsProps {
  onChatFilterChange?: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter?: "Produtor" | "Agenda" | "IA" | "Campo";
  className?: string;
}

/**
 * Optimized dashboard quick cards component
 * Now split into smaller components for better performance
 */
export const DashboardQuickCards = memo<DashboardQuickCardsProps>(({
  onChatFilterChange,
  currentFilter = "Produtor",
  className
}) => {
  return (
    <div className={cn(
      "w-full px-3 sm:px-4 py-1 sm:py-2",
      // Subtle background with silver undertones
      "bg-gradient-to-b from-muted/20 to-transparent", 
      className
    )}>
      {/* Header section - Grok-style */}
      <div className="mb-1 sm:mb-2">
        <p className={cn(
          "font-secondary text-muted-foreground mt-0.5", 
          "text-xs sm:text-[13px] leading-tight tracking-[-0.005em]"
        )}>
          Suas ferramentas principais
        </p>
      </div>

      {/* Grok-style horizontal carousel */}
      <HorizontalCardCarousel onChatFilterChange={onChatFilterChange} currentFilter={currentFilter} />
      
      {/* Bottom separator removed to get closer to chat */}
    </div>
  );
});

DashboardQuickCards.displayName = 'DashboardQuickCards';
export default DashboardQuickCards;