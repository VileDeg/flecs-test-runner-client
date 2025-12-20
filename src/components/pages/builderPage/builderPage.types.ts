import type { SystemInvocation, EntityData, ComponentData } from "@common/testRunner.ts";
import type { FlecsSystem, FlecsComponent, FlecsModule } from "@common/flecsMetadataService.ts";

export interface TestBuilderPersistedState {
  testName: string;
  systems: SystemInvocation[];
  initialEntities: EntityData[];
  expectedEntities: EntityData[];
  selectedModules: string[];
}

export interface TestBuilderProps {
  onTestCreated?: () => void;
  persistedState?: TestBuilderPersistedState;
  onStateChange?: (state: TestBuilderPersistedState) => void;
}

export interface SystemsListProps {
  systems: SystemInvocation[];
  availableSystems: FlecsSystem[];
  onUpdate: (index: number, field: keyof SystemInvocation, value: string | number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export interface EntityBuilderProps {
  entities: EntityData[];
  availableComponents: FlecsComponent[];
  isInitial: boolean;
  onUpdateEntityName: (index: number, name: string) => void;
  onRemoveEntity: (index: number) => void;
  onAddEntity: () => void;
  onUpdateComponent: (entityIndex: number, componentIndex: number, field: string, value: any) => void;
  onRemoveComponent: (entityIndex: number, componentIndex: number) => void;
  onAddComponent: (entityIndex: number) => void;
}

export interface ComponentFieldsProps {
  component: ComponentData;
  componentSchema: FlecsComponent;
  entityIndex: number;
  componentIndex: number;
  onUpdate: (entityIndex: number, componentIndex: number, field: string, value: any) => void;
}

// Re-export common types for convenience
export type { SystemInvocation, EntityData, ComponentData, FlecsSystem, FlecsComponent, FlecsModule };
