'use client';

import React from 'react';
import { cn } from '~/lib/utils';

/**
 * Custom alert components for displaying notifications, warnings, and success messages
 * These provide consistent styling and behavior for alerts throughout the application
 */

export interface CustomAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success';
}

export const CustomAlert = ({ 
  className, 
  children, 
  variant = "default", 
  ...props 
}: CustomAlertProps) => {
  const variantStyles = {
    default: "bg-primary/10 border-primary/20 text-primary-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    success: "bg-green-50 border-green-200 text-green-800"
  };

  return (
    <div 
      className={cn(
        "relative w-full rounded-lg border p-4 mb-4",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("font-medium leading-none tracking-tight mb-1", className)} {...props}>
    {children}
  </h5>
);

export const AlertDescription = ({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm", className)} {...props}>
    {children}
  </p>
);
