import React, { createContext, useContext, useState } from 'react';

// Types
export type UserProfile = 'consultor' | 'produtor';

export interface Producer {
  id: string;
  name: string;
  farm: string;
  location: string;
}

export interface UserData {
  fullName: string;
  profile: UserProfile;
  zipCode: string;
}

export interface CultureStageData {
  selectedCulture: string;
  selectedStage: string;
}

interface UserContextType {
  userData: UserData | null;
  selectedProducer: Producer | null;
  linkedProducers: Producer[];
  ownFarm: Producer | null;
  cultureStageData: CultureStageData;
  setUserData: (data: UserData) => void;
  setSelectedProducer: (producer: Producer | null) => void;
  setLinkedProducers: (producers: Producer[]) => void;
  setOwnFarm: (farm: Producer | null) => void;
  setCultureStageData: (data: CultureStageData) => void;
  isConsultor: boolean;
  isProdutor: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock data for linked producers (consultants)
const mockLinkedProducers: Producer[] = [
  { id: '1', name: 'João Silva', farm: 'Fazenda Boa Vista', location: 'Goiás, GO' },
  { id: '2', name: 'Maria Santos', farm: 'Fazenda São José', location: 'Mato Grosso, MT' },
  { id: '3', name: 'Carlos Oliveira', farm: 'Fazenda Esperança', location: 'Bahia, BA' },
  { id: '4', name: 'Ana Costa', farm: 'Fazenda Nova Era', location: 'Minas Gerais, MG' }
];

// Mock data for producer's own farm
const mockOwnFarm: Producer = {
  id: 'own-farm',
  name: 'Minha Fazenda',
  farm: 'Fazenda Progresso',
  location: 'São Paulo, SP'
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [linkedProducers, setLinkedProducers] = useState<Producer[]>(mockLinkedProducers);
  const [ownFarm, setOwnFarm] = useState<Producer | null>(mockOwnFarm);
  const [cultureStageData, setCultureStageData] = useState<CultureStageData>({
    selectedCulture: 'soja',
    selectedStage: 'V5'
  });

  const isConsultor = userData?.profile === 'consultor';
  const isProdutor = userData?.profile === 'produtor';

  return (
    <UserContext.Provider
      value={{
        userData,
        selectedProducer,
        linkedProducers,
        ownFarm,
        cultureStageData,
        setUserData,
        setSelectedProducer,
        setLinkedProducers,
        setOwnFarm,
        setCultureStageData,
        isConsultor,
        isProdutor,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};