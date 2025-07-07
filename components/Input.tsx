// @ts-nocheck
import React, { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  className?: string;
  placeholder?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ id, className = '', placeholder, onChange, ...props }, ref) => {
  return (
    <input
      id={id}
      className={`border-none outline-none focus:ring-2 focus:ring-blue-600 ${className}`}
      placeholder={placeholder}
      onChange={onChange}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;