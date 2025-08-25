import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { MapStyle } from '@/services/mapService';

interface MapState {
  map: MapboxMap | null;
  isLoading: boolean;
  error: string | null;
  currentStyle: MapStyle;
  token: string | null;
  isFullscreen: boolean;
  showControls: boolean;
}

type MapAction =
  | { type: 'SET_MAP'; payload: MapboxMap | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STYLE'; payload: MapStyle }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_SHOW_CONTROLS'; payload: boolean };

const initialState: MapState = {
  map: null,
  isLoading: true,
  error: null,
  currentStyle: 'streets',
  token: null,
  isFullscreen: false,
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
  setShowControls: (show: boolean) => void;
}

const MapContext = createContext<MapContextType | null>(null);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  const contextValue: MapContextType = {
    ...state,
    setMap: (map) => dispatch({ type: 'SET_MAP', payload: map }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    setStyle: (style) => dispatch({ type: 'SET_STYLE', payload: style }),
    setToken: (token) => dispatch({ type: 'SET_TOKEN', payload: token }),
    setFullscreen: (fullscreen) => dispatch({ type: 'SET_FULLSCREEN', payload: fullscreen }),
    setShowControls: (show) => dispatch({ type: 'SET_SHOW_CONTROLS', payload: show })
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      dispatch({ type: 'SET_FULLSCREEN', payload: !!document.fullscreenElement });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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