import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MessageSkeletonProps {
  isUser?: boolean;
  showAvatar?: boolean;
}

const MessageSkeleton = ({ isUser = false, showAvatar = true }: MessageSkeletonProps) => {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {/* Avatar for non-user messages */}
      {!isUser && showAvatar && (
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[75%] min-w-[120px]",
        isUser ? "order-first" : ""
      )}>
        {/* Sender name skeleton for non-user messages */}
        {!isUser && (
          <Skeleton className="h-3 w-16 mb-1" />
        )}

        {/* Message bubble skeleton */}
        <div className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-primary/10 ml-auto rounded-br-md" 
            : "bg-card border border-border rounded-bl-md"
        )}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* User avatar */}
      {isUser && showAvatar && (
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      )}
    </div>
  );
};

export default MessageSkeleton;