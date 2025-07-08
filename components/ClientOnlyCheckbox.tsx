// @ts-nocheck
'use client';

import React from 'react';
import { Checkbox } from './ui/checkbox';

interface ClientOnlyCheckboxProps {
  id: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export default function ClientOnlyCheckbox({
  id,
  checked,
  disabled,
  onCheckedChange,
  className = ''
}: ClientOnlyCheckboxProps): React.ReactElement {
  // Ensure disabled is always a boolean
  const isDisabled = disabled === true;
  
  return (
    <Checkbox
      id={id}
      checked={checked}
      disabled={isDisabled}
      onCheckedChange={onCheckedChange}
      className={className}
    />
  );
}
