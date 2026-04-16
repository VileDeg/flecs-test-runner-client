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
  TypeInfoResponseArray,
  TypeInfoResponseEntryValue,
  QueriedComponent,
} from "@/common/types";

import {
  Module,
  isTypeInfoLeafValue,
  typeInfoLeafValueToString,
  isSupportedOperators,
} from "@/common/types";

import {
  MODULE_PATH_SEP,
  SUPPORTER_OPERATORS_COMPONENT_NAME,
} from "@common/constants";

export class FlecsMetadataService {
  /**
   * Build full path by recursively querying parent entities by name
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
   * Fetch all available modules from the Flecs application
   * Only fetches modules that have the TestableModule tag
   */
  static async getModules(connection: FlecsAsync): Promise<Module[]> {
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
   * Fetch systems filtered by selected modules
   */
  static async getSystems(
    connection: FlecsAsync,
    module: Module,
  ): Promise<System[]> {
    try {
      const systems: System[] = [];

      // Build query to find systems under this module
      // Format: (ChildOf, module_path), System
      // (ChildOf, modules.movement), flecs.system.System
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
   * Fetch components filtered by selected modules
   */
  static async getComponents(
    connection: FlecsAsync,
    module: Module,
  ): Promise<Components> {
    const modulePath = module.fullPath;
    try {
      const components: Components = [];

      // Query components that are children of each selected module
      // Build query to find components under this module
      // Format: (ChildOf, module_path), flecs.core.Component
      const query = `(ChildOf, ${modulePath}), flecs.core.Component`;

      const data = await connection.query(query);
      if (!data.results || data.results.length < 1) {
        throw new Error("No components found");
      }

      for (const entity of data.results as QueriedEntity[]) {
        const componentName = entity.name;

        // Try to get component metadata to discover fields
        const fullComponentPath = modulePath + "." + componentName;
        const fields = await this.getComponentFields(
          connection,
          fullComponentPath,
        );
        if (!fields) {
          console.warn(`Component ${fullComponentPath} skipped. Unsupported.`);
          continue;
        }

        const supportedOperators = await this.getComponentSupportedOperators(
          connection,
          fullComponentPath,
        );

        components.push({
          id: `${module.fullPath}${MODULE_PATH_SEP}${componentName}`,
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

  static flecsNameToPath(name: string, delim: string = "/"): string {
    return name.replaceAll(".", delim);
  }

  static parseTypeInfoArray(_: TypeInfoResponseArray): ComponentFields {
    console.warn("parseTypeInfoArray is not supported");
    const fields: ComponentFields = {};
    return fields;
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
      // unsupported for now
      field = {
        type: "skip", // fallback type for now
        value: "<undefined>",
      };
    } else {
      // dict
      field = {
        type: "component", // here we don't know which component it is
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

  static async getComponentFields(
    connection: FlecsAsync,
    componentName: string,
  ): Promise<ComponentFields | null> {
    try {
      const typeInfo = await connection.typeInfo(`${componentName}`);

      let fields: ComponentFields = {};

      if (typeof typeInfo === "number") {
        console.log("Empty type info for ", componentName);
        return {}; // no type info, empty component
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
        `Error fetching component info for ${componentName}: ${error}`,
      );
    }
  }

  static async getComponentSupportedOperators(
    connection: FlecsAsync,
    componentName: string, // full path
  ): Promise<SupportedOperators> {
    try {
      const query = `${SUPPORTER_OPERATORS_COMPONENT_NAME}(${componentName})`;
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
        `Error fetching supported operators for ${componentName}: ${error}`,
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
  static isIntegerType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "int" || nt === "integer" || nt === "i32" || nt === "i64";
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

  static parseValueForPrimitiveType(
    type: string,
    value: string,
    enumConstants?: string[],
  ): PrimitiveType {
    const rawValue = value?.trim() ?? "";

    if (this.isBooleanType(type)) {
      const lower = rawValue.toLowerCase();
      if (lower === "true") return true;
      if (lower === "false") return false;
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

  private static readonly DEFAULT_VALUES: Record<string, PrimitiveType> = {
    boolean: false,
    int: 0,
    float: 0,
    string: "",
    text: "",
  };

  /**
   * Get a default value for a component field based on its type
   */
  static getDefaultValueForPrimitiveType(type: string): PrimitiveType {
    const normalizedType = type.toLowerCase();

    const value = this.DEFAULT_VALUES[normalizedType];
    if (value === undefined) {
      throw new Error(`Unsupported or invalid type: ${type}`);
    }
    return value;
  }

  // TODO: component name vs module.name
  // TODO: array support
  // static getDefaultValueForField(fieldType: string, knownComponents: Components)
  //   : ComponentFieldValue
  // {
  //   const component = knownComponents.find((component) => { component.name == fieldType });
  //   if (!component) {
  //     return String(this.getDefaultValueForPrimitiveType(fieldType));
  //   }

  //   return this.getDefaultValueForComponentFields(component.fields, knownComponents);
  // }

  // static getDefaultValueForComponentFields(
  //   fields: ComponentFields, knownComponents: Components
  // ): ComponentFields
  // {
  //   try{

  //     return Utils.mapRecord(fields,
  //       f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
  //     )
  //   } catch(error: any) {
  //     throw Error(error.cause);
  //   }
  // }
}
