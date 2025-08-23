import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/performance';
import { cn } from '@/lib/utils';

interface DebouncedSearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function DebouncedSearchBar({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  className,
  debounceMs = 300
}: DebouncedSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the onChange callback
  const debouncedOnChange = useDebounce(onChange, debounceMs);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!localValue) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [localValue]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    setIsExpanded(false);
  }, [onChange]);

  // Handle expand
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!isExpanded ? (
        // Collapsed state - just the search icon
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          className="h-10 w-10 p-0 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : (
        // Expanded state - full search bar
        <>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            <Search className="h-4 w-4" />
          </div>
          
          <Input
            ref={inputRef}
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-10 pr-10 ios-button focus:shadow-ios-sm transition-all duration-200 animate-fade-in"
          />
          
          {localValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}