import React from 'react';
import { useFloatingActions, FloatingAction } from '../../hooks/useFloatingActions';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
export interface FloatingActionButtonsProps {
  actions: FloatingAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  maxVisibleActions?: number;
  expandOnHover?: boolean;
  contextSensitive?: boolean;
  autoHide?: boolean;
  className?: string;
}

/**
 * Sistema de Floating Action Buttons contextuais
 * Adaptam-se ao contexto e fornecem acesso rápido a ações importantes
 */
export function FloatingActionButtons({
  actions,
  position = 'bottom-right',
  maxVisibleActions = 4,
  expandOnHover = true,
  contextSensitive = true,
  autoHide = false,
  className = ''
}: FloatingActionButtonsProps) {
  const {
    state,
    toggle,
    executeAction,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    getActionPositions,
    getPositionClasses,
    containerRef,
    hasActions,
    hasPrimaryAction,
    hasContextualActions
  } = useFloatingActions(actions, {
    maxVisibleActions,
    expandOnHover,
    contextSensitive,
    position,
    autoHide,
    autoHideDelay: 3000
  });
  const actionPositions = getActionPositions();
  if (!hasActions) {
    return null;
  }
  return <div ref={containerRef} className={cn('floating-action-buttons', getPositionClasses(), className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart}>
      {/* Ações contextuais expandidas */}
      {state.isExpanded && hasContextualActions && <div className="absolute inset-0">
          {state.contextualActions.map((action, index) => {
        const position = actionPositions[index] || {
          x: 0,
          y: 0
        };
        const IconComponent = action.icon;
        return <div key={action.id} className={cn('absolute transition-all duration-200 ease-out', state.isAnimating ? 'animate-scale-in' : '')} style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transitionDelay: `${index * 50}ms`
        }}>
                <Button variant="secondary" size="sm" className={cn('h-10 w-10 p-0 rounded-full shadow-lg', 'bg-background border border-border', 'hover:bg-primary hover:text-primary-foreground', 'transform hover:scale-110 transition-all duration-200', action.disabled && 'opacity-50 cursor-not-allowed')} onClick={() => executeAction(action)} disabled={action.disabled} aria-label={action.label} title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}>
                  <IconComponent className="w-4 h-4" />
                </Button>
                
                {/* Label tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {action.label}
                  {action.shortcut && <span className="ml-1 text-muted-foreground">
                      {action.shortcut}
                    </span>}
                </div>
              </div>;
      })}
        </div>}

      {/* Botão principal */}
      {hasPrimaryAction && state.primaryAction && <Button variant={state.primaryAction.primary ? 'default' : 'secondary'} size="default" className={cn('h-14 w-14 p-0 rounded-full shadow-xl', 'bg-primary text-primary-foreground', 'hover:bg-primary/90 hover:shadow-2xl', 'transform hover:scale-110 active:scale-95', 'transition-all duration-200 ease-out', state.isExpanded && 'rotate-45', state.primaryAction.disabled && 'opacity-50 cursor-not-allowed')} onClick={() => {
      if (hasContextualActions && !state.primaryAction?.disabled) {
        toggle();
      } else if (state.primaryAction && !state.primaryAction.disabled) {
        executeAction(state.primaryAction);
      }
    }} disabled={state.primaryAction.disabled} aria-label={hasContextualActions ? state.isExpanded ? 'Fechar menu' : 'Abrir menu de ações' : state.primaryAction.label} title={state.primaryAction.label}>
          {hasContextualActions ? state.isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" /> : <state.primaryAction.icon className="w-6 h-6" />}
        </Button>}

      {/* Ripple effect */}
      {state.isExpanded && <div className={cn('absolute inset-0 rounded-full border-2 border-primary/30', 'animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite]', '-z-10')} />}

      {/* Background overlay quando expandido */}
      {state.isExpanded && hasContextualActions && <div className="fixed inset-0 -z-20 bg-black/10 backdrop-blur-[1px]" onClick={toggle} />}

      {/* Indicador de ações disponíveis */}
      {!state.isExpanded && hasContextualActions && <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold">
          {state.contextualActions.length}
        </div>}

      {/* Keyboard shortcuts overlay */}
      {state.isExpanded}
    </div>;
}