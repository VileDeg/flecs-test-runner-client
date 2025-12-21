import { useState, useEffect } from "react";
import type { TestBuilderPersistedState } from "@pages/builderPage/builderPage.types.ts";
import type { FlecsCore } from "@common/testRunner.ts";

export const useTestBuilderState = (
  persistedState?: TestBuilderPersistedState,
  onStateChange?: (state: TestBuilderPersistedState) => void
) => {
  const [testName, setTestName] = useState(persistedState?.testName || "");
  const [systems, setSystems] = useState<FlecsCore.SystemInvocation[]>(persistedState?.systems || []);
  const [initialEntities, setInitialEntities] = useState<FlecsCore.EntityData[]>(persistedState?.initialEntities || []);
  const [expectedEntities, setExpectedEntities] = useState<FlecsCore.EntityData[]>(persistedState?.expectedEntities || []);
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
