import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

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

// Simple Landing Page component
const Landing = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
    <h2 className="text-5xl font-bold neon-text-gradient mb-4">Welcome to Farewell '26</h2>
    <p className="text-gray-400 text-lg max-w-2xl mb-8">
      Batch 2022–23 | Join us for a cinematic celebration on 8th & 9th May 2026.
    </p>
    <div className="flex gap-4">
      <a href="/submit" className="px-8 py-3 bg-neonCyan text-darkBg font-bold rounded-full hover:scale-105 transition-transform">Submit Payment</a>
      <a href="/status" className="px-8 py-3 border border-neonCyan text-neonCyan font-bold rounded-full hover:bg-neonCyan/10 transition-all">Check Status</a>
    </div>
  </div>
);

// This sub-component is necessary because useLocation() must be inside a <Router>
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
            <ProtectedRoute>
              <CRDashboard />
            </ProtectedRoute>
          </PageWrapper>
        } />

        {/* ADMIN PROTECTED ROUTES */}
        <Route path="/admin-login" element={<PageWrapper><AdminLogin /></PageWrapper>} />
        <Route path="/admin-dashboard" element={
          <PageWrapper>
            <ProtectedRoute>
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
      <div className="min-h-screen bg-darkBg text-white">
        <Navbar />
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;