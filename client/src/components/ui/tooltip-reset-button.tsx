import React from 'react';
import { useTooltips } from '@/hooks/use-tooltips';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TooltipResetButton({ className }: { className?: string }) {
  const { resetTooltips } = useTooltips();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleReset = () => {
    resetTooltips();
    toast({
      title: t.common.success,
      description: t.tooltips.gotIt,
      duration: 3000,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleReset}
    >
      <HelpCircle className="mr-2 h-4 w-4" />
      <span>Show Help Tips</span>
    </Button>
  );
}