/**
 * @file
 * Types that mirror C++ types in core.
 */
export interface SystemInvocation {
  name: string; // Full path: module.system_name. Must be unique
  timesToRun: number;
}

export type ComponentFieldsArray = ComponentFieldValue[];
export type ComponentFieldValuePrimitive = string | number;
export type ComponentFieldValue =
  | ComponentFieldValuePrimitive
  | ComponentFields
  | ComponentFieldsArray;

export function isComponentFieldValuePrimitive(
  value: unknown,
): value is ComponentFieldValuePrimitive {
  return typeof value === "string" || typeof value === "number";
}

export interface ComponentFields {
  [key: string]: ComponentFieldValue;
}

export type Components = Record<string, ComponentFields>;

export interface Entity {
  name: string;
  components: Components;
}

export type WorldConfiguration = Entity[];

export type SerializedEntities = string[];

export interface SerializedWorld {
  results: Entity[];
}

export const OperatorType = {
  Eq: "EQ",
  Neq: "NEQ",
  Lt: "LT",
  Lte: "LTE",
  Gt: "GT",
  Gte: "GTE",
} as const;

export type OperatorType = (typeof OperatorType)[keyof typeof OperatorType];

export interface OperatorPath {
  path: string;
}

export interface Operator {
  path: OperatorPath;
  type: OperatorType;
}

export interface UnitTest {
  name: string;

  systems: SystemInvocation[];

  initialConfiguration: SerializedEntities;
  expectedConfiguration: SerializedEntities;

  operators: Operator[];
}

export interface Executed {
  statusMessage: string;
}
export interface Incomplete {
  worldExpectedSerialized: string;
}
