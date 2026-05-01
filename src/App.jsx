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
  <div className="relative flex flex-col items-center justify-center min-h-[85vh] text-center p-6">
    {/* Atmospheric Background Orbs */}
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-none" />

    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8 }}
      className="space-y-4 z-10"
    >
      <h2 className="text-5xl md:text-7xl font-black neon-text-gradient leading-tight">
        One Last Grand <br /> Celebration
      </h2>
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
        Batch 2022–23 | Join us for a cinematic farewell on <span className="text-neonCyan font-bold">8th & 9th May 2026</span>.
      </p>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ delay: 0.4, duration: 0.6 }}
      className="relative z-10 mt-12 flex flex-col sm:flex-row gap-6 items-center"
    >
      <Link 
        to="/submit" 
        className="group relative px-10 py-4 bg-neonCyan text-darkBg font-black rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.6)]"
      >
        Submit Payment
      </Link>
      
      <Link 
        to="/status" 
        className="px-10 py-4 border border-neonCyan/50 text-neonCyan font-bold rounded-full hover:bg-neonCyan/10 transition-all duration-300 backdrop-blur-sm"
      >
        Check My Status
      </Link>
    </motion.div>

    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 1 }}
      className="absolute bottom-10 text-[10px] md:text-xs text-gray-500 uppercase tracking-[0.3em]"
    >
      Limited Slots Available • Register Today
    </motion.p>
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