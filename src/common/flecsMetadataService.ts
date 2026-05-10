// Service for fetching Flecs metadata like available systems and components
import type { FlecsAsync } from "./flecsAsync";

import type {
  PrimitiveType,
  System,
  QueriedEntity,
  Components,
  ComponentField,
  ComponentFields,
  SupportedOperators,
  TypeInfoResponseDict,
  TypeInfoResponseEntryValue,
  QueriedComponent,
} from "@/common/types";

import {
  Module,
  isTypeInfoLeafValue,
  typeInfoLeafValueToString,
  isSupportedOperators,
  PRIMITIVE_TYPE_DEFAULT_VALUES,
} from "@/common/types";

import {
  MODULE_PATH_SEP,
  SUPPORTER_OPERATORS_COMPONENT_NAME,
} from "@common/constants";

/**
 * Class resposible for metadata retrieval from the tested application.
 */
export class FlecsMetadataService {
  /**
   * Build full path by recursively querying parent entities by name.
   */
  private static async buildFullPath(
    connection: FlecsAsync,
    entityName: string,
  ): Promise<string> {
    const pathParts: string[] = [entityName];
    let currentName = entityName;

    try {
      // Traverse up the parent hierarchy
      while (true) {
        const entityInfo = await connection.entity(currentName, {
          builtin: true,
        });

        // TODO: throw error if something is missing?
        if (entityInfo.parent) {
          const parentName = entityInfo.parent;

          // Stop if we hit a root entity (no name or special entity)
          if (!parentName || parentName === "flecs" || parentName === "$") {
            break;
          }

          // Add parent name to path
          pathParts.unshift(parentName);
          currentName = parentName;
        } else {
          // No more parents, we're done
          break;
        }
      }
    } catch (error) {
      console.warn(`Error building full path for ${entityName}:`, error);
    }

    return pathParts.join(".");
  }

  /**
   * Fetch all available modules from the Flecs application.
   * Only fetches modules that have the specific tag.
   * @param connection Flecs connection.
   * @returns Array of modules.
   */
  static async getAvailableModules(connection: FlecsAsync): Promise<Module[]> {
    try {
      // Query for modules that have the TestableModule tag
      const data = await connection.query(
        "flecs.core.Module, TestRunner.TestableModule",
      );
      const modules: Module[] = [];

      for (const entity of data.results as QueriedEntity[]) {
        const entityName = entity.name;
        const parentName = entity.parent;

        if (!entityName) {
          console.warn("Entity missing name:", entity);
          continue;
        }

        // Build full path by traversing parents
        let fullPath = await this.buildFullPath(connection, parentName);
        fullPath += "." + entityName;

        modules.push(new Module(fullPath));
      }

      // Sort modules by full path for better UX
      return modules.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw error;
    }
  }

