import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { MapStyle } from '@/services/mapService';

interface ViewportState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

interface MapState {
  map: MapboxMap | null;
  isLoading: boolean;
  error: string | null;
  currentStyle: MapStyle;
  token: string | null;
  isFullscreen: boolean;
  fullscreenState: 'idle' | 'entering' | 'entered' | 'exiting';
  isTransitioning: boolean;
  orientation: 'portrait' | 'landscape';
  previousViewport: ViewportState | null;
  showControls: boolean;
}

type MapAction =
  | { type: 'SET_MAP'; payload: MapboxMap | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STYLE'; payload: MapStyle }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_FULLSCREEN_STATE'; payload: 'idle' | 'entering' | 'entered' | 'exiting' }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_ORIENTATION'; payload: 'portrait' | 'landscape' }
  | { type: 'SET_PREVIOUS_VIEWPORT'; payload: ViewportState | null }
  | { type: 'SET_SHOW_CONTROLS'; payload: boolean };

const initialState: MapState = {
  map: null,
  isLoading: true,
  error: null,
  currentStyle: 'streets',
  token: null,
  isFullscreen: false,
  fullscreenState: 'idle',
  isTransitioning: false,
  orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
  previousViewport: null,
  showControls: true
};

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'SET_MAP':
      return { ...state, map: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_STYLE':
      return { ...state, currentStyle: action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    case 'SET_FULLSCREEN_STATE':
      return { ...state, fullscreenState: action.payload };
    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload };
    case 'SET_ORIENTATION':
      return { ...state, orientation: action.payload };
    case 'SET_PREVIOUS_VIEWPORT':
      return { ...state, previousViewport: action.payload };
    case 'SET_SHOW_CONTROLS':
      return { ...state, showControls: action.payload };
    default:
      return state;
  }
};

interface MapContextType extends MapState {
  setMap: (map: MapboxMap | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStyle: (style: MapStyle) => void;
  setToken: (token: string | null) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setFullscreenState: (state: 'idle' | 'entering' | 'entered' | 'exiting') => void;
  setTransitioning: (transitioning: boolean) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setPreviousViewport: (viewport: ViewportState | null) => void;
  setShowControls: (show: boolean) => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

const MapContext = createContext<MapContextType | null>(null);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  // Enhanced fullscreen transitions
  const enterFullscreen = async () => {
    if (state.map && !state.isFullscreen) {
      // Save current viewport
      const currentViewport = {
        center: state.map.getCenter().toArray() as [number, number],
        zoom: state.map.getZoom(),
        pitch: state.map.getPitch(),
        bearing: state.map.getBearing()
      };
      dispatch({ type: 'SET_PREVIOUS_VIEWPORT', payload: currentViewport });
      dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'entering' });
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      
      try {
        await document.documentElement.requestFullscreen();
        
        // Wait for transition to complete
        setTimeout(() => {
          dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'entered' });
          dispatch({ type: 'SET_TRANSITIONING', payload: false });
        }, 300);
      } catch (error) {
        dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'idle' });
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }
    }
  };

  const exitFullscreen = async () => {
    if (state.isFullscreen) {
      dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'exiting' });
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      
      try {
        await document.exitFullscreen();
        
        // Restore previous viewport if available
        if (state.map && state.previousViewport) {
          state.map.flyTo({
            center: state.previousViewport.center,
            zoom: state.previousViewport.zoom,
            pitch: state.previousViewport.pitch,
            bearing: state.previousViewport.bearing,
            duration: 500
          });
        }
        
        setTimeout(() => {
          dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'idle' });
          dispatch({ type: 'SET_TRANSITIONING', payload: false });
          dispatch({ type: 'SET_PREVIOUS_VIEWPORT', payload: null });
        }, 300);
      } catch (error) {
        dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'entered' });
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }
    }
  };

  const contextValue: MapContextType = {
    ...state,
    setMap: (map) => dispatch({ type: 'SET_MAP', payload: map }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    setStyle: (style) => dispatch({ type: 'SET_STYLE', payload: style }),
    setToken: (token) => dispatch({ type: 'SET_TOKEN', payload: token }),
    setFullscreen: (fullscreen) => dispatch({ type: 'SET_FULLSCREEN', payload: fullscreen }),
    setFullscreenState: (state) => dispatch({ type: 'SET_FULLSCREEN_STATE', payload: state }),
    setTransitioning: (transitioning) => dispatch({ type: 'SET_TRANSITIONING', payload: transitioning }),
    setOrientation: (orientation) => dispatch({ type: 'SET_ORIENTATION', payload: orientation }),
    setPreviousViewport: (viewport) => dispatch({ type: 'SET_PREVIOUS_VIEWPORT', payload: viewport }),
    setShowControls: (show) => dispatch({ type: 'SET_SHOW_CONTROLS', payload: show }),
    enterFullscreen,
    exitFullscreen
  };

  // Enhanced fullscreen and orientation handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      dispatch({ type: 'SET_FULLSCREEN', payload: isFullscreen });
      
      // Auto-transition states if changed externally
      if (!isFullscreen && state.fullscreenState !== 'idle') {
        dispatch({ type: 'SET_FULLSCREEN_STATE', payload: 'idle' });
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }
    };

    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      dispatch({ type: 'SET_ORIENTATION', payload: newOrientation });
      
      // Trigger map resize after orientation change
      setTimeout(() => {
        if (state.map) {
          state.map.resize();
        }
      }, 100);
    };

    const handleResize = () => {
      handleOrientationChange();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.map, state.fullscreenState]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};