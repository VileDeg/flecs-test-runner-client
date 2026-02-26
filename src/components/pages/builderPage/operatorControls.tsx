import React, { useState, useEffect } from "react";
import { X } from "lucide-react"; // Import Lucide icon
import { OperatorType } from "@/common/coreTypes";
import { OperatorDropdown } from "@components/ui/operator-dropdown";
import { LockedToggle } from "@components/ui/locked-toggle";

export interface OperatorControlsProps {
  operatorType: OperatorType | null;
  supportedOperators: OperatorType[];
  onOperatorTypeChange: (type: OperatorType | null) => void;
}

export const OperatorControls: React.FC<OperatorControlsProps> = ({
  operatorType,
  supportedOperators,
  onOperatorTypeChange,
}) => {
  const getDefaultSupportedOperator = () => {
    return supportedOperators.find(t => t === OperatorType.Eq) ?? supportedOperators[0];
  };

  const defaultOperator = getDefaultSupportedOperator();
  const [locked, setLocked] = useState<boolean>(true);

  useEffect(() => {
    setLocked(!operatorType);
  }, [operatorType]);

  // Early return for unsupported state
  if (!defaultOperator) {
    return (
      <div 
        className="flex items-center justify-center w-8 h-8 ml-4 text-slate-400 hover:text-slate-500 transition-colors cursor-help" 
        title="No operators supported"
      >
        <X size={18} strokeWidth={2.5} />
      </div>
    );
  }

  const renderLockedToggle = () => (
    <LockedToggle
      locked={locked}
      onChange={(isLocked) => {
        onOperatorTypeChange(!isLocked && defaultOperator ? defaultOperator : null);
      }}
      title={locked ? "Operator disabled" : "Operator enabled"}
    />
  );

  const renderOperatorDropdown = () => (
    <OperatorDropdown
      value={operatorType ?? defaultOperator}
      onChange={onOperatorTypeChange}
      supportedOperators={supportedOperators}
      disabled={locked}
    />
  );

  return (
    <div className="flex items-center gap-2 ml-4">
      {renderLockedToggle()}
      {!locked && renderOperatorDropdown()}
    </div>
  );
};