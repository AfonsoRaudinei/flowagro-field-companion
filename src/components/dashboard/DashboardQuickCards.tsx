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
  return <div className={cn("w-full px-3 sm:px-4 py-3 sm:py-4",
  // Subtle background with silver undertones
  "bg-gradient-to-b from-muted/20 to-transparent", className)}>
      {/* Header section - Grok-style */}
      <div className="mb-3 sm:mb-4">
        
        <p className={cn("font-secondary text-muted-foreground mt-0.5", "text-xs sm:text-[13px] leading-tight tracking-[-0.005em]")}>
          Suas ferramentas principais
        </p>
      </div>

      {/* Grok-style horizontal carousel */}
      <HorizontalCardCarousel onChatFilterChange={onChatFilterChange} currentFilter={currentFilter} />
      
      {/* Subtle bottom separator */}
      <div className="mt-6 border-b border-border/30" />
    </div>;
});
DashboardQuickCards.displayName = 'DashboardQuickCards';
export default DashboardQuickCards;