import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/unifiedPerformance';

/**
 * FASE 5: Optimized Health Check System
 * Conditional checks based on network and device performance
 * Lazy initialization and intelligent scheduling
 */

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface NetworkAwareHealthCheck {
  priority: 'critical' | 'important' | 'optional';
  networkRequired: boolean;
  frequencyMs: number;
  lastCheck: number;
  enabled: boolean;
}

interface HealthCheckConfig {
  checks: Map<string, NetworkAwareHealthCheck>;
  globalEnabled: boolean;
  baseInterval: number;
  networkAwareScheduling: boolean;
}

class OptimizedHealthMonitor {
  private static instance: OptimizedHealthMonitor;
  private config: HealthCheckConfig;
  private schedulerTimeout: NodeJS.Timeout | null = null;
  private networkStatus: 'online' | 'offline' | 'slow' = 'online';
  private lastBatteryLevel: number = 1;
  private isLowPowerMode: boolean = false;

  private constructor() {
    this.config = this.initializeConfig();
    this.detectNetworkStatus();
    this.detectPowerMode();
    
    // Only initialize if conditions are met
    if (this.shouldInitialize()) {
      this.startIntelligentScheduler();
    }
  }

  static getInstance(): OptimizedHealthMonitor {
    if (!OptimizedHealthMonitor.instance) {
      OptimizedHealthMonitor.instance = new OptimizedHealthMonitor();
    }
    return OptimizedHealthMonitor.instance;
  }

  private shouldInitialize(): boolean {
    // Only in development or with explicit flag
    if (import.meta.env.DEV) return true;
    if (import.meta.env.VITE_ENABLE_HEALTH_CHECKS === 'true') return true;
    if (localStorage.getItem('flowagro-health-checks') === 'true') return true;
    
    return false;
  }

  private initializeConfig(): HealthCheckConfig {
    const baseInterval = import.meta.env.DEV ? 30000 : 300000; // 30s dev, 5min prod
    
    const checks = new Map<string, NetworkAwareHealthCheck>([
      ['database', {
        priority: 'critical',
        networkRequired: true,
        frequencyMs: baseInterval,
        lastCheck: 0,
        enabled: true
      }],
      ['authentication', {
        priority: 'critical',
        networkRequired: true,
        frequencyMs: baseInterval * 2,
        lastCheck: 0,
        enabled: true
      }],
      ['cache', {
        priority: 'important',
        networkRequired: false,
        frequencyMs: baseInterval * 3,
        lastCheck: 0,
        enabled: true
      }],
      ['localStorage', {
        priority: 'important',
        networkRequired: false,
        frequencyMs: baseInterval * 4,
        lastCheck: 0,
        enabled: true
      }],
      ['network', {
        priority: 'optional',
        networkRequired: false,
        frequencyMs: baseInterval / 2,
        lastCheck: 0,
        enabled: true
      }],
      ['memory', {
        priority: 'optional',
        networkRequired: false,
        frequencyMs: baseInterval * 6,
        lastCheck: 0,
        enabled: !this.isLowPowerMode
      }],
      ['performance', {
        priority: 'optional',
        networkRequired: false,
        frequencyMs: baseInterval * 8,
        lastCheck: 0,
        enabled: import.meta.env.DEV
      }]
    ]);

    return {
      checks,
      globalEnabled: true,
      baseInterval,
      networkAwareScheduling: true
    };
  }

