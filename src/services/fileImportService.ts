import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { OfflineStorageService, OfflineImport } from './offlineStorageService';

export interface ImportedFile {
  id: string;
  farmId: string;
  farmName: string;
  fileName: string;
  fileType: '.kml' | '.kmz';
  timestamp: Date;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  fileContent?: string;
  isVisible: boolean;
}

export class FileImportService {
  static async importFile(): Promise<File | null> {
    try {
      // Create file input element for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.kml,.kmz';
      input.style.display = 'none';
      
      return new Promise((resolve) => {
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          resolve(file || null);
        };
        
        input.oncancel = () => {
          resolve(null);
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      });
    } catch (error) {
      console.error('Error importing file:', error);
      throw new Error('Erro ao importar arquivo');
    }
  }

  static async saveImportedFile(file: File, farmId: string, farmName: string): Promise<ImportedFile> {
    try {
      // Read file content
      const fileContent = await this.readFileContent(file);
      
      // Extract bounding box if possible (simplified implementation)
      const boundingBox = this.extractBoundingBox(fileContent);
      
      // Create imported file metadata
      const importedFile: ImportedFile = {
        id: `import-${Date.now()}`,
        farmId,
        farmName,
        fileName: file.name,
        fileType: file.name.endsWith('.kmz') ? '.kmz' : '.kml',
        timestamp: new Date(),
        boundingBox,
        fileContent,
        isVisible: true
      };

      // Save to offline storage
      const offlineImport: OfflineImport = {
        id: importedFile.id,
        type: 'import',
        farmId: importedFile.farmId,
        farmName: importedFile.farmName,
        timestamp: importedFile.timestamp,
        syncStatus: 'pending',
        fileName: importedFile.fileName,
        fileType: importedFile.fileType,
        fileContent: importedFile.fileContent,
        boundingBox: importedFile.boundingBox
      };

      await OfflineStorageService.save(offlineImport);
      
      return importedFile;
    } catch (error) {
      console.error('Error saving imported file:', error);
      throw new Error('Erro ao salvar arquivo importado');
    }
  }

  static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target?.result as string || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsText(file);
    });
  }

  static extractBoundingBox(content: string): ImportedFile['boundingBox'] {
    try {
      // Simple regex to extract coordinates from KML
      const coordsRegex = /<coordinates>(.*?)<\/coordinates>/g;
      const matches = [...content.matchAll(coordsRegex)];
      
      if (matches.length === 0) return undefined;
      
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      matches.forEach(match => {
        const coords = match[1].trim().split(/\s+/);
        coords.forEach(coord => {
          const [lng, lat] = coord.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          }
        });
      });
      
      if (minLat === Infinity) return undefined;
      
      return {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng
      };
    } catch (error) {
      console.warn('Error extracting bounding box:', error);
      return undefined;
    }
  }

  static async saveToStorage(importedFile: ImportedFile): Promise<void> {
    const offlineImport: OfflineImport = {
      id: importedFile.id,
      type: 'import',
      farmId: importedFile.farmId,
      farmName: importedFile.farmName,
      timestamp: importedFile.timestamp,
      syncStatus: 'pending',
      fileName: importedFile.fileName,
      fileType: importedFile.fileType,
      fileContent: importedFile.fileContent,
      boundingBox: importedFile.boundingBox
    };

    await OfflineStorageService.save(offlineImport);
  }

  static async getStoredImports(): Promise<ImportedFile[]> {
    try {
      const offlineImports = await OfflineStorageService.getByType<OfflineImport>('import');
      return offlineImports.map(imp => ({
        id: imp.id,
        farmId: imp.farmId,
        farmName: imp.farmName,
        fileName: imp.fileName,
        fileType: imp.fileType,
        timestamp: imp.timestamp,
        boundingBox: imp.boundingBox,
        fileContent: imp.fileContent,
        isVisible: true
      }));
    } catch (error) {
      console.error('Error reading stored imports:', error);
      return [];
    }
  }

  static async getImportsByFarm(farmId: string): Promise<ImportedFile[]> {
    try {
      const farmData = await OfflineStorageService.getByFarmId(farmId);
      const imports = farmData.filter(item => item.type === 'import') as OfflineImport[];
      return imports.map(imp => ({
        id: imp.id,
        farmId: imp.farmId,
        farmName: imp.farmName,
        fileName: imp.fileName,
        fileType: imp.fileType,
        timestamp: imp.timestamp,
        boundingBox: imp.boundingBox,
        fileContent: imp.fileContent,
        isVisible: true
      }));
    } catch (error) {
      console.error('Error reading imports by farm:', error);
      return [];
    }
  }

  static async toggleVisibility(importId: string): Promise<void> {
    try {
      const item = await OfflineStorageService.getById(importId);
      if (item && item.type === 'import') {
        // This would need to be implemented with a separate visibility flag
        console.log('Toggle visibility for:', importId);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  }
}