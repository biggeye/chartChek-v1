import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

interface DashboardCardProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}

export function DashboardCard({
  title,
  description,
  className,
  children,
  footer,
  icon
}: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {icon && <div className="text-indigo_dye-500">{icon}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
