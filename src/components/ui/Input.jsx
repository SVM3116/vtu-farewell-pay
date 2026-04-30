import React from 'react';

const Input = ({ label, type = "text", value, onChange, placeholder, required, error }) => {
  return (
    <div className="flex flex-col gap-2 w-full group">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 group-focus-within:text-neonCyan transition-all duration-300">
          {label} {required && <span className="text-neonCyan">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Outer Neon Glow - only on focus */}
        <div className="absolute -inset-0.5 bg-neonCyan opacity-0 group-focus-within:opacity-30 blur-md transition-all duration-500 rounded-xl pointer-events-none" />
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            relative w-full px-4 py-3 rounded-xl outline-none transition-all duration-300
            
            /* Base State: "Carved Glass" Look */
            bg-white/[0.05] backdrop-blur-2xl
            border border-white/10 
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_0px_rgba(255,255,255,0.05)]
            
            ${error 
              ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
              : 'text-white shadow-inner'
            }

            /* Focus State: "Neon Tube" Activation */
            group-focus-within:border-neonCyan/60 
            group-focus-within:bg-white/[0.08]
            group-focus-within:shadow-[0_0_20px_rgba(0,245,255,0.15),inset_0_0_8px_rgba(0,245,255,0.1)]
            
            /* Professional Typography */
            placeholder:text-white/20 
            placeholder:italic 
            placeholder:text-xs
            text-sm tracking-wide
          `}
        />
      </div>
      {error && <span className="text-[10px] text-red-400 ml-1 font-bold animate-pulse uppercase tracking-tighter">{error}</span>}
    </div>
  );
};

export default Input;