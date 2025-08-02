export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string | null
          papel: 'consultor' | 'produtor'
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone?: string | null
          papel: 'consultor' | 'produtor'
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string | null
          papel?: 'consultor' | 'produtor'
          criado_em?: string
        }
      }
      propriedades: {
        Row: {
          id: string
          nome: string
          cidade: string
          estado: string
          consultor_id: string
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          cidade: string
          estado: string
          consultor_id: string
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          cidade?: string
          estado?: string
          consultor_id?: string
          criado_em?: string
        }
      }
      checkins: {
        Row: {
          id: string
          usuario_id: string
          propriedade_id: string
          data_entrada: string
          data_saida: string | null
          coordenadas: { lat: number; lng: number }
          criado_em: string
        }
        Insert: {
          id?: string
          usuario_id: string
          propriedade_id: string
          data_entrada: string
          data_saida?: string | null
          coordenadas: { lat: number; lng: number }
          criado_em?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          propriedade_id?: string
          data_entrada?: string
          data_saida?: string | null
          coordenadas?: { lat: number; lng: number }
          criado_em?: string
        }
      }
      trilhas: {
        Row: {
          id: string
          checkin_id: string
          pontos: Array<{ lat: number; lng: number; timestamp: string }>
          finalizada: boolean
          criada_em: string
        }
        Insert: {
          id?: string
          checkin_id: string
          pontos: Array<{ lat: number; lng: number; timestamp: string }>
          finalizada?: boolean
          criada_em?: string
        }
        Update: {
          id?: string
          checkin_id?: string
          pontos?: Array<{ lat: number; lng: number; timestamp: string }>
          finalizada?: boolean
          criada_em?: string
        }
      }
      ocorrencias: {
        Row: {
          id: string
          tipo: 'praga' | 'doenca' | 'deficiencia'
          categoria: string
          gravidade: 'leve' | 'moderada' | 'grave'
          quantidade: number
          coordenadas: { lat: number; lng: number }
          imagem_url: string | null
          checkin_id: string
          propriedade_id: string
          criada_em: string
        }
        Insert: {
          id?: string
          tipo: 'praga' | 'doenca' | 'deficiencia'
          categoria: string
          gravidade: 'leve' | 'moderada' | 'grave'
          quantidade: number
          coordenadas: { lat: number; lng: number }
          imagem_url?: string | null
          checkin_id: string
          propriedade_id: string
          criada_em?: string
        }
        Update: {
          id?: string
          tipo?: 'praga' | 'doenca' | 'deficiencia'
          categoria?: string
          gravidade?: 'leve' | 'moderada' | 'grave'
          quantidade?: number
          coordenadas?: { lat: number; lng: number }
          imagem_url?: string | null
          checkin_id?: string
          propriedade_id?: string
          criada_em?: string
        }
      }
      fotos: {
        Row: {
          id: string
          usuario_id: string
          url: string
          coordenadas: { lat: number; lng: number }
          referencia: 'ocorrencia' | 'trilha' | 'checkin'
          referencia_id: string
          criada_em: string
        }
        Insert: {
          id?: string
          usuario_id: string
          url: string
          coordenadas: { lat: number; lng: number }
          referencia: 'ocorrencia' | 'trilha' | 'checkin'
          referencia_id: string
          criada_em?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          url?: string
          coordenadas?: { lat: number; lng: number }
          referencia?: 'ocorrencia' | 'trilha' | 'checkin'
          referencia_id?: string
          criada_em?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}