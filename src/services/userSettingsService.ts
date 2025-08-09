import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserSettings {
  profilePhotoUrl?: string;
  logoUrl?: string;
  appName?: string;
  useLogoAsIcon?: boolean;
  updatedAt?: any;
}

export class UserSettingsService {
  static async get(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, 'user_settings', userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserSettings) : null;
  }

  static async update(userId: string, data: Partial<UserSettings>): Promise<void> {
    const docRef = doc(db, 'user_settings', userId);
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }

  static async uploadProfilePhoto(userId: string, file: File | Blob): Promise<string> {
    const fileRef = ref(storage, `usuarios/${userId}/profile/profile_${Date.now()}.jpg`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  static async uploadLogo(userId: string, file: File | Blob): Promise<string> {
    const fileRef = ref(storage, `usuarios/${userId}/branding/logo_${Date.now()}.png`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  }
}
