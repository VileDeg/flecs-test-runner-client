import { useState, useEffect } from "react";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { FlecsMetadataService } from "@common/flecsMetadataService.ts";

import type { 
  Module,
  System,
  Component,
} from "@/common/types";

export const useModuleSelection = (selectedModules: Module[]) => {
  const { connection } = useFlecsConnection();
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableSystems, setAvailableSystems] = useState<System[]>([]);
  const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
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
    console.log("*** useEffect useModuleSeelction selectedModules");
    const loadMetadata = async () => {
      if (!connection || selectedModules.length === 0) {
        setAvailableSystems([]);
        setAvailableComponents([]);
        setLoadingMetadata(false);
        console.log("*** useEffect in useModuleSelection set avail systems to empty");
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
        console.log("*** useEffect in useModuleSelection set avail systems to: ", systemsData);
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
