import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
}

export function SwipeActions({ 
  children, 
  leftActions = [], 
  rightActions = [],
  threshold = 80 
}: SwipeActionsProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const [isSwipingRight, setIsSwipingRight] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const { deltaX } = eventData;
      
      if (deltaX > 0 && leftActions.length > 0) {
        // Swiping right (showing left actions)
        setIsSwipingLeft(false);
        setIsSwipingRight(true);
        setSwipeOffset(Math.min(deltaX, threshold * leftActions.length));
      } else if (deltaX < 0 && rightActions.length > 0) {
        // Swiping left (showing right actions)
        setIsSwipingRight(false);
        setIsSwipingLeft(true);
        setSwipeOffset(Math.max(deltaX, -threshold * rightActions.length));
      }
    },
    onSwipeStart: () => {
      setSwipeOffset(0);
    },
    onSwiped: (eventData) => {
      const { deltaX } = eventData;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && leftActions.length > 0) {
          // Trigger left action
          const actionIndex = Math.min(
            Math.floor(deltaX / threshold), 
            leftActions.length - 1
          );
          leftActions[actionIndex]?.action();
        } else if (deltaX < 0 && rightActions.length > 0) {
          // Trigger right action
          const actionIndex = Math.min(
            Math.floor(Math.abs(deltaX) / threshold), 
            rightActions.length - 1
          );
          rightActions[actionIndex]?.action();
        }
      }
      
      // Reset state
      setSwipeOffset(0);
      setIsSwipingLeft(false);
      setIsSwipingRight(false);
    },
    trackMouse: false,
    trackTouch: true,
  });

  return (
    <div className="relative overflow-hidden" {...handlers}>
      {/* Left Actions */}
      {isSwipingRight && leftActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 h-full flex"
          style={{ width: `${threshold * leftActions.length}px` }}
        >
          {leftActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-center transition-all duration-200`}
              style={{ 
                width: `${threshold}px`,
                backgroundColor: action.color,
                transform: `translateX(${swipeOffset - threshold * (index + 1)}px)`
              }}
            >
              <div className="text-white">
                {action.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {isSwipingLeft && rightActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 h-full flex"
          style={{ width: `${threshold * rightActions.length}px` }}
        >
          {rightActions.map((action, index) => (
            <div
              key={action.id}
              className={`flex items-center justify-center transition-all duration-200`}
              style={{ 
                width: `${threshold}px`,
                backgroundColor: action.color,
                transform: `translateX(${Math.abs(swipeOffset) - threshold * (index + 1)}px)`
              }}
            >
              <div className="text-white">
                {action.icon}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div
        className="transition-transform duration-200 ease-out bg-background"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          zIndex: 1,
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
}