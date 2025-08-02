import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface CheckInOutButtonsProps {
  className?: string;
  isCheckedIn: boolean;
  loading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

const CheckInOutButtons: React.FC<CheckInOutButtonsProps> = ({
  className,
  isCheckedIn,
  loading,
  onCheckIn,
  onCheckOut
}) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {!isCheckedIn ? (
        <Button
          onClick={onCheckIn}
          disabled={loading}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-1" />
              Check-in
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onCheckOut}
          disabled={loading}
          size="sm"
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-1" />
              Check-out
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default CheckInOutButtons;