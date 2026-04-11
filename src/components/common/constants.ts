import type { OperatorType } from "@/common/coreTypes";

export const OPERATOR_LABELS: Record<OperatorType, string> = {
  EQ: "==",
  NEQ: "!=",
  LT: "<",
  LTE: "<=",
  GT: ">",
  GTE: ">=",
} as const;

export const ALL_OPERATORS: OperatorType[] = [
  "EQ",
  "NEQ",
  "LT",
  "LTE",
  "GT",
  "GTE",
];
export const ENTITY_OPERATORS: OperatorType[] = ["EQ", "NEQ"];
