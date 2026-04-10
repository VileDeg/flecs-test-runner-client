export type ValidatePredicate<T> = (parsed: any) => parsed is T;
export function get<T>(key: string, validator: ValidatePredicate<T>, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (validator(parsed)) {
        return parsed;
      } else {
        console.error("Invalid structure of parsed value");
      }
    }
  } catch (error) {
    console.error("Failed to load workspace tests from localStorage:", error);
  }
  return defaultValue;
}; 

export function set<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save " + key + " to localStorage:", error);
  }
}; 
