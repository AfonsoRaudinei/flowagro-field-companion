// Map configuration service
export const MapConfig = {
  // MapTiler API Key - Replace with your actual key
  MAPTILER_KEY: 'MZ7IzlO1sjOVafWQMaNa',
  
  // Base URL for MapTiler
  BASE_URL: 'https://api.maptiler.com',
  
  // Available map styles
  STYLES: {
    satellite: {
      id: 'satellite',
      name: 'Satélite',
      url: 'https://api.maptiler.com/maps/satellite/style.json'
    },
    hybrid: {
      id: 'hybrid', 
      name: 'Híbrido',
      url: 'https://api.maptiler.com/maps/hybrid/style.json'
    },
    terrain: {
      id: 'terrain',
      name: 'Terreno', 
      url: 'https://api.maptiler.com/maps/landscape/style.json'
    }
  },
  
  // Get style URL with API key
  getStyleUrl: (styleId: string) => {
    const style = MapConfig.STYLES[styleId as keyof typeof MapConfig.STYLES];
    if (!style) return MapConfig.STYLES.satellite.url + `?key=${MapConfig.MAPTILER_KEY}`;
    return `${style.url}?key=${MapConfig.MAPTILER_KEY}`;
  },
  
  // Default map settings
  DEFAULT_CENTER: [-52.0, -10.0] as [number, number], // Center of Brazil
  DEFAULT_ZOOM: 16,
  
  // Check if API key is valid (basic check)
  isValidKey: () => {
    return MapConfig.MAPTILER_KEY && 
           MapConfig.MAPTILER_KEY !== 'YOUR_MAPTILER_KEY' &&
           MapConfig.MAPTILER_KEY.length > 10;
  }
};

export default MapConfig;