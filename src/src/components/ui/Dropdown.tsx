import React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;
export const DropdownGroup = DropdownPrimitive.Group;
export const DropdownPortal = DropdownPrimitive.Portal;

export interface DropdownContentProps extends React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content> {
  className?: string;
  sideOffset?: number;
}

export const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  DropdownContentProps
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-surface p-1.5 text-text-main shadow-lg text-start',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </DropdownPrimitive.Content>
  </DropdownPrimitive.Portal>
));
DropdownContent.displayName = DropdownPrimitive.Content.displayName;

export interface DropdownItemProps extends React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> {
  className?: string;
  variant?: 'default' | 'danger';
}

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  DropdownItemProps
>(({ className, variant = 'default', children, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors text-start',
      'focus:bg-surface-hover focus:text-text-main data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      variant === 'danger' && 'text-danger hover:bg-danger-bg hover:text-danger focus:bg-danger-bg focus:text-danger',
      className
    )}
    {...props}
  >
    {children}
  </DropdownPrimitive.Item>
));
DropdownItem.displayName = DropdownPrimitive.Item.displayName;

export const DropdownLabel = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    className={cn('px-3 py-1.5 text-xs font-semibold text-text-muted', className)}
    {...props}
  />
));
DropdownLabel.displayName = DropdownPrimitive.Label.displayName;

export const DropdownSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-border-subtle -mx-1', className)}
    {...props}
  />
));
DropdownSeparator.displayName = DropdownPrimitive.Separator.displayName;
