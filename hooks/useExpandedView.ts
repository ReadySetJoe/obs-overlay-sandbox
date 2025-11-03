// hooks/useExpandedView.ts
import { useState, useCallback } from 'react';

export function useExpandedView() {
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleExpandElement = useCallback((element: string) => {
    setIsExpanding(true);
    setExpandedElement(element);
    // Wait for expansion animation to complete before showing content
    setTimeout(() => {
      setIsExpanding(false);
    }, 400);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedElement(null);
    setIsExpanding(false);
  }, []);

  return {
    expandedElement,
    isExpanding,
    handleExpandElement,
    handleCloseExpanded,
  };
}
