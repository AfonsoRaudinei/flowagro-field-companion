import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function ConsultoriaComunicacao() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Consultoria & Comunicação</h1>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Chat Técnico</h2>
                <p className="text-sm text-muted-foreground">
                  Converse com nossa IA especializada
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard?ai=true")}
              className="w-full"
            >
              Iniciar Chat Técnico
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}