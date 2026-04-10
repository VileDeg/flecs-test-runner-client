import { Fragment} from "react";
import { Checkbox } from "@components/ui/checkbox";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Minus } from "lucide-react";

import type { 
  ComponentField,
  ComponentFieldValue,
  ComponentFieldValuePrimitive,
  ComponentFieldsArray,
  ComponentFields,
} from "@/common/types";

import { OperatorType } from "@/common/coreTypes";

import { 
  isComponentStructureEqual,
  isComponentFieldValueArray,
  isComponentFieldValuePrimitive,
  isComponentFieldEnum,
} from "@/common/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";


import { FlecsMetadataService } from "@common/flecsMetadataService.ts";
import { OperatorControls } from "@components/pages/builderPage/operatorControls";
import { OPERATOR_PATH_SEP } from "@/common/constants";
import { useBuilder } from "@/contexts/builderContext";

export interface ComponentFieldBuilderProps {
  field: ComponentField;
  onUpdate: (field: ComponentField) => void;
  fieldPath: string; // Parent path + field name
  isExpected: boolean;
}
export const ComponentFieldBuilder: React.FC<ComponentFieldBuilderProps> = ({
  field,
  onUpdate,
  fieldPath,
  isExpected,
}) => {

  const {
    availableComponents,
    onOperatorChanged,
    getOperatorType
  } = useBuilder();

  const getFieldName = () => {
    return fieldPath.split(OPERATOR_PATH_SEP).at(-1) ?? fieldPath;
  }

  // Conveniece accessor
  const fieldName = getFieldName();
  
  const onUpdateValueDict = (name: string, newValue: ComponentFieldValue) => {
    console.log("onUpdateValueDict newValue: ", newValue);
    const newField = {...field};
    (newField.value as ComponentFields)[name].value = newValue; 
    onUpdate(newField)
  }

  // TODO: dont need name param?
  const onUpdateValueArrayElement = (name: string, index: number, newValue: ComponentFieldValue) => {
    console.log("onUpdateValueArrayElement newValue: ", newValue);

    const newField = {...field};
    // TODO: need to do a copy before?
    (newField.value as ComponentFieldsArray)[index].value = newValue;
    onUpdate(newField)
  }

  const renderFieldPrimitive = (name: string, field: ComponentField) => {
    const value = field.value as ComponentFieldValuePrimitive;
    if(isComponentFieldEnum(field)) {
      return renderFieldEnum(name, value, field.enumValues!);
    }
    const isBoolean = FlecsMetadataService.isBooleanType(field.type);
    
    return isBoolean 
      ? renderFieldCheckbox(name, Boolean(field.value))
      : renderFieldInput(name, value)
  }

  const renderFieldInput = (name: string, value: ComponentFieldValuePrimitive) => {
    const stringValue = String(value ?? "");
    
    return (
      <div className="inline-block">
        <Input
          value={value}
          onChange={(e) => {
            const newField = { ...field, value: e.target.value };
            onUpdate(newField);
          }}
          // Sets width based on character count + a little padding
          style={{ width: `${stringValue.length + 2}ch` }}
          // min-w-[40px] ensures it doesn't vanish if the value is empty
          className="h-8 min-w-[40px] px-2 w-auto"
        />
      </div>
    );
  };

  const renderFieldCheckbox = (name: string, value: boolean) => (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`field-${name}`}
          checked={value}
          onCheckedChange={(checked) => {
            const newField = {...field};
            newField.value = checked ? "true" : "false";
            onUpdate(newField); 
          }}
        />
      </div>
    </div>
  )

  const renderFieldEnum = (name: string, value: string, constants: string[]) => {
    return (
      <Select
        value={value}
        onValueChange={(newValue) => {
          const newField = { ...field, value: newValue };
          onUpdate(newField);
        }}
      >
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder="Select value..." />
        </SelectTrigger>
        <SelectContent>
          {constants.map((constant) => (
            <SelectItem key={constant} value={constant}>
              {constant}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };


  const makeChildFieldPath = (childFieldName: string) => {
    return fieldPath + OPERATOR_PATH_SEP + childFieldName;
  }

  const renderFieldValueDict = (dict: ComponentFields) => {
    if (Object.keys(dict).length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground italic">
          No fields available for this component
        </div>
      );
    }
    
    return (
      <div className="ml-4 pl-4 border-l-2 border-muted/30 bg-muted/5 dark:bg-muted/10 rounded-r space-y-3">
        {Object.entries(dict).map(([name, field]) => {
          return  <Fragment key={name}>
            <ComponentFieldBuilder
              field={field}
              onUpdate={
                (newField) => onUpdateValueDict(name, newField.value)
              }
              fieldPath={makeChildFieldPath(name)}
              isExpected={isExpected}
            />
          </Fragment>
        })}
      </div>
    );
  }

  const addArrayElement = (array: ComponentFieldsArray, schema: ComponentField) => {
    const newLen = array.push(structuredClone(schema)) // clone
    console.log("New array length ", newLen);
  }

  const removeArrayElement = (array: ComponentFieldsArray, index: number) => {
    const deleted = array.splice(index, 1);
    console.log("Removed elements: ", deleted);
  }
 
  const renderFieldArray = (name: string, schema: ComponentField, array: ComponentFieldsArray) => {
    return (
      <div className="ml-4 pl-4 border-l-2 border-accent/30 bg-accent/5 dark:bg-accent/10 rounded-r space-y-3">
        {array.map((element, index) => (
          <div key={`${fieldName}-${index}`} className="space-y-2">
            <ComponentFieldBuilder
              field={element}
              onUpdate={
                (newField) => onUpdateValueArrayElement(name, index, newField.value) 
              }
              fieldPath={makeChildFieldPath(`${index}`)}
              isExpected={isExpected}
            />
            <Button 
              variant="outline" 
              onClick={() => removeArrayElement(array, index)}
              className="gap-2 w-full"
            >
              <Minus className="h-4 w-4" />
              Remove Element
            </Button>
          </div>
        ))}
        <div className="flex justify-center pt-2">
          <Button 
            variant="outline" 
            onClick={() => addArrayElement(array, schema)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Element
          </Button>
        </div>
      </div>
    );
  }

  const getAllOperatorTypes = () => {
    return Object.values(OperatorType);
  }

  // TODO: save to state, otherwise done every re-render?
  const getSupportedOperatorsForFields = (fields: ComponentFields) => {
    const comp = availableComponents.find( // operatorProps?.
        comp => isComponentStructureEqual(comp.fields, fields)
      )
    if(!comp) {
      console.error("Failed to match fields ", fields, " to any component")
      return [];
    }

    let supportedOps: OperatorType[] = []
    const ops = comp?.supportedOperators
    if(ops?.cmp) {
      supportedOps = getAllOperatorTypes();
    } else if (ops?.equals) {
      supportedOps.push(OperatorType.Eq, OperatorType.Neq)
    }
    return supportedOps;
  }

  // TODO: save to state, otherwise done every re-render?
  const getSupportedOperators = () => {
    if (isComponentFieldValuePrimitive(field.value)) {
      return isComponentFieldEnum(field) ? [] : getAllOperatorTypes();
    } 
    if (isComponentFieldValueArray(field.value)) {
      // For now assume no operators supported for array
      return []
    } 
    return getSupportedOperatorsForFields(field.value)
  }

  const renderField = (name: string, field: ComponentField) => {
    if (
      isComponentFieldValuePrimitive(field.value) || 
      isComponentFieldEnum(field)
    ) {
      return renderFieldPrimitive(name, field)
    } 
    if (isComponentFieldValueArray(field.value)) {
      return renderFieldArray(name, field.schema!, field.value) // TODO: check if schema exists?
    } 
    return renderFieldValueDict(field.value)
  }

  const handleOperatorTypeChanged = (type: OperatorType | null) => {
    onOperatorChanged(type, fieldPath) // operatorProps?.
  }

  const renderOperatorControls = () => (
    <OperatorControls
      operatorType={getOperatorType(fieldPath)}
      supportedOperators={getSupportedOperators()}
      onOperatorTypeChange={handleOperatorTypeChanged}
    >
    </OperatorControls>
  )

  return (
    <div className="space-y-3">
      <div key={fieldName} className="flex items-start gap-3 p-3 rounded-md bg-background border border-border/50">
        <Label htmlFor={`field-${fieldName}`} className=" text-sm font-medium pt-2">
          {fieldName}:
        </Label>
        
        {renderField(fieldName, field)}
        <div className="ml-auto">  
          {isExpected && renderOperatorControls()}
        </div>
      </div>
    </div>
  );
};