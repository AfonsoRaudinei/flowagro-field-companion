import React, { useState, useCallback } from 'react';
import { Send, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onExpandChat: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onExpandChat,
  placeholder = "Pergunte qualquer coisa...",
  disabled = false,
  className
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage("");
  }, [message, disabled, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onExpandChat();
  }, [onExpandChat]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className={cn(
      "w-full px-4 py-0 sm:py-1 bg-background/80 backdrop-blur-xl",
      "border-t border-border/30",
      "transition-all duration-300 ease-out",
      isFocused && "bg-background/95 border-border/50",
      className
    )}>
      <div className={cn(
        "max-w-4xl mx-auto relative",
        "transition-all duration-300 ease-out"
      )}>
        <div className={cn(
          "relative flex items-center gap-2 p-2 sm:p-3",
          "bg-muted/30 rounded-2xl border border-border/30",
          "transition-all duration-300 ease-out",
          "hover:bg-muted/50 hover:border-border/50",
          isFocused && "bg-background border-primary/30 shadow-lg shadow-primary/10"
        )}>
          {/* Input Field */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-foreground placeholder-muted-foreground",
              "font-secondary text-[15px] leading-relaxed",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          {/* Voice Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "hover:bg-muted/50 transition-colors",
              "opacity-60 hover:opacity-100"
            )}
            disabled={disabled}
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "bg-primary hover:bg-primary/90",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all duration-200",
              message.trim() && !disabled && "shadow-md shadow-primary/30"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Subtle glow effect when focused */}
        {isFocused && (
          <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl -z-10" />
        )}
      </div>
    </div>
  );
};

export default ChatInputBar;