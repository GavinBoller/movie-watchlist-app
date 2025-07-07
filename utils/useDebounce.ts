// @ts-nocheck
import { useState, useEffect, ChangeEvent } from 'react';

/**
 * A custom hook that implements debounce functionality for input values
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if the value changes before the delay has elapsed
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface DebouncedSearchReturn {
  value: string;
  debouncedValue: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
}

/**
 * A custom hook that returns both the immediate value and debounced value
 * for input fields, along with an onChange handler
 */
export function useDebouncedSearch(
  initialValue: string = '', 
  delay: number = 300
): DebouncedSearchReturn {
  const [value, setValue] = useState<string>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return {
    value,
    debouncedValue,
    onChange,
    setValue
  };
}
