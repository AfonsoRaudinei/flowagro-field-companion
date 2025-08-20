import { Check, CheckCheck, Eye } from "lucide-react";

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  isLastSeen?: boolean;
  size?: 'sm' | 'md';
}

export function MessageStatusIndicator({ 
  status, 
  isLastSeen = false, 
  size = 'sm' 
}: MessageStatusIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  if (isLastSeen) {
    return (
      <Eye className={`${iconSize} text-primary/60`} />
    );
  }

  switch (status) {
    case 'sent':
      return <Check className={`${iconSize} text-muted-foreground`} />;
    case 'delivered':
      return <CheckCheck className={`${iconSize} text-muted-foreground`} />;
    case 'read':
      return <CheckCheck className={`${iconSize} text-primary`} />;
    default:
      return null;
  }
}