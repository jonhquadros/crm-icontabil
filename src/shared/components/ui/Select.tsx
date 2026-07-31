import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        {icon && (
          <div className="absolute left-3 text-muted-foreground">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            "h-9 appearance-none bg-background border border-input rounded-md pl-3 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={14} className="absolute right-3 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";
