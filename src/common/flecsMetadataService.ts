// Service for fetching Flecs metadata like available systems and components
import type { FlecsAsync } from "./flecsConnection/flecsAsync";

import type { 
  Component,
  PrimitiveType,
  System,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFields,
} from "@/common/types";

import { 
  Module,
} from "@/common/types";

import * as Utils from "@common/utils.ts"


// TODO: don't use namespace
// export namespace FlecsMetadata {
  
// }


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
      
      console.log("getModules data: ", data);
      
      if (data.results) {
        for (const entity of data.results) {
          const entityName = entity.name;
          const parentName = entity.parent;
          
          if (!entityName) {
            console.warn("Entity missing name:", entity);
            continue;
          }
          
          console.log(`Processing entity: ${entityName}`);
          
          // Build full path by traversing parents
          let fullPath = await this.buildFullPath(connection, parentName);
          fullPath += "." + entityName;
          
          console.log(`  - Built full path: ${fullPath}`);
          
          modules.push(new Module(fullPath));
        }
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
  static async getSystems(connection: FlecsAsync, selectedModules: Module[]): Promise<System[]> {
    try {
      const systems: System[] = [];
      
      if (selectedModules.length === 0) {
        return systems;
      }
      
      // Query systems that are children of each selected module
      for (const module of selectedModules) {
        // Build query to find systems under this module
        // Format: (ChildOf, module_path), System
        // (ChildOf, modules.movement), flecs.system.System
        const query = `(ChildOf, ${module.fullPath}), flecs.system.System`;
        console.log("Systems query: ", query);
        
        try {
          const data = await connection.query(query);
          console.log("Systems data: ", data);
          
          if (data.results.length > 0) {
            for (const entity of data.results) {
              const systemName = entity.name; //  || entity.path
              if (systemName && systemName !== 'System') {
                // Check if already added (avoid duplicates if overlapping queries)
                if (!systems.find(s => s.name === systemName)) {
                  systems.push({
                    name: systemName,
                    module: module
                  });
                }
              }
            }
          } else {
            throw new Error("No systems found");
          }
        } catch (error) {
          console.warn(`Could not fetch systems for module ${module.fullPath}:`, error);
        }
      }
      
      // Sort systems by name for better UX
      return systems.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching systems:', error);
      throw error;
    }
  }

  /**
   * Fetch components filtered by selected modules
   */
  static async getComponents(connection: FlecsAsync, selectedModules: Module[]): Promise<Component[]> {
    try {
      const components: Component[] = [];
      
      // If no modules selected, return empty array
      if (selectedModules.length === 0) {
        return components;
      }
      
      // Query components that are children of each selected module
      for (const module of selectedModules) {
        const modulePath = module.fullPath;
        // Build query to find components under this module
        // Format: (ChildOf, module_path), Component
        // (ChildOf, modules.movement), flecs.core.Component
        const query = `(ChildOf, ${modulePath}), flecs.core.Component`;
        
        try {
          const data = await connection.query(query);
          
          if (data.results && data.results.length > 0) {
            for (const entity of data.results) {
              const componentName = entity.name; //  || entity.path
              if (componentName && componentName !== 'Component') {
                // Check if already added (avoid duplicates if overlapping queries)
                if (components.find(c => c.name === componentName)) {
                  console.warn("Duplicated component found. Skipping...");
                  continue;
                }
                // Try to get component metadata to discover fields
                const fullComponentPath = modulePath + "." + componentName;
                const fields = await this.getComponentInfo(
                  connection, fullComponentPath);
                
                components.push({
                  name: componentName,
                  module,
                  fields
                });
              }
            }
          } else {
            throw new Error("No components found");
          }
        } catch (error) {
          console.warn(`Could not fetch components for module ${modulePath}:`, error);
        }
      }

      // Validate fields types and assign default values
      components.forEach((component) => {
        component.fields = this.getDefaultValueForComponentFields(component.fields, components);
      })
      
      // Sort components by name for better UX
      return components.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching components:', error);
      throw error;
    }
  }

  private static getEntityMetaComponent<K extends keyof MetaComponentRegistry>(
    entity: QueriedEntity, key: K
  ): MetaComponentRegistry[K] | undefined 
  {
      return entity.components?.[key];
  }

  /**
   * Get detailed information about a specific component fields
   */
  static async getComponentInfo(
    connection: FlecsAsync, 
    componentName: string)
  : Promise<ComponentFields> {
    try {
      // Try to get component metadata using Flecs connection
      const data = await connection.query(
        `(ChildOf, ${componentName})`, {type_info:true, values:true});
      // TODO: get flecs.meta.member component of each member?
      const fields: ComponentFields = {};
      
      //console.log("getComponentInfo for " + componentName + ": ", data);
      
      // Try to extract field information from component metadata
      // This is a best-effort approach as Flecs REST API might not expose all field details
      for (const result of data.results) {
        const entityName = componentName + "." + result.name;
        const entity = await connection.entity(entityName, {type_info:true, values:true})
        //console.log("getComponentInfo member for " + member.name + ": ", data);
        
        const memberDef = this.getEntityMetaComponent(entity, "flecs.meta.member");
        //entity.components["flecs.meta.member"];
        if (!memberDef) {
          throw new Error(`Member definition missing for ${entityName}`);
        }
        
        const typeParts = memberDef.type.split('.');
        const memberType = typeParts[typeParts.length - 1];
        //console.log("-------- type: ", memberDef.type);
        //console.log("-------- type1: ", memberType);
        
        fields[result.name] = {
          //name: member.name,
          type: memberType,
          value: "<undefined>"
          //defaultValue: this.getDefaultValueForType(memberType) // TODO: is it correct?
        };
      }
      return fields;
    } catch (error) {
      throw new Error(`Error fetching component info for ${componentName}: ${error}`);
    }
  }

  // TODO: remove?
  static isComponentType(type: string, knownComponents: Component[]): boolean {
    return knownComponents.find((component) => { component.name == type }) != undefined;
  }

  static isBooleanType(type: string): boolean {
    return type === "bool" || type === "boolean";
  }

  static isFloatType(type: string): boolean {
    return type === "float" || type === "double" || type === "f32" || type === "f64";
  }

  static isIntegerType(type: string): boolean {
    return type === "int" || type === "integer" || type === "i32" || type === "i64"; // TODO: etc.
  }
  static isStringType(type: string): boolean {
    return type === "string" || type === "str";
  }

  static parseValueForPrimitiveType(type: string, value: string | null): PrimitiveType {
    type = type.toLowerCase();
    
    try {
      if (this.isBooleanType(type)) {
        return value ? value.toLowerCase() === "true" : "false";
      } else if (this.isIntegerType(type)) {
        return value ? parseInt(value) : 0;
      } else if (this.isFloatType(type)) {
        return value ? parseFloat(value) : 0.0;
      } else if (this.isStringType(type)) {
        return value ? String(value) : "";
      } else {
        throw Error("Invalid type"); // TODO;
      }
    } catch(err) {
      // TODO: better error
      throw Error("Invalid value for type");
    }
  }


  /**
   * Get a default value for a component field based on its type
   */
  static getDefaultValueForPrimitiveType(type: string): PrimitiveType {
    return this.parseValueForPrimitiveType(type, null);
  }

  

  

  // TODO: component name vs module.name
  // TODO: array support
  static getDefaultValueForField(fieldType: string, knownComponents: Component[])
    : ComponentFieldValue 
  {

    const component = knownComponents.find((component) => { component.name == fieldType });
    if (!component) {
      return String(this.getDefaultValueForPrimitiveType(fieldType));
    }

    return this.getDefaultValueForComponentFields(component.fields, knownComponents);
  }

  

  static getDefaultValueForComponentFields(
    fields: ComponentFields, knownComponents: Component[]
  ): ComponentFields
  {
    return Utils.mapRecord(fields, 
      f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
    )

    // return Object.fromEntries(Object.entries(fields).map(
    //   f => ({ ...f, value: this.getDefaultValueForField(f.type, knownComponents) })
    // ));
  }

  // static getDefaultComponentValue(
  //   componentName: string, knownComponents: Component[]
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