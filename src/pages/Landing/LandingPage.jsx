import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { expenseApi } from '../../api/expenses'; 
import GlassCard from '../../components/ui/GlassCard';
import confetti from 'canvas-confetti'; // Ensure this is installed in your package.json

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
  const [finData, setFinData] = useState({ collected: 0, spent: 0 });

  useEffect(() => {
    // 1. Trigger the Celebration Blast
    fireCelebration();

    // 2. Fetch Financial Data
    const getFinSummary = async () => {
      try {
        const [collected, summary] = await Promise.all([
          expenseApi.fetchTotalCollection(),
          expenseApi.fetchExpenseSummary()
        ]);
        setFinData({ collected, spent: summary.totalExpenses });
      } catch (e) {
        console.error("Error fetching landing page financial summary:", e);
      }
    };
    getFinSummary();
  }, []);

  // Function to handle the cinematic confetti explosion
  const fireCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Left side burst (Cyan)
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: 0, y: 0.6 }, 
        colors: ['#00f5ff', '#bf00ff', '#ffffff'] 
      });
      
      // Right side burst (Violet)
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: 1, y: 0.6 }, 
        colors: ['#00f5ff', '#bf00ff', '#ffffff'] 
      });
    }, 250);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-20">
      <BackgroundOrbs />

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        
        {/* EVENT STATUS BADGE */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 px-6 py-2 rounded-full border border-green-400/30 bg-green-400/5 backdrop-blur-md text-[11px] font-bold uppercase tracking-[0.2em] text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
        >
          ✅ Event Successfully Completed • CELESTIA 2K26
        </motion.div>

        {/* MAIN HERO TEXT */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="space-y-6 mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-black neon-text-gradient leading-[1.1] tracking-tighter">
            CELESTIA 2K26
          </h1>
          <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
            A legendary celebration of the <span className="text-neonCyan font-bold">Batch 2022–23</span>. <br className="hidden md:block" />
            Thank you for making this farewell an unforgettable experience.
          </p>
        </motion.div>

        {/* FINANCIAL SUMMARY SECTION (THE CENTERPIECE) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full max-w-4xl mb-16"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Final Financial Statement</h2>
            <div className="h-1 w-20 bg-neonCyan mx-auto mt-2 rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <GlassCard className="p-6 text-center border-neonCyan/30 bg-neonCyan/5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Total Collected</p>
              <p className="text-3xl font-black text-neonCyan">₹{finData.collected.toLocaleString()}</p>
            </GlassCard>
            <GlassCard className="p-6 text-center border-neonViolet/30 bg-neonViolet/5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Total Spent</p>
              <p className="text-3xl font-black text-neonViolet">₹{finData.spent.toLocaleString()}</p>
            </GlassCard>
            <GlassCard className="p-6 text-center border-green-500/30 bg-green-500/5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Remaining Balance</p>
              <p className="text-3xl font-black text-green-400">₹{(finData.collected - finData.spent).toLocaleString()}</p>
            </GlassCard>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Link 
              to="/expenses" 
              className="text-xs font-bold text-gray-500 hover:text-neonCyan transition-colors duration-300 uppercase tracking-widest flex items-center gap-2 group"
            >
              View Detailed Expense Breakdown <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </motion.div>

        {/* POST-EVENT CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1.0, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-6 md:gap-8 w-full sm:w-auto"
        >
          <Link 
            to="/expenses" 
            className="group relative px-12 py-5 bg-neonCyan text-darkBg font-black text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(0,245,255,0.4)] hover:shadow-[0_0_45px_rgba(0,245,255,0.6)] text-center"
          >
            View Expenses
          </Link>
          
          <Link 
            to="/payments" 
            className="px-12 py-5 border-2 border-neonCyan/50 text-neonCyan font-bold text-lg rounded-full hover:bg-neonCyan/10 transition-all duration-300 backdrop-blur-sm text-center"
          >
            View Payments
          </Link>
        </motion.div>

        {/* MEMORY QUOTE */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.3, duration: 1 }}
          className="mt-24 relative p-8 md:p-12 max-w-2xl"
        >
          <div className="absolute inset-0 bg-neonViolet/5 blur-3xl rounded-full" />
          <p className="relative z-10 text-gray-300 italic text-lg md:text-2xl font-medium leading-relaxed">
            "The laughter, the music, and the memories of CELESTIA 2K26 <br className="hidden md:block" />
            will echo in our hearts forever."
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-1.5 w-24 bg-gradient-to-r from-transparent via-neonViolet to-transparent rounded-full" />
          </div>
        </motion.div>

        {/* ARCHIVE NOTICE */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1.5 }}
          className="mt-24 max-w-2xl w-full"
        >
          <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <div className="w-2 h-2 bg-neonCyan rounded-full animate-pulse" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">Archive Notice</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed text-center font-medium">
              This portal is now in <span className="text-white font-bold">Read-Only Mode</span>. 
              All payments are closed, and the financial statement is final. 
              Thank you for making CELESTIA 2K26 a grand success.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;