import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from "react";

import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
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

export interface MetadataProps {
  availableModules: Module[],
  moduleMetadataMap: Map<string, ModuleMetadata>,
  loadingMetadata: boolean,
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
  //const [availableSystems, setAvailableSystems] = useState<System[]>([]);
  //const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
  //const [loadingModules, setLoadingModules] = useState(false); // TODO
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const setModuleMetadata = (module: string, metadata: ModuleMetadata) => {
    setModuleMetadataMap((prev) => new Map(prev).set(module, metadata));
  };

  // const updateModuleMetadata = (id: string, updates: Partial<ModuleMetadata>) => {
  //   setModuleMetadataMap((prevMetadataMap) => ({
  //     ...prevMetadataMap,        
  //     [id]: {            
  //       ...prevMetadataMap[id],   
  //       updates
  //     },
  //   }));
  // };

  //const availableSystems: System[] = []
  //const availableComponents: Component[] = [];

  // Load available modules on mount
  useEffect(() => {
    if (!connection) {
      setModuleMetadataMap(new Map());
      setAvailableModules([])
      //setLoadingModules(false);
      setLoadingMetadata(false);
      console.log("useMetadataLoading: useEffect: no connection")
      return;
    }
    
    // const loadModules = async () => {
    //   setLoadingModules(true);
    //   try {
    //     const modulesData = await FlecsMetadataService.getModules(connection);
    //     setAvailableModules(modulesData);
    //   } catch (error: any) {
    //     console.error('Failed to load modules:', error);
    //   } 
    //   setLoadingModules(false);
    // };
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const avModules = await FlecsMetadataService.getModules(connection);
        setAvailableModules(avModules);

        for(const module of avModules) {
          // if (!availableModules.find(avModule => avModule.fullPath === module.fullPath)) {
          //   console.warn(`Module is not available: `, module);
          //   continue;
          // }
          //if (!moduleMetadataMap.has(module.fullPath)) {
            console.log("*** useEffect useModuleSelection, not has module: ", module);

            const [systems, components] = await Promise.all([
              FlecsMetadataService.getSystems(connection, module),
              FlecsMetadataService.getComponents(connection, module)
            ]);
            setModuleMetadata(module.fullPath, { systems, components });
          //}
        }
      } catch (error: any) {
        console.error('Failed to load metadata:', error);
      }
      setLoadingMetadata(false);
    };
    
    console.log("useMetadataLoading: useEffect: load modules")

    //loadModules();
    loadMetadata();
  }, [connection]);

  // const getSelectedModulesMetadata = (selectedModules: Module[]) => {
  //   const metadataArray: ModuleMetadata[] = [];
    
  //   for (const module of selectedModules) {
  //     const metadata = moduleMetadataMap.get(module.fullPath);
  //     if (metadata) {
  //       metadataArray.push(metadata)
  //     }
  //   }
  
  //   return { availableSystems: systems, availableComponents: components };
  // }

  
  // To check that modules actually changed (not just the reference)
  //const modulesKey = selectedModules.map(m => m.fullPath).sort().join(",");

  // Load systems and components when selected modules change
  // useEffect(() => {
  //   if(!connection || loadingModules) {
  //     return;
  //   }

  //   console.log("*** useEffect useModuleSelection: ", moduleMetadataMap);

  //   const loadMetadata = async () => {
  //     //setLoadingMetadata(true);
  //     try {
  //       for(const module of availableModules) {
  //         // if (!availableModules.find(avModule => avModule.fullPath === module.fullPath)) {
  //         //   console.warn(`Module is not available: `, module);
  //         //   continue;
  //         // }
  //         if (!moduleMetadataMap.has(module.fullPath)) {
  //           console.log("*** useEffect useModuleSelection, not has module: ", module);

  //           const [systems, components] = await Promise.all([
  //             FlecsMetadataService.getSystems(connection, module),
  //             FlecsMetadataService.getComponents(connection, module)
  //           ]);
  //           setModuleMetadata(module.fullPath, { systems, components });
  //         }
  //       }
  //     } catch (error: any) {
  //       console.error('Failed to load metadata:', error);
  //     }
  //     setLoadingMetadata(false);
  //   };

  //   loadMetadata();
  // }, [connection, loadingModules, selectedModules, moduleMetadataMap]); // selectedModules

  // const { availableSystems, availableComponents } = useMemo(() => {
  //   const systems: System[] = [];
  //   const components: Component[] = [];
  
  //   for (const module of selectedModules) {
  //     const metadata = moduleMetadataMap.get(module.fullPath);
  //     if (metadata) {
  //       systems.push(...metadata.systems);
  //       components.push(...metadata.components);
  //     }
  //   }
  
  //   return { availableSystems: systems, availableComponents: components };
  // }, [availableModules, moduleMetadataMap]);

  // const { availableSystems, availableComponents } = useMemo(() => {
  //   const systems: System[] = [];
  //   const components: Component[] = [];
  
  //   for (const module of selectedModules) {
  //     const metadata = moduleMetadataMap.get(module.fullPath);
  //     if (metadata) {
  //       systems.push(...metadata.systems);
  //       components.push(...metadata.components);
  //     }
  //   }
  
  //   return { availableSystems: systems, availableComponents: components };
  // }, [selectedModules, moduleMetadataMap]);

  // useEffect(() => {
  //   moduleMetadataMap.forEach((value, key) => {
  //     if(selectedModules.find(module => module.fullPath === key.fullPath) !== undefined) {
  //       availableSystems.push(...value.systems)
  //       availableComponents.push(...value.components)
  //     } 
  //   }) 
  // }, [moduleMetadataMap]);

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

  // return {
  //   availableModules,
  //   moduleMetadataMap,
  //   // availableSystems,
  //   // availableComponents,
  //   // loadingModules,
  //   loadingMetadata,
  // };
};

export const useMetadataLoader = (): MetadataLoaderContextType => {
  const context = useContext(MetadataLoaderContext);
  if (context === undefined) {
    throw new Error("useMetadataLoader must be used within a MetadataLoaderProvider");
  }
  return context;
};
