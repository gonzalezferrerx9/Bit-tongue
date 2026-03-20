// —-----------------------------------------------------------
// – IMPORTACIONES / IMPORTS
// —---------------------------------------------------------
import React from 'react';

// —-----------------------------------------------------------
// – COMPONENTE / COMPONENT
// —---------------------------------------------------------
export const TongueLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Robot Head */}
    <rect x="3" y="7" width="18" height="13" rx="3" fill="white" />
    
    {/* Eyes - Unified Style */}
    <rect x="6" y="10" width="4" height="4" rx="1" fill="#121B26" />
    <rect x="14" y="10" width="4" height="4" rx="1" fill="#121B26" />
    
    {/* Antenna */}
    <rect x="11.5" y="4" width="1" height="3" fill="white" />
    <circle cx="12" cy="4" r="1" fill="white" />

    {/* Mouth Line */}
    <path d="M7 16H17" stroke="#121B26" strokeWidth="1" strokeLinecap="round" />

    {/* White Tongue */}
    <path 
      d="M10 16V20C10 21 11 21.5 12 21.5C13 21.5 14 21 14 20V16" 
      fill="#FFFFFF" 
    />
  </svg>
);
