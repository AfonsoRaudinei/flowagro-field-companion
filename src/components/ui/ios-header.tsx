import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IOSHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const IOSHeader: React.FC<IOSHeaderProps> = ({
  title,
  onBack,
  showBackButton = true,
  rightActions,
  subtitle,
  className
}) => {
  // Clean layout when no back button and no right actions
  const isCleanLayout = !showBackButton && !rightActions && !onBack;
  
  return (
    <header className={cn(
      "flex items-center",
      isCleanLayout ? "justify-center" : "justify-between",
      "h-touch px-base py-md",
      "bg-card/95 backdrop-blur-md border-b border-border/50",
      "shadow-ios-sm",
      className
    )}>
      {!isCleanLayout && (
        <>
          {/* Left side - Back button */}
          <div className="flex items-center min-w-0 flex-1">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="ios-button h-8 w-8 p-0 mr-md hover:bg-accent/50 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Center - Title */}
          <div className="flex-2 flex flex-col items-center text-center min-w-0">
            <h1 className="text-ios-lg font-semibold text-foreground truncate max-w-48">
              {title}
            </h1>
            {subtitle && (
              <p className="text-ios-sm text-muted-foreground truncate max-w-40">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center justify-end min-w-0 flex-1">
            {rightActions || (
              <div className="w-8 h-8" />
            )}
          </div>
        </>
      )}
      
      {/* Clean centered layout */}
      {isCleanLayout && (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
};

// Specialized header for conversations
interface ConversationHeaderProps {
  name: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  isOnline?: boolean;
  onBack?: () => void;
  onMore?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  name,
  subtitle,
  avatar,
  isOnline,
  onBack,
  onMore
}) => {
  return (
    <header className="flex items-center justify-between h-touch px-base py-sm bg-card/95 backdrop-blur-md border-b border-border/50 shadow-ios-sm">
      {/* Left side - Back button */}
      <div className="flex items-center min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="ios-button h-8 w-8 p-0 mr-md hover:bg-accent/50 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Center - Avatar and Info */}
      <div className="flex items-center gap-md min-w-0 flex-1 justify-center">
        {avatar && (
          <div className="relative">
            {avatar}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-card" />
            )}
          </div>
        )}
        <div className="text-center min-w-0">
          <h2 className="text-ios-lg font-semibold text-foreground truncate">
            {name}
          </h2>
          {subtitle && (
            <p className="text-ios-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side - More button */}
      <div className="flex items-center justify-end min-w-0">
        {onMore ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMore}
            className="ios-button h-8 w-8 p-0 hover:bg-accent/50"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-8 h-8" /> // Spacer
        )}
      </div>
    </header>
  );
};