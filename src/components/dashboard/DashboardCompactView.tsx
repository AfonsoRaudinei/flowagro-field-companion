import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { BottomQuickCards } from './BottomQuickCards';
import { ChatInputBar } from './ChatInputBar';

interface DashboardCompactViewProps {
  onChatExpand: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onChatFilterChange: (filter: "Produtor" | "Agenda" | "IA" | "Campo") => void;
  currentFilter: "Produtor" | "Agenda" | "IA" | "Campo";
  sendingMessage: boolean;
}

/**
 * Compact dashboard view - shows when chat is collapsed
 * Optimized for initial user interaction
 */
export const DashboardCompactView = memo<DashboardCompactViewProps>(({
  onChatExpand,
  onSendMessage,
  onChatFilterChange,
  currentFilter,
  sendingMessage
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Main content area with greeting */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
        <div className="text-center space-y-4 max-w-md">
          <h1 className={cn(
            "text-2xl sm:text-3xl font-heading font-semibold",
            "text-foreground tracking-tight"
          )}>
            Olá! Como posso ajudar?
          </h1>
          <p className={cn(
            "text-muted-foreground text-sm sm:text-base",
            "leading-relaxed"
          )}>
            Escolha uma das ferramentas abaixo ou comece a conversar
          </p>
        </div>
      </div>

      {/* Bottom cards - positioned above chat input */}
      <BottomQuickCards
        onChatFilterChange={onChatFilterChange}
        currentFilter={currentFilter}
        isVisible={true}
      />

      {/* Chat input at bottom */}
      <ChatInputBar
        onSendMessage={onSendMessage}
        onExpandChat={onChatExpand}
        disabled={sendingMessage}
      />
    </div>
  );
});

DashboardCompactView.displayName = 'DashboardCompactView';