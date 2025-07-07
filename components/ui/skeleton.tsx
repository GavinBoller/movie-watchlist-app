// @ts-nocheck
'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-700', className)}
      {...props}
    />
  );
}