  /**
   * Fetch systems of a module.
   * @param connection Flecs connection.
   * @param module Module to get systems from.
   * @returns Array of systems in module.
   */
  static async getSystemsInModule(
    connection: FlecsAsync,
    module: Module,
  ): Promise<System[]> {
    try {
      const systems: System[] = [];
      const query = `(ChildOf, ${module.fullPath}), flecs.system.System`;

      const data = await connection.query(query);

      if (data.results.length < 1) {
        throw new Error("No systems found");
      }

      for (const entity of data.results as QueriedEntity[]) {
        const systemName = entity.name;
        systems.push({
          name: systemName,
          module: module,
        });
      }

      // Sort systems by name
      return systems.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(
        `Error fetching systems for module ${module.fullPath}: `,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetch components of a module.
   * @param connection Flecs connection.
   * @param module Module to get components from.
   * @returns Array of components in module.
   */
  static async getComponentsInModule(
    connection: FlecsAsync,
    module: Module,
  ): Promise<Components> {
    const modulePath = module.fullPath;
    try {
      const components: Components = [];
      const query = `(ChildOf, ${modulePath}), flecs.core.Component`;

      const data = await connection.query(query);
      if (!data.results || data.results.length < 1) {
        throw new Error("No components found");
      }

      for (const entity of data.results as QueriedEntity[]) {
        const componentName = entity.name;

        // Try to get component metadata to discover fields
        const componentId = `${module.fullPath}${MODULE_PATH_SEP}${componentName}`;
        const fields = await this.getComponentFields(connection, componentId);
        if (!fields) {
          console.warn(`Component ${componentId} skipped. Unsupported.`);
          continue;
        }

        const supportedOperators = await this.getSupportedOperatorsForComponent(
          connection,
          componentId,
        );

        components.push({
          id: componentId,
          name: componentName,
          module,
          supportedOperators,
          fields,
        });
      }

      // Sort components by name for better UX
      return components.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(
        `Error fetching components for module ${modulePath}: `,
        error,
      );
      throw error;
    }
  }

  static isCollectionType(type: string): boolean {
    return type === "vector" || type === "array";
  }

  static parseTypeInfoValue(value: TypeInfoResponseEntryValue): ComponentField {
    let field: ComponentField = { type: "<undefined>", value: "<undefined>" };
    if (Array.isArray(value)) {
      // leaf array
      const type = typeInfoLeafValueToString(value[0]);

      if (this.isCollectionType(type)) {
        if (value.length < 2) {
          // Invalid
          throw Error("Missing element with index 1 in: " + value);
        }

        const schema = this.parseTypeInfoValue(value[1]!);

        field = {
          type,
          value: [],
          schema,
        };
      } else if (this.isEnumType(type)) {
        const enumValues = value.slice(1);
        if (!enumValues.every((v) => typeof v === "string")) {
          throw Error(`Invalid values found in enum '${type}'`);
        }

        field = {
          type,
          value: enumValues[0], // First value as default
          enumValues,
        };
      } else {
        field = {
          type,
          value: String(this.getDefaultValueForPrimitiveType(type)),
        };
      }
    } else if (isTypeInfoLeafValue(value)) {
      // TODO: unsupported
      field = {
        type: "skip", // fallback type for now
        value: "<undefined>",
      };
    } else {
      // Dict
      field = {
        type: "component", // Here we cannot know which component it is
        value: this.parseTypeInfoDict(value),
      };
    }
    return field;
  }

  static parseTypeInfoDict(dict: TypeInfoResponseDict): ComponentFields {
    const fields: ComponentFields = {};

    (Object.entries(dict) as [string, TypeInfoResponseEntryValue][]).forEach(
      ([key, value]) => {
        fields[key] = this.parseTypeInfoValue(value);
      },
    );

    return fields;
  }

  /**
   * Retrieve metadata about component fields.
   * @param connection Flecs connection.
   * @param componentId Id of a component.
   * @returns Component fields if was able to retrieve.
   */
  static async getComponentFields(
    connection: FlecsAsync,
    componentId: string,
  ): Promise<ComponentFields | null> {
    try {
      const typeInfo = await connection.typeInfo(`${componentId}`);

      let fields: ComponentFields = {};

      if (typeof typeInfo === "number") {
        console.log("Empty type info for ", componentId);
        // No type info, empty component. Is valid for tags.
        return {};
      }
      if (Array.isArray(typeInfo)) {
        // Can be array in case of vector/array
        // We probably don't want to support it being used as a component itself,
        // only as a member of a component
        return null;
      }
      fields = this.parseTypeInfoDict(typeInfo);

      return fields;
    } catch (error) {
      throw new Error(
        `Error fetching component info for ${componentId}: ${error}`,
      );
    }
  }

  /**
   * Get supported operators metadata for a component.
   * @param connection Flecs connection.
   * @param componentId Component id.
   * @returns Supported operators metadata.
   */
  static async getSupportedOperatorsForComponent(
    connection: FlecsAsync,
    componentId: string,
  ): Promise<SupportedOperators> {
    try {
      const query = `${SUPPORTER_OPERATORS_COMPONENT_NAME}(${componentId})`;
      const response = await connection.query(query);

      const component = response.results[0] as QueriedComponent;
      const supportedOperators = component.fields.values[0];
      if (!isSupportedOperators(supportedOperators)) {
        throw Error(
          `Invalid response structure for object: ` +
            JSON.stringify(supportedOperators),
        );
      }
      return supportedOperators;
    } catch (error) {
      throw new Error(
        `Error fetching supported operators for ${componentId}: ${error}`,
      );
    }
  }

  static isBooleanType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "bool" || nt === "boolean";
  }

  static isFloatType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "float" || nt === "double" || nt === "f32" || nt === "f64";
  }

  /**
   * Note: Unsigned char is considered "int" by Flecs.
   */
  static isIntegerType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "int" || nt === "integer" || nt === "i32" || nt === "i64";
  }

