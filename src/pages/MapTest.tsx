import { SimpleBaseMap } from '@/components/maps/SimpleBaseMap';

export default function MapTest() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Teste do Mapa Simplificado</h1>
        
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Mapa com Token MapTiler e Fallback OSM</h2>
          <div className="w-full h-[600px]">
            <SimpleBaseMap />
          </div>
        </div>
        
        <div className="mt-6 bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Status do Sistema:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Token MapTiler configurado nos Supabase Secrets</li>
            <li>✅ Fallback OpenStreetMap implementado</li>
            <li>✅ Debug visual ativo</li>
            <li>✅ Controles de navegação incluídos</li>
            <li>✅ Sistema de retry implementado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}