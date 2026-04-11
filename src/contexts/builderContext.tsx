import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useMemo,
} from "react";
import { type WorkspaceTest } from "@/common/workspaceTypes";
import { DEFAULT_TEST_PROPERTIES } from "@common/constants";
import { useWorkspace } from "@/contexts/workspaceContext.tsx";

import type {
  UnitTestProps,
  UnitTest,
  System,
  Component,
  EntityConfiguration,
  WorldConfiguration,
} from "@/common/types";
import { Module } from "@/common/types";
import { OperatorType } from "@/common/coreTypes";

import { useMetadataLoader } from "@/contexts/metadataLoaderContext";

interface BuilderContextType {
  testProperties: UnitTestProps;
  availableModules: Module[];
  availableSystems: System[];
  availableComponents: Component[];
  loadingMetadata: boolean;
  updateTestProperties: (updates: Partial<UnitTestProps>) => void;
  updateUnitTest: (updates: Partial<UnitTest>) => void;
  changeEntityName: (id: string, newName: string) => void;
  addEntity: () => void;
  removeEntity: (id: string) => void;
  getEntity: (id: string, expected: boolean) => EntityConfiguration | undefined;
  addComponent: (entityName: string, componentId: string) => void;
  replaceComponent: (
    entityName: string,
    index: number,
    newComponent: string | null,
  ) => void; // null => remove
  onOperatorChanged: (type: OperatorType | null, fullPath: string) => void;
  isOperatorEnabled: (path: string) => boolean;
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

  const getCurrentTest = useCallback((): WorkspaceTest | null => {
    if (!currentTestId) {
      return null;
    }
    const test = getWorkspaceTest(currentTestId);
    if (!test) {
      console.error("Test does not exist with id: " + currentTestId);
      return null;
    }
    return test;
  }, [currentTestId, getWorkspaceTest]);

  const [testProperties, setTestProperties] = useState<UnitTestProps>(
    getCurrentTest()?.testProperties ?? DEFAULT_TEST_PROPERTIES,
  );

  useEffect(() => {
    setTestProperties(
      getCurrentTest()?.testProperties ?? DEFAULT_TEST_PROPERTIES,
    );
  }, [getCurrentTest, refreshCurrentTest]);

  //const {test, selectedModules} = testProperties;

  const { test, selectedModules } = useMemo(() => {
    return {
      test: testProperties.test,
      selectedModules: testProperties.selectedModules,
    };
  }, [testProperties]);

  const { availableModules, moduleMetadataMap, loadingMetadata } =
    useMetadataLoader();

  const { availableSystems, availableComponents } = useMemo(() => {
    console.log("builderContent update, systems, components");
    const availableSystems: System[] = [];
    const availableComponents: Component[] = [];
    if (!loadingMetadata) {
      console.log(
        "builderContent update, systems, components, loadingMetadata = false",
      );
      selectedModules.forEach((module) => {
        if (!moduleMetadataMap.has(module.fullPath)) {
          console.error(
            "Internal Error: module ",
            module.fullPath,
            " is not in the map ",
            moduleMetadataMap,
          ); // Cannot happen
          return;
        }
        const md = moduleMetadataMap.get(module.fullPath)!;
        availableSystems.push(...md.systems);
        availableComponents.push(...md.components);
      });
    }
    return { availableSystems, availableComponents };
  }, [loadingMetadata, moduleMetadataMap, selectedModules]);

  const updateTestProperties = (updates: Partial<UnitTestProps>) => {
    console.log("updateTestProperties: ", updates);
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

  const changeEntityName = (id: string, newName: string) => {
    updateUnitTest((prev) => ({
      initialConfiguration: prev.initialConfiguration.map((e) =>
        e.id === id ? { ...e, entityName: newName } : e,
      ),
      expectedConfiguration: prev.expectedConfiguration.map((e) =>
        e.id === id ? { ...e, entityName: newName } : e,
      ),
    }));
  };

  const getEntity = (id: string, expected: boolean) => {
    return expected
      ? test.expectedConfiguration.find((e) => e.id === id)
      : test.initialConfiguration.find((e) => e.id === id);
  };

  const addEntity = () => {
    const newId = crypto.randomUUID();
    const newName = "Entity";

    // Same entity reference in both configs
    const newEntity: EntityConfiguration = {
      id: newId,
      entityName: newName,
      components: [],
    };

    updateUnitTest((prevTest) => ({
      initialConfiguration: [...prevTest.initialConfiguration, newEntity],
      expectedConfiguration: [...prevTest.expectedConfiguration, newEntity],
    }));

    handleOnOperatorChanged(OperatorType.Eq, newId);
  };

  const removeEntity = (id: string) => {
    updateUnitTest((prev) => ({
      initialConfiguration: prev.initialConfiguration.filter(
        (e) => e.id !== id,
      ),
      expectedConfiguration: prev.expectedConfiguration.filter(
        (e) => e.id !== id,
      ),
    }));
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

  const addComponentToWorld = (
    world: WorldConfiguration,
    entityId: string,
    comp: Component,
  ) => {
    return world.map((e) =>
      e.id == entityId ? { ...e, components: [...e.components, comp] } : e,
    )!;
  };

  const cloneComponent = (component: Component): Component => {
    return { ...component, fields: structuredClone(component.fields) };
  };

  const addComponent = (entityId: string, componentId: string) => {
    console.log("addComponent: ", entityId, componentId);
    const comp = getAvailableComponent(componentId);

    const initial = addComponentToWorld(test.initialConfiguration, entityId, {
      ...comp,
      fields: structuredClone(comp.fields),
    });
    const expected = addComponentToWorld(
      test.expectedConfiguration,
      entityId,
      cloneComponent(comp),
    );

    updateUnitTest({
      initialConfiguration: initial,
      expectedConfiguration: expected,
    });
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

  const handleOnOperatorChanged = (
    type: OperatorType | null,
    fullPath: string,
  ) => {
    console.log("Add operator: ", type, fullPath);

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
      console.log("newOperators: ", newOperators);

      return { operators: newOperators };
    });
  };

  const isOperatorEnabled = (path: string): boolean => {
    return operators.find((op) => op.path == path) !== undefined;
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
    changeEntityName,
    addComponent,
    getEntity,
    replaceComponent,
    updateTestProperties,
    updateUnitTest,
    onOperatorChanged: handleOnOperatorChanged,
    isOperatorEnabled,
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
