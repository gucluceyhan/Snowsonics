import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  fluid?: boolean;
}

/**
 * Container component to provide consistent horizontal padding and max-width
 * 
 * @param children - The content to be displayed within the container
 * @param className - Additional classes to apply
 * @param as - Element type to render as
 * @param fluid - Whether the container should be fluid (full-width) or have a max-width
 */
export function Container({
  children,
  className,
  as: Component = "div",
  fluid = false,
  ...props
}: ContainerProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={cn(
        "w-full mx-auto px-4 sm:px-6 md:px-8",
        {
          "max-w-7xl": !fluid,
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}