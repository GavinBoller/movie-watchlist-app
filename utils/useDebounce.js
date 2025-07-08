import { useState, useEffect } from 'react';

/**
 * A custom hook that implements debounce functionality for input values
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

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

/**
 * A custom hook that returns both the immediate value and debounced value
 * for input fields, along with an onChange handler
 * @param {string} initialValue - The initial value
 * @param {number} delay - The delay in milliseconds
 * @returns {object} Object containing value, debouncedValue, and onChange
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  return {
    value,
    debouncedValue,
    onChange,
    setValue
  };
}