  /**
   * TODO: remove. Flecs does not use char type. Uses "text" for string and char instead.
   * When deserializing to char, Flecs just takes 1st char of text.
   */
  static isCharType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "char";
  }

  static isStringType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "string" || nt === "str" || nt === "text";
  }

  static isEnumType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "enum";
  }

  static isPrimitiveType(type: string): boolean {
    return (
      this.isBooleanType(type) ||
      this.isIntegerType(type) ||
      this.isFloatType(type) ||
      this.isStringType(type)
    );
  }

  /**
   * Parse a value of a primitive type.
   * Throws in case the value does not match the type.
   */
  static parseValueForPrimitiveType(
    type: string,
    value: string,
    enumConstants?: string[],
  ): PrimitiveType {
    const rawValue = value?.trim() ?? "";

    if (this.isBooleanType(type)) {
      const lower = rawValue.toLowerCase();
      if (lower === "true") {
        return true;
      }
      if (lower === "false") {
        return false;
      }
      throw new Error(
        `Value "${value}" is not a valid boolean for type ${type}`,
      );
    }
    if (this.isIntegerType(type)) {
      // Regex ensures only digits (and optional leading sign) are present
      if (!/^-?\d+$/.test(rawValue)) {
        throw new Error(
          `Value "${value}" is not a valid integer for type ${type}`,
        );
      }
      return parseInt(rawValue, 10);
    }
    // TODO: remove. char type unused by Flecs
    if (this.isCharType(type)) {
      if (rawValue.length > 1) {
        throw new Error(
          `Value "${value}" is not a valid char for type ${type}`,
        );
      }
      const code = rawValue.charCodeAt(0);
      if (isNaN(code) || code > 127) {
        throw new Error(
          `Char code "${rawValue}" is outside of the valid char range for type ${type}`,
        );
      }
      return rawValue.charCodeAt(0);
    }
    if (this.isFloatType(type)) {
      const parsed = Number(rawValue);
      // Number("") returns 0, so we check for empty string explicitly
      if (rawValue === "" || isNaN(parsed)) {
        throw new Error(
          `Value "${value}" is not a valid float for type ${type}`,
        );
      }
      return parsed;
    }
    if (this.isEnumType(type)) {
      if (rawValue === "" || !enumConstants?.find((c) => c === value)) {
        throw new Error(
          `Value "${value}" is not a valid enum value for type ${type}`,
        );
      }
      return rawValue;
    }
    if (this.isStringType(type)) {
      return rawValue;
    }

    throw new Error(`Unsupported or invalid type: ${type}`);
  }

  /**
   * Get a default value for a primitive value component field, based on its type
   */
  static getDefaultValueForPrimitiveType(type: string): PrimitiveType {
    const normalizedType = type.toLowerCase();

    const value = PRIMITIVE_TYPE_DEFAULT_VALUES[normalizedType];
    if (value === undefined) {
      throw new Error(`Unsupported or invalid type: ${type}`);
    }
    return value;
  }
}
