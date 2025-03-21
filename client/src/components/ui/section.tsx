import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Section component to provide consistent vertical spacing
 * 
 * @param children - The content to be displayed within the section
 * @param className - Additional classes to apply
 * @param as - Element type to render as
 * @param size - Size of vertical padding (xs, sm, md, lg, xl)
 */
export function Section({
  children,
  className,
  as: Component = "section",
  size = "md",
  ...props
}: SectionProps & React.HTMLAttributes<HTMLElement>) {
  const sizeClasses = {
    xs: "py-2 md:py-3",
    sm: "py-4 md:py-6",
    md: "py-6 md:py-8",
    lg: "py-8 md:py-12",
    xl: "py-12 md:py-16",
  };

  return (
    <Component
      className={cn(
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}