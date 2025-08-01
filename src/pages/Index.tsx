import React, { useState } from 'react';
import LoginInitial from './LoginInitial';
import LoginComplete from './LoginComplete';
import MainDashboard from './MainDashboard';
import ChatTechnical from './ChatTechnical';
import SettingsGeneral from './SettingsGeneral';

type AppScreen = 'login-initial' | 'login-complete' | 'dashboard' | 'chat' | 'settings';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('login-initial');

  const navigationActions = {
    // From Login Initial
    onNavigateToLogin: () => setCurrentScreen('login-complete'),
    
    // From Login Complete
    onLoginSuccess: () => setCurrentScreen('dashboard'),
    onBackToInitial: () => setCurrentScreen('login-initial'),
    
    // From Dashboard
    onNavigateToChat: () => setCurrentScreen('chat'),
    onNavigateToSettings: () => setCurrentScreen('settings'),
    
    // From Chat
    onBackToDashboard: () => setCurrentScreen('dashboard'),
    onNavigateToMap: () => setCurrentScreen('dashboard'),
    
    // From Settings
    onLogout: () => setCurrentScreen('login-initial'),
    
    // Generic back actions
    onBack: () => {
      switch (currentScreen) {
        case 'login-complete':
          setCurrentScreen('login-initial');
          break;
        case 'chat':
        case 'settings':
          setCurrentScreen('dashboard');
          break;
        default:
          setCurrentScreen('dashboard');
      }
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login-initial':
        return (
          <LoginInitial 
            onNavigateToLogin={navigationActions.onNavigateToLogin}
          />
        );
      
      case 'login-complete':
        return (
          <LoginComplete
            onBack={navigationActions.onBackToInitial}
            onLoginSuccess={navigationActions.onLoginSuccess}
          />
        );
      
      case 'dashboard':
        return (
          <MainDashboard
            onNavigateToChat={navigationActions.onNavigateToChat}
            onNavigateToSettings={navigationActions.onNavigateToSettings}
          />
        );
      
      case 'chat':
        return (
          <ChatTechnical
            onBack={navigationActions.onBack}
            onNavigateToMap={navigationActions.onNavigateToMap}
            onNavigateToSettings={navigationActions.onNavigateToSettings}
          />
        );
      
      case 'settings':
        return (
          <SettingsGeneral
            onBack={navigationActions.onBack}
            onNavigateToMap={navigationActions.onNavigateToMap}
            onNavigateToChat={navigationActions.onNavigateToChat}
            onLogout={navigationActions.onLogout}
          />
        );
      
      default:
        return (
          <LoginInitial 
            onNavigateToLogin={navigationActions.onNavigateToLogin}
          />
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen">
      {renderScreen()}
    </div>
  );
};

export default Index;
