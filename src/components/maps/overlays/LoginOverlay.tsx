import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface LoginOverlayProps {
  opacity?: number;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ 
  opacity = 0.2 
}) => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login-form');
  };

  return (
    <>
      {/* Subtle overlay for better contrast */}
      <div 
        className="absolute inset-0 bg-black pointer-events-none" 
        style={{ opacity }}
      />
      
      {/* Login Button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Button 
            onClick={handleLoginClick}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Entrar no Sistema
          </Button>
        </div>
      </div>
    </>
  );
};