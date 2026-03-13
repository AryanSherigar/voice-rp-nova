import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded font-medium tracking-wide transition-all duration-200 flex items-center justify-center gap-2 text-xs border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-navy-950";
  
  const variants = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.2)] focus:ring-teal-500",
    secondary: "bg-navy-800 hover:bg-navy-700 text-slate-300 border-navy-700 focus:ring-slate-500",
    danger: "bg-red-900/30 hover:bg-red-900/50 text-red-200 border-red-900/50 focus:ring-red-500",
    ghost: "bg-transparent hover:bg-navy-800 text-slate-400 hover:text-teal-400 border-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};