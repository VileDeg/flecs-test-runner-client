// Common test execution module for script-based test format
import { 
  UNIT_TEST_COMPONENT_NAME, 
  UNIT_TEST_READY_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME,
  UNIT_TEST_EXECUTED_TAG_NAME
} from "./constants";

import type { 
  UnitTest,
  Component,
  Operator,
  System,

  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFieldsArray,
  //ComponentFieldsArrayOfComponents,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  Components,
  SystemInvocation,
  QueryResponse,
  QueriedEntityFields,
  QueryResponseElement,
  
} from "@/common/types";

import {
  isComponentFieldValuePrimitive,
  isComponentFieldValueDict,
  isComponentFieldValueArray,
  iterateComponentFieldDict
} from "@/common/types";

import * as Core from "@/common/coreTypes";

import { FlecsAsync, flecsError, flecsErrorMessage } from "@/common/flecsAsync"

import { FlecsConnectionContext, type FlecsConnectionState } from "@/contexts/flecsConnectionContext";

import { 
  Module
} from "@/common/types";
import { compile } from "tailwindcss";



// export interface TestExecutionResult {
//   success: boolean;
//   message: string;
// }

export interface IncompleteTestPollingResult {
  incomplete: UnitTest.Incomplete;
  executed: UnitTest.Executed;
  passed?: UnitTest.Passed;
}

export class TestRunner {
  private connection: FlecsAsync;
  
  constructor(connection: FlecsAsync) {
    this.connection = connection;
  }

  async queryTestEntities(): Promise<QueryResponse> {
    try {
      // Query all entities with UnitTest component
      return await this.connection.query(
        UNIT_TEST_COMPONENT_NAME, {}
      );
    } catch (error: any) {
      throw Error(`Error queries test entities: ${error}`)
    }
  }

  async findTestEntity(testName: string): Promise<QueriedEntity | undefined> {
    try {
      // Query all entities with UnitTest component
      const allTestsQuery = await this.queryTestEntities()

      return allTestsQuery.results.find(queriedEntity => 
        (queriedEntity as QueriedEntity).name === testName
      ) as (QueriedEntity | undefined)
    } catch (error: any) {
      throw flecsError(error, `Error query test entities for "${testName}"`)
    }
  }

  async deleteTestEntity(testName: string): Promise<boolean> {
    try {
      const testEntity = await this.findTestEntity(testName);
      if(!testEntity) {
        return false;
      }

      //console.log("testEntity: ", testEntity)
      // const allTestsQuery = await this.connection.query(
      //   UNIT_TEST_COMPONENT_NAME, {}
      // );
      await this.connection.delete(testEntity.name)
      return true;
    } catch (error: any) {
      throw flecsError(error, `Error deleting test entity "${testName}"`)
    }
  }

  async deleteTestEntities() {
    const allTestsQuery = await this.queryTestEntities()

    const deletePromises = allTestsQuery.results.map((entity) => 
      this.connection.delete((entity as QueriedEntity).name)
    );
    
    await Promise.all(deletePromises);
  }

