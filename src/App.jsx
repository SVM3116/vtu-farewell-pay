import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageWrapper from './components/layout/PageWrapper';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import PaymentForm from './pages/Submit/PaymentForm';
import StatusCheck from './pages/Status/StatusCheck';
import CRLogin from './pages/CR/CRLogin';
import CRDashboard from './pages/CR/CRDashboard';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CRAccess from './pages/CR/CRAccess';

// --- GLOBAL PAGE TRANSITION WRAPPER ---
// This ensures every page fades in and slides up consistently
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={
          <PageTransition>
            <PageWrapper><LandingPage /></PageWrapper>
          </PageTransition>
        } />
        <Route path="/submit" element={
          <PageTransition>
            <PageWrapper><PaymentForm /></PageWrapper>
          </PageTransition>
        } />
        <Route path="/status" element={
          <PageTransition>
            <PageWrapper><StatusCheck /></PageWrapper>
          </PageTransition>
        } />

        {/* CR PROTECTED ROUTES */}
        <Route path="/cr-login" element={
          <PageTransition>
            <PageWrapper><CRLogin /></PageWrapper>
          </PageTransition>
        } />
        <Route path="/cr-dashboard" element={
          <PageTransition>
            <PageWrapper>
              <ProtectedRoute redirectTo="/cr-login">
                <CRDashboard />
              </ProtectedRoute>
            </PageWrapper>
          </PageTransition>
        } />

        {/* ADMIN PROTECTED ROUTES */}
        <Route path="/admin-login" element={
          <PageTransition>
            <PageWrapper><AdminLogin /></PageWrapper>
          </PageTransition>
        } />
        <Route path="/admin-dashboard" element={
          <PageTransition>
            <PageWrapper>
              <ProtectedRoute redirectTo="/admin-login">
                <AdminDashboard />
              </ProtectedRoute>
            </PageWrapper>
          </PageTransition>
        } />

        <Route path="/cr-access" element={
          <PageTransition>
            <CRAccess />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-white flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;