// Common test execution module for script-based test format
import { 
  UNIT_TEST_COMPONENT_NAME, 
  UNIT_TEST_READY_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME,
  UNIT_TEST_EXECUTED_TAG_NAME
} from "./constants";

import type * as Core from "./coreTypes.ts";

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
  async executeTest(test: Core.UnitTest): Promise<TestExecutionResult> {
    try {
      const testName = test.name;
      
      // Create the entity for this test
      await this.connection?.create(testName);
      
      // Set the test component
      await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, test);
      await this.connection?.add(testName, UNIT_TEST_READY_TAG_NAME);
      
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
  async executeTests(tests: Core.UnitTest[]): Promise<TestExecutionResult[]> {
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
    systems: Core.SystemInvocation[],
    initialEntities: Core.EntityData[],
    expectedEntities: Core.EntityData[]
  ): Core.UnitTest {
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
  static convertEntitiesToScript(entities: Core.EntityData[]): string {
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

  /**
   * Execute an incomplete test to generate expected state
   * This creates a test with the Incomplete tag and empty expected config
   */
  async executeIncompleteTest(
    name: string,
    systems: Core.SystemInvocation[],
    initialEntities: Core.EntityData[]
  ): Promise<TestExecutionResult> {
    try {
      const testName = name;
      
      // Create test with empty expected config
      const incompleteTest: Core.UnitTest = {
        name: testName,
        systems,
        scriptActual: TestRunner.convertEntitiesToScript(initialEntities),
        scriptExpected: "" // Empty expected for incomplete test
      };
      
      // Create the entity for this test
      await this.connection?.create(testName);
      
      // Set the test component
      await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, incompleteTest);
      
      // Add Incomplete tag to signal this is for expected state generation
      await this.connection?.add(testName, UNIT_TEST_INCOMPLETE_TAG_NAME);
      
      // Add Ready tag to start execution
      await this.connection?.add(testName, UNIT_TEST_READY_TAG_NAME);
      
      return {
        success: true,
        message: `Incomplete test "${testName}" created for expected state generation`,
        testName
      };
    } catch (error: any) {
      console.error("Error executing incomplete test:", error);
      return {
        success: false,
        message: `Error executing incomplete test "${name}": ${error.message}`,
        testName: name
      };
    }
  }

  /**
   * Poll for incomplete test results with Executed tag
   * Returns the worldExpectedSerialized from the Executed component
   */
  async pollForIncompleteTestResult(
    testName: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 500
  ): Promise<{ success: boolean; worldSerialized?: string; error?: string }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Query for this specific test with Incomplete and Executed tags
        const query = await this.connection?.query(
          `${UNIT_TEST_EXECUTED_TAG_NAME}, ${UNIT_TEST_INCOMPLETE_TAG_NAME}`,
          {}
        );

        console.log("pollForIncompleteTestResult for test name ", testName, " returned: ", query);
        
        if (query?.results) {
          // Find our test in the results
          for (const result of query.results) {
            const values = result.fields?.values;
            if (result.name === testName && values) {
              // Look for the Executed component with worldExpectedSerialized
              //const executedComponent = values[0];
              const incompleteComponent: Core.UnitTest.Incomplete = values[1];
              
              // .find(
              //   (v: any) => v && v[1] === UNIT_TEST_EXECUTED_TAG_NAME
              // );
              
              if (incompleteComponent && incompleteComponent?.worldExpectedSerialized) {
                return {
                  success: true,
                  worldSerialized: incompleteComponent.worldExpectedSerialized
                };
              }
            }
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } catch (error: any) {
        console.error("Error polling for incomplete test result:", error);
        return {
          success: false,
          error: `Error polling: ${error.message}`
        };
      }
    }
    
    return {
      success: false,
      error: `Timeout: Test did not complete within ${timeoutMs}ms`
    };
  }

    /**
   * Extract module name from entity path (e.g., "modules.movement.Position" -> "modules.movement")
   */
  private static splitNameModule(entityPath: string): { name: string, module: string | undefined } {
    const parts = entityPath.split('.');
    if (parts.length > 1) {
      return { name: parts.slice(-1)[0], module: parts.slice(0, -1).join('.')};
    }
    
    return { name: "", module: undefined };
  }

  /**
   * Parse serialized world JSON into EntityData array
   * The serialized world format should contain entities with their components
   */
  static parseWorldSerialized(worldJson: string): Core.EntityData[] {
    try {
      console.log("parseWorldSerialized, json: ", worldJson);
      const world = JSON.parse(worldJson);
      const entities: Core.EntityData[] = [];
      
      // Assuming the serialized format has an entities array
      // Adjust this parsing logic based on your actual serialized format
      if (world.results && Array.isArray(world.results)) {
        for (const entity of world.results) {
          const entityData: Core.EntityData = {
            entity: entity.name || entity.id || "",
            components: []
          };

          console.log("components: ", entity.components);
          
          if (entity.components) {

            for (const [key, value] of Object.entries(entity.components)) {
              const componentFullPath = key;
              console.log("component path: ", componentFullPath);
              const componentValues = value;
              const {name, module} = this.splitNameModule(componentFullPath);
              const componentData: Core.ComponentData = {
                name: name,  //comp.type || comp.name || "",
                module: module || ""
              };
              
              // Add component field values
              if (componentValues) {
                Object.entries(componentValues).forEach(([key, value]) => {
                  componentData[key] = value;
                });
              }
              
              entityData.components.push(componentData);
            }
          }
          
          entities.push(entityData);
        }
      }

      console.log("PARSED, entities: ", entities);
      
      return entities;
    } catch (error: any) {
      console.error("Error parsing world serialized JSON:", error);
      return [];
    }
  }
}