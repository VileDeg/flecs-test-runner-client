import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from "react";
import { TestStatus, type WorkspaceTest } from "@/common/workspaceTypes";
import { isWorkspaceState } from "@/common/workspaceTypes";
import { DEFAULT_WORKSPACE_STATE, DEFAULT_TEST_PROPERTIES } from "@common/constants"
import { useWorkspace } from "@/contexts/workspaceContext.tsx";

import * as LS from "@/common/localStorage";
import type { SystemInvocation, UnitTestProps, UnitTest, System, Component, EntityConfiguration, WorldConfiguration } from "@/common/types";
import { Module, MessageType } from "@/common/types";
import { OperatorType, type Operator } from "@/common/coreTypes";

import { FlecsAsync } from "@common/flecsConnection/flecsAsync"

import { useToast } from "@/components/common/toast/useToast";
import * as Utils from "@/common/testUtils";
import { useMetadataLoader } from "@/contexts/metadataLoaderContext";

interface BuilderContextType {
  testProperties: UnitTestProps;
  availableModules: Module[],
  availableSystems: System[],
  availableComponents: Component[],
  loadingMetadata: boolean,
  updateTestProperties: (updates: Partial<UnitTestProps>) => void;
  updateUnitTest: (updates: Partial<UnitTest>) => void;
  changeEntityName: (id: string, newName: string) => void;
  addEntity: () => void;
  removeEntity: (id: string) => void;
  getEntity: (id: string, expected: boolean) => EntityConfiguration | undefined;
  addComponent: (entityName: string, componentId: string) => void;
  //removeComponent: (entityName: string, index: number) => void;
  replaceComponent: (entityName: string, index: number, newComponent: string | null) => void; // null => remove
  onOperatorChanged: (type: OperatorType | null, fullPath: string) => void;
  isOperatorEnabled: (path: string) => boolean;
  getOperatorType: (path: string) => OperatorType | null;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

interface BuilderProviderProps {
  children: ReactNode;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({ children }) => {
  const { 
    currentTestId, 
    refreshCurrentTest,
    getWorkspaceTest,
    //setSelectedModules,
    //getMetadataProps,
    //updateWorkspaceTest
  } = useWorkspace(); 

  //console.log("currentTestId: ", currentTestId)
  
  const getCurrentTest = (): WorkspaceTest | null => {
    if(!currentTestId) {
      return null;
    }
    const test = getWorkspaceTest(currentTestId);
    if(!test) {
      console.error("Test does not exist with id: " + currentTestId)
      return null;
    }
    return test;
  }
  
  const [testProperties, setTestProperties] = useState<UnitTestProps>(
    getCurrentTest()?.testProperties ?? DEFAULT_TEST_PROPERTIES
  )

  useEffect(() => {
    setTestProperties(getCurrentTest()?.testProperties ?? DEFAULT_TEST_PROPERTIES)
  }, [refreshCurrentTest]);
  
  const {test, selectedModules} = testProperties;
  //const {systems} = test;

  // useEffect(() => {
  //   setSelectedModules(selectedModules);
  // }, [selectedModules]);

  const {
    availableModules,
    moduleMetadataMap,
    // availableSystems,
    // availableComponents,
    // loadingModules,
    loadingMetadata,
  } = useMetadataLoader();

  // const getAvailableSystems = () => {
  //   let systems = []
  //   selectedModules.forEach(module => {
  //     if(!moduleMetadataMap.has(module.fullPath)) {
  //       console.error("Internal Error"); // Cannot happen
  //       return;
  //     }
  //     systems.push(moduleMetadataMap.get(module.fullPath)?.systems)
  //   }) 
  // }

  // const getAvailableComponents = () => {
  //   let components = []
  //   selectedModules.forEach(module => {
  //     if(!moduleMetadataMap.has(module.fullPath)) {
  //       console.error("Internal Error"); // Cannot happen
  //       return;
  //     }
  //     components.push(moduleMetadataMap.get(module.fullPath)?.components)
  //   }) 
  // }

  const { availableSystems, availableComponents } = useMemo(() => {
    let availableSystems: System[] = []
    let availableComponents: Component[] = []
    if(!loadingMetadata) {
      selectedModules.forEach(module => {
        if(!moduleMetadataMap.has(module.fullPath)) {
          console.error("Internal Error"); // Cannot happen
          return;
        }
        const md = moduleMetadataMap.get(module.fullPath)!;
        availableSystems.push(...md.systems)
        availableComponents.push(...md.components)
      }) 
    }
    //console.log("availableSystems: ", availableSystems)
    return {availableSystems, availableComponents}
  }, [loadingMetadata, moduleMetadataMap, testProperties])



  //const availableSystems = 
  

  // const {
  //   availableModules,
  //   availableSystems,
  //   availableComponents,
  //   loadingModules,
  //   loadingMetadata,
  // } = getMetadataProps();

  const updateTestProperties = (updates: Partial<UnitTestProps>) => {
    console.log("updateTestProperties: ", updates)
    setTestProperties(prev => ({ ...prev, ...updates }));
  };
  
  const updateUnitTest = (updater: Partial<UnitTest> | ((prev: UnitTest) => Partial<UnitTest>)) => {
    setTestProperties(prev => {
      const updates = typeof updater === "function" ? updater(prev.test) : updater;
      return {
        ...prev,
        test: { ...prev.test, ...updates }
      };
    });
  };

  // const setSystems = (systems: SystemInvocation[]) => {
  //   updateUnitTest({systems});
  // }

  // const setInitialConfiguration = (entities: WorldConfiguration) => {
  //   //console.log("setInitialConfiguration")
  //   updateUnitTest({initialConfiguration: entities});
  // }

  // const setExpectedConfiguration = (entities: WorldConfiguration) => {
  //   updateUnitTest({expectedConfiguration: entities});
  // }

  // useEffect(() => {
  //   // Don't run until modules have finished loading
  //   if (loadingModules) { 
  //     return;
  //   }

  //   //console.log("*** useEffect, availableModules: ", availableModules);
  //   // Filter out selected that are not in available 
  //   // Avoid comparing by reference
  //   const filteredSelected = selectedModules.filter(sm => 
  //     availableModules.find(am => am.equals(sm))
  //   );

  //   //console.log("*** useEffect, filteredSelected: ", filteredSelected);
  //   setSelectedModules(filteredSelected);
  // }, [availableModules, loadingModules]); // , setSelectedModules 

  // // Clear systems from modules that are no longer selected
  // useEffect(() => {
  //   if (loadingModules || loadingMetadata || !currentTestId) { 
  //     return;
  //   }

  //   const wsTest = getCurrentTest()!
  //   // if(!wsTest) {
  //   //   return;
  //   // }
  //   const unitTest = wsTest.testProperties.test;
  //   const systems = unitTest.systems;

  //   if (systems.length > 0) {
  //     const availableSystemNames = new Set(availableSystems.map(s => s.module.fullPath + "." + s.name));
  //     const filteredSystems = systems.filter(s => availableSystemNames.has(s.name));

  //     console.log("*** Filtering systems, systems before filtering: ", systems);
  //     console.log("*** Filtering systems, availableSystemNames: ", availableSystemNames);
  //     console.log("*** Filtering systems, filteredSystems: ", filteredSystems);
  //     //if (filteredSystems.length !== systems.length) {
  //     setSystems(filteredSystems);
  //     //}
  //   }
  // }, [availableSystems, loadingModules, loadingMetadata, currentTestId]); //, setSystems

  // // Clear components from entities that are no longer available in selected modules
  // useEffect(() => {
  //   if (loadingModules || loadingMetadata || !currentTestId) { 
  //     return;
  //   }

  //   //const availableComponentNames = availableComponents.map(c => c.name);
  //   const filterEntityComponents = (entities: EntityConfiguration[]) => {
  //     return entities.map(entity => ({
  //       ...entity,
  //       components: entity.components.filter(
  //         comp => availableComponents.find(
  //           ac => ac.name == comp.name 
  //         )
  //       )
  //     }));
  //   };

  //   const wsTest = getCurrentTest()!
  //   const unitTest = wsTest.testProperties.test;

  //   const filteredInitial  = filterEntityComponents(unitTest.initialConfiguration);
  //   const filteredExpected = filterEntityComponents(unitTest.expectedConfiguration);

  //   console.log("*** Filtering ENTITIES INITIAL, AVAILABLE components: ", availableComponents);
  //   console.log("*** Filtering ENTITIES INITIAL, BEFORE filtering: ", unitTest.initialConfiguration);
  //   console.log("*** Filtering ENTITIES INITIAL, AFTER filtering: ", filteredInitial);
    
  //   //if (JSON.stringify(filteredInitial) !== JSON.stringify(initialConfiguration)) {
  //   setInitialConfiguration(filteredInitial);
  //   setExpectedConfiguration(filteredExpected);
  // }, [availableComponents, loadingModules, loadingMetadata, currentTestId]); // , setInitialConfiguration, setExpectedConfiguration

  const changeEntityName = (id: string, newName: string) => {
    //const oldName = test.initialConfiguration.find(e => e.id === id)!.entityName;
    //const oldId = test.initialConfiguration.find(e => e.id === id)!.id;

    updateUnitTest(prev => ({
      initialConfiguration: prev.initialConfiguration.map(e => 
        e.id === id ? { ...e, entityName: newName } : e
      ),
      expectedConfiguration: prev.expectedConfiguration.map(e => 
        e.id === id ? { ...e, entityName: newName } : e
      )
    }));

    //handleOnOperatorChanged(null, oldName);
    //handleOnOperatorChanged(OperatorType.Eq, newName);
  };

  const getEntity = (id: string, expected: boolean) => {
    return expected
      ? test.expectedConfiguration.find(e => e.id === id)
      : test.initialConfiguration.find(e => e.id === id)
  }


  const addEntity = () => {
    const newId = crypto.randomUUID();
    const newName = "Entity";
    
    // Same entity reference in both configs
    const newEntity: EntityConfiguration = { 
      id: newId, entityName: newName, components: [] 
    };
  
    updateUnitTest(prevTest => ({
      initialConfiguration: [
        ...prevTest.initialConfiguration, 
        //{id: crypto.randomUUID(), entityName: newName, components: [] }
        newEntity
      ],
      expectedConfiguration: [
        ...prevTest.expectedConfiguration, 
        //{id: crypto.randomUUID(), entityName: newName, components: [] }
        newEntity
      ]
    }));
  
    handleOnOperatorChanged(OperatorType.Eq, newId);
  };

  const removeEntity = (id: string) => {
    updateUnitTest((prev) => ({
      initialConfiguration: prev.initialConfiguration.filter(e => e.id !== id), 
      expectedConfiguration: prev.expectedConfiguration.filter(e => e.id !== id)
    }));
  }

  const getAvailableComponent = (id: string): Component => {
    const component = 
        availableComponents.find((component) => component.id == id);
    if(!component) {
      //console.log("getAvailableComponent Error: ", component)
      throw Error(`Component with ID ${id} is not available`);
    }

    //console.log("getAvailableComponent: ", component)
    return component;
  }

  const addComponentToWorld = (world: WorldConfiguration, entityId: string, comp: Component) => {
    return world.map(e => e.id == entityId ? {...e, components: [...e.components, comp] } : e)!;
  }  
  
  // TODO: move method to types module
  const cloneComponent = (component: Component): Component => {
    return {...component, fields: structuredClone(component.fields)}
  }

  const addComponent = (entityId: string, componentId: string) => {
    console.log("addComponent: ", entityId, componentId);
    const comp = getAvailableComponent(componentId);

    const initial = addComponentToWorld(
      test.initialConfiguration, 
      entityId, 
      {...comp, fields: structuredClone(comp.fields)}
    ); // TODO: need deep clone
    const expected = addComponentToWorld(test.expectedConfiguration, entityId, cloneComponent(comp));

    updateUnitTest({initialConfiguration: initial, expectedConfiguration: expected});
  };


  const replaceComponentFromWorld = (world: WorldConfiguration, entityId: string, componentIndex: number, newComponentId: string | null) => {
    //console.log("replaceComponentFromWorld, ", newComponentId)
    //console.log("entityId, ", entityId)
    //console.log("world, ", world)

    return world.map(
      e => e.id === entityId ? {
        ...e, 
        components: newComponentId 
          ? e.components.map((comp, i) => i === componentIndex ? cloneComponent(getAvailableComponent(newComponentId)) : comp) // replace
          : e.components.filter((_, i) => i !== componentIndex) // remove
      } : e)
  }  

  const replaceComponent = (entityId: string, componentIndex: number, newComponentId: string | null) => {
    // if(!newComponent) {
    //   const initial = removeComponentFromWorld(test.initialConfiguration, entityId, componentIndex);
    //   const expected = removeComponentFromWorld(test.expectedConfiguration, entityId, componentIndex);
    // }

    updateUnitTest((prev: UnitTest) => {
      return {
        ...prev,
        initialConfiguration: replaceComponentFromWorld(prev.initialConfiguration, entityId, componentIndex, newComponentId),
        expectedConfiguration: replaceComponentFromWorld(prev.expectedConfiguration, entityId, componentIndex, newComponentId)
      }
    })
  }

  // const updateOperators = (operators: Operator[]) => {
  //   updateUnitTest({operators})
  // }

  const operators = testProperties.test.operators;

  // function isChildPath(pathParent: string, pathChild: string): boolean {
  //   const child = pathChild.split('/').filter(Boolean);
  //   const parent = pathParent.split('/').filter(Boolean);
  
  //   if (parent.length > child.length) {
  //     return false;
  //   }
  
  //   return parent.every((segment, i) => segment === child[i]);
  // }

  // function arePathsRelated(path1: string, path2: string): boolean {
  //   const segments1 = new Set(path1.split('/').filter(Boolean));
  //   const segments2 = path2.split('/').filter(Boolean);
  
  //   return segments2.some(segment => segments1.has(segment));
  // }

  function arePathsNested(pathA: string, pathB: string): boolean {
    const segA = pathA.split('/').filter(Boolean);
    const segB = pathB.split('/').filter(Boolean);
  
    const minLength = Math.min(segA.length, segB.length);
  
    for (let i = 0; i < minLength; i++) {
      if (segA[i] !== segB[i]) return false;
    }
  
    return true;
  }
  // const arePathsRelated = (a: string, b: string): boolean => {
  //   return a.includes(b) || b.includes(a); // a !== b && (
  // };

  const handleOnOperatorChanged = (type: OperatorType | null, fullPath: string) => {
    console.log("Add operator: ", type, fullPath)
    
    updateUnitTest(prevTest => {
      let newOperators = []
      if(type) {
        //newOperators = prevTest.operators.filter((op) => !arePathsRelated(op.path, fullPath));
        newOperators = prevTest.operators.filter((op) => !arePathsNested(fullPath, op.path));

        newOperators.push({type, path:fullPath})
      } else {
        newOperators = prevTest.operators.filter((op) => op.path !== fullPath);
      }
      console.log("newOperators: ", newOperators)
      
      return { operators: newOperators };
    });
  };

  const isOperatorEnabled = (path: string): boolean => {
    //console.log(`isOperatorEnabled search ${path} in `, operators)
    //console.log("Result isOperatorEnabled: ", operators.find(op => op.path == path))
    return operators.find(op => op.path == path) !== undefined
  }

  const getOperatorType = (path: string): OperatorType | null => {
    //console.log(`isOperatorEnabled search ${path} in `, operators)
    //console.log("Result isOperatorEnabled: ", operators.find(op => op.path == path))
    return operators.find(op => op.path == path)?.type ?? null;
  }
 
  const value: BuilderContextType = {
    testProperties,
    availableModules,
    availableSystems,
    availableComponents,
    loadingMetadata,
    addEntity,
    removeEntity,
    changeEntityName,
    addComponent,
    getEntity,
    replaceComponent,
    updateTestProperties,
    updateUnitTest,
    onOperatorChanged: handleOnOperatorChanged,
    isOperatorEnabled,
    getOperatorType
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = (): BuilderContextType => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};