  /**
   * Execute a test
   */
  async executeTest(test: Core.UnitTest, clearLastResult: boolean, incomplete: boolean = false): Promise<void> {
    try {
      const testName = test.name;
      if(clearLastResult) {
        await this.deleteTestEntity(testName)
      }
      
      // Create the entity for this test
      await this.connection?.create(testName);
      
      // Set the test component
      await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, test);

      if(incomplete) {
        // Add Incomplete tag to signal this is for expected state generation
        await this.connection?.add(testName, UNIT_TEST_INCOMPLETE_TAG_NAME);
      }

      await this.connection?.add(testName, UNIT_TEST_READY_TAG_NAME);
      
      // return {
      //   success: true,
      //   message: `Test "${testName}" created and is now running!`,
      // };
    } catch (error: any) {
      throw flecsError(error, `Error executing test "${test.name}"`)
    }
  }

  /**
   * Execute multiple tests
   */
  // async executeTests(tests: Core.UnitTest[]): Promise<TestExecutionResult[]> {
  //   const results: TestExecutionResult[] = [];
    
  //   for (const test of tests) {
  //     const result = await this.executeTest(test);
  //     results.push(result);
      
  //     // Small delay between tests to avoid overwhelming the system
  //     await new Promise(resolve => setTimeout(resolve, 100));
  //   }
    
  //   return results;
  // }


  /**
   * Maps ComponentField[] to Core.ComponentFields recursively
   */
  // static mapFieldsEntityToCore(fields: ComponentFields): Core.ComponentFields {
  //   const result: Core.ComponentFields = {};

  //   for (const [key, field] of Object.entries(fields)) {
  //     // Don't care about other attributes
  //     const value = field.value;

  //     if (isComponentFieldValuePrimitive(value)) {
  //       result[key] = value;
  //     } else if (Array.isArray(value)) {
  //       console.log("Field value is array: ", value);
  //       const arrayValue: Core.ComponentFieldsArray = [];
  //       value.forEach((element) => {
  //         arrayValue.push(TestRunner.mapFieldsEntityToCore(element))
  //       })
  //       console.log("Field value is array (after parsing): ", arrayValue);
  //       result[key] = arrayValue;
  //     } else {
  //       // Recursively handle nested ComponentFields
  //       result[key] = TestRunner.mapFieldsEntityToCore(value);
  //     }
  //   }

  //   return result;
  // }

  static getComponentByPath(fullPath: string, knownComponents: Components): Component {
    const parts = fullPath.split('.');
    const name = parts.pop();
    const module = parts.join('.');

    console.log("getComponentByPath knownComponents: ", knownComponents);

    const component = knownComponents.find((comp) => comp.name == name && comp.module.fullPath == module);
    if(!component) {
      throw Error("Unknown component: " + fullPath);
    }
    return component;
  }

  static mapFieldCoreToEntity(
    destination: ComponentField,
    value: Core.ComponentFieldValue 
  ) {
    console.log("mapFieldsCoreToEntity, typeof value: ", typeof value)
    if (Core.isComponentFieldValuePrimitive(value)) {
      console.log("Assign primitive value (key, value): ", name, value);
      // Primitive type
      destination.value = String(value);
    } else if (Array.isArray(value)) {
      console.log("mapFieldsCoreToEntity value is array: ", value);
      const schema = destination.schema;
      if(!schema) {
        throw Error("Schema is missing on :" + destination) // TODO:
      }
      console.log("\tschema: ", schema);
      // TODO: assert dest value is array 
      const arrayValue: ComponentFieldsArray = [];
      value.forEach((element) => {
        const destinationElement = structuredClone(schema!);
        this.mapFieldCoreToEntity(destinationElement, element)
        arrayValue.push(destinationElement)
      })
      destination.value = arrayValue;
      console.log("\tparsed into: ", arrayValue);
    } else {
      //let destinationValue = destination.value;
      if (!isComponentFieldValueDict(destination.value)) {
        throw Error("Expected a dict value type in destination. \
          Received component structure does not match expected one");
      }
      this.mapFieldsCoreToEntity(destination.value, value); 
    }
  
  }

  // Need to pass destination as parameter because we take it as reference, 
  // because we need to preserve type info of the component
  static mapFieldsCoreToEntity(
    destination: ComponentFields,
    fields: Core.ComponentFields 
  ) {
    for (const [name, value] of Object.entries(fields)) {
      if (!destination[name]) {
        throw Error("Entry does not exist for key: " + name);
      }
      this.mapFieldCoreToEntity(destination[name], value)
    }
  }

  /**
   * Converts the General EntityConfiguration (Array-based) 
   * to Core Entity (Map-based)
   */
  // static convertWorldToCore(
  //   generalWorld: WorldConfiguration
  // ): Core.WorldConfiguration {
  //   return generalWorld.map((entityConf) => {
  //     const coreComponents: Core.ComponentFields = {};

  //     entityConf.components.forEach((comp) => {
  //       // Use the full path (module + name) as the key to match Flecs expectations
  //       const componentPath = `${comp.module.fullPath}.${comp.name}`;
  //       coreComponents[componentPath] = TestRunner.mapFields(comp.fields);
  //     });

  //     return {
  //       name: entityConf.entity,
  //       components: coreComponents,
  //     };
  //   });
  // }

  static convertEntityToCoreFnCallback(
    _: string, field: ComponentField, __: string
  ): Core.ComponentFieldValue {
    // Must be called only on leaf so will be primtiive
    return field.value as Core.ComponentFieldValuePrimitive;
  }

  static convertEntityToCore(
    entityConf: EntityConfiguration
  ): Core.Entity {
    const coreComponents: Core.Components = {};

    entityConf.components.forEach((comp) => {
      // Use the full path (module + name) as the key to match Flecs expectations
      const componentPath = `${comp.module.fullPath}.${comp.name}`;
      coreComponents[componentPath] = 
        iterateComponentFieldDict<Core.ComponentFieldValuePrimitive>(
          comp.fields, 
          componentPath, 
          TestRunner.convertEntityToCoreFnCallback
        )
        //TestRunner.mapFieldsEntityToCore(comp.fields);
    });

    return {
      name: entityConf.entityName,
      components: coreComponents,
    };
  }

  static convertCoreToEntity(
    entityCore: Core.Entity,
    knownComponents: Components
  ): EntityConfiguration {
    const components: Components = [];

    for (const [fullPath, fields] of Object.entries(entityCore.components)) {
      const component = structuredClone(
        this.getComponentByPath(fullPath, knownComponents)
      );
      console.log("Retrieved component for path: ", fullPath, component);
      TestRunner.mapFieldsCoreToEntity(component.fields, fields);
      components.push(component);
    }
   
    return {
      id: crypto.randomUUID(),
      entityName: entityCore.name,
      components,
    };
  }

  static convertEntitiesToCoreString(
    world: WorldConfiguration
  ): Core.SerializedEntities {
    return world.map((coreEntity) => JSON.stringify(this.convertEntityToCore(coreEntity)));
  }

  // static convertEntitiesToString(
  //   generalWorld: WorldConfiguration
  // ): Core.SerializedEntities {
  //   return world.map((generalWorld) => (JSON.stringify(coreEntity)));
  // }

  static convertOperatorToCore(oper: Operator): Core.Operator {
    return {path: {path: oper.path }, type: oper.type}
  }

  /**
   * Create a UnitTest from entity data arrays
   */
  static convertTestToCore(
    test: UnitTest
  ): Core.UnitTest {
    return {
      name: test.name,
      systems: test.systems,
      initialConfiguration: TestRunner.convertEntitiesToCoreString(test.initialConfiguration),
      expectedConfiguration: TestRunner.convertEntitiesToCoreString(test.expectedConfiguration),
      operators: test.operators.map(op => TestRunner.convertOperatorToCore(op))
    };
  }


  /**
   * Convert entity data array to Flecs DSL script format
   */
  // static convertEntitiesToScript(entities: EntityConfiguration[]): string {
  //   if (entities.length === 0) return "";

  //   let script = "";
  //   const modules = new Set<string>();

  //   // Collect modules from components
  //   entities.forEach(entity => {
  //     entity.components.forEach(component => {
  //       if (component.module) {
  //         modules.add(component.module.fullPath);
  //       }
  //     });
  //   });

  //   // Add using statements
  //   modules.forEach(module => {
  //     script += `using ${module}\n`;
  //   });

  //   if (modules.size > 0) {
  //     script += "\n";
  //   }

  //   // Add entities
  //   entities.forEach(entity => {
  //     script += `${entity.entity} {\n`;
  //     entity.components.forEach(component => {
  //       const componentName = component.name;
        
  //       // Extract component field values (exclude 'name' and 'module' fields)
  //       const fields = Object.entries(component).filter(([key]) => key !== 'name' && key !== 'module');
        
  //       if (fields.length > 0) {
  //         const fieldsStr = fields
  //           .map(([key, value]) => `${key}: ${TestRunner.formatValue(value)}`)
  //           .join(', ');
  //         script += `    ${componentName}: {${fieldsStr}}\n`;
  //       } else {
  //         script += `    ${componentName}\n`;
  //       }
  //     });
  //     script += "}\n";
  //   });

  //   return script.trim();
  // }

  /**
   * Format a value for Flecs DSL script
   */
  // private static formatValue(value: any): string {
  //   if (typeof value === 'string') {
  //     // If it's already a formatted string (like "hello"), keep it as-is
  //     // Otherwise, wrap in quotes
  //     if (value.startsWith('"') && value.endsWith('"')) {
  //       return value;
  //     }
  //     return `"${value}"`;
  //   }
  //   return String(value);
  // }

  /**
   * Validate test format and structure
   */
  // static validateTest(test: any): { valid: boolean; errors: string[] } {
  //   const errors: string[] = [];

  //   if (!test) {
  //     errors.push("Test is null or undefined");
  //     return { valid: false, errors };
  //   }

  //   if (!test.name || typeof test.name !== 'string') {
  //     errors.push("Test name is required and must be a string");
  //   }

  //   if (!test.systems || !Array.isArray(test.systems)) {
  //     errors.push("Test systems are required and must be an array");
  //   } else {
  //     test.systems.forEach((system: any, index: number) => {
  //       if (!system.name || typeof system.name !== 'string') {
  //         errors.push(`System ${index}: name is required and must be a string`);
  //       }
  //       if (typeof system.timesToRun !== 'number' || system.timesToRun < 1) {
  //         errors.push(`System ${index}: timesToRun must be a positive number`);
  //       }
  //     });
  //   }

  //   if (typeof test.scriptActual !== 'string') {
  //     errors.push("scriptActual must be a string");
  //   }
  //   if (typeof test.scriptExpected !== 'string') {
  //     errors.push("scriptExpected must be a string");
  //   }

  //   return { valid: errors.length === 0, errors };
  // }


  /**
   * Execute an incomplete test to generate expected state
   * This creates a test with the Incomplete tag and empty expected config
   */
  // async executeIncompleteTest(
  //   name: string,
  //   systems: SystemInvocation[],
  //   initialEntities: EntityConfiguration[],
  //   clearLastResult: boolean = true
  // ): Promise<void> {
  //   try {
  //     console.log("TestRunner: converting world before: ", initialEntities);

  //     if(clearLastResult) {
  //       await this.deleteTestEntity(name)
  //     }

  //     // Create test with empty expected config
  //     const incompleteTest: Core.UnitTest = {
  //       name,
  //       systems,
  //       initialConfiguration: TestRunner.convertEntitiesToCoreString(initialEntities),
  //       expectedConfiguration: [], 
  //       operators: []
  //     };

  //     console.log("TestRunner: converting world after: ", incompleteTest.initialConfiguration);
      
  //     // Create the entity for this test
  //     await this.connection?.create(name);
      
  //     // Set the test component
  //     await this.connection?.set(name, UNIT_TEST_COMPONENT_NAME, incompleteTest);
      
  //     // Add Incomplete tag to signal this is for expected state generation
  //     await this.connection?.add(name, UNIT_TEST_INCOMPLETE_TAG_NAME);
      
  //     // Add Ready tag to start execution
  //     await this.connection?.add(name, UNIT_TEST_READY_TAG_NAME);
      
  //     // return {
  //     //   success: true,
  //     //   message: `Incomplete test "${testName}" created for expected state generation`,
  //     //   testName
  //     // };
  //   } catch (error: any) {
  //     throw flecsError(error, `Error executing incomplete test "${name}"`)
  //   }
  // }

  

  /**
   * Poll for incomplete test results with Executed tag
   * Returns the worldExpectedSerialized from the Executed component
   */
  async pollForIncompleteTestResult(
    testName: string,
    timeoutMs: number = 30000,
    pollIntervalMs: number = 500
  ): Promise<IncompleteTestPollingResult | { error: string }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Query for this specific test with Incomplete and Executed tags
        const query = await this.connection?.query(
          `${UNIT_TEST_EXECUTED_TAG_NAME}, ${UNIT_TEST_INCOMPLETE_TAG_NAME}, ?${UNIT_TEST_INCOMPLETE_TAG_NAME}`, // TODO
          {}
        );

        console.log("pollForIncompleteTestResult for test name ", testName, " returned: ", query);
        
        for (const queryResult of query.results) {
          const result = queryResult as QueriedEntity;
          const values = result.fields.values;
          if (result.name === testName) {
            const [executed, incomplete, passed] = 
              values as [UnitTest.Executed, UnitTest.Incomplete, UnitTest.Passed?];
            
            console.log("found name, ic: ", incomplete);
            
            if (executed && incomplete) { //  && incompleteComponent?.worldExpectedSerialized
              console.log("polling success")
              return {
                incomplete,
                executed,
                passed
              };
            }
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } catch (error: any) {
        const msg = flecsErrorMessage(error);
        console.error(msg);
        return {
          error: msg
        };
      }
    }
    
    return {
      error: `Timeout: Test did not complete within ${timeoutMs}ms`
    };
  }

    /**
   * Extract module name from entity path (e.g., "modules.movement.Position" -> "modules.movement")
   */
  private static splitNameModule(entityPath: string): { name: string, module: string } {
    const parts = entityPath.split('.');
    if (parts.length > 1) {
      return { name: parts.slice(-1)[0], module: parts.slice(0, -1).join('.')};
    }
    
    return { name: "", module: "" };
  }

  /**
   * Parse serialized world JSON into EntityData array
   * The serialized world format should contain entities with their components
   */
  static parseWorldSerialized(worldJson: string, knownComponents: Components): WorldConfiguration {
    try {
      console.log("parseWorldSerialized, json: ", worldJson);
      const world: Core.SerializedWorld = JSON.parse(worldJson);
      if (!world.results) {
        throw Error("Missing results property on serialized world");
      }

      const entities = world.results.map((entityCore) => this.convertCoreToEntity(entityCore, knownComponents))
      
      console.log("PARSED, entities: ", entities);
      
      return entities;
    } catch (error: any) {
      console.error("Error parsing world serialized JSON:", error);
      return [];
    }
  }
}