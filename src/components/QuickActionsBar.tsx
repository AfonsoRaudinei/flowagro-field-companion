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
      className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-card border border-border shadow-sm hover:bg-accent active:scale-95 transition-all duration-200 flex-shrink-0"
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4 text-foreground" />
      <span className="mt-0.5 text-[9px] text-muted-foreground truncate max-w-[50px]">{label}</span>
    </button>
  );

  return (
    <div className="relative z-50">
      <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Action buttons with horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
              <ActionButton icon={Sun} label="Clima" onClick={onWeather} />
              <ActionButton icon={Newspaper} label="AgroNews" onClick={onNews} />
              <ActionButton icon={DollarSign} label="Dólar" onClick={onDollar} />
              <ActionButton icon={FlaskConical} label="Defensivos" onClick={onDefensivos} />
              <ActionButton icon={Satellite} label="NDVI" onClick={onNdvi} />
              <ActionButton icon={Paperclip} label="Anexar" onClick={triggerFile} />
              <ActionButton icon={Mic} label="Áudio" onClick={onRecordClick} />
            </div>

            {/* Contexto: Fazenda / Talhão - Fixed on right */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <div className="flex items-center gap-1">
                <Select value={selectedFarm} onValueChange={onSelectFarm}>
                  <SelectTrigger className="h-7 w-28 text-xs bg-card">
                    <SelectValue placeholder="Fazenda" />
                  </SelectTrigger>
                  <SelectContent className="z-[60] bg-card border border-border shadow-lg">
                    {farms.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTalhao} onValueChange={onSelectTalhao}>
                  <SelectTrigger className="h-7 w-24 text-xs bg-card">
                    <SelectValue placeholder="Talhão" />
                  </SelectTrigger>
                  <SelectContent className="z-[60] bg-card border border-border shadow-lg">
                    {talhoes.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
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
