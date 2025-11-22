import React from 'react';

export function CRTOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] mix-blend-overlay">
      <div className="crt-lines w-full h-full"></div>
      <div className="crt-scanline"></div>
    </div>
  );
}
