/**
 * @file
 * Types used by FTR Client application.
 */

import type { SystemInvocation, OperatorType } from "@common/coreTypes";
import { FLECS_PATH_SEP } from "./constants";

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

/**
 * Properties used by builder
 */
export interface UnitTestProps {
  test: UnitTest;
  selectedModules: string[];
}

export function isUnitTestProps(obj: unknown): obj is UnitTestProps {
  if (typeof obj !== "object" || obj === null) return false;

  const candidate = obj as Record<string, unknown>;
  const test = candidate.test as Record<string, unknown> | undefined;

  return (
    Array.isArray(candidate.selectedModules) &&
    candidate.selectedModules.every((mod) => typeof mod === "string") &&
    typeof test === "object" &&
    test !== null &&
    typeof test.name === "string" &&
    Array.isArray(test.systems) &&
    Array.isArray(test.initialConfiguration) &&
    Array.isArray(test.expectedConfiguration) &&
    Array.isArray(test.operators)
  );
}

export interface System {
  name: string;
  module: string;
}

/**
 * Name: Field
 */
export type ComponentFields = Record<string, ComponentField>;

export type ComponentFieldsArray = ComponentField[];
export type ComponentFieldValuePrimitive = string;

export type ComponentFieldValue =
  | ComponentFieldValuePrimitive
  | ComponentFields
  | ComponentFieldsArray;

export interface ComponentField {
  /**
   * We only know the actual type for the primitive.
   * If field is a component, type is unknown.
   */
  type: string;
  value: ComponentFieldValue;
  /**
   * For vector and array to know what the element looks like.
   */
  schema?: ComponentField;
  /**
   * For the enum type, list of possible values.
   */
  enumValues?: string[];
}

export interface ComponentHeader {
  id: string;
  name: string;
  module: string;
  supportedOperators: SupportedOperators;
}

export interface Component extends ComponentHeader {
  fields: ComponentFields;
}
export type Components = Component[];

/**
 * Captures the presence of on_equals, on_compare Flecs hooks.
 */
export interface SupportedOperators {
  equals: boolean;
  cmp: boolean;
}

export function isSupportedOperators(
  value: unknown,
): value is SupportedOperators {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.equals === "boolean" && typeof candidate.cmp === "boolean"
  );
}

/**
 * Compare the structure of two component fields.
 */
export function isComponentStructureEqual(
  a: ComponentFieldValue,
  b: ComponentFieldValue,
): boolean {
  // Primitive
  if (typeof a === "string" || typeof b === "string") {
    // Don't check the value, we only care about structure.
    return true;
  }

  // Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // Recursively check each field in the array
    return a.every((field, index) => isFieldStructureEqual(field, b[index]));
  }

  // Dictionary
  if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every((key) => {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      return isFieldStructureEqual(a[key], b[key]);
    });
  }

  // Types mismatch (e.g., one is string, one is array)
  return false;
}

export function isFieldStructureEqual(
  a: ComponentField,
  b: ComponentField,
): boolean {
  if (a.type !== b.type) {
    return false;
  }

  // Recursively check the schema structure if it exists
  if (!!a.schema !== !!b.schema) {
    return false;
  }
  if (a.schema && b.schema) {
    return isFieldStructureEqual(a.schema, b.schema);
  }

  // Recurse into the value structure (ignoring the literal value, checking its shape)
  return isComponentStructureEqual(a.value, b.value);
}

export function isComponentFieldValuePrimitive(
  value: ComponentFieldValue,
): value is ComponentFieldValuePrimitive {
  return typeof value === "string";
}

export function isComponentFieldValueArray(
  value: ComponentFieldValue,
): value is ComponentFieldsArray {
  return Array.isArray(value);
}

export function isComponentFieldValueDict(
  value: ComponentFieldValue,
): value is ComponentFields {
  return (
    !isComponentFieldValuePrimitive(value) && !isComponentFieldValueArray(value)
  );
}

export function isComponentFieldEnum(field: ComponentField): boolean {
  return (
    field.type === "enum" &&
    isComponentFieldValuePrimitive(field.value) &&
    field.enumValues !== undefined
  );
}

// Allows to return something by processing each field
// Or return nothing?
export type ComponentFieldCallback<T> = (
  name: string,
  field: ComponentField,
  path: string,
) => GenericFieldValue<T>;

// T is the primitive type
export interface GenericFieldRecord<T> {
  [key: string]: GenericFieldValue<T>;
}

export type GenericFieldArray<T> = GenericFieldValue<T>[]; // GenericFieldValue<T>
export type GenericFieldValue<T> =
  | GenericFieldRecord<T>
  | GenericFieldArray<T>
  | T;

// It can be used for example to return each field's value and get it as a dict
export function iterateComponentField<T>(
  field: ComponentField,
  parent: string,
  func: ComponentFieldCallback<T>,
): GenericFieldValue<T> {
  const value = field.value;

  if (isComponentFieldValuePrimitive(value)) {
    const parts = parent.split(".");
    const name = parts.length > 0 ? parts[-1] : "";
    return func(name, field, parent);
  } else if (isComponentFieldValueArray(value)) {
    const newArray: GenericFieldArray<T> = [];
    value.forEach((element, index) => {
      const suffix = `${index}`;
      const me = parent + FLECS_PATH_SEP + suffix;
      // TODO: assert schema exists and holds a string
      newArray.push(iterateComponentField(element, me, func));
    });
    return newArray;
  } else {
    return iterateComponentFieldDict(value, parent, func);
  }
}

export function iterateComponentFieldDict<T>(
  fields: ComponentFields,
  parent: string,
  func: ComponentFieldCallback<T>,
): GenericFieldRecord<T> {
  const fieldsOut: GenericFieldRecord<T> = {};
  for (const [key, field] of Object.entries(fields)) {
    const path = parent + "." + key;

    fieldsOut[key] = iterateComponentField(field, path, func);
  }
  return fieldsOut;
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

export const PRIMITIVE_TYPE_DEFAULT_VALUES: Record<string, PrimitiveType> = {
  boolean: false,
  int: 0,
  char: 97, // 'a'
  float: 0,
  string: "",
  text: "",
};

// Types retrieved from Flecs query
export interface QueriedEntityFields {
  values: unknown[];
}

export interface QueriedEntity {
  name: string;
  parent: string;
  fields: QueriedEntityFields;
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
  values: unknown[]; // depends on component type
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
  | [string]
  | [string, TypeInfoResponseEntryValue] // In case of array / vector
  | TypeInfoResponseEntryValueLeafValue;

export type TypeInfoResponseEntryValue =
  | TypeInfoResponseDict // dict in case of struct member
  | TypeInfoResponseEntryValueLeaf; // other can be

export interface TypeInfoResponseDict {
  [key: string]: TypeInfoResponseEntryValue;
}
// TODO: not sure about array, check serialized array JSON
export type TypeInfoResponseArray = (
  | TypeInfoResponseEntryValueLeaf
  | TypeInfoResponseDict
)[];

// Can be 0 when component does not have type info (e.g. empty Component/Tag)
export type TypeInfoResponse =
  | TypeInfoResponseDict
  | TypeInfoResponseArray
  | number;

export function isTypeInfoLeafValue(
  value: unknown,
): value is TypeInfoResponseEntryValueLeafValue {
  const type = typeof value;
  return type === "string" || type === "number";
}

export function typeInfoLeafValueToString(
  value: TypeInfoResponseEntryValueLeafValue,
): string {
  return typeof value === "string" ? value : value.toString();
}

export const MessageType = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface TestValidationResult {
  message: string;
  type?: MessageType;
}
