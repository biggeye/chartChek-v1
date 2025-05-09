import * as React from 'react';

import { cn } from '../lib/utils';

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('bg-card text-card-foreground rounded-xl border', className)}
    {...props}
  />
);
Card.displayName = 'Card';

const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn('leading-none font-semibold tracking-tight', className)}
    {...props}
  />
);
CardTitle.displayName = 'CardTitle';

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn('text-muted-foreground text-sm', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-6 pt-0', className)} {...props} />;
CardContent.displayName = 'CardContent';

const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
