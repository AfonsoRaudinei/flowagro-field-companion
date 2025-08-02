import { FirebaseAuthService } from './firebaseAuthService';
import { FirestoreService } from './firestoreService';
import { FirebaseStorageService } from './firebaseStorageService';
import { supabase } from '@/lib/supabase';

export interface SyncStats {
  checkinsSincronizados: number;
  trilhasSincronizadas: number;
  ocorrenciasSincronizadas: number;
  erros: string[];
}

export class FirebaseSyncService {
  private static syncInProgress = false;

  static async initialize(): Promise<void> {
    await FirebaseAuthService.initialize();
    await FirestoreService.initialize();
    
    console.log('🔥 Firebase inicializado para FlowAgro Mobile');
  }

  // Sincronizar dados do Firestore para Supabase (quando necessário)
  static async syncToSupabase(): Promise<SyncStats> {
    if (this.syncInProgress) {
      throw new Error('Sincronização já em andamento');
    }

    this.syncInProgress = true;
    const stats: SyncStats = {
      checkinsSincronizados: 0,
      trilhasSincronizadas: 0,
      ocorrenciasSincronizadas: 0,
      erros: []
    };

    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados não sincronizados do Firestore
      const checkins = await FirestoreService.getCheckinsByUser(currentUser.uid);
      const checkinsNaoSincronizados = checkins.filter(c => !c.sincronizado);

      // Sincronizar check-ins
      for (const checkin of checkinsNaoSincronizados) {
        try {
          const { error } = await supabase
            .from('checkins')
            .insert({
              usuario_id: currentUser.uid,
              data_entrada: checkin.dataHoraEntrada.toDate(),
              data_saida: checkin.dataHoraSaida?.toDate(),
              coordenadas: checkin.coordenadas,
              propriedade_id: checkin.propriedadeId,
              fazenda: checkin.fazenda,
              talhao: checkin.talhao
            });

          if (error) {
            stats.erros.push(`Erro ao sincronizar check-in ${checkin.id}: ${error.message}`);
          } else {
            stats.checkinsSincronizados++;
            // Marcar como sincronizado no Firestore
            // (implementar updateDoc aqui se necessário)
          }
        } catch (error) {
          stats.erros.push(`Erro inesperado no check-in ${checkin.id}: ${error}`);
        }
      }

      console.log('📊 Sincronização concluída:', stats);
      
    } catch (error) {
      console.error('Erro na sincronização geral:', error);
      stats.erros.push(`Erro geral: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return stats;
  }

  // Verificar se há dados não sincronizados
  static async hasPendingSync(): Promise<boolean> {
    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) return false;

      const checkins = await FirestoreService.getCheckinsByUser(currentUser.uid);
      return checkins.some(c => !c.sincronizado);
    } catch (error) {
      console.error('Erro ao verificar sync pendente:', error);
      return false;
    }
  }

  // Workflow completo para trabalho de campo
  static async startFieldWork(propriedadeId: string, fazenda: string, talhao: string) {
    const currentUser = FirebaseAuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Obter coordenadas atuais
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });

    const coordenadas = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Criar check-in
    const checkinId = await FirestoreService.saveCheckin({
      usuarioId: currentUser.uid,
      coordenadas,
      propriedadeId,
      fazenda,
      talhao,
      sincronizado: false
    });

    console.log('✅ Trabalho de campo iniciado:', { checkinId, propriedadeId });
    return checkinId;
  }

  static async endFieldWork(checkinId: string) {
    await FirestoreService.updateCheckinSaida(checkinId);
    console.log('🏁 Trabalho de campo finalizado:', checkinId);
  }

  // Upload de imagem com ocorrência
  static async saveOcorrenciaWithImage(
    checkinId: string,
    propriedadeId: string,
    ocorrenciaData: {
      tipo: 'praga' | 'doenca' | 'deficiencia';
      categoria: string;
      gravidade: number;
      quantidade: number;
      coordenadas: { lat: number; lng: number };
    },
    imageFile: File | Blob
  ): Promise<string> {
    const currentUser = FirebaseAuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Salvar ocorrência primeiro (sem imagem)
    const ocorrenciaId = await FirestoreService.saveOcorrencia({
      usuarioId: currentUser.uid,
      checkinId,
      propriedadeId,
      ...ocorrenciaData
    });

    // Upload da imagem
    const imageUrl = await FirebaseStorageService.uploadImage(
      imageFile,
      currentUser.uid,
      ocorrenciaId
    );

    // Atualizar ocorrência com URL da imagem
    // (implementar updateDoc se necessário)

    console.log('✅ Ocorrência salva com imagem:', { ocorrenciaId, imageUrl });
    return ocorrenciaId;
  }
}