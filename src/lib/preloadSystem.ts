/**
 * Sistema Inteligente de Preload Unificado - FlowAgro
 * 
 * Otimiza carregamento baseado em:
 * - Comportamento do usuário
 * - Condições de rede
 * - Viewport e intersecção
 * - Prioridade de componentes
 */

import { logger } from './logger';
import { performanceMonitor } from './unifiedPerformance';

interface PreloadTask {
  id: string;
  priority: number;
  type: 'component' | 'route' | 'data' | 'image' | 'chunk';
  loader: () => Promise<any>;
  condition?: () => boolean;
  dependencies?: string[];
  estimatedSize?: number;
  viewport?: boolean;
}

interface NetworkInfo {
  type: string;
  downlink: number;
  rtt: number;
  effectiveType: string;
}

interface UserPattern {
  mostVisitedRoutes: string[];
  commonSequences: string[][];
  averageSessionTime: number;
  lastVisit: Date;
  device: 'mobile' | 'desktop' | 'tablet';
}

class IntelligentPreloadSystem {
  private static instance: IntelligentPreloadSystem;
  private tasks = new Map<string, PreloadTask>();
  private loadedTasks = new Set<string>();
  private userPatterns: UserPattern | null = null;
  private networkInfo: NetworkInfo | null = null;
  private isPreloading = false;
  private concurrentLimit = 3;
  private maxCacheSize = 50; // MB

  private constructor() {
    this.initNetworkMonitoring();
    this.loadUserPatterns();
  }

  static getInstance(): IntelligentPreloadSystem {
    if (!IntelligentPreloadSystem.instance) {
      IntelligentPreloadSystem.instance = new IntelligentPreloadSystem();
    }
    return IntelligentPreloadSystem.instance;
  }

  private initNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkInfo = {
        type: connection.type || 'unknown',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        effectiveType: connection.effectiveType || '4g'
      };

