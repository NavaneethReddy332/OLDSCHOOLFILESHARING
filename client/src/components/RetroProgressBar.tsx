import React from 'react';

interface RetroProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
}

export function RetroProgressBar({ progress, label }: RetroProgressBarProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Calculate number of blocks for visual effect
  const blocks = Math.floor(clampedProgress / 5);
  
  return (
    <div className="w-full font-sans text-xs">
      {label && <div className="mb-1">{label}</div>}
      <div className="retro-border-inset p-[1px] bg-white h-6 relative overflow-hidden">
        <div 
          className="h-full win98-progress-bar transition-all duration-200 ease-linear"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <div className="text-center mt-1">{clampedProgress}%</div>
    </div>
  );
}
