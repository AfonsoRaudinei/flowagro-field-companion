import React from "react";
import { NavigationHeader } from "@/components/ui/navigation";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Construction } from "lucide-react";

const TechnicalMap = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        title="Mapa Técnico" 
        onBack={handleBack}
        showBackButton
      />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Map className="w-16 h-16 text-primary" />
                <Construction className="w-6 h-6 text-muted-foreground absolute -bottom-1 -right-1" />
              </div>
            </div>
            <CardTitle className="text-2xl">Mapa Técnico</CardTitle>
            <CardDescription>
              Esta funcionalidade está sendo reconstruída
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              O sistema de mapas está sendo completamente renovado para oferecer
              uma melhor experiência e performance.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                🚧 Em desenvolvimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalMap;