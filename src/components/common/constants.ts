import type { OperatorType } from "@/common/coreTypes";

export const OPERATOR_LABELS: Record<OperatorType, string> = {
  EQ: "==",
  NEQ: "!=",
  LT: "<",
  LTE: "<=",
  GT: ">",
  GTE: ">=",
} as const;
