import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Submit Payment', path: '/submit' },
    { name: 'Check Status', path: '/status' },
    { name: 'CR Login', path: '/cr-login' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full h-20 px-6 backdrop-blur-md bg-[#0a0f1e]/90 border-b border-neonCyan/10 flex items-center justify-between">
      
      {/* --- LEFT ZONE: EVENT BRANDING --- */}
      <Link to="/" className="flex items-center gap-3 group shrink-0">
        <img 
          src="/favicon.png" 
          alt="Farewell Logo" 
          className="h-11 w-11 rounded-full object-cover ring-2 ring-neonCyan/30 group-hover:ring-neonCyan/60 transition-all duration-300" 
        />
        <span className="text-xl font-black text-white group-hover:text-neonCyan transition-colors duration-300 hidden sm:block tracking-tight">
          Farewell '26
        </span>
      </Link>

      {/* --- CENTER ZONE: INSTITUTIONAL IDENTITY --- */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-[10px] sm:text-[11px] font-bold text-white/60 uppercase tracking-[0.3em] whitespace-nowrap text-center">
          Visvesvaraya Technological University, Belagavi
        </span>
      </div>

      {/* --- RIGHT ZONE: NAV & INFO --- */}
      <div className="hidden md:flex items-center gap-8 shrink-0">
        <div className="flex items-center gap-6 mr-4">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 relative py-1 
                ${isActive(link.path) ? 'text-neonCyan' : 'text-gray-400 hover:text-white'}`}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neonCyan shadow-[0_0_8px_rgba(0,245,255,0.8)]"
                />
              )}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
          <div className="text-right">
            <p className="text-[10px] text-white/70 font-medium leading-tight">Batch 2022–23</p>
            <p className="text-[9px] text-neonCyan font-bold leading-tight opacity-90 uppercase">8th & 9th May 2026</p>
          </div>
          <img 
            src="/logo-vtu.png" 
            alt="VTU Logo" 
            className="h-10 w-10 object-contain" 
          />
        </div>
      </div>

      {/* --- MOBILE HAMBURGER --- */}
      <div className="flex items-center gap-4 md:hidden">
        <span className="text-[10px] font-bold text-neonCyan uppercase tracking-widest hidden xs:block">
          VTU BELAGAVI
        </span>
        <button 
          className="p-2 text-neonCyan transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <motion.div animate={{ rotate: isMobileMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </motion.div>
        </button>
      </div>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="absolute top-20 left-0 w-full bg-[#0a0f1e]/98 backdrop-blur-2xl z-40 flex flex-col items-center pt-12 px-6 overflow-hidden"
          >
            <div className="flex flex-col items-center gap-3 mb-12 text-center">
              <img src="/logo-vtu.png" alt="VTU Logo" className="h-16 w-16 mb-4" />
              <p className="text-white text-base font-bold uppercase tracking-widest">Batch 2022–23</p>
              <p className="text-neonCyan text-sm font-black uppercase tracking-widest">8th & 9th May 2026</p>
            </div>

            <div className="w-full h-px bg-neonCyan/20 mb-12" />

            <div className="flex flex-col items-center gap-8 w-full">
              {navLinks.map((link, idx) => (
                <motion.div 
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <Link 
                    to={link.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-2xl font-bold transition-all duration-300 block text-center w-full py-4 rounded-2xl
                      ${isActive(link.path) ? 'text-neonCyan bg-neonCyan/10' : 'text-white hover:text-neonCyan'}`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;