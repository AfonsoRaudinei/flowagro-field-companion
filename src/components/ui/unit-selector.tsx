import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitService, UnitType, RegionType } from '@/services/unitService';

interface UnitSelectorProps {
  selectedUnit: UnitType;
  onUnitChange: (unit: UnitType) => void;
  region?: RegionType;
  className?: string;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({
  selectedUnit,
  onUnitChange,
  region,
  className = ""
}) => {
  const availableUnits = UnitService.getUnitsForRegion(region);

  return (
    <Select value={selectedUnit} onValueChange={onUnitChange}>
      <SelectTrigger className={`w-32 ${className}`}>
        <SelectValue placeholder="Unidade" />
      </SelectTrigger>
      <SelectContent>
        {availableUnits.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{unit.symbol}</span>
              <span className="text-xs text-muted-foreground">{unit.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UnitSelector;