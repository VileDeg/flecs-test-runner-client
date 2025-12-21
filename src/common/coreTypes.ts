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
}

export interface ComponentData {
  name: string;
  module: string; // Module path for the component (e.g., "modules.movement")
  [key: string]: any; // Component field values
}

export interface EntityData {
  entity: string;
  components: ComponentData[];
}


