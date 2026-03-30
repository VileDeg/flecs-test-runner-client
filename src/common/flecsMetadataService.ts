// Service for fetching Flecs metadata like available systems and components
import type { FlecsAsync } from "./flecsAsync";

import type { 
  Component,
  PrimitiveType,
  System,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  Components,
  ComponentField,
  ComponentFieldValue,
  ComponentFields,
  SupportedOperators,
  TypeInfoResponse,
  TypeInfoResponseDict,
  TypeInfoResponseArray,
  TypeInfoResponseEntryValue,
  TypeInfoResponseEntryValueLeaf,
  QueriedComponent
} from "@/common/types";

import { 
  Module,
  isTypeInfoLeafValue,
  typeInfoLeafValueToString,
  isSupportedOperators
} from "@/common/types";

import {
  MODULE_PATH_SEP,
  SUPPORTER_OPERATORS_COMPONENT_NAME
} from "@common/constants"

import * as Utils from "@common/utils.ts"

export class FlecsMetadataService {
  /**
   * Build full path by recursively querying parent entities by name
   */
  private static async buildFullPath(
    connection: FlecsAsync, 
    entityName: string
  ): Promise<string> {
    const pathParts: string[] = [entityName];
    let currentName = entityName;
    
    try {
      // Traverse up the parent hierarchy
      while (true) {
        const entityInfo = await connection.entity(currentName, {builtin:true});
        //console.log("entityInfo: ", entityInfo);
        
        // TODO: throw error if something is missing?
        if (entityInfo.parent) {
          const parentName = entityInfo.parent;
          
          // Stop if we hit a root entity (no name or special entity)
          if (!parentName || parentName === 'flecs' || parentName === '$') {
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
    
    return pathParts.join('.');
  }

  /**
   * Fetch all available modules from the Flecs application
   * Only fetches modules that have the TestableModule tag
   */
  static async getModules(connection: FlecsAsync): Promise<Module[]> {
    try {
      // Query for modules that have the TestableModule tag
      const data = await connection.query('flecs.core.Module, TestRunner.TestableModule');
      const modules: Module[] = [];
      
      //console.log("getModules data: ", data);
      
      for (const entity  of data.results as QueriedEntity[]) {
        const entityName = entity.name;
        const parentName = entity.parent;
        
        if (!entityName) {
          console.warn("Entity missing name:", entity);
          continue;
        }
        
        //console.log(`Processing entity: ${entityName}`);
        
        // Build full path by traversing parents
        let fullPath = await this.buildFullPath(connection, parentName);
        fullPath += "." + entityName;
        
        //console.log(`  - Built full path: ${fullPath}`);
        
        modules.push(new Module(fullPath));
      }
      
      // Sort modules by full path for better UX
      return modules.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  /**
   * Fetch systems filtered by selected modules
   */
  static async getSystems(connection: FlecsAsync, module: Module): Promise<System[]> {
    try {
      const systems: System[] = [];
      
      // Build query to find systems under this module
      // Format: (ChildOf, module_path), System
      // (ChildOf, modules.movement), flecs.system.System
      const query = `(ChildOf, ${module.fullPath}), flecs.system.System`;
      //console.log("Systems query: ", query);
      
      //try {
        const data = await connection.query(query);
        //console.log("Systems data: ", data);
        
        if (data.results.length < 1) {
          throw new Error("No systems found");
        }

        for (const entity of data.results as QueriedEntity[]) {
          const systemName = entity.name; //  || entity.path
          //if (systemName && systemName !== 'System') {
            //if (!systems.find(s => s.name === systemName)) {
              systems.push({
                name: systemName,
                module: module
              });
            //}
          //}
        }
      // } catch (error) {
      //   console.warn(`Could not fetch systems for module ${module.fullPath}:`, error);
      // }
      
      // Sort systems by name
      return systems.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(`Error fetching systems for module ${module.fullPath}: `, error);
      throw error;
    }
  }

  /**
   * Fetch components filtered by selected modules
   */
  static async getComponents(connection: FlecsAsync, module: Module): Promise<Components> {
    const modulePath = module.fullPath;
    try {
      const components: Components = [];
      
      // Query components that are children of each selected module
      // Build query to find components under this module
      // Format: (ChildOf, module_path), flecs.core.Component
      const query = `(ChildOf, ${modulePath}), flecs.core.Component`;
      
      //try {
      const data = await connection.query(query);
      if (!data.results || data.results.length < 1) {
        throw new Error("No components found");
      }

      for (const entity of data.results as QueriedEntity[]) {
        const componentName = entity.name; //  || entity.path
        //if (componentName) {
          // Check if already added (avoid duplicates if overlapping queries)
          // if (components.find(c => c.name === componentName)) {
          //   console.warn("Duplicated component found. Skipping...");
          //   continue;
          // }
          // Try to get component metadata to discover fields
        const fullComponentPath = modulePath + "." + componentName; // 
        const fields = await this.getComponentFields(
          connection, fullComponentPath
        );
        if(!fields) {
          continue
        }

        const supportedOperators = 
          await this.getComponentSupportedOperators(connection, fullComponentPath);
        
        components.push({
          id: `${module.fullPath}${MODULE_PATH_SEP}${componentName}`,
          name: componentName,
          module,
          supportedOperators,
          fields
        });
        //}
      }
      //   console.warn(`Could not fetch components for module ${modulePath}:`, error);
      // }
      /*
      // Validate fields types and assign default values
      components.forEach((component) => {
        component.fields = this.getDefaultValueForComponentFields(component.fields, components);

        console.log("Component fields assigned\n", component);
      })
      */
      
      // Sort components by name for better UX
      return components.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error(`Error fetching components for module ${modulePath}: `, error);
      throw error;
    }
  }

  private static getEntityMetaComponent<K extends keyof MetaComponentRegistry>(
    entity: QueriedEntity, key: K
  ): MetaComponentRegistry[K] | undefined 
  {
    return entity.components?.[key];
  }

  
    static flecsNameToPath(name: string, delim: string = '/'): string {
      return name.replaceAll('.', delim);
    }

    static parseTypeInfoArray(
      array: TypeInfoResponseArray)
    : ComponentFields 
    {
      console.warn("parseTypeInfoArray is not supported");
      const fields: ComponentFields = {};
      return fields;
    }

    static isCollectionType(type: string): boolean {
      return type === "vector" || type === "array";
    }

    static parseTypeInfoValue(value : TypeInfoResponseEntryValue): ComponentField {
      let field: ComponentField = {type:"<undefined>", value:"<undefined>"} 
      if (Array.isArray(value)) { // leaf array
        const type = typeInfoLeafValueToString(value[0]);

        if(!this.isCollectionType(type)) {
          field = {
            type,
            value: String(this.getDefaultValueForPrimitiveType(type))
          };
        } else {
          if(value.length < 2) {
            // invalid
            throw Error("Missing element with index 1 in: " + value);
          }

          const schema = this.parseTypeInfoValue(value[1]!);
          //console.log("Assigned schema: ", schema);

          field = {
            type,
            value: [],
            schema
          };
        }
      } else if (isTypeInfoLeafValue(value)) { // leaf
        // unsupported for now
        field = {
          type: "skip", // fallback type for now
          value: "<undefined>"
        };
      } else { // dict
        field = {
          type: "component", // here we don't know which component it is
          value: this.parseTypeInfoDict(value)
        };
      }
      return field;
    } 

    static parseTypeInfoDict(
      dict: TypeInfoResponseDict)
    : ComponentFields 
    {
      const fields: ComponentFields = {};

      (Object.entries(dict) as [string, TypeInfoResponseEntryValue][]).forEach(([key, value]) => {
        fields[key] = this.parseTypeInfoValue(value)
      });

      return fields;
    }

    static async getComponentFields(
      connection: FlecsAsync, 
      componentName: string)
    : Promise<ComponentFields | null> {
      try {
        //console.log("replace before " + componentName + " after: " + this.flecsNameToPath(componentName))
        // Try to get component metadata using Flecs connection
        // const typeInfo = await connection.typeInfo(
        //   `${this.flecsNameToPath(componentName)})`
        // );
        const typeInfo = await connection.typeInfo(
          `${componentName}`
        );

        let fields: ComponentFields = {};
        //console.log("getComponentInfo for " + componentName + ", typeInfo: ", typeInfo);

        if (!Array.isArray(typeInfo)) {
          fields = this.parseTypeInfoDict(typeInfo);
        } else {
          // Can be array in case of vector/array
          // We probably don't want to support it being used as a component itself, 
          // only as a member
          // Not supported
          return null;
          //fields = this.parseTypeInfoArray(typeInfo);
        }

        // console.log("replace before " + componentName + " after: " + this.flecsNameToPath(componentName))
  
        return fields;
      } catch (error) {
        throw new Error(`Error fetching component info for ${componentName}: ${error}`);
      }
    } 

    static async getComponentSupportedOperators(
      connection: FlecsAsync,
      componentName: string, // full path
    ) : Promise<SupportedOperators> {
      try {
        const query = `${SUPPORTER_OPERATORS_COMPONENT_NAME}(${componentName})`
        const response = await connection.query(query);

        const component = response.results[0] as QueriedComponent;
        const supportedOperators = component.fields.values[0];
        if(!isSupportedOperators(supportedOperators)) {
          throw Error(`Invalid response structure for object: ` + JSON.stringify(supportedOperators));
        }
        return supportedOperators;
      } catch (error) {
        throw new Error(`Error fetching supported operators for ${componentName}: ${error}`);
      }
    }

  // TODO: remove?
  static isComponentType(type: string, knownComponents: Components): boolean {
    return knownComponents.find((component) => { component.name == type }) != undefined;
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
    return nt === "int" || nt === "integer" || nt === "i32" || nt === "i64"; // TODO: etc.
  }
  static isStringType(type: string): boolean {
    const nt = type.toLowerCase();
    return nt === "string" || nt === "str";
  }

  static isPrimitiveType(type: string): boolean {
    return this.isBooleanType(type) || 
      this.isIntegerType(type) || 
      this.isFloatType(type) || 
      this.isStringType(type);
  }

  static parseValueForPrimitiveType(type: string, value: string): PrimitiveType {
    const rawValue = value?.trim() ?? "";
  
    if (this.isBooleanType(type)) {
      const lower = rawValue.toLowerCase();
      if (lower === "true") return true;
      if (lower === "false") return false;
      throw new Error(`Value "${value}" is not a valid boolean for type ${type}`);
    }
  
    if (this.isIntegerType(type)) {
      // Regex ensures only digits (and optional leading sign) are present
      if (!/^-?\d+$/.test(rawValue)) {
        throw new Error(`Value "${value}" is not a valid integer for type ${type}`);
      }
      return parseInt(rawValue, 10);
    }
  
    if (this.isFloatType(type)) {
      const parsed = Number(rawValue);
      // Number("") returns 0, so we check for empty string explicitly
      if (rawValue === "" || isNaN(parsed)) {
        throw new Error(`Value "${value}" is not a valid float for type ${type}`);
      }
      return parsed;
    }
  
    if (this.isStringType(type)) {
      return rawValue;
    }
  
    throw new Error(`Unsupported or invalid type: ${type}`);
  }

  /*
  static parseValueForPrimitiveType(type: string, value: string | null): PrimitiveType {
    type = type.toLowerCase();
    
    if (this.isBooleanType(type)) {
      return value ? value.toLowerCase() === "true" : "false";
    } else if (this.isIntegerType(type)) {
      return value ? parseInt(value) : 0;
    } else if (this.isFloatType(type)) {
      return value ? parseFloat(value) : 0.0;
    } else if (this.isStringType(type)) {
      return value ? String(value) : "";
    } else if (type == "vector" || type == "array" || type == "skip") { // unsupported for now
        return "I am " + type + " value";
    } else {
      console.log("throw Error(\"Invalid (type, value): \" + type + \", \" + value);")
      throw Error("Invalid (type, value): " + type + ", " + value);
    }
  }
  */

  private static readonly DEFAULT_VALUES: Record<string, PrimitiveType> = {
    boolean: false,
    int: 0,
    float: 0,
    string: "",
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
  static getDefaultValueForField(fieldType: string, knownComponents: Components)
    : ComponentFieldValue 
  {

    const component = knownComponents.find((component) => { component.name == fieldType });
    if (!component) {
      return String(this.getDefaultValueForPrimitiveType(fieldType));
    }

    return this.getDefaultValueForComponentFields(component.fields, knownComponents);
  }

  

  static getDefaultValueForComponentFields(
    fields: ComponentFields, knownComponents: Components
  ): ComponentFields
  {
    try{

      return Utils.mapRecord(fields, 
        f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
      )
    } catch(error: any) {
      //console.log("Failed to getDefaultValueForComponentFields: ", fields);
      throw Error(error.cause);
    }

    // return Object.fromEntries(Object.entries(fields).map(
    //   f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
    // ));
  }

  // static getDefaultComponentValue(
  //   componentName: string, knownComponents: ComponentsRegistry
  // ): ComponentFields
  // {

  //   return fields.map(
  //     f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
  //   );
  // }

  /**
   * Format a value for JSON serialization based on its type
   */
  // static formatValueForType(value: string, type: string): ScalarValue {
  //   switch (type.toLowerCase()) {
  //     case 'float':
  //     case 'double':
  //     case 'f32':
  //     case 'f64':
  //       return parseFloat(value) || 0.0;
  //     case 'int':
  //     case 'integer':
  //     case 'i32':
  //     case 'i64':
  //     case 'u32':
  //     case 'u64':
  //     case 'int32':
  //     case 'int64':
  //     case 'uint32':
  //     case 'uint64':
  //       return parseInt(value) || 0;
  //     case 'bool':
  //     case 'boolean':
  //       return value.toLowerCase() === 'true';
  //     case 'string':
  //     case 'str':
  //       return String(value);
  //     default:
  //       return value;
  //   }
  // }
}