import React from "react";

// Placeholder clustering component to keep logic unchanged for now.
// It renders children as-is; clustering can be enabled later without touching the page.
interface MarkersClusterProps {
  enabled?: boolean;
  children?: React.ReactNode;
}

const MarkersCluster: React.FC<MarkersClusterProps> = ({ enabled = false, children }) => {
  // Future: if enabled, wrap markers with a clustering library
  return <>{children}</>;
};

export default MarkersCluster;

