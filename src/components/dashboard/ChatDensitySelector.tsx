import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import { useChatDensity, ChatDensity } from "@/hooks/useChatDensity";

export function ChatDensitySelector() {
  const { density, updateDensity } = useChatDensity();

  const densityOptions = [
    { value: 'compact' as ChatDensity, icon: List, label: 'Compacto' },
    { value: 'comfortable' as ChatDensity, icon: Rows3, label: 'Confortável' },
    { value: 'spacious' as ChatDensity, icon: LayoutGrid, label: 'Espaçoso' }
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30">
      {densityOptions.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={density === value ? "default" : "ghost"}
          size="sm"
          onClick={() => updateDensity(value)}
          className={`h-8 px-3 transition-all duration-200 ${
            density === value 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}