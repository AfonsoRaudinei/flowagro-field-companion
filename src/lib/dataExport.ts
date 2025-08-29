import { MapPin } from '@/hooks/useMapPins';
import { NDVIStats, NDVITimeSeriesData } from '@/components/maps/NDVIAnalysis';

export interface ExportOptions {
  format: 'csv' | 'geojson' | 'json';
  includeMetadata?: boolean;
  dateFormat?: 'iso' | 'locale';
}

export class DataExporter {
  // Export pins to various formats
  static exportPins(pins: MapPin[], options: ExportOptions = { format: 'csv' }): string {
    switch (options.format) {
      case 'csv':
        return this.pinsToCSV(pins, options);
      case 'geojson':
        return this.pinsToGeoJSON(pins, options);
      case 'json':
        return this.pinsToJSON(pins, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  // Export NDVI data to CSV
  static exportNDVIData(
    stats: NDVIStats | null,
    timeSeries: NDVITimeSeriesData[],
    options: ExportOptions = { format: 'csv' }
  ): string {
    switch (options.format) {
      case 'csv':
        return this.ndviToCSV(stats, timeSeries, options);
      case 'json':
        return this.ndviToJSON(stats, timeSeries, options);
      default:
        throw new Error(`NDVI export only supports CSV and JSON formats`);
    }
  }

  // Convert pins to CSV format
  private static pinsToCSV(pins: MapPin[], options: ExportOptions): string {
    if (pins.length === 0) return 'No data available';

    const headers = [
      'ID',
      'Title',
      'Description',
      'Type',
      'Color',
      'Latitude',
      'Longitude',
      'Created At'
    ];

    const rows = pins.map(pin => [
      pin.id,
      this.escapeCsvValue(pin.title || ''),
      this.escapeCsvValue(pin.description || ''),
      pin.type || 'default',
      pin.color || '#0057FF',
      pin.coordinates[1].toString(),
      pin.coordinates[0].toString(),
      this.formatDate(pin.createdAt, options.dateFormat)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return options.includeMetadata 
      ? this.addCSVMetadata(csvContent, 'Pins Export')
      : csvContent;
  }

  // Convert pins to GeoJSON format
  private static pinsToGeoJSON(pins: MapPin[], options: ExportOptions): string {
    const geojson = {
      type: 'FeatureCollection' as const,
      metadata: options.includeMetadata ? {
        title: 'FlowAgro Pins Export',
        description: 'Map pins exported from FlowAgro Technical Map',
        exportDate: new Date().toISOString(),
        count: pins.length
      } : undefined,
      features: pins.map(pin => ({
        type: 'Feature' as const,
        id: pin.id,
        properties: {
          title: pin.title || '',
          description: pin.description || '',
          type: pin.type || 'default',
          color: pin.color || '#0057FF',
          createdAt: this.formatDate(pin.createdAt, options.dateFormat)
        },
        geometry: {
          type: 'Point' as const,
          coordinates: pin.coordinates
        }
      }))
    };

    return JSON.stringify(geojson, null, 2);
  }

  // Convert pins to JSON format
  private static pinsToJSON(pins: MapPin[], options: ExportOptions): string {
    const data = {
      metadata: options.includeMetadata ? {
        title: 'FlowAgro Pins Export',
        exportDate: new Date().toISOString(),
        count: pins.length,
        format: 'JSON'
      } : undefined,
      pins: pins.map(pin => ({
        ...pin,
        createdAt: this.formatDate(pin.createdAt, options.dateFormat)
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  // Convert NDVI data to CSV format
  private static ndviToCSV(
    stats: NDVIStats | null,
    timeSeries: NDVITimeSeriesData[],
    options: ExportOptions
  ): string {
    let csvContent = '';

    // Add statistics section
    if (stats) {
      csvContent += 'NDVI Statistics\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Mean,${stats.mean}\n`;
      csvContent += `Minimum,${stats.min}\n`;
      csvContent += `Maximum,${stats.max}\n`;
      csvContent += `Standard Deviation,${stats.stdDev}\n`;
      csvContent += `Median,${stats.median}\n`;
      csvContent += `Area (hectares),${stats.area}\n`;
      csvContent += `Healthy Vegetation (%),${stats.healthyVegetation}\n`;
      csvContent += `Moderate Vegetation (%),${stats.moderateVegetation}\n`;
      csvContent += `Poor Vegetation (%),${stats.poorVegetation}\n`;
      csvContent += `Bare Ground (%),${stats.bareGround}\n`;
      csvContent += '\n';
    }

    // Add time series section
    if (timeSeries.length > 0) {
      csvContent += 'NDVI Time Series\n';
      const timeHeaders = ['Date', 'NDVI', 'Temperature', 'Precipitation'];
      csvContent += timeHeaders.join(',') + '\n';

      timeSeries.forEach(data => {
        const row = [
          this.formatDate(new Date(data.date), options.dateFormat),
          data.ndvi.toFixed(3),
          data.temperature?.toFixed(1) || '',
          data.precipitation?.toFixed(1) || ''
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    return options.includeMetadata 
      ? this.addCSVMetadata(csvContent, 'NDVI Analysis Export')
      : csvContent;
  }

  // Convert NDVI data to JSON format  
  private static ndviToJSON(
    stats: NDVIStats | null,
    timeSeries: NDVITimeSeriesData[],
    options: ExportOptions
  ): string {
    const data = {
      metadata: options.includeMetadata ? {
        title: 'FlowAgro NDVI Analysis Export',
        exportDate: new Date().toISOString(),
        format: 'JSON'
      } : undefined,
      statistics: stats,
      timeSeries: timeSeries.map(item => ({
        ...item,
        date: this.formatDate(new Date(item.date), options.dateFormat)
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  // Utility methods
  private static escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private static formatDate(date: Date, format: 'iso' | 'locale' = 'iso'): string {
    return format === 'iso' 
      ? date.toISOString()
      : date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  }

  private static addCSVMetadata(csvContent: string, title: string): string {
    const metadata = [
      `# ${title}`,
      `# Exported from FlowAgro`,
      `# Export Date: ${new Date().toLocaleString('pt-BR')}`,
      `# Format: CSV`,
      '',
      csvContent
    ].join('\n');

    return metadata;
  }

  // Download file utility
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Generate filename with timestamp
  static generateFilename(baseNome: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseNome}_${timestamp}.${format}`;
  }

  // Get MIME type for format
  static getMimeType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
      case 'geojson':
        return 'application/json';
      default:
        return 'text/plain';
    }
  }
}