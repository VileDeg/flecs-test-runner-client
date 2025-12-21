import { useState, useEffect } from "react";
import type { SystemInvocation, EntityData } from "@pages/builderPage/builderPage.types.ts";
import type * as Core from "@common/coreTypes.ts";

export interface TestBuilderPersistedState {
  testName: string;
  systems: Core.SystemInvocation[];
  initialEntities: Core.EntityData[];
  expectedEntities: Core.EntityData[];
  selectedModules: string[];
}

export const useTestBuilderState = (
  persistedState?: TestBuilderPersistedState,
  onStateChange?: (state: TestBuilderPersistedState) => void
) => {
  const [testName, setTestName] = useState(persistedState?.testName || "");
  const [systems, setSystems] = useState<SystemInvocation[]>(persistedState?.systems || []);
  const [initialEntities, setInitialEntities] = useState<EntityData[]>(persistedState?.initialEntities || []);
  const [expectedEntities, setExpectedEntities] = useState<EntityData[]>(persistedState?.expectedEntities || []);
  const [selectedModules, setSelectedModules] = useState<string[]>(persistedState?.selectedModules || []);

  // Persist state changes to parent component
  useEffect(() => {
    if (onStateChange) {
      console.log("*** useTestBuilderState: state changed, notifying parent");
      console.log("*** useTestBuilderState: selectedModules: ", selectedModules);
      onStateChange({
        testName,
        systems,
        initialEntities,
        expectedEntities,
        selectedModules,
      });
    }
  }, [testName, systems, initialEntities, expectedEntities, selectedModules, onStateChange]);

  return {
    testName,
    setTestName,
    systems,
    setSystems,
    initialEntities,
    setInitialEntities,
    expectedEntities,
    setExpectedEntities,
    selectedModules,
    setSelectedModules,
  };
};
