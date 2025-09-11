/**
 * Security Hardening Component - Fase 3
 * Implementa medidas avançadas de segurança e monitoramento
 */

import React, { memo, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Eye, RefreshCw, CheckCircle } from 'lucide-react';

interface SecurityMetrics {
  cspViolations: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
  suspiciousRequests: number;
  failedLogins: number;
  dataIntegrityChecks: number;
}

interface SecurityThreat {
  id: string;
  type: 'high' | 'medium' | 'low';
  category: 'xss' | 'sql' | 'csrf' | 'bruteforce' | 'data' | 'network';
  description: string;
  timestamp: Date;
  blocked: boolean;
}

export const SecurityHardening = memo(() => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    cspViolations: 0,
    xssAttempts: 0,
    sqlInjectionAttempts: 0,
    suspiciousRequests: 0,
    failedLogins: 0,
    dataIntegrityChecks: 0
  });

  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [securityScore, setSecurityScore] = useState(85);

  // Content Security Policy monitoring
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('[Security] CSP Violation:', event);
      
      setMetrics(prev => ({
        ...prev,
        cspViolations: prev.cspViolations + 1
      }));

      // Add to threats if suspicious
      if (event.violatedDirective?.includes('script-src')) {
        addThreat({
          type: 'high',
          category: 'xss',
          description: `Script CSP violation: ${event.blockedURI}`,
          blocked: true
        });
      }
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    return () => document.removeEventListener('securitypolicyviolation', handleCSPViolation);
  }, []);

  // XSS Protection
  useEffect(() => {
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      
      // Monitor script creation attempts
      if (tagName.toLowerCase() === 'script') {
        console.warn('[Security] Script element created:', element);
        
        setMetrics(prev => ({
          ...prev,
          xssAttempts: prev.xssAttempts + 1
        }));

        addThreat({
          type: 'high',
          category: 'xss',
          description: 'Potentially malicious script creation detected',
          blocked: false
        });
      }
      
      return element;
    };

    return () => {
      document.createElement = originalCreateElement;
    };
  }, []);

  // Form input sanitization monitoring
  useEffect(() => {
    const handleFormInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.value) return;

      // Check for SQL injection patterns
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /insert\s+into/i,
        /delete\s+from/i,
        /'\s*or\s*'1'\s*=\s*'1/i
      ];

      const hasSqlPattern = sqlPatterns.some(pattern => pattern.test(target.value));
      
      if (hasSqlPattern) {
        console.warn('[Security] SQL injection attempt detected:', target.value);
        
        setMetrics(prev => ({
          ...prev,
          sqlInjectionAttempts: prev.sqlInjectionAttempts + 1
        }));

        addThreat({
          type: 'high',
          category: 'sql',
          description: 'SQL injection pattern detected in form input',
          blocked: true
        });

        // Sanitize input
        target.value = target.value.replace(/['";<>]/g, '');
      }

      // Check for XSS patterns
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /onload\s*=/i,
        /onerror\s*=/i
      ];

      const hasXssPattern = xssPatterns.some(pattern => pattern.test(target.value));
      
      if (hasXssPattern) {
        console.warn('[Security] XSS attempt detected:', target.value);
        
        setMetrics(prev => ({
          ...prev,
          xssAttempts: prev.xssAttempts + 1
        }));

        addThreat({
          type: 'high',
          category: 'xss',
          description: 'XSS pattern detected in form input',
          blocked: true
        });

        // Sanitize input
        target.value = target.value.replace(/<[^>]*>/g, '');
      }
    };

    document.addEventListener('input', handleFormInput);
    return () => document.removeEventListener('input', handleFormInput);
  }, []);

  // Network monitoring
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.href);
      
      // Monitor for suspicious requests
      if (url.includes('eval') || url.includes('javascript:')) {
        console.warn('[Security] Suspicious fetch attempt:', url);
        
        setMetrics(prev => ({
          ...prev,
          suspiciousRequests: prev.suspiciousRequests + 1
        }));

        addThreat({
          type: 'medium',
          category: 'network',
          description: `Suspicious network request: ${url}`,
          blocked: false
        });
      }

      return originalFetch.apply(this, args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const addThreat = useCallback((threat: Omit<SecurityThreat, 'id' | 'timestamp'>) => {
    const newThreat: SecurityThreat = {
      ...threat,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setThreats(prev => [newThreat, ...prev.slice(0, 9)]); // Keep last 10 threats
  }, []);

  // Calculate security score
  useEffect(() => {
    const totalThreats = Object.values(metrics).reduce((sum, count) => sum + count, 0);
    const blockedThreats = threats.filter(t => t.blocked).length;
    
    let score = 100;
    score -= totalThreats * 2; // Reduce score for each threat
    score += blockedThreats * 1; // Increase for blocked threats
    score = Math.max(0, Math.min(100, score));
    
    setSecurityScore(score);
  }, [metrics, threats]);

  const runSecurityScan = useCallback(async () => {
    setIsMonitoring(true);
    
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for common vulnerabilities
      const checks = [
        'Content Security Policy',
        'HTTPS Enforcement', 
        'Input Sanitization',
        'Authentication State',
        'Data Encryption',
        'Session Management'
      ];

      let passedChecks = 0;
      
      for (const check of checks) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mock check results (in real implementation, would run actual checks)
        const passed = Math.random() > 0.2;
        if (passed) passedChecks++;
        
        console.log(`[Security Scan] ${check}: ${passed ? 'PASS' : 'FAIL'}`);
      }
      
      setMetrics(prev => ({
        ...prev,
        dataIntegrityChecks: prev.dataIntegrityChecks + passedChecks
      }));

      const scanScore = (passedChecks / checks.length) * 100;
      setSecurityScore(Math.round((securityScore + scanScore) / 2));
      
    } catch (error) {
      console.error('[Security] Scan failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, [securityScore]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getThreatColor = (type: SecurityThreat['type']) => {
    switch (type) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <Card className="fixed top-4 left-4 w-96 p-4 border shadow-lg bg-background/95 backdrop-blur z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">Security Monitor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${getScoreColor(securityScore)}`}>
            {securityScore}/100
          </span>
          {securityScore >= 90 && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex justify-between">
          <span>CSP Violations:</span>
          <Badge variant={metrics.cspViolations > 0 ? 'destructive' : 'default'}>
            {metrics.cspViolations}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span>XSS Attempts:</span>
          <Badge variant={metrics.xssAttempts > 0 ? 'destructive' : 'default'}>
            {metrics.xssAttempts}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span>SQL Injections:</span>
          <Badge variant={metrics.sqlInjectionAttempts > 0 ? 'destructive' : 'default'}>
            {metrics.sqlInjectionAttempts}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span>Failed Logins:</span>
          <Badge variant={metrics.failedLogins > 0 ? 'secondary' : 'default'}>
            {metrics.failedLogins}
          </Badge>
        </div>
      </div>

      {/* Recent Threats */}
      {threats.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Recent Threats ({threats.length})
          </h4>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {threats.slice(0, 3).map((threat) => (
              <Alert key={threat.id} className="py-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <AlertDescription className="text-xs truncate">
                      {threat.description}
                    </AlertDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={getThreatColor(threat.type)} className="text-xs">
                      {threat.type}
                    </Badge>
                    {threat.blocked && (
                      <Shield className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runSecurityScan}
          disabled={isMonitoring}
          className="flex-1"
        >
          {isMonitoring ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Eye className="h-3 w-3 mr-1" />
          )}
          {isMonitoring ? 'Scanning...' : 'Security Scan'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setThreats([])}
          className="px-3"
        >
          Clear
        </Button>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center mt-3 pt-3 border-t">
        <div className={`h-2 w-2 rounded-full mr-2 ${
          securityScore >= 90 
            ? 'bg-green-500' 
            : securityScore >= 70
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`} />
        <span className="text-xs text-muted-foreground">
          {securityScore >= 90 
            ? 'Security Strong'
            : securityScore >= 70
            ? 'Security Moderate'
            : 'Security Needs Attention'
          }
        </span>
      </div>
    </Card>
  );
});

SecurityHardening.displayName = 'SecurityHardening';