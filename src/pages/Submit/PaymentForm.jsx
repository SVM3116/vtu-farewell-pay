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
  const [paymentMethod, setPaymentMethod] = useState('digital'); // 'digital' or 'cash'
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '', 
    usn: '',
    year: YEARS[0],
    branch: BRANCHES[0],
    division: DIVISIONS[0],
    utr: '',
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
    if (paymentMethod === 'digital' && formData.utr) {
      const checkUtr = async () => {
        const isDuplicate = await checkDuplicate('utr', formData.utr);
        setDuplicates(prev => ({ ...prev, utr: isDuplicate }));
      };
      checkUtr();
    } else {
      setDuplicates(prev => ({ ...prev, utr: false }));
    }
  }, [formData.utr, paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = {
      name: 'Full Name',
      mobile: 'Mobile Number',
      usn: 'USN',
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

    // Set UTR to 'CASH' if cash is selected, otherwise use the input
    const finalUtr = paymentMethod === 'cash' ? `CASH_${formData.usn}` : formData.utr;
    // FIXED: Changed 'CASH' to `CASH_${formData.usn}` to avoid duplicate key database errors
    

    if (paymentMethod === 'digital' && (!finalUtr || finalUtr.trim() === '')) {
      alert("Please enter your UTR Number for digital payments.");
      return;
    }

    if (paymentMethod === 'digital' && duplicates.utr) {
      alert("UTR already exists. Please check your details.");
      return;
    }

    setLoading(true);
    try {
      await submitPayment({ ...formData, utr: finalUtr, amount });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00f5ff', '#bf00ff'] });
      setStep(4); // Success Page
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const upiLink = `upi://pay?pa=${MY_UPI_ID}&pn=Farewell26&am=${amount}&cu=INR`;

  return (
    <div className="relative flex justify-center items-center min-h-screen md:min-h-[80vh] p-4 sm:p-6">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-72 md:h-72 bg-neonCyan/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-72 md:h-72 bg-neonViolet/10 rounded-full blur-[100px] pointer-events-none" />
      
      <GlassCard className="relative w-full max-w-2xl p-6 md:p-12 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl">
        
        {/* STEP INDICATOR */}
        <div className="flex justify-center mb-12 max-w-md mx-auto gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${step >= i ? 'text-neonCyan scale-110' : 'text-gray-500'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black transition-all ${step >= i ? 'border-neonCyan shadow-[0_0_10px_rgba(0,245,255,0.5)] bg-neonCyan/10' : 'border-gray-600 bg-transparent'}`}>
                {i}
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold hidden sm:block">{i === 1 ? 'Details' : i === 2 ? 'Payment' : 'Verify'}</span>
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
                    onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} 
                />
                <Input 
                    label="Mobile Number" 
                    placeholder="Enter 10 digit mobile" 
                    required 
                    value={formData.mobile} 
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
            <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6 md:space-y-8 text-center"
            >
                <div>
                  <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
                    Banking Name: <span className="text-white font-black">MANOJ KUMAR V</span>
                  </p>
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-neon-cyan mb-6 transform hover:scale-105 transition-transform">
                      <motion.div 
                        key={amount}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <QRCodeCanvas value={upiLink} size={window.innerWidth < 768 ? 180 : 200} />
                      </motion.div>
                  </div>
                  <div className="mb-2">
                      <span className="text-3xl md:text-4xl font-black text-neonCyan drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">₹{amount}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-8 tracking-wide">Scan the QR code with any UPI app to pay</p>
                </div>
                <div className="relative overflow-hidden p-3 md:p-4 border border-neonViolet/30 bg-neonViolet/10 rounded-2xl text-center group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neonViolet/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <p className="text-xs md:text-sm relative z-10">
                    Payment Note: <strong className="text-neonViolet font-mono ml-2">{`${formData.usn}_${formData.name.toUpperCase()}`}</strong>
                </p>
                </div>

                <div className="flex justify-between gap-4">
                    <Button variant="violet" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                    <Button onClick={() => setStep(3)} className="flex-1">I have paid ✅</Button>
                </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
                onSubmit={handleSubmit}
            >
                <div className="space-y-4 text-center">
                    <h3 className="text-lg font-bold text-white">Verification Method</h3>
                    
                    <div className="flex items-center justify-center gap-4 p-1 bg-white/5 rounded-full border border-white/10 w-fit mx-auto">
                        <button 
                            type="button"
                            onClick={() => setPaymentMethod('digital')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${paymentMethod === 'digital' ? 'bg-neonCyan text-darkBg shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Digital / UPI
                        </button>
                        <button 
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${paymentMethod === 'cash' ? 'bg-neonViolet text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Paid in Cash
                        </button>
                    </div>
                </div>

                {paymentMethod === 'digital' ? (
                    <div className="flex justify-center w-full animate-in fade-in slide-in-from-top-2">
                        <div className="w-full max-w-md">
                            <Input 
                                label="UTR Number" 
                                placeholder="12 digit UTR" 
                                required 
                                error={duplicates.utr ? "UTR already used!" : null}
                                value={formData.utr} 
                                onChange={(e) => setFormData({...formData, utr: e.target.value})} 
                            />
                        </div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="p-4 bg-neonViolet/10 border border-neonViolet/30 rounded-2xl text-center text-sm text-violet-300 italic"
                    >
                        Payment noted as CASH. Your CR will verify your contribution manually.
                    </motion.div>
                )}

                <div className="flex justify-between gap-4 mt-12">
                    <Button variant="violet" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                    <Button onClick={handleSubmit} disabled={loading} type="submit" className="flex-1">
                        {loading ? 'Processing...' : 'Submit Contribution ✅'}
                    </Button>
                </div>
            </motion.form>
          )}

          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-10"
            >
              <div className="text-7xl mb-4 animate-bounce">💖</div>
              <h2 className="text-4xl font-black neon-text-gradient uppercase tracking-tighter">Thank You!</h2>
              <div className="space-y-4 max-w-md mx-auto">
                <p className="text-white font-bold text-lg">Contribution Received Successfully</p>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                  Your contribution is more than just a payment; it's a building block for our 
                  <span className="text-neonCyan font-bold"> final grand celebration</span>. 
                  Thank you for ensuring our last chapter together is complete and unforgettable.
                </p>
              </div>
              <div className="pt-6">
                <Button variant="cyan" onClick={() => window.location.href = '/status'}>Track My Status</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};

export default PaymentForm;