import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react'; // If you don't have lucide-react, just use "▾"

const Select = ({ label, options, value, onChange, disabled, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full group relative" ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 group-focus-within:text-neonCyan transition-all duration-300">
          {label} {required && <span className="text-neonCyan">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Outer Neon Glow - only on open/focus */}
        <div className={`absolute -inset-0.5 bg-neonCyan opacity-0 ${isOpen ? 'opacity-30' : 'group-focus-within:opacity-20'} blur-md transition-all duration-500 rounded-xl pointer-events-none`} />
        
        {/* Trigger Button */}
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            relative w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between
            bg-white/[0.05] backdrop-blur-2xl border border-white/10 
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_0px_rgba(255,255,255,0.05)]
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/[0.08]'}
            ${isOpen ? 'border-neonCyan/60 shadow-[0_0_20px_rgba(0,245,255,0.15)]' : 'text-white'}
          `}
        >
          <span className={`text-sm tracking-wide ${isOpen ? 'text-neonCyan' : 'text-white'}`}>
            {value}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-neonCyan' : ''}`} />
        </div>

        {/* Custom Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 overflow-hidden rounded-xl border border-white/10 bg-darkBg/90 backdrop-blur-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="py-1">
                {options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`
                      px-4 py-3 text-sm cursor-pointer transition-all duration-200
                      ${value === opt ? 'bg-neonCyan/20 text-neonCyan font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Minimal AnimatePresence shim if you aren't using Framer Motion here
const AnimatePresence = ({ children }) => <>{children}</>;

export default Select;