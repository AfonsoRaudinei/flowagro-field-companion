import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Map, Calculator, Settings } from "lucide-react";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Use structured logging instead of console.error
    logger.error("404 Error: User attempted to access non-existent route", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      type: '404_error'
    });
  }, [location.pathname, location.search, location.hash]);

  const suggestedRoutes = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/technical-map', label: 'Mapa Técnico', icon: Map },
    { path: '/calculator', label: 'Calculadora', icon: Calculator },
    { path: '/settings', label: 'Configurações', icon: Settings },
  ];

  const handleGoHome = () => {
    logger.userAction('navigate_from_404', 'NotFound', { destination: '/dashboard' });
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    logger.userAction('go_back_from_404', 'NotFound');
    window.history.back();
  };

  const handleSuggestedRoute = (path: string, label: string) => {
    logger.userAction('navigate_from_404_suggestion', 'NotFound', { destination: path, label });
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">
            404
          </div>
          <CardTitle className="text-2xl mb-2">Página não encontrada</CardTitle>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>URL solicitada:</strong> {location.pathname}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Páginas sugeridas:</p>
            <div className="grid gap-2">
              {suggestedRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <Button
                    key={route.path}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedRoute(route.path, route.label)}
                    className="justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {route.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;