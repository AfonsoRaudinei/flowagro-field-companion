/**
 * FlowAgro Brand Application
 * 
 * Auto-aplicação do sistema de branding FlowAgro
 * na inicialização da aplicação
 */

import { FLOWAGRO_BRAND, applyFlowAgroBranding } from '@/lib/flowagro-brand';

// Auto-apply branding when module is imported
applyFlowAgroBranding();

// Export for manual usage
export { 
  FLOWAGRO_BRAND,
  FLOWAGRO_COLORS,
  FLOWAGRO_TYPOGRAPHY,
  FLOWAGRO_SPACING,
  FLOWAGRO_COMPONENTS,
  FLOWAGRO_ASSETS,
  FLOWAGRO_GUIDELINES,
  getBrandColor,
  getBrandFont,
  getBrandSpacing,
  applyFlowAgroBranding
} from '@/lib/flowagro-brand';

export {
  FlowAgroLogo,
  BrandBadge,
  BrandCard,
  BrandButton
} from '@/components/ui/flowagro-brand';