      connection.addEventListener('change', () => {
        this.networkInfo = {
          type: connection.type || 'unknown',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          effectiveType: connection.effectiveType || '4g'
        };
        this.adjustPreloadStrategy();
      });
    }
  }

  private loadUserPatterns() {
    try {
      const stored = localStorage.getItem('flowagro:user-patterns');
      if (stored) {
        this.userPatterns = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load user patterns', error);
    }
  }

  private saveUserPatterns() {
    if (this.userPatterns) {
      try {
        localStorage.setItem('flowagro:user-patterns', JSON.stringify(this.userPatterns));
      } catch (error) {
        logger.error('Failed to save user patterns', error);
      }
    }
  }

  private adjustPreloadStrategy() {
    if (!this.networkInfo) return;

    // Ajustar estratégia baseado na rede
    if (this.networkInfo.effectiveType === 'slow-2g' || this.networkInfo.effectiveType === '2g') {
      this.concurrentLimit = 1;
    } else if (this.networkInfo.effectiveType === '3g') {
      this.concurrentLimit = 2;
    } else {
      this.concurrentLimit = 3;
    }

    logger.info('Preload strategy adjusted', { 
      effectiveType: this.networkInfo.effectiveType,
      concurrentLimit: this.concurrentLimit 
    });
  }

  /**
   * Registra uma tarefa de preload
   */
  registerTask(task: PreloadTask): void {
    this.tasks.set(task.id, task);
    
    // Se a condição é atendida e tem alta prioridade, executa imediatamente
    if (task.priority >= 90 && (!task.condition || task.condition())) {
      this.executeTask(task.id);
    }
  }

  /**
   * Executa preload baseado em viewport (intersecção)
   */
  preloadOnViewport(elementRef: HTMLElement, taskIds: string[]): void {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            taskIds.forEach(id => this.executeTask(id));
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        rootMargin: '100px',
        threshold: 0.1 
      }
    );

    observer.observe(elementRef);
  }

  /**
   * Preload preditivo baseado em padrões do usuário
   */
  predictivePreload(currentRoute: string): void {
    if (!this.userPatterns) return;

    const likelyNextRoutes = this.predictNextRoutes(currentRoute);
    
    likelyNextRoutes.forEach(route => {
      const taskId = `route:${route}`;
      if (this.tasks.has(taskId)) {
        this.executeTask(taskId);
      }
    });
  }

  private predictNextRoutes(currentRoute: string): string[] {
    if (!this.userPatterns) return [];

    // Buscar sequências que começam com a rota atual
    const sequences = this.userPatterns.commonSequences
      .filter(seq => seq.includes(currentRoute))
      .map(seq => {
        const currentIndex = seq.indexOf(currentRoute);
        return seq[currentIndex + 1];
      })
      .filter(Boolean);

    return [...new Set(sequences)].slice(0, 3);
  }

  /**
   * Executa uma tarefa de preload
   */
  async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || this.loadedTasks.has(taskId)) return;

    if (task.condition && !task.condition()) return;

    // Verificar dependências
    if (task.dependencies) {
      const unmetDeps = task.dependencies.filter(dep => !this.loadedTasks.has(dep));
      if (unmetDeps.length > 0) {
        logger.debug(`Task ${taskId} waiting for dependencies: ${unmetDeps.join(', ')}`);
        return;
      }
    }

    try {
      const startTime = performance.now();
      
      logger.debug(`Preloading task: ${taskId}`);
      await task.loader();
      
      const loadTime = performance.now() - startTime;
      this.loadedTasks.add(taskId);
      
      // Log performance metrics without using invalid method signature
      logger.info(`Task preloaded successfully: ${taskId}`, { 
        loadTime,
        type: task.type,
        priority: task.priority 
      });
      
      logger.info(`Task preloaded successfully: ${taskId}`, { 
        loadTime,
        type: task.type,
        priority: task.priority 
      });

    } catch (error) {
      logger.error(`Failed to preload task: ${taskId}`, error);
    }
  }

  /**
   * Preload em lote com controle de concorrência
   */
  async batchPreload(taskIds: string[]): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    try {
      // Ordenar por prioridade
      const sortedTasks = taskIds
        .map(id => this.tasks.get(id))
        .filter(Boolean)
        .sort((a, b) => b!.priority - a!.priority);

      // Executar em lotes respeitando o limite de concorrência
      for (let i = 0; i < sortedTasks.length; i += this.concurrentLimit) {
        const batch = sortedTasks.slice(i, i + this.concurrentLimit);
        
        await Promise.allSettled(
          batch.map(task => this.executeTask(task!.id))
        );
        
        // Pequena pausa entre lotes para não bloquear a UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Registra padrão de navegação do usuário
   */
  trackNavigation(route: string): void {
    if (!this.userPatterns) {
      this.userPatterns = {
        mostVisitedRoutes: [route],
        commonSequences: [[route]],
        averageSessionTime: 0,
        lastVisit: new Date(),
        device: this.detectDevice()
      };
    } else {
      // Atualizar rotas mais visitadas
      const routeIndex = this.userPatterns.mostVisitedRoutes.indexOf(route);
      if (routeIndex === -1) {
        this.userPatterns.mostVisitedRoutes.push(route);
      }

      // Atualizar sequências comuns
      const lastSequence = this.userPatterns.commonSequences[this.userPatterns.commonSequences.length - 1];
      if (lastSequence && lastSequence[lastSequence.length - 1] !== route) {
        lastSequence.push(route);
      } else if (!lastSequence) {
        this.userPatterns.commonSequences.push([route]);
      }

      this.userPatterns.lastVisit = new Date();
    }

    this.saveUserPatterns();
  }

  private detectDevice(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/.test(userAgent)) return 'mobile';
    if (/tablet|ipad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Limpa cache baseado em idade e tamanho
   */
  cleanupCache(): void {
    const cacheKeys = Array.from(this.loadedTasks);
    
    // Manter apenas os 50 itens mais recentes
    if (cacheKeys.length > this.maxCacheSize) {
      const toRemove = cacheKeys.slice(0, cacheKeys.length - this.maxCacheSize);
      toRemove.forEach(key => this.loadedTasks.delete(key));
      
      logger.info(`Cache cleanup: removed ${toRemove.length} items`);
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  getStats() {
    return {
      totalTasks: this.tasks.size,
      loadedTasks: this.loadedTasks.size,
      hitRate: this.loadedTasks.size / this.tasks.size,
      networkInfo: this.networkInfo,
      userPatterns: this.userPatterns,
      concurrentLimit: this.concurrentLimit
    };
  }

  /**
   * Reseta o sistema (útil para testes)
   */
  reset(): void {
    this.tasks.clear();
    this.loadedTasks.clear();
    this.userPatterns = null;
    this.isPreloading = false;
  }
}

// Instância singleton
export const preloadSystem = IntelligentPreloadSystem.getInstance();

// Hook para React
export const usePreloadSystem = () => {
  return {
    registerTask: (task: PreloadTask) => preloadSystem.registerTask(task),
    preloadOnViewport: (element: HTMLElement, taskIds: string[]) => 
      preloadSystem.preloadOnViewport(element, taskIds),
    predictivePreload: (route: string) => preloadSystem.predictivePreload(route),
    batchPreload: (taskIds: string[]) => preloadSystem.batchPreload(taskIds),
    trackNavigation: (route: string) => preloadSystem.trackNavigation(route),
    getStats: () => preloadSystem.getStats()
  };
};

export default preloadSystem;