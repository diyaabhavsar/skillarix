import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import React from "react";

interface AppCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

const AppCard: React.FC<AppCardProps> = ({
  title,
  description,
  children,
  footer,
  className = "",
  headerClassName = "",
  contentClassName = "",
  footerClassName = "",
}) => (
  <Card className={className}>
    {(title || description) && (
      <CardHeader className={headerClassName}>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
    )}
    <CardContent className={contentClassName}>{children}</CardContent>
    {footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
  </Card>
);

export default AppCard;