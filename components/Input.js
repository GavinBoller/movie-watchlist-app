import { forwardRef } from 'react';

const Input = forwardRef(({ id, className, placeholder, onChange, ...props }, ref) => {
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