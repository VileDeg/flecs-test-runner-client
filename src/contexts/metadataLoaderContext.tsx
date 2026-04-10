import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from "react";

import { useFlecsConnection } from "@/contexts/flecsConnectionContext";
import { FlecsMetadataService } from "@common/flecsMetadataService.ts";

import type { 
  Module,
  System,
  Component,
} from "@/common/types";

export interface ModuleMetadata {
  systems: System[],
  components: Component[],
}

interface MetadataLoaderContextType {
  availableModules: Module[],
  moduleMetadataMap: Map<string, ModuleMetadata>,
  loadingMetadata: boolean,
}

const MetadataLoaderContext = createContext<MetadataLoaderContextType | undefined>(undefined);

interface MetadataLoaderProviderProps {
  children: ReactNode;
}

export const MetadataLoaderProvider: React.FC<MetadataLoaderProviderProps> = ({ children }) => {

  const { connection } = useFlecsConnection();
  const [moduleMetadataMap, setModuleMetadataMap] = useState<Map<string, ModuleMetadata>>(new Map());
  
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const setModuleMetadata = (module: string, metadata: ModuleMetadata) => {
    setModuleMetadataMap((prev) => new Map(prev).set(module, metadata));
  };

  // Load available modules on mount
  useEffect(() => {
    if (!connection) {
      setModuleMetadataMap(new Map());
      setAvailableModules([])
      console.log("useMetadataLoading: useEffect: no connection")
      return;
    }
    
    const loadMetadata = async () => {
      try {
        const avModules = await FlecsMetadataService.getModules(connection);
        setAvailableModules(avModules);

        for(const module of avModules) {
          console.log("*** useEffect useModuleSelection, not has module: ", module);

          const [systems, components] = await Promise.all([
            FlecsMetadataService.getSystems(connection, module),
            FlecsMetadataService.getComponents(connection, module)
          ]);
          setModuleMetadata(module.fullPath, { systems, components });
        }
      } catch (error: any) {
        console.error('Failed to load metadata:', error);
      }
      setLoadingMetadata(false);
      console.log("useMetadataLoading: useEffect: Finished loading")
    };
    
    console.log("useMetadataLoading: useEffect: load modules")

    loadMetadata();
  }, [connection]);

  const value: MetadataLoaderContextType = {
    availableModules,
    moduleMetadataMap,
    loadingMetadata
  };

  return (
    <MetadataLoaderContext.Provider value={value}>
      {children}
    </MetadataLoaderContext.Provider>
  );
};

export const useMetadataLoader = (): MetadataLoaderContextType => {
  const context = useContext(MetadataLoaderContext);
  if (context === undefined) {
    throw new Error("useMetadataLoader must be used within a MetadataLoaderProvider");
  }
  return context;
};
