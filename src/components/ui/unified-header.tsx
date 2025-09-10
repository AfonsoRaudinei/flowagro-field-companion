import React from 'react';
import { ArrowLeft, MoreHorizontal, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Base header props shared across all header variants
interface BaseHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
}

// Standard header variant
interface StandardHeaderProps extends BaseHeaderProps {
  variant?: 'standard';
}

// iOS-style header variant  
interface IOSHeaderProps extends BaseHeaderProps {
  variant: 'ios';
  showSettingsButton?: boolean;
}

// Conversation header variant
interface ConversationHeaderProps extends BaseHeaderProps {
  variant: 'conversation';
  name: string;
  avatar?: React.ReactNode;
  isOnline?: boolean;
  onMore?: () => void;
}

// Clean centered header variant
interface CleanHeaderProps extends BaseHeaderProps {
  variant: 'clean';
}

// Union type for all header variants
type UnifiedHeaderProps = StandardHeaderProps | IOSHeaderProps | ConversationHeaderProps | CleanHeaderProps;
export const UnifiedHeader: React.FC<UnifiedHeaderProps> = props => {
  const navigate = useNavigate();

  // Standard header (default NavigationHeader style)
  if (!props.variant || props.variant === 'standard') {
    const {
      title,
      onBack,
      showBackButton = true,
      rightActions,
      className
    } = props;
    return <header className={cn("flex items-center justify-between p-4 bg-card border-b border-border", className)}>
        <div className="flex items-center space-x-3">
          {showBackButton && <BackButton variant="ghost" size="sm" />}
          
        </div>
        {rightActions && <div className="flex items-center space-x-2">
            {rightActions}
          </div>}
      </header>;
  }

  // iOS-style header
  if (props.variant === 'ios') {
    const {
      title,
      subtitle,
      onBack,
      showBackButton = true,
      rightActions,
      showSettingsButton = true,
      className
    } = props;
    const isCleanLayout = !showBackButton && !rightActions && !onBack && !showSettingsButton;
    return;
  }

  // Conversation header
  if (props.variant === 'conversation') {
    const {
      name,
      subtitle,
      avatar,
      isOnline,
      onBack,
      onMore,
      className
    } = props;
    return <header className={cn("flex items-center justify-between h-touch px-base py-sm", "bg-card/95 backdrop-blur-md border-b border-border/50 shadow-ios-sm", className)}>
        {/* Left side - Back button */}
        <div className="flex items-center min-w-0">
          {onBack && <BackButton variant="ios" className="mr-md" customHandler={onBack} />}
        </div>

        {/* Center - Avatar and Info */}
        <div className="flex items-center gap-md min-w-0 flex-1 justify-center">
          {avatar && <div className="relative">
              {avatar}
              {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-card" />}
            </div>}
          <div className="text-center min-w-0">
            <h2 className="text-ios-lg font-semibold text-foreground truncate">
              {name}
            </h2>
            {subtitle && <p className="text-ios-sm text-muted-foreground truncate">
                {subtitle}
              </p>}
          </div>
        </div>

        {/* Right side - More button */}
        <div className="flex items-center justify-end min-w-0">
          {onMore ? <Button variant="ghost" size="sm" onClick={onMore} className="ios-button h-8 w-8 p-0 hover:bg-accent/50">
              <MoreHorizontal className="h-5 w-5" />
            </Button> : <div className="w-8 h-8" />}
        </div>
      </header>;
  }

  // Clean header
  if (props.variant === 'clean') {
    const {
      title,
      subtitle,
      className
    } = props;
    return <header className={cn("flex items-center justify-center py-6", "bg-background", className)}>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && <p className="text-muted-foreground mt-2">
              {subtitle}
            </p>}
        </div>
      </header>;
  }
  return null;
};

// Legacy component exports for backward compatibility
export const NavigationHeader: React.FC<StandardHeaderProps> = props => <UnifiedHeader {...props} variant="standard" />;
export const IOSHeader: React.FC<Omit<IOSHeaderProps, 'variant'>> = props => <UnifiedHeader {...props} variant="ios" />;
export const ConversationHeader: React.FC<Omit<ConversationHeaderProps, 'variant' | 'title'> & {
  name: string;
}> = props => <UnifiedHeader {...props} variant="conversation" title={props.name} />;
export const CleanHeader: React.FC<Omit<CleanHeaderProps, 'variant'>> = props => <UnifiedHeader {...props} variant="clean" />;