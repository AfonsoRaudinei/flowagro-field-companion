import React, { useRef } from "react";
import { Sun, Newspaper, DollarSign, FlaskConical, Satellite, Paperclip, Mic, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuickActionsBarProps {
  onWeather: () => void;
  onNews: () => void;
  onDollar: () => void;
  onDefensivos: () => void;
  onNdvi: () => void;
  onAttachImage: (file: File) => void;
  onRecordClick: () => void;
  farms: string[];
  talhoes: string[];
  selectedFarm?: string;
  selectedTalhao?: string;
  onSelectFarm: (farm: string) => void;
  onSelectTalhao: (talhao: string) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onWeather,
  onNews,
  onDollar,
  onDefensivos,
  onNdvi,
  onAttachImage,
  onRecordClick,
  farms,
  talhoes,
  selectedFarm,
  selectedTalhao,
  onSelectFarm,
  onSelectTalhao,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFile = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onAttachImage(f);
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset
  };

  const ActionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-card border border-border shadow-sm hover:bg-accent active:scale-95 transition-transform"
      title={label}
      aria-label={label}
    >
      <Icon className="h-5 w-5 text-foreground" />
      <span className="mt-1 text-[10px] text-muted-foreground truncate max-w-[56px]">{label}</span>
    </button>
  );

  return (
    <div className="relative z-50">
      <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
        <div className="px-4 py-2">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <ActionButton icon={Sun} label="Clima" onClick={onWeather} />
            <ActionButton icon={Newspaper} label="AgroNews" onClick={onNews} />
            <ActionButton icon={DollarSign} label="Dólar" onClick={onDollar} />
            <ActionButton icon={FlaskConical} label="Defensivos" onClick={onDefensivos} />
            <ActionButton icon={Satellite} label="NDVI" onClick={onNdvi} />
            <ActionButton icon={Paperclip} label="Anexar" onClick={triggerFile} />
            <ActionButton icon={Mic} label="Áudio" onClick={onRecordClick} />

            {/* Contexto: Fazenda / Talhão */}
            <div className="ml-auto flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Select value={selectedFarm} onValueChange={onSelectFarm}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Fazenda" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {farms.map((f) => (
                      <SelectItem key={f} value={f} className="text-sm">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTalhao} onValueChange={onSelectTalhao}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Talhão" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {talhoes.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
};
