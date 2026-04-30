import React from 'react';

const Button = ({ children, onClick, variant = 'cyan', className = "", type = "button" }) => {
  const variants = {
    cyan: "border-neonCyan text-neonCyan hover:bg-neonCyan hover:text-darkBg shadow-neon-cyan",
    violet: "border-neonViolet text-neonViolet hover:bg-neonViolet hover:text-darkBg shadow-neon-violet",
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      className={`px-6 py-2 border-2 rounded-full font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;