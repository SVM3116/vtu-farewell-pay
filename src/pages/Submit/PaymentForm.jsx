import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; 
import Select from '../../components/ui/Select'; 
import { YEARS, BRANCHES, DIVISIONS, FEE_STRUCTURE } from '../../utils/constants';
import { checkDuplicate, submitPayment } from '../../api/payments';
import { supabase } from '../../api/supabase'; 

const MY_UPI_ID = "BHARATPE2F0N0B1G7I09072@unitype";

const PaymentForm = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState({ utr: false });
  const [usnStatus, setUsnStatus] = useState('none'); 
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '', 
    usn: '',
    year: YEARS[0],
    branch: BRANCHES[0],
    division: DIVISIONS[0],
    utr: '',
    payment_timestamp: '',
  });

  const amount = FEE_STRUCTURE[formData.year];

  useEffect(() => {
    if (formData.branch === 'CSBS' && formData.year === '3rd Year') {
      setFormData(prev => ({ ...prev, division: 'A' })); 
    }
  }, [formData.branch, formData.year]);

  useEffect(() => {
    const checkUsnStatus = async (value) => {
      if (value.length < 5) return;
      try {
        const { data } = await supabase.from('payments').select('status').eq('usn', value).single();
        setUsnStatus(data ? data.status : 'none');
      } catch (err) {
        setUsnStatus('none');
      }
    };
    if (formData.usn) checkUsnStatus(formData.usn);
  }, [formData.usn]);

  useEffect(() => {
    if (formData.utr) {
      const checkUtr = async () => {
        const isDuplicate = await checkDuplicate('utr', formData.utr);
        setDuplicates(prev => ({ ...prev, utr: isDuplicate }));
      };
      checkUtr();
    }
  }, [formData.utr]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: 'Full Name',
      mobile: 'Mobile Number',
      usn: 'USN',
      utr: 'UTR Number',
      payment_timestamp: 'Payment Timestamp'
    };

    for (const key in requiredFields) {
      if (!formData[key] || formData[key].trim() === '') {
        alert(`Please enter your ${requiredFields[key]}.`);
        return;
      }
    }

    if (formData.mobile.length !== 10) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }

    if (duplicates.utr) {
      alert("UTR already exists. Please check your details.");
      return;
    }

    setLoading(true);
    try {
      await submitPayment({ ...formData, amount });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00f5ff', '#bf00ff'] });
      alert("Payment submitted successfully!");
      setStep(3);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const upiLink = `upi://pay?pa=${MY_UPI_ID}&pn=Farewell26&am=${amount}&cu=INR`;

  return (
    <div className="relative flex justify-center items-center min-h-screen md:min-h-[80vh] p-4 sm:p-6">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-72 md:h-72 bg-neonCyan/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-72 md:h-72 bg-neonViolet/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none" />
      
      <GlassCard className="relative w-full max-w-2xl p-6 md:p-12 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl">
        
        {/* Step Indicator - Mobile Optimized */}
        <div className="flex justify-center md:justify-between mb-8 md:mb-12 max-w-md mx-auto">
          {[1, 2].map((i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${step === i ? 'text-neonCyan scale-110' : 'text-gray-500'}`}>
              <span className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-black text-xs md:text-sm transition-all ${step === i ? 'border-neonCyan shadow-[0_0_10px_rgba(0,245,255,0.5)] bg-neonCyan/10' : 'border-gray-600 bg-transparent'}`}>
                {i}
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">{i === 1 ? 'Details' : 'Payment'}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input 
                    label="Full Name" 
                    placeholder="Enter full name" 
                    required 
                    value={formData.name} 
                    // CONSTRAINT: Only alphabets and spaces allowed
                    onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                />
                <Input 
                    label="Mobile Number" 
                    placeholder="Enter 10 digit mobile" 
                    required 
                    value={formData.mobile} 
                    // CONSTRAINT: Only numbers and max 10 digits
                    onChange={(e) => setFormData({...formData, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} 
                />
                <Input 
                    label="USN" 
                    placeholder="1MS22CS001" 
                    required 
                    error={usnStatus === 'pending' ? "Your payment is already submitted and under review." : 
                           usnStatus === 'approved' ? "Your payment is already approved. No action needed." : null}
                    value={formData.usn} 
                    onChange={(e) => setFormData({...formData, usn: e.target.value.toUpperCase()})} 
                />
                
                <Select 
                    label="Year" 
                    options={YEARS} 
                    value={formData.year} 
                    onChange={(val) => setFormData({...formData, year: val})} 
                    required 
                />
                <Select 
                    label="Branch" 
                    options={BRANCHES} 
                    value={formData.branch} 
                    onChange={(val) => setFormData({...formData, branch: val})} 
                    required 
                />
              </div>
              
              {usnStatus === 'rejected' && (
                <p className="text-center text-[10px] md:text-xs text-neonCyan italic animate-pulse bg-neonCyan/5 p-2 rounded-lg border border-neonCyan/20">
                  A previous submission with this USN was rejected. You are resubmitting with new details.
                </p>
              )}

              <div className="flex flex-col gap-1">
                <Select 
                    label="Division" 
                    options={DIVISIONS} 
                    value={formData.division} 
                    onChange={(val) => setFormData({...formData, division: val})} 
                    disabled={formData.branch === 'CSBS' && formData.year === '3rd Year'}
                    required 
                />
              </div>

              <div className="flex justify-end mt-6 md:mt-8">
                <Button onClick={() => setStep(2)}>Next Step →</Button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6 md:space-y-8"
                onSubmit={handleSubmit}
            >
                <div className="text-center">
                <div className="inline-block p-3 md:p-4 bg-white rounded-2xl shadow-neon-cyan mb-4 md:mb-6 transform hover:scale-105 transition-transform">
                    <QRCodeCanvas value={upiLink} size={window.innerWidth < 768 ? 180 : 200} />
                </div>
                
                <div className="mb-2">
                    <span className="text-3xl md:text-4xl font-black text-neonCyan drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">₹{amount}</span>
                </div>
                <p className="text-[10px] md:text-xs text-gray-400 mb-6 tracking-wide">Scan the QR code with any UPI app to pay</p>
                </div>

                <div className="relative overflow-hidden p-3 md:p-4 border border-neonViolet/30 bg-neonViolet/10 rounded-2xl text-center group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neonViolet/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <p className="text-xs md:text-sm relative z-10">
                    Payment Note: <strong className="text-neonViolet font-mono ml-2">{`${formData.usn}_${formData.name.toUpperCase()}`}</strong>
                </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                        label="UTR Number" 
                        placeholder="12 digit UTR" 
                        required 
                        error={duplicates.utr ? "UTR already used!" : null}
                        value={formData.utr} 
                        onChange={(e) => setFormData({...formData, utr: e.target.value})} 
                    />
                    <Input 
                        label="Payment Timestamp" 
                        type="datetime-local" 
                        required 
                        value={formData.payment_timestamp} 
                        onChange={(e) => setFormData({...formData, payment_timestamp: e.target.value})} 
                    />
                </div>

                <div className="flex flex-col-reverse md:flex-row justify-between gap-4 mt-8">
                    <Button variant="violet" onClick={() => setStep(1)} className="w-full md:w-auto">← Back</Button>
                    <Button onClick={handleSubmit} disabled={loading} type="submit" className="w-full md:w-auto">
                        {loading ? 'Processing...' : 'Confirm Payment ✅'}
                    </Button>
                </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-10"
            >
              <div className="text-6xl md:text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl md:text-4xl font-black neon-text-gradient uppercase tracking-tighter">Submitted!</h2>
              <p className="text-gray-400 max-w-sm mx-auto leading-relaxed text-sm md:text-base">Your payment is pending verification by your CR. You can check your status on the Status page.</p>
              <Button variant="cyan" onClick={() => window.location.href = '/status'}>Check Status</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};

export default PaymentForm;