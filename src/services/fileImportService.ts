import { OfflineStorageService, OfflineImport } from './offlineStorageService';
import JSZip from 'jszip';

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
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.kml,.kmz';
      input.multiple = false;

      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          console.log('File selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
            extension: file.name.split('.').pop()?.toLowerCase()
          });
          resolve(file);
        } else {
          console.log('No file selected');
          resolve(null);
        }
      };

      input.oncancel = () => {
        console.log('File selection cancelled');
        resolve(null);
      };

      input.click();
    });
  }

  static async saveImportedFile(file: File, farmId: string, farmName: string): Promise<ImportedFile> {
    try {
      console.log('Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Ensure OfflineStorage is initialized
      await OfflineStorageService.ensureInitialized();
      console.log('OfflineStorage initialized for import');
      
      // Read file content based on type
      let content: string;
      const isKMZ = file.name.toLowerCase().endsWith('.kmz');
      
      if (isKMZ) {
        console.log('Processing KMZ file...');
        content = await this.processKMZFile(file);
      } else {
        console.log('Processing KML file...');
        content = await this.readFileContent(file);
      }
      
      console.log('File content length:', content.length);
      console.log('Content preview:', content.substring(0, 200));
      
      // Extract bounding box
      const boundingBox = this.extractBoundingBox(content);
      console.log('Extracted bounding box:', boundingBox);

      const importedFile: ImportedFile = {
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        farmId,
        farmName,
        fileName: file.name,
        fileType: isKMZ ? '.kmz' : '.kml',
        timestamp: new Date(),
        boundingBox,
        fileContent: content,
        isVisible: true
      };

      await this.saveToStorage(importedFile);
      console.log('File saved to storage successfully:', importedFile.id);
      
      return importedFile;
    } catch (error) {
      console.error('Error processing imported file:', error);
      throw new Error(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async processKMZFile(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const contents = await zip.loadAsync(arrayBuffer);
      
      // Look for .kml files in the archive
      const kmlFiles = Object.keys(contents.files).filter(name => 
        name.toLowerCase().endsWith('.kml') && !contents.files[name].dir
      );
      
      if (kmlFiles.length === 0) {
        throw new Error('No KML files found in KMZ archive');
      }
      
      // Use the first KML file found
      const kmlFile = contents.files[kmlFiles[0]];
      const kmlContent = await kmlFile.async('text');
      
      console.log(`Extracted KML from KMZ: ${kmlFiles[0]}`);
      return kmlContent;
    } catch (error) {
      console.error('Error processing KMZ file:', error);
      throw new Error(`Failed to process KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private static extractBoundingBox(content: string): ImportedFile['boundingBox'] {
    try {
      console.log('Extracting bounding box from content...');
      
      // Multiple regex patterns to catch different KML coordinate formats
      const patterns = [
        /<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi,
        /<coord>([\s\S]*?)<\/coord>/gi,
        /<gx:coord>([\s\S]*?)<\/gx:coord>/gi
      ];
      
      let allMatches: string[] = [];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          allMatches = allMatches.concat(matches);
        }
      });
      
      if (allMatches.length === 0) {
        console.log('No coordinates found with any pattern');
        return undefined;
      }

      console.log(`Found ${allMatches.length} coordinate blocks`);
      
      let north = -90, south = 90, east = -180, west = 180;
      let coordCount = 0;
      
      allMatches.forEach((match, index) => {
        console.log(`Processing coordinate block ${index + 1}:`);
        
        // Extract coordinate values and clean up
        const coordText = match
          .replace(/<\/?[^>]+>/gi, '') // Remove all XML tags
          .replace(/\s+/g, ' ')        // Normalize whitespace
          .trim();
        
        console.log('Cleaned coordinate text:', coordText.substring(0, 100));
        
        // Split by various delimiters and filter empty strings
        const parts = coordText.split(/[\s,\n\r\t]+/).filter(part => part.length > 0);
        
        // Process coordinates - try different formats
        for (let i = 0; i < parts.length; i++) {
          // Format: lng,lat,elevation or lng,lat
          if (parts[i].includes(',')) {
            const coords = parts[i].split(',');
            if (coords.length >= 2) {
              const lng = parseFloat(coords[0]);
              const lat = parseFloat(coords[1]);
              
              if (!isNaN(lng) && !isNaN(lat) && 
                  lng >= -180 && lng <= 180 && 
                  lat >= -90 && lat <= 90) {
                north = Math.max(north, lat);
                south = Math.min(south, lat);
                east = Math.max(east, lng);
                west = Math.min(west, lng);
                coordCount++;
              }
            }
          }
          // Format: lng lat elevation (space separated)
          else if (i < parts.length - 1) {
            const lng = parseFloat(parts[i]);
            const lat = parseFloat(parts[i + 1]);
            
            if (!isNaN(lng) && !isNaN(lat) && 
                lng >= -180 && lng <= 180 && 
                lat >= -90 && lat <= 90) {
              north = Math.max(north, lat);
              south = Math.min(south, lat);
              east = Math.max(east, lng);
              west = Math.min(west, lng);
              coordCount++;
              i++; // Skip next part as it's used as latitude
            }
          }
        }
      });

      if (coordCount === 0) {
        console.log('No valid coordinates found');
        return undefined;
      }

      const boundingBox = { north, south, east, west };
      console.log(`Extracted bounding box from ${coordCount} coordinates:`, boundingBox);
      
      return boundingBox;
    } catch (error) {
      console.error('Error extracting bounding box:', error);
      return undefined;
    }
  }

  private static async saveToStorage(importedFile: ImportedFile): Promise<void> {
    try {
      console.log('Saving to OfflineStorage...');
      
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
      console.log('Successfully saved to OfflineStorage');
    } catch (error) {
      console.error('Error saving to OfflineStorage:', error);
      throw error;
    }
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