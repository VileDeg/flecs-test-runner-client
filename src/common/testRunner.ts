// Common test execution module for script-based test format
import { UNIT_TEST_COMPONENT_NAME } from "./constants";

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

export interface ComponentData {
  name: string;
  module: string; // Module path for the component (e.g., "modules.movement")
  [key: string]: any; // Component field values
}

export interface EntityData {
  entity: string;
  components: ComponentData[];
}

export interface TestExecutionResult {
  success: boolean;
  message: string;
  testName: string;
}

export class TestRunner {
  private connection: any;
  
  constructor(connection: any) {
    this.connection = connection;
  }

  /**
   * Execute a test
   */
  async executeTest(test: UnitTest): Promise<TestExecutionResult> {
    try {
      const testName = test.name;
      
      // Create the entity for this test
      await this.connection?.create(testName);
      
      // Set the test component
      await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, test);
      
      return {
        success: true,
        message: `Test "${testName}" created and is now running!`,
        testName
      };
    } catch (error: any) {
      console.error("Error executing test:", error);
      return {
        success: false,
        message: `Error executing test "${test.name}": ${error.message}`,
        testName: test.name
      };
    }
  }

  /**
   * Execute multiple tests
   */
  async executeTests(tests: UnitTest[]): Promise<TestExecutionResult[]> {
    const results: TestExecutionResult[] = [];
    
    for (const test of tests) {
      const result = await this.executeTest(test);
      results.push(result);
      
      // Small delay between tests to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Create a UnitTest from entity data arrays
   */
  static createTest(
    name: string,
    systems: SystemInvocation[],
    initialEntities: EntityData[],
    expectedEntities: EntityData[]
  ): UnitTest {
    return {
      name,
      systems,
      scriptActual: TestRunner.convertEntitiesToScript(initialEntities),
      scriptExpected: TestRunner.convertEntitiesToScript(expectedEntities)
    };
  }

  /**
   * Convert entity data array to Flecs DSL script format
   */
  static convertEntitiesToScript(entities: EntityData[]): string {
    if (entities.length === 0) return "";

    let script = "";
    const modules = new Set<string>();

    // Collect modules from components
    entities.forEach(entity => {
      entity.components.forEach(component => {
        if (component.module) {
          modules.add(component.module);
        }
      });
    });

    // Add using statements
    modules.forEach(module => {
      script += `using ${module}\n`;
    });

    if (modules.size > 0) {
      script += "\n";
    }

    // Add entities
    entities.forEach(entity => {
      script += `${entity.entity} {\n`;
      entity.components.forEach(component => {
        const componentName = component.name;
        
        // Extract component field values (exclude 'name' and 'module' fields)
        const fields = Object.entries(component).filter(([key]) => key !== 'name' && key !== 'module');
        
        if (fields.length > 0) {
          const fieldsStr = fields
            .map(([key, value]) => `${key}: ${TestRunner.formatValue(value)}`)
            .join(', ');
          script += `    ${componentName}: {${fieldsStr}}\n`;
        } else {
          script += `    ${componentName}\n`;
        }
      });
      script += "}\n";
    });

    return script.trim();
  }

  /**
   * Format a value for Flecs DSL script
   */
  private static formatValue(value: any): string {
    if (typeof value === 'string') {
      // If it's already a formatted string (like "hello"), keep it as-is
      // Otherwise, wrap in quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        return value;
      }
      return `"${value}"`;
    }
    return String(value);
  }

  /**
   * Validate test format and structure
   */
  static validateTest(test: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!test) {
      errors.push("Test is null or undefined");
      return { valid: false, errors };
    }

    if (!test.name || typeof test.name !== 'string') {
      errors.push("Test name is required and must be a string");
    }

    if (!test.systems || !Array.isArray(test.systems)) {
      errors.push("Test systems are required and must be an array");
    } else {
      test.systems.forEach((system: any, index: number) => {
        if (!system.name || typeof system.name !== 'string') {
          errors.push(`System ${index}: name is required and must be a string`);
        }
        if (typeof system.timesToRun !== 'number' || system.timesToRun < 1) {
          errors.push(`System ${index}: timesToRun must be a positive number`);
        }
      });
    }

    if (typeof test.scriptActual !== 'string') {
      errors.push("scriptActual must be a string");
    }
    if (typeof test.scriptExpected !== 'string') {
      errors.push("scriptExpected must be a string");
    }

    return { valid: errors.length === 0, errors };
  }
}