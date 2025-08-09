import React from "react";
import { RouteRecorder } from "@/components/RouteRecorder";
import { RouteHistoryModal } from "@/components/RouteHistoryModal";
import { RouteViewer } from "@/components/RouteViewer";

interface RouteUIProps {
  farmId: string;
  farmName: string;
  showRouteRecorder: boolean;
  onTrailUpdate: (t: any) => void;
  onTrailComplete: (t: any) => void;
  showRouteHistory: boolean;
  closeRouteHistory: () => void;
  onViewRoute: (trail: any) => void;
  selectedViewTrail: any;
  showRouteViewer: boolean;
  closeRouteViewer: () => void;
  photos: any[];
}

const RouteUI: React.FC<RouteUIProps> = ({
  farmId,
  farmName,
  showRouteRecorder,
  onTrailUpdate,
  onTrailComplete,
  showRouteHistory,
  closeRouteHistory,
  onViewRoute,
  selectedViewTrail,
  showRouteViewer,
  closeRouteViewer,
  photos,
}) => {
  return (
    <>
      <RouteRecorder
        farmId={farmId}
        farmName={farmName}
        isVisible={showRouteRecorder}
        onTrailUpdate={onTrailUpdate}
        onTrailComplete={onTrailComplete}
      />
      <RouteHistoryModal
        isOpen={showRouteHistory}
        onClose={closeRouteHistory}
        farmId={farmId}
        onViewRoute={onViewRoute}
      />
      <RouteViewer
        trail={selectedViewTrail}
        isOpen={showRouteViewer}
        onClose={closeRouteViewer}
        photos={photos}
      />
    </>
  );
};

export default RouteUI;
