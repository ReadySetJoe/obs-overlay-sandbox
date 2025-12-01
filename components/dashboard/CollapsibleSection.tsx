// components/dashboard/CollapsibleSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  tileCount?: number;
}

export default function CollapsibleSection({
  id,
  title,
  icon,
  defaultCollapsed = false,
  children,
  tileCount,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`dashboard-section-${id}`);
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, [id]);

  // Save collapse state to localStorage when it changes
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`dashboard-section-${id}`, newState.toString());
  };

  return (
    <div className='mb-6'>
      {/* Section Header */}
      <button
        onClick={toggleCollapse}
        className='w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 mb-4 group'
      >
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>{icon}</span>
          <h3 className='text-lg font-bold text-gray-200 group-hover:text-white transition-colors'>
            {title}
          </h3>
          {isCollapsed && tileCount !== undefined && (
            <span className='text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full'>
              {tileCount} {tileCount === 1 ? 'tile' : 'tiles'}
            </span>
          )}
        </div>
        <div className='text-gray-400 group-hover:text-white transition-colors'>
          {isCollapsed ? (
            <ChevronRight className='w-5 h-5' />
          ) : (
            <ChevronDown className='w-5 h-5' />
          )}
        </div>
      </button>

      {/* Section Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}
      >
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {children}
        </div>
      </div>
    </div>
  );
}
