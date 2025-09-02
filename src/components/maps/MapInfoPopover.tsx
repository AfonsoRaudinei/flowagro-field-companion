import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const MapInfoPopover = () => {
  return (
    <Card className="absolute top-4 left-4 w-64 z-50 shadow-lg pointer-events-auto">
      <CardHeader>
        <CardTitle className="text-sm">Info Contextual</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Clique no mapa para ver informações do local
        </p>
      </CardContent>
    </Card>
  );
};