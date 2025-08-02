import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

export class FirebaseAuthService {
  private static listeners: ((user: AuthUser | null) => void)[] = [];
  private static currentUser: AuthUser | null = null;

  static async initialize(): Promise<void> {
    // Enable persistence for offline access
    await setPersistence(auth, browserLocalPersistence);

    // Listen for auth state changes
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || undefined
        };
      } else {
        this.currentUser = null;
      }
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.currentUser));
    });
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  static async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined
      };
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  static getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  static addAuthListener(callback: (user: AuthUser | null) => void): void {
    this.listeners.push(callback);
  }

  static removeAuthListener(callback: (user: AuthUser | null) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  static isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}