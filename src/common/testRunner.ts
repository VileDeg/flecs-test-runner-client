import {
  UNIT_TEST_COMPONENT_NAME,
  UNIT_TEST_READY_TAG_NAME,
  UNIT_TEST_INCOMPLETE_TAG_NAME,
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
  iterateComponentFieldDict,
} from "@/common/types";

import * as Core from "@/common/coreTypes";

import { FlecsAsync, flecsError, flecsErrorMessage } from "@/common/flecsAsync";
import { FlecsMetadataService } from "./flecsMetadataService";

/**
 * Class responsible for test execution.
 * Calls Flecs REST API endpoints.
 * Serializes the Client data, deserializes retrieved Core data.
 */
export class TestRunner {
  private connection: FlecsAsync;

  constructor(connection: FlecsAsync) {
    this.connection = connection;
  }

  /**
   * Execute a single test.
   * @param test Unit test definition.
   * @param incomplete Whether the test is "incomplete". Used to generate the "expected" configuration.
   */
  async executeTest(
    test: Core.UnitTest,
    incomplete: boolean = false,
  ): Promise<void> {
    const testName = test.name;
    try {
      try {
        // Create the entity for this test
        await this.connection?.create(testName);

        // Set the test component
        await this.connection?.set(testName, UNIT_TEST_COMPONENT_NAME, test);

        if (incomplete) {
          // Add Incomplete tag to signal this is for expected state generation
          await this.connection?.add(testName, UNIT_TEST_INCOMPLETE_TAG_NAME);
        }
        // Add ready tag to signal its ready to be processed by the "Run Test" system in Core.
        await this.connection?.add(testName, UNIT_TEST_READY_TAG_NAME);
      } catch (error: unknown) {
        throw Error(`${flecsErrorMessage(error)}`);
      }
    } catch (error: unknown) {
      throw Error(`Error executing test "${test.name}": ${error}`);
    }
  }

  /**
   * Query all entities with UnitTest component.
   */
  async queryTestEntities(): Promise<QueryResponse> {
    try {
      return await this.connection.query(UNIT_TEST_COMPONENT_NAME, {});
    } catch (error: unknown) {
      throw Error(`Error queries test entities: ${error}`);
    }
  }

  /**
   * Find a single test entity.
   * @param testName Entity name (same as test name).
   */
  async findTestEntity(testName: string): Promise<QueriedEntity | undefined> {
    try {
      const allTestsQuery = await this.queryTestEntities();

      return allTestsQuery.results.find(
        (queriedEntity) => (queriedEntity as QueriedEntity).name === testName,
      ) as QueriedEntity | undefined;
    } catch (error: unknown) {
      throw flecsError(
        error,
        `Error in response for query test entities for test "${testName}"`,
      );
    }
  }

  /**
   * Delete a single test entity.
   * @param testName Entity name (same as test name).
   */
  async deleteTestEntity(testName: string): Promise<boolean> {
    try {
      const testEntity = await this.findTestEntity(testName);
      if (!testEntity) {
        return false;
      }

      await this.connection.delete(testEntity.name);
      return true;
    } catch (error: unknown) {
      throw flecsError(
        error,
        `Error in response, when deleting test entity "${testName}"`,
      );
    }
  }

  async deleteAllTestEntities() {
    const allTestsQuery = await this.queryTestEntities();

    const deletePromises = allTestsQuery.results.map((entity) =>
      this.connection.delete((entity as QueriedEntity).name),
    );

    await Promise.all(deletePromises);
  }

  static mapFieldCoreToEntity(
    destination: ComponentField,
    value: Core.ComponentFieldValue,
  ) {
    if (Core.isComponentFieldValuePrimitive(value)) {
      destination.value = String(
        FlecsMetadataService.parseValueForPrimitiveType(
          destination.type,
          String(value),
          destination.enumValues,
        ),
      );
    } else if (Array.isArray(value)) {
      const schema = destination.schema;
      if (!schema) {
        throw Error("Schema is missing on :" + destination);
      }
      // TODO: assert dest value is array
      const arrayValue: ComponentFieldsArray = [];
      value.forEach((element) => {
        const destinationElement = structuredClone(schema!);
        this.mapFieldCoreToEntity(destinationElement, element);
        arrayValue.push(destinationElement);
      });
      destination.value = arrayValue;
    } else {
      if (!isComponentFieldValueDict(destination.value)) {
        throw Error(
          "Expected a dict value type in destination. \
          Received component structure does not match expected one",
        );
      }
      this.mapFieldsCoreToEntity(destination.value, value);
    }
  }

