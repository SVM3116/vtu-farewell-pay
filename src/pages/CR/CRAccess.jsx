import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabase';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Copy, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CRAccess = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState('input'); // 'input' -> 'agreement' -> 'credentials'
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  // Password Auto-masking logic (10 seconds)
  useEffect(() => {
    let timer;
    if (step === 'credentials' && credentials) {
      setShowPassword(true);
      timer = setTimeout(() => {
        setShowPassword(false);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [step, credentials]);

  // Trigger Agreement Modal
  const handleStartProcess = (e) => {
    e.preventDefault();
    if (!mobile || mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError('');
    setStep('agreement');
  };

  // Fetch Credentials after Agreement
  const handleConfirmAgreement = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: supabaseError } = await supabase
        .from('cr_accounts')
        .select('name, email, password_hash, year, branch, division, mobile')
        .eq('mobile', mobile)
        .single();

      if (supabaseError || !data) {
        setError("Unauthorized access. Mobile number not found.");
        setStep('input'); // Go back to input on fail
      } else {
        setCredentials(data);
        setStep('credentials');
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0f1e] overflow-hidden">
      {/* Background Visuals */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <AnimatePresence mode="wait">
          
          {/* PHASE 1: INITIAL INPUT */}
          {step === 'input' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-center"
            >
              <GlassCard className="w-full max-w-md p-8 md:p-12 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl text-center">
                <h1 className="text-3xl font-bold neon-text-gradient mb-2">CR Access Portal</h1>
                <p className="text-gray-400 text-sm mb-8">Enter your registered mobile number to retrieve your credentials.</p>
                
                <form onSubmit={handleStartProcess} className="space-y-6">
                  <Input 
                    label="Mobile Number" 
                    placeholder="10 digit mobile" 
                    required 
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  />
                  {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                  <Button type="submit" className="w-full">Get Credentials</Button>
                </form>
              </GlassCard>
            </motion.div>
          )}

          {/* PHASE 2: AGREEMENT MODAL */}
          {step === 'agreement' && (
            <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} // <--- CHANGED TO 1
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
             >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl p-6 md:p-10 glass-card border-neonCyan/30 rounded-3xl overflow-y-auto max-h-[90vh]"
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-neonCyan rounded-full" />
                  System Access Agreement
                </h2>

                <div className="space-y-8 text-left">
                  {/* Section 1: Logic */}
                  <section className="space-y-3">
                    <h3 className="text-neonCyan uppercase text-xs font-black tracking-widest">System Verification Logic</h3>
                    <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                      The system automatically verifies student payments using bank transaction data. <br/><br/>
                      If a student enters the correct <span className="text-white font-bold">UTR number</span> AND the <span className="text-white font-bold">payment amount</span> matches their class requirement, the payment will be <span className="text-green-400">automatically approved</span>. <br/><br/>
                      If UTR is incorrect or amount mismatches, the payment remains <span className="text-yellow-400">pending</span> and requires your manual verification.
                    </p>
                  </section>

                  {/* Section 2: Responsibilities */}
                  <section className="space-y-3">
                    <h3 className="text-neonViolet uppercase text-xs font-black tracking-widest">Your Responsibilities</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300 text-xs leading-relaxed">
                      {[
                        "Verify all pending payments carefully",
                        "Cross-check UTR with bank statements",
                        "Ensure amount matches class fee",
                        "Do NOT approve without proper verification",
                        "Reject invalid payments with correct reasons",
                        "Contact students for incorrect details",
                        "Ensure full class completion by 05/05/2026",
                        "You are fully responsible for your approvals"
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <CheckCircle2 size={14} className="text-neonCyan shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="mt-10 space-y-6">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-1 accent-neonCyan w-4 h-4" 
                      checked={isAgreed} 
                      onChange={(e) => setIsAgreed(e.target.checked)} 
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      I have read and understood the system verification and my responsibilities.
                    </span>
                  </label>

                  <div className="flex gap-4">
                    <Button variant="violet" className="flex-1" onClick={() => setStep('input')}>Cancel</Button>
                    <Button 
                      className="flex-1" 
                      disabled={!isAgreed || loading} 
                      onClick={handleConfirmAgreement}
                    >
                      {loading ? "Processing..." : "Continue"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* PHASE 3: CREDENTIALS & MOTIVATION */}
          {step === 'credentials' && credentials && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-8"
            >
              <GlassCard className="p-8 md:p-12 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl text-center">
                <h1 className="text-3xl font-bold neon-text-gradient mb-8">Access Granted</h1>
                
                <div className="grid gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl text-left mb-8">
                  <CredentialRow label="Name" value={credentials.name} onCopy={() => copyToClipboard(credentials.name, 'name')} copied={copiedField === 'name'} />
                  <CredentialRow label="Email" value={credentials.email} onCopy={() => copyToClipboard(credentials.email, 'email')} copied={copiedField === 'email'} />
                  
                  <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Password</span>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-neonCyan hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-white">{showPassword ? credentials.password_hash : '••••••••'}</span>
                      <button onClick={() => copyToClipboard(credentials.password_hash, 'pass')} className="p-1.5 bg-white/10 rounded hover:bg-white/20 text-gray-400 transition-all">
                        {copiedField === 'pass' ? <span className="text-[10px] text-green-400">Copied!</span> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <CredentialRow label="Class" value={`${credentials.year} | ${credentials.branch} | ${credentials.division}`} onCopy={() => copyToClipboard(`${credentials.year} | ${credentials.branch} | ${credentials.division}`, 'class')} copied={copiedField === 'class'} />
                </div>

                <Button onClick={() => navigate('/cr-login')} className="w-full py-4 group">
                  Go to CR Login <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </GlassCard>

              <GlassCard className="p-6 border-l-4 border-neonViolet italic text-center">
                <p className="text-gray-300 text-sm leading-relaxed">
                    "Dear <span className="text-white font-bold">{credentials?.name},</span> <br/><br/>
                    Thank you for taking up this responsibility. Your role is very important in making Farewell '26 successful. Please actively follow up with your classmates and ensure everyone completes their payment before <span className="text-neonViolet font-bold">05/05/2026</span>. <br/><br/>
                    Your effort, coordination, and responsibility will directly contribute to the success of this event. We appreciate your support and dedication."
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CredentialRow = ({ label, value, onCopy, copied }) => (
  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
    <button onClick={onCopy} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-neonCyan transition-all">
      {copied ? <span className="text-[10px] text-green-400 font-bold">Copied!</span> : <Copy size={16} />}
    </button>
  </div>
);

export default CRAccess;