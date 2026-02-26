import type {
  UnitTest, 
  Component,
  ComponentField,
  ComponentFieldValuePrimitive,
  EntityConfiguration,
  WorldConfiguration,
  System,
  TestValidationResult,
} from "@/common/types";

import { 
  iterateComponentFieldDict
} from "@/common/types";

import { FlecsMetadataService } from "@common/flecsMetadataService.ts";
import { TestRunner } from "@common/testRunner.ts";
import type { FlecsAsync } from "./flecsConnection/flecsAsync";

export function downloadJson<T> (item: T, filename: string) {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateComponentField(_: string, field: ComponentField, path: string, messages: string[]) {
  try {
    String(FlecsMetadataService.parseValueForPrimitiveType(
      field.type, 
      field.value as ComponentFieldValuePrimitive)
    );
  } catch(err) {
    console.log("Invalid value");
    const message = `${path}: invalid value "${field.value}" for type "${field.type}"`
    messages.push(message);

  } 
}

// function getComponentFullName(comp: Component) {
//   return comp.module.fullPath.trim() + comp.name.trim() 
// }

export function validateComponents(
  components: Component[],
  availableComponents: Component[],
): string[] {
  let all: string[] = [];
  if(components.length < 1) {
    all.push("Does not have components")
  }
  components.forEach((component: Component) => {
    if(!availableComponents.find(
      avComp => avComp.id === component.id
    )) {
      all.push(`Component ${component.name} from module ${component.module.fullPath} is not available`)
    }
    
    let messages: string[] = [];
    iterateComponentFieldDict(
      component.fields, 
      component.name, 
      (...args) => validateComponentField(...args, messages)
    );

    all.push(...messages)
  })
  return all
}

export function validateEntities(
  entities: WorldConfiguration,
  availableComponents: Component[],
): string[] {
  let all: string[] = [];
  entities.forEach((entity: EntityConfiguration, index: number) => {
    if(entity.entityName.length < 1) {
      all.push(`Entity "${index}" does not have a name`)
    }
    let messages = validateComponents(entity.components, availableComponents);
    
    const prefix = `${entity.entityName.length > 0 ? entity.entityName : "Entity " + index}: `;
    messages = messages.map((msg) => msg = prefix + msg)
    all.push(...messages)
  })
  return all
}


function findDuplicates(arr: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return Array.from(duplicates);
};

export function validateConfiguration(
  entities: WorldConfiguration, 
  availableComponents: Component[],
  isExpected: boolean = false
): string[] {
  const name = `${isExpected ? "Expected" : "Initial"}`;

  let all: string[] = []
  if(entities.length < 1) {
    all.push(`${name} configuration can not be empty`)
  } else {
    const prefix = `${name}: `;
    const duplicates = findDuplicates(entities.map(e => e.entityName.trim()));
    if(duplicates.length > 0) {
      const msg = prefix + `Entities must have unique names, duplicates: ${duplicates.join(", ")}`
      all.push(msg)
    }

    let messages = validateEntities(entities, availableComponents);
    messages = messages.map((msg) => msg = prefix + msg)
    all.push(...messages)
  }
  return all;
}


// TODO: filter out unavailable systems and components.
export function validateTest(
  test: UnitTest, 
  availableSystems: System[],
  availableComponents: Component[],
  validateExpected: boolean = true
) : TestValidationResult[] {
  let all: string[] = []
  if (!test.name.trim()) {
    all.push("Test name is missing")
  }
  if (test.systems.length === 0) {
    all.push("At least one system is required")
  }

  const availableSystemNamesSet = new Set(availableSystems.map(system => system.module.fullPath + "." + system.name))
  test.systems.forEach(system => {
    const systemName = system.name.trim()
    if(!systemName) {
      all.push("All systems must have names")
    }
    if(!availableSystemNamesSet.has(systemName)) {
      all.push(`System ${systemName} is not available`)
    }
  })

  all.push(...validateConfiguration(test.initialConfiguration, availableComponents));
  if (validateExpected) {
    all.push(...validateConfiguration(test.expectedConfiguration, availableComponents, true));
  }
  //all.forEach((msg) => showToast(msg, "error"))

  return all.map(message => {return {message}});
}


// export async function runTest(connection: FlecsAsync, test: UnitTest)
//   : Promise<{ success: boolean; message?: string }> 
// {
//   const testCore = TestRunner.convertTestToCore({...test, name: test.name.trim()});

//     /*
//     // First update the test in workspace
//     const updatedTest = {
//         name: test.name,
//       systems: test.systems,
//       initialConfiguration,
//       expectedConfiguration,
//       operators: test.operators || []
//     };
    
//     updateTest(currentTest.id, { test: updatedTest });
//     */
//   try {  
//     // Then execute the test
//     const testRunner = new TestRunner(connection!);
//     const result = await testRunner.executeTest(testCore);

//     return {
//       success: result.success,
//       message: result.message
//     }
    
//     // if (result.success) {
//     //   showToast(`Test "${test.name}" saved and started successfully`, 'success');
//     // } else {
//     //   showToast(result.message, 'error');
//     // }
//   } catch (error: any) {
//     return {
//       success: false,
//       message: "Error running test: " + error.message
//     }    
//     //console.error("Error running test:", error);
//     //showToast(`Error running test "${test.name}": ${error.message}`, 'error');
//   }
// };

