import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabase';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const CRLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- MODAL STATE ---
  const [showInstructions, setShowInstructions] = useState(false);
  const [crName, setCrName] = useState('CR');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check the public.cr_accounts table directly instead of using supabase.auth
      const { data, error: dbError } = await supabase
        .from('cr_accounts')
        .select('name, email, year, branch, division, mobile')
        .eq('email', email)
        .eq('password_hash', password) // Matches the plain text password we inserted via SQL
        .single();

      if (dbError || !data) {
        // This replaces the 'Invalid login credentials' error
        throw new Error("Invalid login credentials. Please check your email and password.");
      }

      // 2. MANUALLY set the session 
      // Since we are bypassing supabase.auth, we store the CR info in localStorage
      // so that getCurrentCR() can still work across the app.
      localStorage.setItem('cr_user', JSON.stringify(data));

      // 3. Set the name for the popup and show instructions
      setCrName(data.name);
      setShowInstructions(true);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    // Only now do we navigate to the dashboard
    navigate('/cr-dashboard');
  };

  return (
  <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0f1e] overflow-hidden">
    {/* Background Cinematic Orbs */}
    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-//none" />

    {/* --- NEW: CR GRATITUDE MESSAGE --- */}
    <div className="absolute top-10 left-0 right-0 px-4 flex justify-center z-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl text-center p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-lg"
      >
        <p className="text-gray-300 text-sm leading-relaxed">
          <span className="text-neonCyan font-bold">Dear Class Representative,</span><br/>
          Thank you for taking up this responsibility. Your effort and coordination are very important for the success of Farewell '26. <br/>
          <span className="text-gray-400 italic">Please ensure accurate verification and help your classmates complete their payments on time.</span>
        </p>
      </motion.div>
    </div>

    <GlassCard className="relative w-full max-w-md p-8 md:p-12 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl">
       {/* ... rest of your login form remains exactly the same ... */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold neon-text-gradient mb-2">CR Portal Login</h1>
          <p className="text-gray-400 text-sm">Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="cr@gmail.com" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </Button>
        </form>
      </GlassCard>

      {/* --- MANDATORY INSTRUCTION POPUP --- */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-lg p-6 md:p-10 glass-card border-neonCyan/30 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-400 mb-4 animate-bounce">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
                  Important Verification Instructions
                </h2>
              </div>

              <div className="space-y-6 text-left text-gray-300 leading-relaxed">
                <p className="text-sm italic border-l-4 border-neonCyan pl-4 py-1 bg-white/5">
                  Dear <span className="text-white font-bold">{crName}</span>,
                </p>

                <div className="space-y-4">
                  <section className="space-y-2">
                    <h3 className="text-neonCyan text-xs font-black uppercase tracking-widest">System Logic</h3>
                    <p className="text-sm">
                      The system automatically verifies payments every day between <span className="text-white font-bold">6:00 PM – 8:00 PM</span> using the bank statement.
                      <br/><br/>
                      If UTR and amount match <span className="text-green-400">→ auto approval</span>.
                      <br/>
                      If mismatch → remains <span className="text-yellow-400">pending</span> for manual verification.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-neonViolet text-xs font-black uppercase tracking-widest">Strict Instructions</h3>
                    <ul className="list-disc list-inside text-sm space-y-2">
                      <li>Do <span className="text-red-400 font-bold">NOT</span> verify any payments before 8:00 PM</li>
                      <li>Do <span className="text-red-400 font-bold">NOT</span> approve payments without checking the bank statement</li>
                      <li>After 8:00 PM: Verify remaining pending payments ONLY after confirming with the bank statement provided by Finance Head</li>
                      <li><span className="text-white font-bold underline">Never approve based only on UTR entered by students.</span></li>
                    </ul>
                  </section>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-xs text-center italic">
                  "Your careful verification is very important to maintain accuracy and prevent fake claims."
                </div>
              </div>

              <div className="mt-10">
                <Button 
                  onClick={handleAcknowledge} 
                  className="w-full py-4 text-lg font-bold shadow-[0_0_20px_rgba(0,245,255,0.3)]"
                >
                  I Understand & Agree
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRLogin;