/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */

import type { OperatorType } from "@common/coreTypes";

// Core types
export interface SystemInvocation {
  name: string; // full path: module + system name
  timesToRun: number;
}

export interface Operator {
  path: string;
  type: OperatorType;
}

export interface UnitTest {
  name: string;
  systems: SystemInvocation[];
  initialConfiguration: WorldConfiguration;
  expectedConfiguration: WorldConfiguration;
  operators: Operator[];
}

// TODO: move to core types?
export namespace UnitTest {
  export interface Executed {
    statusMessage: string;
  }
  export interface Passed {}
  export interface Incomplete {
    worldExpectedSerialized: string;
  }

}

// Properties used by builder
export interface UnitTestProps {
  test: UnitTest,
  selectedModules: Module[],
}

/**
 * Standard Prototype Check
 * Returns true only if the object was created via 'new Module()'
 */
export function isModule(obj: unknown): obj is Module {
  return obj instanceof Module;
}

/**
 * Structural Check (Duck Typing)
 * Returns true if the object has the shape of a Module, 
 * even if the prototype was lost (e.g., via structuredClone or JSON.parse).
 */
export function isModuleStructural(obj: any): obj is Module {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof obj.fullPath === "string"
  );
}

export function isUnitTestProps(obj: any): obj is UnitTestProps {
  const test = obj.test;
  return (
    typeof obj === "object" &&

    obj.selectedModules !== null &&
    Array.isArray(obj.selectedModules) &&

    obj.selectedModules.every((module: any) => isModuleStructural(module)) &&
    
    obj !== null &&
    typeof test === "object" &&
    
    test !== null &&
    typeof test.name === "string" &&

    test.systems !== null &&
    Array.isArray(test.systems) &&

    test.initialConfiguration !== null &&
    Array.isArray(test.initialConfiguration) &&

    test.expectedConfiguration !== null &&
    Array.isArray(test.expectedConfiguration) &&

    test.operators !== null &&
    Array.isArray(test.operators)
  );
}

// General types
export class Module { // TODO: convert to simple type (not class)
  fullPath: string;

  constructor(fullPath: string) {
    this.fullPath = fullPath;
  }

  getName(): string {
    return this.fullPath.split('.').pop() ?? '';
  }

  equals(other: Module): boolean {
    return other.fullPath == this.fullPath;
  }
}

export interface System {
  name: string;
  module: Module;
}

// name : field
export type ComponentFields = Record<string, ComponentField>
export type ComponentFieldsRaw = Record<string, ComponentFieldValue> 

export type ComponentBody = ComponentFields;

export type ComponentFieldsArray = ComponentField[]; //ComponentFieldValue[];

export type ComponentFieldValuePrimitive = string;
export type ComponentFieldValue = 
  ComponentFieldValuePrimitive | ComponentFields | ComponentFieldsArray;

export interface ComponentField {
  // We only know the actual type for the primitive
  type: string;
  value: ComponentFieldValue;

  // For vector and array to know what the element looks like
  schema?: ComponentField;
  enumValues?: string[];
}

// TODO: difference between equals and cmp
export interface SupportedOperators {
  equals: boolean;
  cmp: boolean;
}

export function isComponentStructureEqual(
  a: ComponentFieldValue,
  b: ComponentFieldValue
): boolean {
  // 1. Handle Primitive Case (string)
  if (typeof a === 'string' || typeof b === 'string') {
    return true; // don't check the value
    //return a === b;
  }

  // 2. Handle Array Case (ComponentFieldsArray)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // Recursively check each field in the array
    return a.every((field, index) => isFieldStructureEqual(field, b[index]));
  }

  // 3. Handle Dictionary Case (ComponentFields / Record)
  if (
    typeof a === 'object' && a !== null &&
    typeof b === 'object' && b !== null &&
    !Array.isArray(a) && !Array.isArray(b)
  ) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }
    
    return keysA.every(key => {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      return isFieldStructureEqual(a[key], b[key]);
    });
  }

  // Types mismatch (e.g., one is string, one is array)
  return false;
}

/**
 * Helper to compare the ComponentField wrapper objects
 */
export function isFieldStructureEqual(a: ComponentField, b: ComponentField): boolean {
  // Compare the explicit 'type' property
  if (a.type !== b.type) return false;

  // Recursively check the schema structure if it exists
  if (!!a.schema !== !!b.schema) return false;
  if (a.schema && b.schema) {
    return isFieldStructureEqual(a.schema, b.schema);
  }

  // Recurse into the value structure (ignoring the literal value, checking its shape)
  return isComponentStructureEqual(a.value, b.value);
}

export function isSupportedOperators(value: any): value is SupportedOperators {
  return value.equals !== undefined && typeof value.equals === "boolean" &&
    value.cmp !== undefined && typeof value.cmp === "boolean";
}

export interface ComponentHeader {
  id: string;
  name: string;
  module: Module;
  supportedOperators: SupportedOperators;
}

export function isComponentFieldValuePrimitive(
  value: ComponentFieldValue
): value is ComponentFieldValuePrimitive {
  return typeof value === "string";
}

export function isComponentFieldValueArray(
  value: ComponentFieldValue
): value is ComponentFieldsArray {
  return Array.isArray(value);
}

export function isComponentFieldValueDict(
  value: ComponentFieldValue
): value is ComponentFields {
  return !isComponentFieldValuePrimitive(value) && !isComponentFieldValueArray(value);
}


export function isComponentFieldEnum(
  field: ComponentField
): boolean {
  return field.type === "enum" &&
    isComponentFieldValuePrimitive(field.value) && 
    field.enumValues !== undefined;
}

const PATH_DELIM = '.';


// Allows to return something by processing each field
// Or return nothing?
export type ComponentFieldCallback<T> = 
  (name: string, field: ComponentField, path: string) => GenericFieldValue<T>; 

// T is the primitive type
export interface GenericFieldRecord<T> {
  [key: string]: GenericFieldValue<T>;
}

export type GenericFieldArray<T> = GenericFieldValue<T>[] // GenericFieldValue<T>
export type GenericFieldValue<T> = GenericFieldRecord<T> | GenericFieldArray<T> | T 

// It can be used for example to return each field's value and get it as a dict
export function iterateComponentField<T>(
  field: ComponentField, 
  parent: string,
  func: ComponentFieldCallback<T>
): GenericFieldValue<T> {
  const value = field.value;

  if (isComponentFieldValuePrimitive(value)) {
    const parts = parent.split('.')
    const name = parts.length > 0 ? parts[-1] : ""
    //    console.log("iterateComponentField primitive value: ", value);
    return func(name, field, parent)
  } else if (isComponentFieldValueArray(value)) {
    const newArray: GenericFieldArray<T> = []
    value.forEach((element, index) => {
      const suffix = `${index}`;
      const me = parent + PATH_DELIM + suffix
      // TODO: assert schema exists and holds a string
      newArray.push(
        iterateComponentField(element, me, func)
      )
    })
    return newArray;
  } else {
    return iterateComponentFieldDict(value, parent, func)
  }
}

export function iterateComponentFieldDict<T>(
  fields: ComponentFields, 
  parent: string,
  func: ComponentFieldCallback<T>
): GenericFieldRecord<T> {
  let fieldsOut: GenericFieldRecord<T> = {}
  for (const [key, field] of Object.entries(fields)) {
    const path = parent + "." + key;

    fieldsOut[key] = iterateComponentField(field, path, func)
  }
  return fieldsOut
}

export type Components = Component[];

export interface Component extends ComponentHeader {
  fields: ComponentFields;
}

export interface EntityHeader {
  id: string; // unique 
  entityName: string;
}

export interface EntityConfiguration extends EntityHeader {
  // TODO: maybe user a record type name : component?
  components: Components;
}

export type WorldConfiguration = EntityConfiguration[];

export type PrimitiveType = boolean | string | number;

// Types retrieved from Flecs query
export interface QueriedEntityFields {
  values: unknown[];
}

export interface QueriedEntity {
  name: string;
  parent: string;
  fields: QueriedEntityFields,
  components: {
    [K in keyof MetaComponentRegistry]?: MetaComponentRegistry[K];
  };
}

export interface MetaMember {
  type: string;
}

export interface MetaComponentRegistry {
  "flecs.meta.member": MetaMember;
}

export interface QueriedComponentFields {
  sources: string[];
  values: any[]; // depends on component type
}

export interface QueriedComponent {
  fields: QueriedComponentFields;
}

export type QueryResponseElement = QueriedEntity | QueriedComponent;

export interface QueryResponse {
  results: QueryResponseElement[];
}

export type TypeInfoResponseEntryValueLeafValue = string | number;
export type TypeInfoResponseEntryValueLeaf = 
  [string] | 
  [string, TypeInfoResponseEntryValue] | // In case of array / vector
  TypeInfoResponseEntryValueLeafValue;

export type TypeInfoResponseEntryValue = 
  TypeInfoResponseDict |  // dict in case of struct member
  TypeInfoResponseEntryValueLeaf; // other can be 

export interface TypeInfoResponseDict {
  [key: string]: TypeInfoResponseEntryValue;
}
// TODO: not sure about array, check serialized array JSON
export type TypeInfoResponseArray = (TypeInfoResponseEntryValueLeaf | TypeInfoResponseDict)[];

export type TypeInfoResponse = TypeInfoResponseDict | TypeInfoResponseArray;

export function isTypeInfoLeafValue(value: any): value is TypeInfoResponseEntryValueLeafValue {
  const type = typeof value;
  return type === "string" || type === "number";
}

export function typeInfoLeafValueToString(value: TypeInfoResponseEntryValueLeafValue): string {
  return typeof value === "string" 
    ? value
    : value.toString();
}

export const OperatorLevel = {
  Entity: 'entity',
  Component: 'component',
  Property: 'field',
} as const;
export type OperatorLevel = (typeof OperatorLevel)[keyof typeof OperatorLevel];

// 1. Erasable "Enum" Replacement
export const MessageType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface TestValidationResult {
  message: string,
  type?: MessageType
}
