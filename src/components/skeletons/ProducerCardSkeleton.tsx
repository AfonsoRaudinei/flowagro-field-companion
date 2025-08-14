import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const ProducerCardSkeleton = () => {
  return (
    <Card className="mb-3 p-5 shadow-sm border-0 bg-gradient-to-r from-card to-card/95">
      <div className="flex items-start gap-4">
        {/* Avatar Skeleton */}
        <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />

        {/* Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Skeleton className="h-4 w-64" />
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProducerCardSkeleton;