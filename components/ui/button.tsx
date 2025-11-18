import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-[10px]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[10px]',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-[10px]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[10px]',
        ghost: 'hover:bg-accent hover:text-accent-foreground rounded-[10px]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[44px] px-4 py-2 min-h-[44px]' /* WCAG AAA touch target */,
        sm: 'h-[36px] px-3 text-xs min-h-[36px]',
        lg: 'h-[52px] px-8 text-base min-h-[52px]',
        icon: 'h-[44px] w-[44px] min-h-[44px] min-w-[44px]' /* WCAG AAA touch target */,
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
