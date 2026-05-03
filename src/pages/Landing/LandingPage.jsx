import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BackgroundOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-neonCyan/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-20 -right-20 w-[500px] h-[500px] bg-neonViolet/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-10 -right-10 w-96 h-96 bg-neonCyan/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-neonViolet/15 rounded-full blur-3xl"
      />
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-20">
      <BackgroundOrbs />

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        
        {/* EVENT BADGE */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 px-6 py-2 rounded-full border border-neonCyan/30 bg-neonCyan/5 backdrop-blur-md text-[11px] font-bold uppercase tracking-[0.2em] text-neonCyan shadow-[0_0_20px_rgba(0,245,255,0.2)]"
        >
          🎓 VTU Batch 2022–23 • Farewell Event
        </motion.div>

        {/* MAIN HERO TEXT - SCALED UP */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="space-y-8 md:space-y-10"
        >
          <h1 className="text-6xl md:text-8xl font-black neon-text-gradient leading-[1.1] tracking-tighter">
            One Last Grand <br className="hidden md:block" /> Celebration
          </h1>
          <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
            Batch 2022–23 | Join us for a cinematic farewell on <br className="sm:hidden" />
            <span className="text-neonCyan font-bold">8th & 9th May 2026</span>.
          </p>
        </motion.div>

        {/* MOTIVATIONAL QUOTE - SCALE INCREASED */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 md:mt-24 relative p-8 md:p-12 max-w-2xl"
        >
          <div className="absolute inset-0 bg-neonViolet/5 blur-3xl rounded-full" />
          <p className="relative z-10 text-gray-300 italic text-lg md:text-2xl font-medium leading-relaxed">
            "College ends, but the memories remain forever. <br className="hidden md:block" />
            <span className="text-neonViolet font-bold not-italic">Don't let this final chapter be incomplete.</span>"
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-neonViolet to-transparent rounded-full" />
          </div>
        </motion.div>

        {/* CTA BUTTONS - BOLDER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 flex flex-col sm:flex-row gap-6 md:gap-8 w-full sm:w-auto"
        >
          <Link 
            to="/submit" 
            className="group relative px-12 py-5 bg-neonCyan text-darkBg font-black text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:shadow-[0_0_45px_rgba(0,245,255,0.6)] text-center"
          >
            Make Your Contribution
          </Link>
          
          <Link 
            to="/status" 
            className="px-12 py-5 border-2 border-neonCyan/50 text-neonCyan font-bold text-lg rounded-full hover:bg-neonCyan/10 transition-all duration-300 backdrop-blur-sm text-center"
          >
            Check My Status
          </Link>
        </motion.div>

        {/* EVENT INFO STRIP */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-16 flex flex-wrap justify-center gap-6"
        >
          {[
            { icon: "📅", text: "8th & 9th May 2026" },
            { icon: "📍", text: "VTU, Belagavi" },
            { icon: "🎓", text: "Batch 2022–23" }
          ].map((info, idx) => (
            <div key={idx} className="px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] text-gray-400 font-bold uppercase tracking-widest">
              {info.icon} <span className="ml-2">{info.text}</span>
            </div>
          ))}
        </motion.div>

        {/* SECURITY DISCLAIMER */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.2 }}
          className="mt-24 max-w-2xl w-full"
        >
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <div className="w-2 h-2 bg-neonCyan rounded-full animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">Security Notice</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed text-center font-medium">
              This is an official internal portal for the <span className="text-white font-bold">VTU Batch 2022-23 Farewell</span>. 
              We do <span className="text-red-400 font-black">NOT</span> collect bank passwords, OTPs, or credit card details. 
              If you see a browser warning, click <span className="text-white underline">Advanced</span> &rarr; <span className="text-white underline">Proceed</span> to continue.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;