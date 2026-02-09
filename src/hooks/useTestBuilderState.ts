import { useState, useEffect } from "react";

import { DEFAULT_TEST_PROPERTIES} from "@common/constants";

import type { 
  TestProperties,
  PrimitiveType,
  System,
  Module,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  ComponentsRegistry,
} from "@/common/types";

export interface TestBuilderPersistedState {
  testProperties: TestProperties,

  // testName: string;
  // systems: SystemInvocation[];
  // initialEntities: EntityConfiguration[];
  // expectedEntities: EntityConfiguration[];
  selectedModules: Module[];
}

export const useTestBuilderState = (
  persistedState?: TestBuilderPersistedState,
  onStateChange?: (state: TestBuilderPersistedState) => void
) => {
  const [testProperties, setTestProperties] 
    = useState(persistedState?.testProperties ?? DEFAULT_TEST_PROPERTIES);
  // const [systems, setSystems] = useState<SystemInvocation[]>(persistedState?.systems || []);
  // const [initialEntities, setInitialEntities] = useState<EntityData[]>(persistedState?.initialEntities || []);
  // const [expectedEntities, setExpectedEntities] = useState<EntityData[]>(persistedState?.expectedEntities || []);
  const [selectedModules, setSelectedModules] 
    = useState<Module[]>(persistedState?.selectedModules || []);

  // Persist state changes to parent component
  useEffect(() => {
    if (onStateChange) {
      console.log("*** useTestBuilderState: state changed, notifying parent");
      console.log("*** useTestBuilderState: selectedModules: ", selectedModules);
      onStateChange({
        testProperties,
        selectedModules,
      });
    }
  }, [testProperties, selectedModules, onStateChange]);

  return {
    testProperties,
    setTestProperties,
 
    selectedModules,
    setSelectedModules,
  };
};
