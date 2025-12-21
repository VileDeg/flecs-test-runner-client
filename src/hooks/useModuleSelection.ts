import { useState, useEffect } from "react";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { FlecsMetadataService, type FlecsMetadata } from "@common/flecsMetadataService.ts";

export const useModuleSelection = (selectedModules: string[]) => {
  const { connection } = useFlecsConnection();
  const [availableModules, setAvailableModules] = useState<FlecsMetadata.Module[]>([]);
  const [availableSystems, setAvailableSystems] = useState<FlecsMetadata.System[]>([]);
  const [availableComponents, setAvailableComponents] = useState<FlecsMetadata.Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load available modules on mount
  useEffect(() => {
    const loadModules = async () => {
      if (!connection) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const modulesData = await FlecsMetadataService.getModules(connection);
        setAvailableModules(modulesData);
      } catch (error: any) {
        console.error('Failed to load modules:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [connection]);

  // Load systems and components when selected modules change
  useEffect(() => {
    const loadMetadata = async () => {
      if (!connection || selectedModules.length === 0) {
        setAvailableSystems([]);
        setAvailableComponents([]);
        setLoadingMetadata(false);
        return;
      }

      setLoadingMetadata(true);
      try {
        const [systemsData, componentsData] = await Promise.all([
          FlecsMetadataService.getSystems(connection, selectedModules),
          FlecsMetadataService.getComponents(connection, selectedModules)
        ]);
        
        setAvailableSystems(systemsData);
        setAvailableComponents(componentsData);
      } catch (error: any) {
        console.error('Failed to load metadata:', error);
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, [connection, selectedModules]);

  return {
    availableModules,
    availableSystems,
    availableComponents,
    loading,
    loadingMetadata,
  };
};
