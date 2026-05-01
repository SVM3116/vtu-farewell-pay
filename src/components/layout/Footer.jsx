import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="w-full mt-20 py-8 border-t border-white/5 bg-darkBg/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center space-y-3">
        
        {/* The Cinematic Branding Line */}
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: '100px', opacity: 1 }}
          transition={{ duration: 1 }}
          className="h-[1px] bg-gradient-to-r from-transparent via-neonCyan to-transparent"
        />

        <div className="text-center">
          <p className="text-sm md:text-base font-bold tracking-[0.3em] text-gray-300 uppercase">
            Developed by <span className="text-neonCyan drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]">ONE RUPEE</span>
          </p>
          
          <p className="text-[10px] md:text-xs text-gray-500 mt-2 uppercase tracking-[0.2em] font-medium">
            3rd Year, CSBS • Educational Project for Learning Purpose
          </p>
        </div>

        {/* Subtle decorative element */}
        <div className="pt-4">
          <div className="flex gap-4 opacity-20">
            <div className="w-1 h-1 rounded-full bg-neonViolet" />
            <div className="w-1 h-1 rounded-full bg-neonCyan" />
            <div className="w-1 h-1 rounded-full bg-neonViolet" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;