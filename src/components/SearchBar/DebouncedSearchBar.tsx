import React, { useState, useEffect, useCallback } from 'react';
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

  // Debounce the onChange callback
  const debouncedOnChange = useDebounce(onChange, debounceMs);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      
      <Input
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-10 ios-button focus:shadow-ios-sm transition-all duration-200"
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
    </div>
  );
}