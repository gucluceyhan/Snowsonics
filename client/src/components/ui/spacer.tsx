import React from "react";
import { cn } from "@/lib/utils";

interface SpacerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  axis?: "horizontal" | "vertical";
}

/**
 * Spacer component to provide consistent spacing between elements
 * 
 * @param size - Size of the spacing (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)
 * @param className - Additional classes to apply
 * @param axis - Direction of the spacing (horizontal or vertical)
 */
export function Spacer({
  size = "md",
  className,
  axis = "vertical",
  ...props
}: SpacerProps & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    xs: axis === "vertical" ? "h-2" : "w-2",
    sm: axis === "vertical" ? "h-4" : "w-4",
    md: axis === "vertical" ? "h-6" : "w-6",
    lg: axis === "vertical" ? "h-8" : "w-8",
    xl: axis === "vertical" ? "h-12" : "w-12",
    "2xl": axis === "vertical" ? "h-16" : "w-16",
    "3xl": axis === "vertical" ? "h-20" : "w-20",
    "4xl": axis === "vertical" ? "h-24" : "w-24",
  };
  
  return (
    <div
      className={cn(
        sizeClasses[size],
        axis === "horizontal" ? "inline-block" : "block",
        className
      )}
      {...props}
    />
  );
}