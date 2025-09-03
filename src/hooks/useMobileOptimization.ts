import { useEffect, useCallback, useState } from 'react';
import { useMapInstance } from './useMapInstance';
import { performanceMonitor } from '@/lib/unifiedPerformance';

interface MobileOptimizationConfig {
  enableGPUAcceleration: boolean;
  adaptiveQuality: boolean;
  batteryOptimization: boolean;
  touchOptimization: boolean;
  memoryManagement: boolean;
  frameRateTarget: number;
}

interface DeviceCapabilities {
  cores: number;
  memory: number;
  pixelRatio: number;
  isMobile: boolean;
  batteryLevel?: number;
  isLowPowerMode?: boolean;
  maxTextureSize: number;
  webGLVersion: number;
}

interface OptimizationStatus {
  currentFPS: number;
  memoryUsage: number;
  batteryLevel: number;
  networkSpeed: 'fast' | 'medium' | 'slow' | 'offline';
  qualityLevel: 'high' | 'medium' | 'low';
  isOptimized: boolean;
}

/**
 * Hook for comprehensive mobile optimization including GPU acceleration,
 * battery awareness, adaptive quality, and performance monitoring
 */
export const useMobileOptimization = (config: Partial<MobileOptimizationConfig> = {}) => {
  const { map, isReady } = useMapInstance();
  const [status, setStatus] = useState<OptimizationStatus>({
    currentFPS: 60,
    memoryUsage: 0,
    batteryLevel: 100,
    networkSpeed: 'fast',
    qualityLevel: 'high',
    isOptimized: false
  });

  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);

  const defaultConfig: MobileOptimizationConfig = {
    enableGPUAcceleration: true,
    adaptiveQuality: true,
    batteryOptimization: true,
    touchOptimization: true,
    memoryManagement: true,
    frameRateTarget: 60,
    ...config
  };

  // Detect device capabilities
  const detectDeviceCapabilities = useCallback((): DeviceCapabilities => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    const capabilities: DeviceCapabilities = {
      cores: navigator.hardwareConcurrency || 4,
      memory: (navigator as any).deviceMemory || 4,
      pixelRatio: window.devicePixelRatio || 1,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
      webGLVersion: gl ? (gl.constructor.name.includes('2') ? 2 : 1) : 1
    };

    // Get battery info if available
    (navigator as any).getBattery?.()?.then((battery: any) => {
      capabilities.batteryLevel = battery.level * 100;
      capabilities.isLowPowerMode = battery.level < 0.2;
    });

    return capabilities;
  }, []);

  // Get network speed
  const getNetworkSpeed = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!navigator.onLine) return 'offline';
    
    if (!connection) return 'medium';
    
    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case '4g': return 'fast';
      case '3g': return 'medium';
      case '2g':
      case 'slow-2g': return 'slow';
      default: return 'medium';
    }
  }, []);

  // Calculate optimal quality level
  const calculateOptimalQuality = useCallback((
    capabilities: DeviceCapabilities,
    networkSpeed: string,
    batteryLevel: number,
    currentFPS: number
  ): 'high' | 'medium' | 'low' => {
    let score = 1;

    // Device capability score
    if (capabilities.memory < 4) score -= 0.3;
    if (capabilities.cores < 4) score -= 0.2;
    if (capabilities.isMobile) score -= 0.1;
    if (capabilities.webGLVersion < 2) score -= 0.2;

    // Network score
    if (networkSpeed === 'slow') score -= 0.3;
    if (networkSpeed === 'offline') score -= 0.5;

    // Battery score
    if (batteryLevel < 20) score -= 0.4;
    if (batteryLevel < 50) score -= 0.2;

    // Performance score
    if (currentFPS < 30) score -= 0.4;
    if (currentFPS < 45) score -= 0.2;

    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }, []);

  // Apply GPU acceleration optimizations
  const applyGPUAcceleration = useCallback(() => {
    if (!map || !defaultConfig.enableGPUAcceleration) return;

    // Force GPU layer for all animations
    const mapContainer = map.getContainer();
    mapContainer.style.transform = 'translateZ(0)';
    mapContainer.style.willChange = 'transform';

    // Optimize canvas rendering
    const canvas = mapContainer.querySelector('canvas');
    if (canvas) {
      canvas.style.transform = 'translateZ(0)';
      canvas.style.imageRendering = 'optimizeSpeed';
    }
  }, [map, defaultConfig.enableGPUAcceleration]);

  // Apply quality-based optimizations
  const applyQualityOptimizations = useCallback((qualityLevel: 'high' | 'medium' | 'low') => {
    if (!map || !isReady) return;

    switch (qualityLevel) {
      case 'low':
        // Disable expensive features
        map.setRenderWorldCopies(false);
        map.setMaxZoom(18);
        
        // Reduce tile quality
        if (map.getSource('satellite')) {
          const source = map.getSource('satellite') as any;
          source.tileSize = 256;
        }
        break;

      case 'medium':
        map.setRenderWorldCopies(false);
        map.setMaxZoom(20);
        break;

      case 'high':
        map.setRenderWorldCopies(true);
        map.setMaxZoom(22);
        break;
    }

    // Adjust animation performance
    const animationOptions = {
      duration: qualityLevel === 'low' ? 0 : qualityLevel === 'medium' ? 500 : 1000,
      easing: qualityLevel === 'low' ? (t: number) => t : undefined
    };

    // Store for future use
    (map as any)._optimizationLevel = qualityLevel;
    (map as any)._animationOptions = animationOptions;
  }, [map, isReady]);

  // Apply touch optimizations
  const applyTouchOptimizations = useCallback(() => {
    if (!map || !defaultConfig.touchOptimization) return;

    // Optimize touch events
    const mapContainer = map.getContainer();
    
    // Use passive listeners for better scroll performance
    mapContainer.style.touchAction = 'none';
    
    // Reduce touch event frequency for better performance
    let touchMoveThrottled = false;
    const originalTouchMove = mapContainer.ontouchmove;
    
    mapContainer.ontouchmove = (e) => {
      if (touchMoveThrottled) return;
      
      touchMoveThrottled = true;
      requestAnimationFrame(() => {
        if (originalTouchMove) originalTouchMove.call(mapContainer, e);
        touchMoveThrottled = false;
      });
    };
  }, [map, defaultConfig.touchOptimization]);

  // Monitor performance metrics
  const monitorPerformance = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setStatus(prev => ({
          ...prev,
          currentFPS: fps
        }));

        frameCount = 0;
        lastTime = currentTime;

        // Log performance if below target
        if (fps < defaultConfig.frameRateTarget * 0.8) {
          performanceMonitor.recordMemoryUsage('mobile-optimization-fps-drop');
        }
      }
      
      requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }, [defaultConfig.frameRateTarget]);

  // Monitor memory usage
  const monitorMemoryUsage = useCallback(() => {
    if (!(performance as any).memory) return;

    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      setStatus(prev => ({
        ...prev,
        memoryUsage: usagePercent
      }));

      // Trigger garbage collection if memory usage is high
      if (defaultConfig.memoryManagement && usagePercent > 80) {
        performanceMonitor.recordMemoryUsage('mobile-optimization-high-memory');
        
        // Clear caches if available
        if (map && (map as any).clearCache) {
          (map as any).clearCache();
        }
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [map, defaultConfig.memoryManagement]);

  // Monitor battery status
  const monitorBatteryStatus = useCallback(() => {
    if (!(navigator as any).getBattery) return;

    (navigator as any).getBattery().then((battery: any) => {
      const updateBatteryStatus = () => {
        const level = battery.level * 100;
        
        setStatus(prev => ({
          ...prev,
          batteryLevel: level
        }));

        // Apply battery optimizations
        if (defaultConfig.batteryOptimization && level < 20) {
          // Enable power saving mode
          applyQualityOptimizations('low');
        }
      };

      battery.addEventListener('levelchange', updateBatteryStatus);
      battery.addEventListener('chargingchange', updateBatteryStatus);
      updateBatteryStatus();
    });
  }, [defaultConfig.batteryOptimization, applyQualityOptimizations]);

  // Apply all optimizations
  const optimize = useCallback(() => {
    if (!map || !isReady || !deviceCapabilities) return;

    const networkSpeed = getNetworkSpeed();
    const qualityLevel = calculateOptimalQuality(
      deviceCapabilities,
      networkSpeed,
      status.batteryLevel,
      status.currentFPS
    );

    applyGPUAcceleration();
    applyQualityOptimizations(qualityLevel);
    applyTouchOptimizations();

    setStatus(prev => ({
      ...prev,
      networkSpeed: networkSpeed as any,
      qualityLevel,
      isOptimized: true
    }));

    performanceMonitor.recordMemoryUsage('mobile-optimization-applied');
  }, [
    map,
    isReady,
    deviceCapabilities,
    getNetworkSpeed,
    calculateOptimalQuality,
    applyGPUAcceleration,
    applyQualityOptimizations,
    applyTouchOptimizations,
    status.batteryLevel,
    status.currentFPS
  ]);

  // Initialize device capabilities
  useEffect(() => {
    const capabilities = detectDeviceCapabilities();
    setDeviceCapabilities(capabilities);
  }, [detectDeviceCapabilities]);

  // Initialize monitoring
  useEffect(() => {
    if (!isReady) return;

    const cleanupMemory = monitorMemoryUsage();
    monitorPerformance();
    monitorBatteryStatus();

    return cleanupMemory;
  }, [isReady, monitorMemoryUsage, monitorPerformance, monitorBatteryStatus]);

  // Apply optimizations when ready
  useEffect(() => {
    if (isReady && deviceCapabilities) {
      optimize();
    }
  }, [isReady, deviceCapabilities, optimize]);

  // Reoptimize on significant status changes
  useEffect(() => {
    if (status.currentFPS < defaultConfig.frameRateTarget * 0.7 || status.memoryUsage > 80) {
      optimize();
    }
  }, [status.currentFPS, status.memoryUsage, defaultConfig.frameRateTarget, optimize]);

  return {
    status,
    deviceCapabilities,
    optimize,
    config: defaultConfig
  };
};