import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useTooltips } from '@/hooks/use-tooltips';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface ContextualTooltipProps {
  id: string;
  content: string | ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  className?: string;
  showOnce?: boolean;
  showOnHover?: boolean;
  delay?: number;
  maxWidth?: number;
}

export function ContextualTooltip({
  id,
  content,
  children,
  position = 'top',
  className,
  showOnce = true,
  showOnHover = false,
  delay = 500,
  maxWidth = 250,
}: ContextualTooltipProps) {
  const { hasSeenTooltip, markTooltipSeen } = useTooltips();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // Only show the tooltip if it hasn't been seen before (for showOnce tooltips)
  const shouldShow = showOnce ? !hasSeenTooltip(id) : true;

  useEffect(() => {
    // Show tooltip on initial render (after delay) if it should be shown and not hover-activated
    if (shouldShow && !showOnHover) {
      timerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, delay);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [shouldShow, showOnHover, delay]);

  // Handle mouse enter
  const handleMouseEnter = () => {
    if (shouldShow && showOnHover) {
      setHovered(true);
      timerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, delay);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHovered(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (showOnHover) {
      setVisible(false);
    }
  };

  // Close the tooltip and mark it as seen
  const handleClose = () => {
    setVisible(false);
    if (showOnce) {
      markTooltipSeen(id);
    }
  };

  // Get position classes based on the position prop
  const getPositionClasses = (): string => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  // Get the arrow position classes
  const getArrowClasses = (): string => {
    switch (position) {
      case 'top':
        return 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
      case 'right':
        return 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent';
      case 'bottom':
        return 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {visible && (
        <div 
          className={cn(
            "absolute z-50 px-3 py-2 text-sm bg-primary text-primary-foreground rounded shadow-md",
            getPositionClasses()
          )}
          style={{ maxWidth }}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">{content}</div>
            <button 
              onClick={handleClose}
              className="text-primary-foreground hover:text-white p-1 rounded-full flex-shrink-0 -mt-1 -mr-1"
            >
              <X size={14} />
            </button>
          </div>
          <div 
            className={cn(
              "absolute w-0 h-0 border-solid border-4 border-primary",
              getArrowClasses()
            )}
          />
        </div>
      )}
    </div>
  );
}