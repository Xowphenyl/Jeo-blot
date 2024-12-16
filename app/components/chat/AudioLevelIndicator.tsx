import React from 'react';
import { classNames } from '~/utils/classNames';

interface AudioLevelIndicatorProps {
  level: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({ level, size = 'md', className }) => {
  const bars = 5;
  const activeBarCount = Math.floor(level * bars);

  const sizeClasses = {
    sm: 'h-2 gap-0.5',
    md: 'h-3 gap-1',
    lg: 'h-4 gap-1',
  };

  const barSizeClasses = {
    sm: 'w-0.5',
    md: 'w-1',
    lg: 'w-1.5',
  };

  // Fixed height classes for each bar
  const barHeights = [
    'h-[20%]', // Bar 1
    'h-[40%]', // Bar 2
    'h-[60%]', // Bar 3
    'h-[80%]', // Bar 4
    'h-[100%]', // Bar 5
  ];

  return (
    <div className={classNames('flex items-end transition-all duration-100', sizeClasses[size], className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={classNames(
            'transition-all duration-100',
            barSizeClasses[size],
            barHeights[i],
            i < activeBarCount ? 'bg-bolt-elements-item-contentAccent' : 'bg-gray-300 dark:bg-gray-600',
          )}
        />
      ))}
    </div>
  );
};
