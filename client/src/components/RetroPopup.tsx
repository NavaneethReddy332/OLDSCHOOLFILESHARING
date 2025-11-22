import React from 'react';

interface RetroPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'warning';
  buttons?: { label: string; onClick: () => void; primary?: boolean }[];
}

export function RetroPopup({ isOpen, onClose, title, message, type = 'info', buttons }: RetroPopupProps) {
  if (!isOpen) return null;

  const icon = type === 'error' 
    ? 'https://win98icons.alexmeub.com/icons/png/msg_error-0.png' 
    : type === 'warning' 
    ? 'https://win98icons.alexmeub.com/icons/png/msg_warning-0.png'
    : 'https://win98icons.alexmeub.com/icons/png/msg_information-0.png';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-[1px]">
      <div className="retro-border p-1 bg-[#c0c0c0] shadow-xl max-w-sm w-full mx-4">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-1 py-0.5 flex justify-between items-center mb-3">
          <span className="font-bold text-sm font-sans">{title}</span>
          <button 
            onClick={onClose}
            className="bg-[#c0c0c0] text-black w-4 h-4 flex items-center justify-center text-xs border border-white border-r-black border-b-black font-bold leading-none"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-2 flex items-start gap-4">
          <img src={icon} width="32" height="32" alt="icon" />
          <div className="text-sm font-sans text-black">
            {message}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-2 mt-4 mb-2">
          {buttons ? (
            buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`retro-button min-w-[80px] ${btn.primary ? 'border-2 border-black' : ''}`}
              >
                {btn.label}
              </button>
            ))
          ) : (
            <button onClick={onClose} className="retro-button min-w-[80px] border-black">
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
