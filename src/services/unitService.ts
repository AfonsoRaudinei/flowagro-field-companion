export type RegionType = 'SP' | 'MG' | 'GERAL';
export type UnitType = 'm2' | 'ha' | 'alqueire_paulista' | 'alqueire_mineiro';

export interface AreaMeasurement {
  m2: number;
  ha: number;
  alqueire_paulista: number;
  alqueire_mineiro: number;
}

export interface UnitConfig {
  id: UnitType;
  name: string;
  symbol: string;
  region?: RegionType;
  precision: number;
}

export class UnitService {
  // Conversões (todas baseadas em m²)
  private static readonly CONVERSIONS = {
    m2: 1,
    ha: 10000, // 1 hectare = 10.000 m²
    alqueire_paulista: 24200, // 1 alqueire paulista = 24.200 m²
    alqueire_mineiro: 48400  // 1 alqueire mineiro = 48.400 m²
  };

  private static readonly UNIT_CONFIGS: UnitConfig[] = [
    { id: 'm2', name: 'Metros quadrados', symbol: 'm²', precision: 0 },
    { id: 'ha', name: 'Hectares', symbol: 'ha', precision: 2 },
    { id: 'alqueire_paulista', name: 'Alqueire Paulista', symbol: 'alq.', region: 'SP', precision: 2 },
    { id: 'alqueire_mineiro', name: 'Alqueire Mineiro', symbol: 'alq.', region: 'MG', precision: 2 }
  ];

  static convertArea(areaM2: number): AreaMeasurement {
    return {
      m2: areaM2,
      ha: areaM2 / this.CONVERSIONS.ha,
      alqueire_paulista: areaM2 / this.CONVERSIONS.alqueire_paulista,
      alqueire_mineiro: areaM2 / this.CONVERSIONS.alqueire_mineiro
    };
  }

  static formatArea(areaM2: number, unit: UnitType): string {
    const config = this.UNIT_CONFIGS.find(u => u.id === unit);
    if (!config) return '0 m²';

    const value = areaM2 / this.CONVERSIONS[unit];
    const formatted = value.toFixed(config.precision);
    
    return `${formatted} ${config.symbol}`;
  }

  static getAutoUnit(areaM2: number, region?: RegionType): UnitType {
    // Auto-seleção baseada no tamanho da área
    if (areaM2 < 1000) return 'm2';
    if (areaM2 < 50000) return 'ha';
    
    // Para áreas grandes, usar alqueire baseado na região
    if (region === 'SP') return 'alqueire_paulista';
    if (region === 'MG') return 'alqueire_mineiro';
    
    return 'ha'; // Default para hectares
  }

  static getUnitsForRegion(region?: RegionType): UnitConfig[] {
    if (!region) return this.UNIT_CONFIGS;
    
    return this.UNIT_CONFIGS.filter(unit => 
      !unit.region || unit.region === region || unit.id === 'm2' || unit.id === 'ha'
    );
  }

  static getUnitConfig(unit: UnitType): UnitConfig | undefined {
    return this.UNIT_CONFIGS.find(u => u.id === unit);
  }

  static getMultipleFormats(areaM2: number, region?: RegionType): string[] {
    const units = this.getUnitsForRegion(region);
    return units.map(unit => this.formatArea(areaM2, unit.id));
  }
}