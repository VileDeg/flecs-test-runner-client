import {useState, useEffect, Fragment} from "react";
import { Checkbox } from "@components/ui/checkbox";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Minus, Trash2, Package } from "lucide-react";

import type { 
  Component,
  PrimitiveType,
  System,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFieldsArray,
  //ComponentFieldsArrayOfComponents,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  Components,
} from "@/common/types";

import { OperatorType, type ComponentFieldValuePrimitive, type Operator } from "@/common/coreTypes";

import { 
  Module,
  isFieldStructureEqual,
  isComponentStructureEqual,
  isComponentFieldValueArray,
  isComponentFieldValuePrimitive
} from "@/common/types";

import { useToast } from "@/components/common/toast/useToast";

//import * as Utils from "@common/utils.ts"

import { FlecsMetadataService } from "@common/flecsMetadataService.ts";
import { OperatorControls } from "@components/pages/builderPage/operatorControls";
import { ComparisonToggle } from "@components/ui/comparison-toggle";
import { OPERATOR_PATH_SEP } from "@/common/constants";
import { useBuilder } from "@/contexts/builderContext";

/**
 * Props needed for operator controls
 */
// export interface ComponentFieldOperatorProps {
//   isAffectedByAnyUpper: boolean; // passed all the way down
//   availableComponents: Component[]; // to determine supp ops for child
//   //onAnyLowerOperatorEnabled: () => void; // propagated all the way up
//   //onOperatorChanged: (type: OperatorType | null, fullPath: string) => void;
// }

export interface ComponentFieldBuilderProps {
  field: ComponentField;
  onUpdate: (field: ComponentField) => void;
  fieldPath: string; // Parent path + field name
  // Operator management
  //operatorProps?: ComponentFieldOperatorProps;
  isExpected: boolean;
  //entityName?: string;
}
// TODO: rename class
export const ComponentFieldBuilder: React.FC<ComponentFieldBuilderProps> = ({
  field,
  onUpdate,
  fieldPath,
  isExpected,
  //entityName = "",
}) => {

  const {
    availableComponents,
    onOperatorChanged,
    isOperatorEnabled,
    getOperatorType
  } = useBuilder();

  // const [operatorEnabled, setOperatorEnabled] = useState<boolean>(
  //   isExpected ? isOperatorEnabled(fieldPath) : false
  // ); 

  //const operatorEnabled = isOperatorEnabled(fieldPath);

  // useEffect(() => {
  //   const affected = operatorProps?.isAffectedByAnyUpper;
  //   if(affected === undefined) {
  //     return;
  //   }
  //   if(affected) {
  //     setOperatorEnabled(false);
  //   }
  // }, [operatorProps, operatorProps?.isAffectedByAnyUpper, operatorEnabled]);

  // useEffect(() => {
  //   if(!operatorEnabled) {
  //     return;
  //   }

  //   // Notify parent
  //   operatorProps?.onAnyLowerOperatorEnabled();
  //   // const callback = operatorProps?.onAnyLowerOperatorEnabled;
  //   // if(callback) {
  //   //   callback();
  //   // }
  // }, [operatorProps, operatorProps?.onAnyLowerOperatorEnabled, operatorEnabled]);

  const getFieldName = () => {
    //console.log("getFieldName: ", fieldPath.split(OPERATOR_PATH_SEP).at(-1))
    return fieldPath.split(OPERATOR_PATH_SEP).at(-1) ?? fieldPath;
  }

  // Conveniece accessor
  const fieldName = getFieldName();
  
  // Pass signal from child
  // const handleOnAnyLowerOperatorEnabled = () => {
  //   setOperatorEnabled(false);

  //   // Notify parent
  //   operatorProps?.onAnyLowerOperatorEnabled();
  //   // const callback = operatorProps?.onAnyLowerOperatorEnabled;
  //   // if(callback) {
  //   //   callback();
  //   // }
  // }

  
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

  const renderFieldPrimitive = (name: string, type: string, value: ComponentFieldValuePrimitive) => {
    const isBoolean = FlecsMetadataService.isBooleanType(type);
    
    return isBoolean 
      ? renderFieldCheckbox(name, Boolean(value))
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

  // const renderFieldInput = (name: string, value: ComponentFieldValuePrimitive) => (
  //   <div className="w-auto">
  //     <Input
  //       id={`field-ava`} // TODO: ${field.type}
  //       type="text"
  //       value={value as ComponentFieldValuePrimitive}
  //       onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
  //         //console.log("Received value: ", e.target.value);
  //         // const newValue = parseFieldValue(field.type, e.target.value);
  //         // if(newValue == null) {
  //         //   return;
  //         // }
  //         const newField = {...field};
  //         newField.value = e.target.value;

  //         onUpdate(newField); 
  //         // elementIndex ? onUpdateValueArrayElement(name, elementIndex, newValue)
  //         //   :
  //       }}
  //       placeholder={`${name} field`} // TODO: ${field.type}
  //       className=""
  //     />
  //   </div>
  // )

  const renderFieldCheckbox = (name: string, value: boolean) => (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`field-${name}`}
          checked={value}
          onCheckedChange={(checked) => { // TODO: which type is checked here?
            const newField = {...field};
            newField.value = checked ? "true" : "false";
            onUpdate(newField); 
          }}
        />
        {/* <span className="text-sm text-muted-foreground">
          {field.type}
        </span> */}
      </div>
    </div>
  )


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
    
    //console.log("renderFieldValueDict: ", dict);
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
              //operatorProps={passOperatorProps()}
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
    //console.log("renderFieldArray: schema: ", schema);
    //console.log("renderFieldArray: array: ", array);
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
              //operatorProps={passOperatorProps()}
              //entityName={entityName}
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
    // Object.values(OperatorType)
    //   .filter((v): v is OperatorType => typeof v === "number");
  }

  // TODO: save to state, otherwise done every re-render?
  const getSupportedOperatorsForFields = (fields: ComponentFields) => {
    const comp = availableComponents.find( // operatorProps?.
        comp => isComponentStructureEqual(comp.fields, fields)
      )
    if(!comp) {
      console.error("Failed to match fields ", fields, " to any component")
      console.log("Available comps: ", availableComponents)
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
      return getAllOperatorTypes();
    } 
    if (isComponentFieldValueArray(field.value)) {
      // For now assume no operators supported for array
      return []
    } 
    return getSupportedOperatorsForFields(field.value)
  }

  const renderField = (name: string, field: ComponentField) => {
    //console.log("renderFieldImpl field: ", field)
    if (isComponentFieldValuePrimitive(field.value)) {
      return renderFieldPrimitive(name, field.type, field.value)
    } 
    if (isComponentFieldValueArray(field.value)) {
      return renderFieldArray(name, field.schema!, field.value) // TODO: check if schema exists?
    } 
    //console.log("renderFieldValueDict value: ", field.value);
    return renderFieldValueDict(field.value)
  }

  const handleOperatorTypeChanged = (type: OperatorType | null) => {
    //setOperatorEnabled(type !== null);
    onOperatorChanged(type, fieldPath) // operatorProps?.
    // if(type) {
    //   operatorProps?.onAnyLowerOperatorEnabled()
    // }
  }

  const renderOperatorControls = () => (
    <OperatorControls
      //operatorDisabled={!operatorEnabled}
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