// Service for fetching Flecs metadata like available systems and components
import type { FlecsAsync } from "../context/flecsConnection/flecsAsync";

export interface FlecsSystem {
  name: string;
  module?: string;
}

export interface FlecsComponent {
  name: string;
  module?: string;
  fields: ComponentField[];
}

export interface ComponentField {
  name: string;
  type: string;
  defaultValue?: any;
}

export interface FlecsModule {
  name: string;
  fullPath: string;
}

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
        console.log("entityInfo: ", entityInfo);
        
        // Check if entity has a parent (ChildOf relationship)
        //if (entityInfo.is_a && entityInfo.is_a.length > 0) {
        if (entityInfo.parent) {
          // Get parent name - it should be in the is_a array
          const parentName = entityInfo.parent;
          
          // Stop if we hit a root entity (no name or special entity)
          if (!parentName || parentName === 'flecs' || parentName === '$') {
            break;
          }
          
          // Fetch parent info to get its name
          /*const parentInfo = await connection.entity(parentName, {});
          
          if (!parentInfo.name || parentInfo.name === 'flecs' || parentInfo.name === '$') {
            break;
          }*/
          
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
  static async getModules(connection: FlecsAsync): Promise<FlecsModule[]> {
    try {
      // Query for modules that have the TestableModule tag
      const data = await connection.query('flecs.core.Module, TestRunner.TestableModule');
      const modules: FlecsModule[] = [];
      
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
          
          if (fullPath && fullPath !== 'TestableModule' && 
              fullPath !== 'TestRunner.TestableModule') {
            //const parts = fullPath.split('.');
            //const name = parts[parts.length - 1] || fullPath;
            modules.push({
              name: entityName,
              fullPath
            });
          }
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
  static async getSystems(connection: FlecsAsync, selectedModules?: string[]): Promise<FlecsSystem[]> {
    try {
      const systems: FlecsSystem[] = [];
      
      // If no modules selected, return empty array
      if (!selectedModules || selectedModules.length === 0) {
        return systems;
      }
      
      // Query systems that are children of each selected module
      for (const modulePath of selectedModules) {
        // Build query to find systems under this module
        // Format: (ChildOf, module_path), System
        // (ChildOf, modules.movement), flecs.system.System
        const query = `(ChildOf, ${modulePath}), flecs.system.System`;
        //const query = `System`;
        console.log("Systems query: ", query);
        
        try {
          const data = await connection.query(query);
          console.log("Systems data: ", data);
          
          if (data.results.length > 0) {
            for (const entity of data.results) {
              const systemName = entity.name || entity.path;
              if (systemName && systemName !== 'System') {
                // Check if already added (avoid duplicates if overlapping queries)
                if (!systems.find(s => s.name === systemName)) {
                  systems.push({
                    name: systemName,
                    module: this.extractModule(systemName)
                  });
                }
              }
            }
          } else {
            throw new Error("No systems found");
          }
        } catch (error) {
          console.warn(`Could not fetch systems for module ${modulePath}:`, error);
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
  static async getComponents(connection: FlecsAsync, selectedModules?: string[]): Promise<FlecsComponent[]> {
    try {
      const components: FlecsComponent[] = [];
      
      // If no modules selected, return empty array
      if (!selectedModules || selectedModules.length === 0) {
        return components;
      }
      
      // Query components that are children of each selected module
      for (const modulePath of selectedModules) {
        // Build query to find components under this module
        // Format: (ChildOf, module_path), Component
        // (ChildOf, modules.movement), flecs.core.Component
        const query = `(ChildOf, ${modulePath}), flecs.core.Component`;
        
        try {
          const data = await connection.query(query);
          
          if (data.results && data.results.length > 0) {
            for (const entity of data.results) {
              const componentName = entity.name || entity.path;
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
                  module: modulePath,//this.extractModule(componentName),
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
      
      // Sort components by name for better UX
      return components.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching components:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific component including its fields
   */
  static async getComponentInfo(
    connection: FlecsAsync, 
    componentName: string)
  : Promise<ComponentField[]> {
    try {
      // Try to get component metadata using Flecs connection
      const data = await connection.query(
        `(ChildOf, ${componentName})`, {type_info:true, values:true});
      // TODO: get flecs.meta.member component of each member?
      const fields: ComponentField[] = [];
      
      console.log("getComponentInfo for " + componentName + ": ", data);
      
      // Try to extract field information from component metadata
      // This is a best-effort approach as Flecs REST API might not expose all field details
      for (const member of data.results) {
        const entityName = componentName + "." + member.name;
        const data = await connection.entity(entityName, {type_info:true, values:true})
        console.log("getComponentInfo member for " + member.name + ": ", data);
        
        const memberDef = data.components["flecs.meta.member"];
        if (!memberDef) {
          throw new Error(`Member definition missing for ${entityName}`);
        }
        
        const typeParts = memberDef.type.split('.');
        const memberType = typeParts[typeParts.length - 1];
        console.log("-------- type: ", memberDef.type);
        console.log("-------- type1: ", memberType);
        
        fields.push({
          name: member.name,
          type: memberType,
          defaultValue: this.getDefaultValueForType(memberType) // TODO: is it correct?
        });
      }
      return fields;
    } catch (error) {
      throw new Error(`Error fetching component info for ${componentName}: ${error}`);
    }
  }

  /**
   * Extract module name from entity path (e.g., "modules.movement.Position" -> "modules.movement")
   */
  private static extractModule(entityPath: string): string | undefined {
    if (!entityPath || !entityPath.includes('.')) {
      return undefined;
    }
    
    const parts = entityPath.split('.');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('.');
    }
    
    return undefined;
  }

  /**
   * Get a default value for a component field based on its type
   */
  static getDefaultValueForType(type: string): any {
    switch (type.toLowerCase()) {
      case 'float':
      case 'double':
      case 'f32':
      case 'f64':
        return 0.0;
      case 'int':
      case 'integer':
      case 'i32':
      case 'i64':
      case 'u32':
      case 'u64':
      case 'int32':
      case 'int64':
      case 'uint32':
      case 'uint64':
        return 0;
      case 'bool':
      case 'boolean':
        return false;
      case 'string':
      case 'str':
        return "";
      default:
        return "";
    }
  }

  /**
   * Format a value for JSON serialization based on its type
   */
  static formatValueForType(value: any, type: string): any {
    switch (type.toLowerCase()) {
      case 'float':
      case 'double':
      case 'f32':
      case 'f64':
        return parseFloat(value) || 0.0;
      case 'int':
      case 'integer':
      case 'i32':
      case 'i64':
      case 'u32':
      case 'u64':
      case 'int32':
      case 'int64':
      case 'uint32':
      case 'uint64':
        return parseInt(value) || 0;
      case 'bool':
      case 'boolean':
        return value === 'true' || value === true;
      case 'string':
      case 'str':
        return String(value);
      default:
        return value;
    }
  }
}