  // Need to pass destination as parameter because we take it as reference,
  // because we need to preserve type info of the component
  static mapFieldsCoreToEntity(
    destination: ComponentFields,
    fields: Core.ComponentFields,
  ) {
    for (const [name, value] of Object.entries(fields)) {
      if (!destination[name]) {
        throw Error("Entry does not exist for key: " + name);
      }
      this.mapFieldCoreToEntity(destination[name], value);
    }
  }

  static convertEntityToCoreFnCallback(
    _: string,
    field: ComponentField,
    __: string,
  ): Core.ComponentFieldValue {
    // Must be called only on leaf so will be primtiive
    return field.value as Core.ComponentFieldValuePrimitive;
  }

  static convertEntityToCore(entityConf: EntityConfiguration): Core.Entity {
    const coreComponents: Core.Components = {};

    entityConf.components.forEach((comp) => {
      // Use the full path (module + name) as the key to match Flecs expectations
      coreComponents[comp.id] =
        iterateComponentFieldDict<Core.ComponentFieldValuePrimitive>(
          comp.fields,
          comp.id,
          TestRunner.convertEntityToCoreFnCallback,
        );
    });

    return {
      name: entityConf.entityName,
      components: coreComponents,
    };
  }

  static getComponentById(id: string, knownComponents: Components): Component {
    const component = knownComponents.find((comp) => comp.id == id);
    if (!component) {
      throw Error("Unknown component with id: " + id);
    }
    return component;
  }

  static convertCoreToEntity(
    entityCore: Core.Entity,
    knownComponents: Components,
  ): EntityConfiguration {
    const components: Components = [];

    if (entityCore.components) {
      for (const [id, fields] of Object.entries(entityCore.components)) {
        const component = structuredClone(
          this.getComponentById(id, knownComponents),
        );
        TestRunner.mapFieldsCoreToEntity(component.fields, fields);
        components.push(component);
      }
    }

    return {
      id: crypto.randomUUID(),
      entityName: entityCore.name,
      components,
    };
  }

  static convertEntitiesToCoreString(
    world: WorldConfiguration,
  ): Core.SerializedEntities {
    return world.map((coreEntity) =>
      JSON.stringify(this.convertEntityToCore(coreEntity)),
    );
  }

  static convertOperatorToCore(oper: Operator): Core.Operator {
    return { path: { path: oper.path }, type: oper.type };
  }

  /**
   * Create a UnitTest from entity data arrays
   */
  static convertTestToCore(test: UnitTest): Core.UnitTest {
    return {
      name: test.name,
      systems: test.systems,
      initialConfiguration: TestRunner.convertEntitiesToCoreString(
        test.initialConfiguration,
      ),
      expectedConfiguration: TestRunner.convertEntitiesToCoreString(
        test.expectedConfiguration,
      ),
      operators: test.operators.map((op) =>
        TestRunner.convertOperatorToCore(op),
      ),
    };
  }

  /**
   
   */

  /**
   * Parse serialized world JSON into an array of entity configurations.
   * The serialized world format must contain entities with their components.
   * @param worldJson Serialized world.
   * @param knownComponents Known components.
   * @returns Asrray of entity configurations.
   */
  static parseWorldSerialized(
    worldJson: string,
    knownComponents: Components,
  ): WorldConfiguration {
    try {
      const world: Core.SerializedWorld = JSON.parse(worldJson);
      if (!world.results) {
        throw Error("Missing results property on serialized world");
      }

      const entities = world.results.map((entityCore) =>
        this.convertCoreToEntity(entityCore, knownComponents),
      );

      return entities;
    } catch (error: unknown) {
      console.error("Error parsing world serialized JSON:", error);
      return [];
    }
  }
}
