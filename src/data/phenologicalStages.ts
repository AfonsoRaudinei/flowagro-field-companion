// Dados centralizados dos estádios fenológicos
// Siglas para UI, descrições para relatórios e banco de dados

export interface PhenologicalStage {
  code: string; // Sigla (ex: "V1")
  name: string; // Nome resumido
  fullDescription: string; // Descrição completa para relatórios
  category: 'vegetativo' | 'reprodutivo';
}

export interface CultureStages {
  [key: string]: PhenologicalStage[];
}

export const phenologicalStages: CultureStages = {
  soja: [
    // Estádios Vegetativos
    {
      code: 'VE',
      name: 'Emergência',
      fullDescription: 'VE – Emergência (cotilédones acima da superfície do solo)',
      category: 'vegetativo'
    },
    {
      code: 'VC',
      name: 'Cotilédones expandidos',
      fullDescription: 'VC – Cotilédones expandidos (cotilédones completamente expandidos)',
      category: 'vegetativo'
    },
    {
      code: 'V1',
      name: 'Primeiro nó',
      fullDescription: 'V1 – Primeiro nó (folhas unifolioladas completamente desenvolvidas)',
      category: 'vegetativo'
    },
    {
      code: 'V2',
      name: 'Segundo nó',
      fullDescription: 'V2 – Segundo nó (primeira folha trifoliolada completamente desenvolvida)',
      category: 'vegetativo'
    },
    {
      code: 'V3',
      name: 'Terceiro nó',
      fullDescription: 'V3 – Terceiro nó (segunda folha trifoliolada completamente desenvolvida)',
      category: 'vegetativo'
    },
    {
      code: 'V4',
      name: 'Quarto nó',
      fullDescription: 'V4 – Quarto nó (terceira folha trifoliolada completamente desenvolvida)',
      category: 'vegetativo'
    },
    {
      code: 'V5',
      name: 'Quinto nó',
      fullDescription: 'V5 – Quinto nó (quarta folha trifoliolada completamente desenvolvida)',
      category: 'vegetativo'
    },
    {
      code: 'V6',
      name: 'Sexto nó',
      fullDescription: 'V6 – Sexto nó (quinta folha trifoliolada completamente desenvolvida)',
      category: 'vegetativo'
    },
    // Estádios Reprodutivos
    {
      code: 'R1',
      name: 'Início do florescimento',
      fullDescription: 'R1 – Início do florescimento (uma flor aberta em qualquer nó da haste principal)',
      category: 'reprodutivo'
    },
    {
      code: 'R2',
      name: 'Florescimento pleno',
      fullDescription: 'R2 – Florescimento pleno (flor aberta no 1º ou 2º nó reprodutivo da haste principal)',
      category: 'reprodutivo'
    },
    {
      code: 'R3',
      name: 'Início da formação da vagem',
      fullDescription: 'R3 – Início da formação da vagem (vagem com 1,5 cm no 1º ao 4º nó reprodutivo)',
      category: 'reprodutivo'
    },
    {
      code: 'R4',
      name: 'Vagem completamente desenvolvida',
      fullDescription: 'R4 – Vagem completamente desenvolvida (vagem com 2 a 4 cm no 1º ao 4º nó reprodutivo)',
      category: 'reprodutivo'
    },
    {
      code: 'R5',
      name: 'Início do enchimento do grão',
      fullDescription: 'R5 – Início do enchimento do grão (grão com 10% do tamanho final na vagem)',
      category: 'reprodutivo'
    },
    {
      code: 'R6',
      name: 'Grão verde preenchendo a cavidade',
      fullDescription: 'R6 – Grão verde preenchendo a cavidade (vagem contendo grãos verdes preenchendo a cavidade)',
      category: 'reprodutivo'
    },
    {
      code: 'R7',
      name: 'Início da maturação',
      fullDescription: 'R7 – Início da maturação (uma vagem normal na planta com coloração de madura)',
      category: 'reprodutivo'
    },
    {
      code: 'R8',
      name: 'Maturação plena',
      fullDescription: 'R8 – Maturação plena (95% das vagens com coloração de vagem madura)',
      category: 'reprodutivo'
    }
  ],

  milho: [
    // Estádios Vegetativos
    {
      code: 'VE',
      name: 'Emergência',
      fullDescription: 'VE – Emergência (coleóptilo emerge da superfície do solo)',
      category: 'vegetativo'
    },
    {
      code: 'V1',
      name: 'Primeira folha',
      fullDescription: 'V1 – Primeira folha (primeira folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'V2',
      name: 'Segunda folha',
      fullDescription: 'V2 – Segunda folha (segunda folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'V3',
      name: 'Terceira folha',
      fullDescription: 'V3 – Terceira folha (terceira folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'V4',
      name: 'Quarta folha',
      fullDescription: 'V4 – Quarta folha (quarta folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'V5',
      name: 'Quinta folha',
      fullDescription: 'V5 – Quinta folha (quinta folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'V6',
      name: 'Sexta folha',
      fullDescription: 'V6 – Sexta folha (sexta folha com colar visível)',
      category: 'vegetativo'
    },
    {
      code: 'VT',
      name: 'Pendoamento',
      fullDescription: 'VT – Pendoamento (último ramo do pendão completamente visível)',
      category: 'vegetativo'
    },
    // Estádios Reprodutivos
    {
      code: 'R1',
      name: 'Embonecamento',
      fullDescription: 'R1 – Embonecamento (estigmas visíveis)',
      category: 'reprodutivo'
    },
    {
      code: 'R2',
      name: 'Grão leitoso',
      fullDescription: 'R2 – Grão leitoso (grão com aparência leitosa)',
      category: 'reprodutivo'
    },
    {
      code: 'R3',
      name: 'Grão pastoso',
      fullDescription: 'R3 – Grão pastoso (grãos amarelos na base, suco leitoso)',
      category: 'reprodutivo'
    },
    {
      code: 'R4',
      name: 'Grão farináceo',
      fullDescription: 'R4 – Grão farináceo (grãos consistência pastosa, linha de leite visível)',
      category: 'reprodutivo'
    },
    {
      code: 'R5',
      name: 'Grão dentado',
      fullDescription: 'R5 – Grão dentado (formação da depressão na parte superior dos grãos)',
      category: 'reprodutivo'
    },
    {
      code: 'R6',
      name: 'Maturidade fisiológica',
      fullDescription: 'R6 – Maturidade fisiológica (formação da camada preta na inserção dos grãos)',
      category: 'reprodutivo'
    }
  ],

  algodao: [
    // Estádios Vegetativos
    {
      code: 'VE',
      name: 'Emergência',
      fullDescription: 'VE – Emergência (cotilédones acima da superfície do solo)',
      category: 'vegetativo'
    },
    {
      code: 'V1',
      name: 'Primeira folha verdadeira',
      fullDescription: 'V1 – Primeira folha verdadeira (primeira folha verdadeira completamente expandida)',
      category: 'vegetativo'
    },
    {
      code: 'V2',
      name: 'Segunda folha verdadeira',
      fullDescription: 'V2 – Segunda folha verdadeira (segunda folha verdadeira completamente expandida)',
      category: 'vegetativo'
    },
    // Estádios de Botão Floral
    {
      code: 'B1',
      name: 'Primeiro botão floral',
      fullDescription: 'B1 – Primeiro botão floral (primeiro botão floral visível)',
      category: 'reprodutivo'
    },
    {
      code: 'B2',
      name: 'Segundo botão floral',
      fullDescription: 'B2 – Segundo botão floral (segundo botão floral visível)',
      category: 'reprodutivo'
    },
    // Estádios de Florescimento
    {
      code: 'F1',
      name: 'Primeira flor',
      fullDescription: 'F1 – Primeira flor (primeira flor aberta)',
      category: 'reprodutivo'
    },
    {
      code: 'F2',
      name: 'Segunda flor',
      fullDescription: 'F2 – Segunda flor (segunda flor aberta)',
      category: 'reprodutivo'
    },
    // Estádios de Capulho
    {
      code: 'C1',
      name: 'Primeiro capulho',
      fullDescription: 'C1 – Primeiro capulho (primeiro capulho formado)',
      category: 'reprodutivo'
    },
    {
      code: 'C2',
      name: 'Segundo capulho',
      fullDescription: 'C2 – Segundo capulho (segundo capulho formado)',
      category: 'reprodutivo'
    }
  ]
};

// Funções auxiliares para buscar dados
export const getStageByCode = (culture: string, code: string): PhenologicalStage | undefined => {
  return phenologicalStages[culture]?.find(stage => stage.code === code);
};

export const getStagesForCulture = (culture: string): PhenologicalStage[] => {
  return phenologicalStages[culture] || [];
};

export const getStagesByCategory = (culture: string, category: 'vegetativo' | 'reprodutivo'): PhenologicalStage[] => {
  return getStagesForCulture(culture).filter(stage => stage.category === category);
};

export const getFullDescription = (culture: string, code: string): string => {
  const stage = getStageByCode(culture, code);
  return stage?.fullDescription || code;
};

// Para uso em relatórios - retorna descrição completa
export const formatStageForReport = (culture: string, code: string): string => {
  return getFullDescription(culture, code);
};

// Para uso em UI - retorna apenas a sigla
export const formatStageForUI = (code: string): string => {
  return code;
};