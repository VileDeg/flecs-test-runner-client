import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useMemo,
} from "react";
import {
  DEFAULT_ENTITY_NAME,
  DEFAULT_TEST_PROPERTIES,
} from "@common/constants";
import { useWorkspace } from "@/contexts/workspaceContext.tsx";

import type {
  UnitTestProps,
  UnitTest,
  System,
  Component,
  WorldConfiguration,
  EntityConfiguration,
} from "@/common/types";
import { OperatorType } from "@/common/coreTypes";

import { useMetadataLoader } from "@/contexts/metadataLoaderContext";

interface BuilderContextType {
  testProperties: UnitTestProps;
  availableModules: string[];
  availableSystems: System[];
  availableComponents: Component[];
  loadingMetadata: boolean;
  updateTestProperties: (updates: Partial<UnitTestProps>) => void;
  updateUnitTest: (updates: Partial<UnitTest>) => void;
  addEntity: (isExpectedConfiguration: boolean) => void;
  removeEntity: (id: string, isExpectedConfiguration: boolean) => void;
  replaceComponent: (
    entityName: string,
    index: number,
    newComponent: string | null,
  ) => void; // null => remove
  copyFromInitial: () => void;
  onOperatorChanged: (type: OperatorType | null, fullPath: string) => void;
  getOperatorType: (path: string) => OperatorType | null;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

interface BuilderProviderProps {
  children: ReactNode;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({
  children,
}) => {
  const { currentTestId, refreshCurrentTest, getWorkspaceTest } =
    useWorkspace();

  const workspaceTest = useMemo(() => {
    if (!currentTestId) {
      return null;
    }
    return getWorkspaceTest(currentTestId) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTestId, refreshCurrentTest, getWorkspaceTest]);

  const [testProperties, setTestProperties] = useState<UnitTestProps>(
    workspaceTest?.testProperties ?? DEFAULT_TEST_PROPERTIES,
  );

  useEffect(() => {
    setTestProperties(workspaceTest?.testProperties ?? DEFAULT_TEST_PROPERTIES);
  }, [workspaceTest]);

  const { unitTest, selectedModules } = useMemo(() => {
    return {
      unitTest: testProperties.test,
      selectedModules: testProperties.selectedModules,
    };
  }, [testProperties]);

  const { availableModules, moduleMetadataMap, loadingMetadata } =
    useMetadataLoader();

  const { availableSystems, availableComponents } = useMemo(() => {
    const availableSystems: System[] = [];
    const availableComponents: Component[] = [];
    if (!loadingMetadata) {
      selectedModules.forEach((module) => {
        if (!moduleMetadataMap.has(module)) {
          console.error(
            "Internal Error: module ",
            module,
            " is not in the map ",
            moduleMetadataMap,
          ); // Cannot happen
          return;
        }
        const md = moduleMetadataMap.get(module)!;
        availableSystems.push(...md.systems);
        availableComponents.push(...md.components);
      });
    }
    return { availableSystems, availableComponents };
  }, [loadingMetadata, moduleMetadataMap, selectedModules]);

  const generateEntityId = () => crypto.randomUUID();

  const updateTestProperties = (updates: Partial<UnitTestProps>) => {
    setTestProperties((prev) => ({ ...prev, ...updates }));
  };

  const updateUnitTest = (
    updater: Partial<UnitTest> | ((prev: UnitTest) => Partial<UnitTest>),
  ) => {
    setTestProperties((prev) => {
      const updates =
        typeof updater === "function" ? updater(prev.test) : updater;
      return {
        ...prev,
        test: { ...prev.test, ...updates },
      };
    });
  };

  /**
   * Must always be called when entity is created!
   */
  const onEntityAdded = (id: string, isExpectedConfiguration: boolean) => {
    if (isExpectedConfiguration) {
      onOperatorChanged(OperatorType.Eq, id);
    }
  };

  /**
   * Must always be called when entity is removed or replaced!
   */
  const onEntityRemoved = (id: string, isExpectedConfiguration: boolean) => {
    if (isExpectedConfiguration) {
      onOperatorChanged(null, id);
    }
  };

  const addEntity = (isExpectedConfiguration: boolean) => {
    const newId = generateEntityId();
    const newName = DEFAULT_ENTITY_NAME;

    const newEntity: EntityConfiguration = {
      id: newId,
      entityName: newName,
      components: [],
    };
    updateUnitTest((prev) =>
      isExpectedConfiguration
        ? {
            expectedConfiguration: [...prev.expectedConfiguration, newEntity],
          }
        : {
            initialConfiguration: [...prev.initialConfiguration, newEntity],
          },
    );
    onEntityAdded(newId, isExpectedConfiguration);
  };

  const removeEntity = (id: string, isExpectedConfiguration: boolean) => {
    updateUnitTest((prev) => ({
      initialConfiguration: prev.initialConfiguration.filter(
        (e) => e.id !== id,
      ),
      expectedConfiguration: prev.expectedConfiguration.filter(
        (e) => e.id !== id,
      ),
    }));
    onEntityRemoved(id, isExpectedConfiguration);
  };

  const cloneComponent = (component: Component): Component => {
    return { ...component, fields: structuredClone(component.fields) };
  };

  const cloneEntity = (entity: EntityConfiguration): EntityConfiguration => {
    return {
      id: generateEntityId(),
      entityName: entity.entityName,
      components: entity.components.map((comp) => cloneComponent(comp)),
    };
  };

  const copyFromInitial = () => {
    // Cleanup current entities
    unitTest.expectedConfiguration.forEach((entity) =>
      onEntityRemoved(entity.id, true),
    );

    const newExpected = unitTest.initialConfiguration.map((entity) =>
      cloneEntity(entity),
    );

    newExpected.forEach((entity) => onEntityAdded(entity.id, true));

    updateUnitTest({
      expectedConfiguration: newExpected,
    });
  };

  const getAvailableComponent = (id: string): Component => {
    const component = availableComponents.find(
      (component) => component.id == id,
    );
    if (!component) {
      throw Error(`Component with ID ${id} is not available`);
    }

    return component;
  };

  const replaceComponentFromWorld = (
    world: WorldConfiguration,
    entityId: string,
    componentIndex: number,
    newComponentId: string | null,
  ) => {
    return world.map((e) =>
      e.id === entityId
        ? {
            ...e,
            components: newComponentId
              ? e.components.map((comp, i) =>
                  i === componentIndex
                    ? cloneComponent(getAvailableComponent(newComponentId))
                    : comp,
                ) // replace
              : e.components.filter((_, i) => i !== componentIndex), // remove
          }
        : e,
    );
  };

  const replaceComponent = (
    entityId: string,
    componentIndex: number,
    newComponentId: string | null,
  ) => {
    updateUnitTest((prev: UnitTest) => {
      return {
        ...prev,
        initialConfiguration: replaceComponentFromWorld(
          prev.initialConfiguration,
          entityId,
          componentIndex,
          newComponentId,
        ),
        expectedConfiguration: replaceComponentFromWorld(
          prev.expectedConfiguration,
          entityId,
          componentIndex,
          newComponentId,
        ),
      };
    });
  };

  const operators = testProperties.test.operators;

  function arePathsNested(pathA: string, pathB: string): boolean {
    const segA = pathA.split("/").filter(Boolean);
    const segB = pathB.split("/").filter(Boolean);

    const minLength = Math.min(segA.length, segB.length);

    for (let i = 0; i < minLength; i++) {
      if (segA[i] !== segB[i]) return false;
    }

    return true;
  }

  const onOperatorChanged = (type: OperatorType | null, fullPath: string) => {
    updateUnitTest((prevTest) => {
      let newOperators = [];
      if (type) {
        newOperators = prevTest.operators.filter(
          (op) => !arePathsNested(fullPath, op.path),
        );

        newOperators.push({ type, path: fullPath });
      } else {
        newOperators = prevTest.operators.filter((op) => op.path !== fullPath);
      }

      return { operators: newOperators };
    });
  };

  const getOperatorType = (path: string): OperatorType | null => {
    return operators.find((op) => op.path == path)?.type ?? null;
  };

  const value: BuilderContextType = {
    testProperties,
    availableModules,
    availableSystems,
    availableComponents,
    loadingMetadata,
    addEntity,
    removeEntity,
    replaceComponent,
    copyFromInitial,
    updateTestProperties,
    updateUnitTest,
    onOperatorChanged,
    getOperatorType,
  };

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
};

export const useBuilder = (): BuilderContextType => {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};
