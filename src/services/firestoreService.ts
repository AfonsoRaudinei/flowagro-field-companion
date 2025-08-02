import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types for Firestore collections
export interface FirestoreCheckin {
  id?: string;
  usuarioId: string;
  dataHoraEntrada: Timestamp;
  dataHoraSaida?: Timestamp;
  coordenadas: {
    lat: number;
    lng: number;
  };
  propriedadeId: string; // Referência do Supabase
  fazenda: string;
  talhao: string;
  sincronizado: boolean;
}

export interface FirestoreTrilha {
  id?: string;
  usuarioId: string;
  checkinId: string;
  pontos: Array<{
    lat: number;
    lng: number;
    timestamp: Timestamp;
  }>;
  finalizada: boolean;
  propriedadeId: string;
  criadaEm: Timestamp;
}

export interface FirestoreOcorrencia {
  id?: string;
  usuarioId: string;
  tipo: 'praga' | 'doenca' | 'deficiencia';
  categoria: string;
  gravidade: number;
  quantidade: number;
  coordenadas: {
    lat: number;
    lng: number;
  };
  imagemUrl?: string;
  checkinId: string;
  propriedadeId: string;
  criadaEm: Timestamp;
}

export class FirestoreService {
  private static isOnline = true;

  static async initialize(): Promise<void> {
    try {
      await enableNetwork(db);
      this.isOnline = true;
      console.log('✅ Firestore conectado e cache offline habilitado');
    } catch (error) {
      console.error('Erro ao inicializar Firestore:', error);
    }
  }

  // Checkins
  static async saveCheckin(checkin: Omit<FirestoreCheckin, 'id' | 'dataHoraEntrada'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'checkins'), {
        ...checkin,
        dataHoraEntrada: serverTimestamp(),
      });
      console.log('✅ Check-in salvo:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar check-in:', error);
      throw error;
    }
  }

  static async updateCheckinSaida(checkinId: string): Promise<void> {
    try {
      const checkinRef = doc(db, 'checkins', checkinId);
      await updateDoc(checkinRef, {
        dataHoraSaida: serverTimestamp()
      });
      console.log('✅ Check-out atualizado:', checkinId);
    } catch (error) {
      console.error('Erro ao atualizar check-out:', error);
      throw error;
    }
  }

  static async getCheckinsByUser(usuarioId: string): Promise<FirestoreCheckin[]> {
    try {
      const q = query(
        collection(db, 'checkins'),
        where('usuarioId', '==', usuarioId),
        orderBy('dataHoraEntrada', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreCheckin[];
    } catch (error) {
      console.error('Erro ao buscar check-ins:', error);
      throw error;
    }
  }

  // Trilhas
  static async saveTrilha(trilha: Omit<FirestoreTrilha, 'id' | 'criadaEm'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'trilhas'), {
        ...trilha,
        criadaEm: serverTimestamp(),
      });
      console.log('✅ Trilha salva:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar trilha:', error);
      throw error;
    }
  }

  static async updateTrilhaPontos(trilhaId: string, pontos: FirestoreTrilha['pontos']): Promise<void> {
    try {
      const trilhaRef = doc(db, 'trilhas', trilhaId);
      await updateDoc(trilhaRef, { pontos });
      console.log('✅ Pontos da trilha atualizados:', trilhaId);
    } catch (error) {
      console.error('Erro ao atualizar trilha:', error);
      throw error;
    }
  }

  static async finalizarTrilha(trilhaId: string): Promise<void> {
    try {
      const trilhaRef = doc(db, 'trilhas', trilhaId);
      await updateDoc(trilhaRef, { finalizada: true });
      console.log('✅ Trilha finalizada:', trilhaId);
    } catch (error) {
      console.error('Erro ao finalizar trilha:', error);
      throw error;
    }
  }

  // Ocorrências
  static async saveOcorrencia(ocorrencia: Omit<FirestoreOcorrencia, 'id' | 'criadaEm'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'ocorrencias'), {
        ...ocorrencia,
        criadaEm: serverTimestamp(),
      });
      console.log('✅ Ocorrência salva:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      throw error;
    }
  }

  static async getOcorrenciasByCheckin(checkinId: string): Promise<FirestoreOcorrencia[]> {
    try {
      const q = query(
        collection(db, 'ocorrencias'),
        where('checkinId', '==', checkinId),
        orderBy('criadaEm', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreOcorrencia[];
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error);
      throw error;
    }
  }

  // Network management
  static async goOffline(): Promise<void> {
    try {
      await disableNetwork(db);
      this.isOnline = false;
      console.log('📴 Firestore offline');
    } catch (error) {
      console.error('Erro ao ir offline:', error);
    }
  }

  static async goOnline(): Promise<void> {
    try {
      await enableNetwork(db);
      this.isOnline = true;
      console.log('🌐 Firestore online');
    } catch (error) {
      console.error('Erro ao ir online:', error);
    }
  }

  static isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Real-time listeners (funcionam offline também)
  static subscribeToCheckins(usuarioId: string, callback: (checkins: FirestoreCheckin[]) => void) {
    const q = query(
      collection(db, 'checkins'),
      where('usuarioId', '==', usuarioId),
      orderBy('dataHoraEntrada', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const checkins = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreCheckin[];
      callback(checkins);
    });
  }
}