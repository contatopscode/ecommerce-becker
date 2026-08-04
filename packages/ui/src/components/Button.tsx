import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-becker-purple text-white hover:bg-becker-purple-deep',
        secondary: 'bg-becker-orange text-white hover:brightness-95',
        outline: 'border-2 border-becker-purple text-becker-purple hover:bg-becker-purple hover:text-white',
        ghost: 'text-becker-ink hover:bg-becker-cream',
      },
      size: {
        sm: 'h-9 px-4 rounded-full text-sm',
        md: 'h-11 px-6 rounded-full text-base',
        lg: 'h-14 px-8 rounded-full text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { buttonVariants };
