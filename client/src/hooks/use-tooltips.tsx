import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the types for tooltips
type TooltipState = {
  seen: Record<string, boolean>;
};

type TooltipContextType = {
  hasSeenTooltip: (id: string) => boolean;
  markTooltipSeen: (id: string) => void;
  resetTooltips: () => void;
};

// Create a context for tooltips
const TooltipContext = createContext<TooltipContextType | null>(null);

// Create tooltip provider component
export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltipState, setTooltipState] = useState<TooltipState>(() => {
    // Try to get from localStorage on initial load
    const saved = localStorage.getItem('tooltips');
    return saved ? JSON.parse(saved) : { seen: {} };
  });

  // Save to localStorage whenever tooltipState changes
  useEffect(() => {
    localStorage.setItem('tooltips', JSON.stringify(tooltipState));
  }, [tooltipState]);

  const hasSeenTooltip = (id: string) => {
    return !!tooltipState.seen[id];
  };

  const markTooltipSeen = (id: string) => {
    setTooltipState(prev => ({
      ...prev,
      seen: {
        ...prev.seen,
        [id]: true
      }
    }));
  };

  const resetTooltips = () => {
    setTooltipState({ seen: {} });
  };

  return (
    <TooltipContext.Provider value={{ hasSeenTooltip, markTooltipSeen, resetTooltips }}>
      {children}
    </TooltipContext.Provider>
  );
}

// Hook to use tooltip context
export function useTooltips() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltips must be used within a TooltipProvider');
  }
  return context;
}