  private detectNetworkStatus(): void {
    // Initial detection
    this.updateNetworkStatus();

    // Listen for network changes
    window.addEventListener('online', () => {
      this.networkStatus = 'online';
      this.resumeNetworkChecks();
    });

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline';
      this.pauseNetworkChecks();
    });

    // Monitor network speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionSpeed = () => {
        if (connection.effectiveType === '2g' || connection.downlink < 1) {
          this.networkStatus = 'slow';
          this.adjustForSlowNetwork();
        } else {
          this.networkStatus = 'online';
        }
      };

      connection.addEventListener('change', updateConnectionSpeed);
      updateConnectionSpeed();
    }
  }

  private detectPowerMode(): void {
    // Battery API detection
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updatePowerMode = () => {
          this.lastBatteryLevel = battery.level;
          this.isLowPowerMode = battery.level < 0.2 || battery.charging === false;
          
          if (this.isLowPowerMode) {
            this.enablePowerSavingMode();
          } else {
            this.disablePowerSavingMode();
          }
        };

        battery.addEventListener('levelchange', updatePowerMode);
        battery.addEventListener('chargingchange', updatePowerMode);
        updatePowerMode();
      }).catch(() => {
        // Battery API not supported, assume normal power mode
        this.isLowPowerMode = false;
      });
    }
  }

  private updateNetworkStatus(): void {
    this.networkStatus = navigator.onLine ? 'online' : 'offline';
  }

  private pauseNetworkChecks(): void {
    this.config.checks.forEach((check, name) => {
      if (check.networkRequired) {
        check.enabled = false;
      }
    });
    
    if (import.meta.env.DEV) {
      logger.debug('Network checks paused due to offline status');
    }
  }

  private resumeNetworkChecks(): void {
    this.config.checks.forEach((check, name) => {
      if (check.networkRequired) {
        check.enabled = true;
        check.lastCheck = 0; // Force immediate check
      }
    });
    
    if (import.meta.env.DEV) {
      logger.debug('Network checks resumed');
    }
  }

  private adjustForSlowNetwork(): void {
    this.config.checks.forEach((check, name) => {
      if (check.networkRequired) {
        // Reduce frequency for slow networks
        check.frequencyMs *= 2;
      }
    });
    
    if (import.meta.env.DEV) {
      logger.debug('Health check frequency reduced for slow network');
    }
  }

  private enablePowerSavingMode(): void {
    this.config.checks.forEach((check, name) => {
      // Disable optional checks in low power mode
      if (check.priority === 'optional') {
        check.enabled = false;
      } else {
        // Reduce frequency for important checks
        check.frequencyMs *= 3;
      }
    });
    
    if (import.meta.env.DEV) {
      logger.debug('Power saving mode enabled for health checks', {
        batteryLevel: this.lastBatteryLevel
      });
    }
  }

  private disablePowerSavingMode(): void {
    // Restore original frequencies
    this.config = this.initializeConfig();
    
    if (import.meta.env.DEV) {
      logger.debug('Power saving mode disabled for health checks');
    }
  }

  private startIntelligentScheduler(): void {
    const scheduleNextCheck = () => {
      const now = Date.now();
      const nextChecks: Array<{ name: string; timeUntilCheck: number }> = [];

      this.config.checks.forEach((check, name) => {
        if (!check.enabled) return;
        
        const timeSinceLastCheck = now - check.lastCheck;
        const timeUntilCheck = Math.max(0, check.frequencyMs - timeSinceLastCheck);
        
        nextChecks.push({ name, timeUntilCheck });
      });

      if (nextChecks.length === 0) return;

      // Sort by time until next check
      nextChecks.sort((a, b) => a.timeUntilCheck - b.timeUntilCheck);
      
      const nextCheck = nextChecks[0];
      
      this.schedulerTimeout = setTimeout(async () => {
        await this.runSingleCheck(nextCheck.name);
        scheduleNextCheck(); // Schedule next check
      }, Math.max(1000, nextCheck.timeUntilCheck)); // Minimum 1 second
    };

    scheduleNextCheck();
  }

  private async runSingleCheck(checkName: string): Promise<void> {
    const check = this.config.checks.get(checkName);
    if (!check || !check.enabled) return;

    const startTime = performance.now();
    
    try {
      await performanceMonitor.measureAsync(`health-check-${checkName}`, async () => {
        switch (checkName) {
          case 'database':
            await this.checkDatabase();
            break;
          case 'authentication':
            await this.checkAuthentication();
            break;
          case 'cache':
            await this.checkCache();
            break;
          case 'localStorage':
            await this.checkLocalStorage();
            break;
          case 'network':
            await this.checkNetworkConnectivity();
            break;
          case 'memory':
            await this.checkMemory();
            break;
          case 'performance':
            await this.checkPerformance();
            break;
        }
      });

      check.lastCheck = Date.now();
      
      if (import.meta.env.DEV) {
        const duration = performance.now() - startTime;
        logger.debug(`Health check completed: ${checkName}`, {
          duration: Math.round(duration),
          networkStatus: this.networkStatus,
          powerMode: this.isLowPowerMode ? 'low' : 'normal'
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error(`Health check failed: ${checkName}`, { error });
      }
      
      // Update last check time even on failure to prevent spam
      check.lastCheck = Date.now();
    }
  }

  // Simplified health check methods (placeholder implementations)
  private async checkDatabase(): Promise<void> {
    // Simplified database check
    if (this.networkStatus === 'offline') throw new Error('Network offline');
  }

  private async checkAuthentication(): Promise<void> {
    // Simplified auth check
    if (this.networkStatus === 'offline') throw new Error('Network offline');
  }

  private async checkCache(): Promise<void> {
    // Local cache check - no network required
    const testKey = 'health_test';
    localStorage.setItem(testKey, 'test');
    if (localStorage.getItem(testKey) !== 'test') {
      throw new Error('Cache test failed');
    }
    localStorage.removeItem(testKey);
  }

  private async checkLocalStorage(): Promise<void> {
    // LocalStorage availability check
    try {
      const testKey = 'health_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      throw new Error('localStorage unavailable');
    }
  }

  private async checkNetworkConnectivity(): Promise<void> {
    // Simple connectivity check
    if (!navigator.onLine) throw new Error('Browser offline');
  }

  private async checkMemory(): Promise<void> {
    // Memory usage check
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 90) {
        throw new Error(`High memory usage: ${Math.round(usagePercent)}%`);
      }
    }
  }

  private async checkPerformance(): Promise<void> {
    // Performance metrics check
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      if (loadTime > 10000) { // 10 seconds threshold
        throw new Error(`Slow page load: ${Math.round(loadTime)}ms`);
      }
    }
  }

  public getStatus(): { 
    enabled: boolean; 
    checksEnabled: number; 
    networkStatus: string; 
    powerMode: string;
    nextCheckIn: number;
  } {
    const enabledChecks = Array.from(this.config.checks.values()).filter(check => check.enabled).length;
    
    // Calculate next check time
    const now = Date.now();
    let nextCheckIn = Infinity;
    
    this.config.checks.forEach((check) => {
      if (check.enabled) {
        const timeUntilNext = Math.max(0, check.frequencyMs - (now - check.lastCheck));
        nextCheckIn = Math.min(nextCheckIn, timeUntilNext);
      }
    });

    return {
      enabled: this.config.globalEnabled,
      checksEnabled: enabledChecks,
      networkStatus: this.networkStatus,
      powerMode: this.isLowPowerMode ? 'low-power' : 'normal',
      nextCheckIn: nextCheckIn === Infinity ? 0 : nextCheckIn
    };
  }

  public destroy(): void {
    if (this.schedulerTimeout) {
      clearTimeout(this.schedulerTimeout);
      this.schedulerTimeout = null;
    }
  }
}

// Export singleton instance
export const optimizedHealthMonitor = OptimizedHealthMonitor.getInstance();

// Convenience functions
export const getOptimizedHealthStatus = () => optimizedHealthMonitor.getStatus();
export const destroyHealthMonitor = () => optimizedHealthMonitor.destroy();