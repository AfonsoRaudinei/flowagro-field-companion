import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class FirebaseStorageService {
  
  static async uploadImage(
    file: File | Blob, 
    usuarioId: string, 
    ocorrenciaId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Criar referência do arquivo
      const fileName = `${ocorrenciaId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `usuarios/${usuarioId}/ocorrencias/${fileName}`);

      // Upload com progresso
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              };
              onProgress(progress);
            },
            (error) => {
              console.error('Erro no upload:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('✅ Imagem enviada:', downloadURL);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // Upload simples
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('✅ Imagem enviada:', downloadURL);
        return downloadURL;
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  static async uploadTrilhaImage(
    file: File | Blob,
    usuarioId: string,
    trilhaId: string,
    pontoIndex: number
  ): Promise<string> {
    try {
      const fileName = `trilha_${trilhaId}_ponto_${pontoIndex}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `usuarios/${usuarioId}/trilhas/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Imagem da trilha enviada:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem da trilha:', error);
      throw error;
    }
  }

  static async uploadCheckinImage(
    file: File | Blob,
    usuarioId: string,
    checkinId: string
  ): Promise<string> {
    try {
      const fileName = `checkin_${checkinId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `usuarios/${usuarioId}/checkins/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Imagem do check-in enviada:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem do check-in:', error);
      throw error;
    }
  }

  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('✅ Imagem deletada:', imageUrl);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  // Converter dataURL (from camera) para Blob para upload
  static dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  // Redimensionar imagem antes do upload (para economizar banda)
  static async resizeImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}