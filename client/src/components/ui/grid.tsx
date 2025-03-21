import React from "react";
import { cn } from "@/lib/utils";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | number;
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | number;
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | number;
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | number;
  colsXl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | number;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | number;
  gapX?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | number;
  gapY?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | number;
}

/**
 * Grid component for creating responsive grid layouts
 * 
 * @param children - The grid items
 * @param className - Additional classes
 * @param cols - Default number of columns
 * @param colsSm - Number of columns on small screens
 * @param colsMd - Number of columns on medium screens
 * @param colsLg - Number of columns on large screens
 * @param colsXl - Number of columns on extra large screens
 * @param gap - Gap between grid items (both horizontal and vertical)
 * @param gapX - Horizontal gap between grid items
 * @param gapY - Vertical gap between grid items
 */
export function Grid({
  children,
  className,
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  colsXl,
  gap,
  gapX,
  gapY,
  ...props
}: GridProps) {
  const getGridCols = (cols: number) => {
    return {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
      9: "grid-cols-9",
      10: "grid-cols-10",
      11: "grid-cols-11",
      12: "grid-cols-12",
    }[cols] || `grid-cols-${cols}`;
  };

  const getGridGap = (gap: number) => {
    return {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
    }[gap] || `gap-${gap}`;
  };

  const getGridGapX = (gap: number) => {
    return {
      0: "gap-x-0",
      1: "gap-x-1",
      2: "gap-x-2",
      3: "gap-x-3",
      4: "gap-x-4",
      5: "gap-x-5",
      6: "gap-x-6",
      8: "gap-x-8",
      10: "gap-x-10",
      12: "gap-x-12",
    }[gap] || `gap-x-${gap}`;
  };

  const getGridGapY = (gap: number) => {
    return {
      0: "gap-y-0",
      1: "gap-y-1",
      2: "gap-y-2",
      3: "gap-y-3",
      4: "gap-y-4",
      5: "gap-y-5",
      6: "gap-y-6",
      8: "gap-y-8",
      10: "gap-y-10",
      12: "gap-y-12",
    }[gap] || `gap-y-${gap}`;
  };

  return (
    <div
      className={cn(
        "grid",
        getGridCols(cols),
        colsSm && `sm:${getGridCols(colsSm)}`,
        colsMd && `md:${getGridCols(colsMd)}`,
        colsLg && `lg:${getGridCols(colsLg)}`,
        colsXl && `xl:${getGridCols(colsXl)}`,
        gap !== undefined && getGridGap(gap),
        gapX !== undefined && getGridGapX(gapX),
        gapY !== undefined && getGridGapY(gapY),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GridItem component for consistent grid items
 */
export function GridItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}