/**
 * Advanced Authentication Hook - Fase 3 Hardening
 * Implementa autenticação robusta com múltiplas camadas de segurança
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AuthState {
  user: any | null;
  loading: boolean;
  sessionValid: boolean;
  mfaEnabled: boolean;
  loginAttempts: number;
  isLocked: boolean;
  lastActivity: Date | null;
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'mfa_attempt' | 'session_timeout' | 'suspicious_activity';
  timestamp: Date;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute

export function useAdvancedAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    sessionValid: false,
    mfaEnabled: false,
    loginAttempts: 0,
    isLocked: false,
    lastActivity: null
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
    setupSessionMonitoring();
    setupActivityTracking();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Session error:', error);
        addSecurityEvent('suspicious_activity', `Session error: ${error.message}`);
        return;
      }

      if (session?.user) {
        const isValid = await validateSession(session);
        
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          sessionValid: isValid,
          loading: false,
          lastActivity: new Date()
        }));

        if (isValid) {
          addSecurityEvent('login', 'Session restored successfully');
          checkMFAStatus(session.user.id);
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('[Auth] Initialize error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const validateSession = async (session: any): Promise<boolean> => {
    try {
      // Check session expiry
      const now = Date.now() / 1000;
      if (session.expires_at && session.expires_at < now) {
        addSecurityEvent('session_timeout', 'Session expired');
        return false;
      }

      // Validate session with server
      const { error } = await supabase.auth.getUser();
      if (error) {
        addSecurityEvent('suspicious_activity', `Session validation failed: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Auth] Session validation error:', error);
      return false;
    }
  };

  const checkMFAStatus = async (userId: string) => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasMFA = factors && factors.all && factors.all.length > 0;
      
      setAuthState(prev => ({
        ...prev,
        mfaEnabled: hasMFA
      }));

      if (!hasMFA) {
        toast({
          title: "Segurança Recomendada",
          description: "Configure a autenticação de dois fatores para maior segurança",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('[Auth] MFA check error:', error);
    }
  };

  const setupSessionMonitoring = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              const isValid = await validateSession(session);
              
              setAuthState(prev => ({
                ...prev,
                user: session.user,
                sessionValid: isValid,
                loginAttempts: 0,
                isLocked: false,
                lastActivity: new Date()
              }));

              addSecurityEvent('login', `User logged in: ${session.user.email}`);
              checkMFAStatus(session.user.id);
            }
            break;

          case 'SIGNED_OUT':
            setAuthState(prev => ({
              ...prev,
              user: null,
              sessionValid: false,
              lastActivity: null
            }));
            
            addSecurityEvent('logout', 'User logged out');
            clearActivityTimeout();
            break;

          case 'TOKEN_REFRESHED':
            addSecurityEvent('login', 'Session token refreshed');
            updateLastActivity();
            break;

          default:
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  };

  const setupActivityTracking = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for inactivity
    const checkInactivity = () => {
      if (authState.lastActivity && authState.sessionValid) {
        const inactiveTime = Date.now() - authState.lastActivity.getTime();
        
        if (inactiveTime > SESSION_TIMEOUT) {
          handleSessionTimeout();
        }
      }
    };

    const inactivityCheck = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(inactivityCheck);
    };
  };

  const updateLastActivity = () => {
    setAuthState(prev => ({
      ...prev,
      lastActivity: new Date()
    }));

    // Reset session timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  };

  const clearActivityTimeout = () => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = undefined;
    }
  };

  const handleSessionTimeout = async () => {
    addSecurityEvent('session_timeout', 'User session timed out due to inactivity');
    
    toast({
      title: "Sessão Expirada",
      description: "Sua sessão expirou por inatividade. Faça login novamente.",
      duration: 0
    });

    await signOut();
  };

  const signInWithPassword = async (email: string, password: string, captcha?: string) => {
    // Check if locked
    if (authState.isLocked) {
      const lockExpiry = getLockExpiry();
      if (lockExpiry && Date.now() < lockExpiry) {
        const remainingTime = Math.ceil((lockExpiry - Date.now()) / 60000);
        
        toast({
          title: "Conta Bloqueada",
          description: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
          duration: 5000
        });
        
        return { error: { message: 'Account locked' } };
      } else {
        // Unlock account
        setAuthState(prev => ({
          ...prev,
          isLocked: false,
          loginAttempts: 0
        }));
        removeLockExpiry();
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: captcha
        }
      });

      if (error) {
        handleFailedLogin(email, error.message);
        return { error };
      }

      // Successful login
      setAuthState(prev => ({
        ...prev,
        loginAttempts: 0,
        isLocked: false
      }));

      addSecurityEvent('login', `Successful login: ${email}`);
      removeLockExpiry();

      return { data, error: null };
    } catch (error: any) {
      handleFailedLogin(email, error.message);
      return { error };
    }
  };

  const handleFailedLogin = (email: string, errorMessage: string) => {
    const newAttempts = authState.loginAttempts + 1;
    
    setAuthState(prev => ({
      ...prev,
      loginAttempts: newAttempts
    }));

    addSecurityEvent('failed_login', `Failed login attempt for ${email}: ${errorMessage}`);

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockExpiry = Date.now() + LOCKOUT_DURATION;
      
      setAuthState(prev => ({
        ...prev,
        isLocked: true
      }));

      setLockExpiry(lockExpiry);
      
      toast({
        title: "Conta Bloqueada",
        description: `Muitas tentativas de login falharam. Conta bloqueada por ${LOCKOUT_DURATION / 60000} minutos.`,
        duration: 0
      });

      addSecurityEvent('suspicious_activity', `Account locked due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`);
    } else {
      const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      
      toast({
        title: "Login Falhou",
        description: `Credenciais inválidas. ${remaining} tentativas restantes.`,
        duration: 5000
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
      }

      clearActivityTimeout();
      addSecurityEvent('logout', 'User signed out');
      
      return { error };
    } catch (error: any) {
      console.error('[Auth] Sign out error:', error);
      return { error };
    }
  };

  const enableMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) {
        console.error('[Auth] MFA enrollment error:', error);
        return { error };
      }

      addSecurityEvent('mfa_attempt', 'MFA enrollment initiated');
      
      return { data, error: null };
    } catch (error: any) {
      console.error('[Auth] MFA enrollment error:', error);
      return { error };
    }
  };

  const addSecurityEvent = (type: SecurityEvent['type'], details: string) => {
    const event: SecurityEvent = {
      type,
      details,
      timestamp: new Date(),
      ipAddress: 'unknown', // Would get from request in real implementation
      userAgent: navigator.userAgent
    };

    setSecurityEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    
    // Log security events for monitoring
    console.log(`[Security Event] ${type}: ${details}`);
  };

  // Helper functions for lock management
  const setLockExpiry = (expiry: number) => {
    localStorage.setItem('auth_lock_expiry', expiry.toString());
  };

  const getLockExpiry = (): number | null => {
    const expiry = localStorage.getItem('auth_lock_expiry');
    return expiry ? parseInt(expiry) : null;
  };

  const removeLockExpiry = () => {
    localStorage.removeItem('auth_lock_expiry');
  };

  const forceRefreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        addSecurityEvent('suspicious_activity', `Session refresh failed: ${error.message}`);
        return false;
      }

      addSecurityEvent('login', 'Session refreshed manually');
      updateLastActivity();
      
      return true;
    } catch (error: any) {
      console.error('[Auth] Force refresh error:', error);
      return false;
    }
  };

  return {
    ...authState,
    securityEvents,
    signInWithPassword,
    signOut,
    enableMFA,
    forceRefreshSession,
    updateLastActivity,
    addSecurityEvent
  };
}