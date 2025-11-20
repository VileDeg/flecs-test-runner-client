// Service for fetching Flecs metadata like available systems and components
import { BASE_URL } from "./constants";

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

export class FlecsMetadataService {
  /**
   * Fetch all available systems from the Flecs application
   */
  static async getSystems(): Promise<FlecsSystem[]> {
    try {
      // Query for all systems using Flecs REST API
      // This queries for entities that have the System component
      const response = await fetch(`${BASE_URL}/query?q=System`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch systems: ${response.statusText}`);
      }
      
      const data = await response.json();
      const systems: FlecsSystem[] = [];
      
      if (data.results) {
        for (const entity of data.results) {
          const systemName = entity.name || entity.path;
          if (systemName && systemName !== 'System') { // Exclude the System component itself
            systems.push({
              name: systemName,
              module: this.extractModule(systemName)
            });
          }
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
   * Fetch all available components from the Flecs application
   */
  static async getComponents(): Promise<FlecsComponent[]> {
    try {
      // Query for all components using Flecs REST API
      // This queries for entities that have the Component component
      const response = await fetch(`${BASE_URL}/query?q=Component`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch components: ${response.statusText}`);
      }
      
      const data = await response.json();
      const components: FlecsComponent[] = [];
      
      if (data.results) {
        for (const entity of data.results) {
          const componentName = entity.name || entity.path;
          if (componentName && componentName !== 'Component') { // Exclude the Component component itself
            // Try to get component metadata to discover fields
            const componentInfo = await this.getComponentInfo(componentName);
            
            components.push({
              name: componentName,
              module: this.extractModule(componentName),
              fields: componentInfo.fields || []
            });
          }
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
  static async getComponentInfo(componentName: string): Promise<FlecsComponent> {
    try {
      // Try to get component metadata
      const response = await fetch(`${BASE_URL}/entity/${encodeURIComponent(componentName)}`);
      
      if (!response.ok) {
        // If we can't get detailed info, return basic component info
        return {
          name: componentName,
          module: this.extractModule(componentName),
          fields: []
        };
      }
      
      const data = await response.json();
      const fields: ComponentField[] = [];
      
      // Try to extract field information from component metadata
      // This is a best-effort approach as Flecs REST API might not expose all field details
      if (data.type && data.type.members) {
        for (const member of data.type.members) {
          fields.push({
            name: member.name,
            type: member.type || 'unknown',
            defaultValue: member.value
          });
        }
      }
      
      return {
        name: componentName,
        module: this.extractModule(componentName),
        fields
      };
    } catch (error) {
      console.error(`Error fetching component info for ${componentName}:`, error);
      return {
        name: componentName,
        module: this.extractModule(componentName),
        fields: []
      };
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