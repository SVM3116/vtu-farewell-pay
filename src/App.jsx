import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Layouts
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageWrapper from './components/layout/PageWrapper';

// Public Pages
import PaymentForm from './pages/Submit/PaymentForm';
import StatusCheck from './pages/Status/StatusCheck';

// CR Pages
import CRLogin from './pages/CR/CRLogin';
import CRDashboard from './pages/CR/CRDashboard';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';

// --- CINEMATIC LANDING PAGE COMPONENT ---
const Landing = () => (
  <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
    {/* ATMOSPHERIC BACKGROUND ORBS */}
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-none" />

    <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center">
      
      {/* MAIN HERO TEXT */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="space-y-4 md:space-y-6"
      >
        <h1 className="text-5xl md:text-7xl font-black neon-text-gradient leading-tight">
          One Last Grand <br className="hidden md:block" /> Celebration
        </h1>
        <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
          Batch 2022–23 | Join us for a cinematic farewell on <span className="text-neonCyan font-bold">8th & 9th May 2026</span>.
        </p>
      </motion.div>

      {/* MOTIVATIONAL QUOTE */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-10 md:mt-16 relative p-6 md:p-8 max-w-lg"
      >
        <div className="absolute inset-0 bg-neonViolet/5 blur-2xl rounded-full" />
        <p className="relative z-10 text-gray-300 italic text-sm md:text-lg font-medium leading-relaxed">
          "College ends, but the memories remain forever. <br className="hidden md:block" />
          <span className="text-neonViolet font-bold not-italic">Don't let this final chapter be incomplete.</span>"
        </p>
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-12 bg-gradient-to-r from-transparent via-neonViolet to-transparent rounded-full" />
        </div>
      </motion.div>

      {/* CTA BUTTONS */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 flex flex-col sm:flex-row gap-4 md:gap-6 w-full sm:w-auto"
      >
        <Link 
          to="/submit" 
          className="group relative px-8 md:px-12 py-4 bg-neonCyan text-darkBg font-black rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)] text-center"
        >
          Submit Payment
        </Link>
        
        <Link 
          to="/status" 
          className="px-8 md:px-12 py-4 border border-neonCyan/50 text-neonCyan font-bold rounded-full hover:bg-neonCyan/10 transition-all duration-300 backdrop-blur-sm text-center"
        >
          Check My Status
        </Link>
      </motion.div>

      {/* SECURITY DISCLAIMER */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1.2 }}
        className="mt-16 max-w-xl w-full"
      >
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="w-2 h-2 bg-neonCyan rounded-full animate-pulse" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Security Notice</h3>
          </div>
          <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed text-center">
            This is an official internal portal for the <span className="text-white font-semibold">VTU Batch 2022-23 Farewell</span>. 
            We do <span className="text-red-400 font-bold">NOT</span> collect bank passwords or OTPs. 
            If you see a browser warning, click <span className="text-white underline">Advanced</span> &rarr; <span className="text-white underline">Proceed</span>.
          </p>
        </div>
      </motion.div>
    </div>
  </div>
);

// --- ROUTING LOGIC ---
function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/submit" element={<PageWrapper><PaymentForm /></PageWrapper>} />
        <Route path="/status" element={<PageWrapper><StatusCheck /></PageWrapper>} />

        {/* CR PROTECTED ROUTES */}
        <Route path="/cr-login" element={<PageWrapper><CRLogin /></PageWrapper>} />
        <Route path="/cr-dashboard" element={
          <PageWrapper>
            <ProtectedRoute redirectTo="/cr-login">
              <CRDashboard />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* ADMIN PROTECTED ROUTES */}
        <Route path="/admin-login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
        <Route path="/admin-dashboard" element={
          <PageWrapper>
            <ProtectedRoute redirectTo="/admin-login">
              <AdminDashboard />
            </ProtectedRoute>
          </PageWrapper>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-white selection:bg-neonCyan/30">
        <Navbar />
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;