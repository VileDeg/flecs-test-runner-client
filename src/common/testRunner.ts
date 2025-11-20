// Common test execution module for both script-based and hierarchical test formats
import { type UnitTest } from "../components/uploader/uploader";
import { UNIT_TEST_COMPONENT_NAME } from "./constants";

export interface ComponentData {
  name: string;
  [key: string]: any; // Component field values
}

export interface EntityData {
  entity: string;
  components: ComponentData[];
}

export interface HierarchicalTest {
  name: string;
  systems: { name: string; timesToRun: number }[];
  initial: EntityData[];
  expected: EntityData[];
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
   * Execute a test - supports both script-based and hierarchical formats
   */
  async executeTest(test: UnitTest | HierarchicalTest): Promise<TestExecutionResult> {
    try {
      const testName = test.name;
      
      // Create the entity for this test
      await this.connection?.create(testName);
      
      // Convert to standard format and set the test component
      const standardTest = this.convertToStandardFormat(test);
      await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, standardTest);
      
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
  async executeTests(tests: (UnitTest | HierarchicalTest)[]): Promise<TestExecutionResult[]> {
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
   * Convert hierarchical test format to script-based format for backward compatibility
   */
  private convertToStandardFormat(test: UnitTest | HierarchicalTest): UnitTest {
    // If it's already a script-based test, return as-is
    if ('scriptActual' in test) {
      return test as UnitTest;
    }
    
    // Convert hierarchical test to script-based format
    const hierarchicalTest = test as HierarchicalTest;
    
    return {
      name: hierarchicalTest.name,
      systems: hierarchicalTest.systems,
      scriptActual: this.convertEntitiesToScript(hierarchicalTest.initial),
      scriptExpected: this.convertEntitiesToScript(hierarchicalTest.expected)
    };
  }

  /**
   * Convert entity data array to Flecs DSL script format
   */
  private convertEntitiesToScript(entities: EntityData[]): string {
    if (entities.length === 0) return "";

    let script = "";
    const modules = new Set<string>();

    // Collect modules from component names
    entities.forEach(entity => {
      entity.components.forEach(component => {
        if (component.name.includes('.')) {
          const moduleParts = component.name.split('.');
          if (moduleParts.length > 1) {
            modules.add(moduleParts.slice(0, -1).join('.'));
          }
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
        const componentName = component.name.split('.').pop() || component.name;
        
        // Extract component field values (exclude the 'name' field)
        const fields = Object.entries(component).filter(([key]) => key !== 'name');
        
        if (fields.length > 0) {
          const fieldsStr = fields
            .map(([key, value]) => `${key}: ${this.formatValue(value)}`)
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
  private formatValue(value: any): string {
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
   * Check if a test uses the hierarchical format
   */
  static isHierarchicalTest(test: any): test is HierarchicalTest {
    return test && 'initial' in test && 'expected' in test && !('scriptActual' in test);
  }

  /**
   * Check if a test uses the script-based format
   */
  static isScriptBasedTest(test: any): test is UnitTest {
    return test && 'scriptActual' in test && 'scriptExpected' in test;
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

    // Check format-specific requirements
    if (TestRunner.isHierarchicalTest(test)) {
      if (!Array.isArray(test.initial)) {
        errors.push("Hierarchical test: initial configuration must be an array");
      }
      if (!Array.isArray(test.expected)) {
        errors.push("Hierarchical test: expected configuration must be an array");
      }
    } else if (TestRunner.isScriptBasedTest(test)) {
      if (typeof test.scriptActual !== 'string') {
        errors.push("Script-based test: scriptActual must be a string");
      }
      if (typeof test.scriptExpected !== 'string') {
        errors.push("Script-based test: scriptExpected must be a string");
      }
    } else {
      errors.push("Test must be either hierarchical (with initial/expected) or script-based (with scriptActual/scriptExpected)");
    }

    return { valid: errors.length === 0, errors };
  }
}