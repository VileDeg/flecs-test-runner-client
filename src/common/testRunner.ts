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
  QueriedEntity,
  ComponentField,
  ComponentFieldsArray,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  Components,
  QueryResponse,
  
} from "@/common/types";

import {
  isComponentFieldValueDict,
  iterateComponentFieldDict
} from "@/common/types";

import * as Core from "@/common/coreTypes";

import { FlecsAsync, flecsError, flecsErrorMessage } from "@/common/flecsAsync"

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
      
    } catch (error: any) {
      throw flecsError(error, `Error executing test "${test.name}"`)
    }
  }

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
            
            if (executed && incomplete) {
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