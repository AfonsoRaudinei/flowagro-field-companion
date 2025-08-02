import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

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

      // Save to localStorage
      this.saveToStorage(importedFile);
      
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

  static saveToStorage(importedFile: ImportedFile): void {
    const existing = this.getStoredImports();
    const updated = [...existing, importedFile];
    localStorage.setItem('importedFiles', JSON.stringify(updated));
  }

  static getStoredImports(): ImportedFile[] {
    try {
      const stored = localStorage.getItem('importedFiles');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored imports:', error);
      return [];
    }
  }

  static getImportsByFarm(farmId: string): ImportedFile[] {
    const allImports = this.getStoredImports();
    return allImports.filter(imp => imp.farmId === farmId);
  }

  static toggleVisibility(importId: string): void {
    const imports = this.getStoredImports();
    const updated = imports.map(imp => 
      imp.id === importId ? { ...imp, isVisible: !imp.isVisible } : imp
    );
    localStorage.setItem('importedFiles', JSON.stringify(updated));
  }
}