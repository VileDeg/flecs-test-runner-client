
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */

// Core types
export interface SystemInvocation {
  name: string;
  timesToRun: number;
}

export interface UnitTest {
  name: string;
  systems: SystemInvocation[];
  scriptActual: string;
  scriptExpected: string;
}

export namespace UnitTest {
  export interface Executed {
    statusMessage: string;
  }
  export interface Passed {}
  export interface Incomplete {
    worldExpectedSerialized: string;
  }

}

// General types
export class Module {
  fullPath: string;

  constructor(fullPath: string) {
    this.fullPath = fullPath;
  }

  getName(): string {
    return this.fullPath.split('.').pop() ?? '';
  }
}

export interface System {
  name: string;
  module: Module;
}

// name : field
export type ComponentFields = Record<string, ComponentField> // = ComponentField[];
export type ComponentBody = ComponentFields;


export type ComponentFieldValue = string | ComponentFields;




export interface ComponentField {
  

  //name: string;
  type: string;
  value: ComponentFieldValue;
}

export interface ComponentHeader {
  name: string;
  module: Module;
}

//export type ComponentsRegistry = Record<string, Component>;

export type ComponentsRegistry = Component[];

export interface Component extends ComponentHeader {
  fields: ComponentFields;
}

export interface EntityConfiguration {
  entity: string;
  // name: component
  components: ComponentsRegistry; // : ComponentsRegistry;
}

export type WorldConfiguration = EntityConfiguration[];

// Metadata service

export type PrimitiveType = boolean | string | number;

// Builder types

export interface TestProperties {
  name: string;
  systems: SystemInvocation[];
  initialConfiguration: WorldConfiguration;
  expectedConfiguration: WorldConfiguration;
}


// Types retrieved from Flecs query

export interface QueriedEntityFields {
  values: unknown[];
}

export interface QueriedEntity {
  name: string;
  parent: string;
  fields: QueriedEntityFields,
  components: {
    [K in keyof MetaComponentRegistry]?: MetaComponentRegistry[K];
  };
}

export interface MetaMember {
  type: string;
}

export interface MetaComponentRegistry {
  "flecs.meta.member": MetaMember;
}

export interface QueryResponse {
  results: QueriedEntity[];
}

