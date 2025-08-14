import ProducerCardSkeleton from "./ProducerCardSkeleton";

interface ConversationListSkeletonProps {
  count?: number;
}

const ConversationListSkeleton = ({ count = 6 }: ConversationListSkeletonProps) => {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }, (_, i) => (
        <ProducerCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ConversationListSkeleton;