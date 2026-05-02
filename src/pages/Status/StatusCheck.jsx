import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { checkPaymentStatus } from '../../api/payments';

const StatusCheck = () => {
  const [usn, setUsn] = useState('');
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- ROBUST DATE FORMATTING (Fixes "Invalid Date" & Timezone shifts) ---
  const universalFormatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const normalizedDate = dateString.includes('T') 
        ? dateString 
        : dateString.replace(' ', 'T');
      const date = new Date(normalizedDate);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleString("en-IN", {
        timeZone: 'UTC', // Syncs exactly with the IST values stored in Supabase
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateString; 
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!usn) return;
    
    setLoading(true);
    setError('');
    setPayment(null);

    try {
      const data = await checkPaymentStatus(usn.toUpperCase());
      if (data) {
        setPayment(data);
      } else {
        setError('No record found for this USN. Please ensure you have submitted the form.');
      }
    } catch (err) {
      setError('Error fetching status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-[80vh] p-6">
      {/* ATMOSPHERIC LIGHTING */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-lg flex flex-col items-center gap-6 z-10">
        <GlassCard className="relative w-full p-8 backdrop-blur-2xl border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold neon-text-gradient mb-2">Check Status</h2>
            <p className="text-gray-400">Enter your USN to see your payment verification progress</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="flex-1">
              <Input 
                label="USN"
                placeholder="e.g. 1MS22CS001" 
                required 
                value={usn} 
                onChange={(e) => setUsn(e.target.value.toUpperCase())} 
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="h-[52px]">
                {loading ? 'Searching...' : 'Check'}
              </Button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-center text-sm"
              >
                {error}
              </motion.div>
            )}

            {payment && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-400 text-sm uppercase tracking-widest">Payment Status for {payment.name}</p>
                  <StatusBadge status={payment.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-glassBorder text-sm">
                  <div className="text-left">
                    <p className="text-gray-500">Amount Paid</p>
                    <p className="text-white font-semibold">₹{payment.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">USN</p>
                    <p className="text-white font-semibold">{payment.usn}</p>
                  </div>
                </div>

                {payment.status === 'approved' && (
                  <p className="text-xs text-green-400/70 italic">
                    Verified by {payment.verified_by} on {universalFormatDate(payment.verified_at)}
                  </p>
                )}

                {payment.status === 'rejected' && (
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 space-y-3">
                    <div className="text-center">
                      <p className="text-red-400 font-bold text-sm uppercase tracking-tight">Rejection Reason:</p>
                      <p className="text-gray-200 text-sm italic">
                        {payment.rejection_reason || "No specific reason provided."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-500/20 text-[11px] text-gray-400 flex justify-between items-center px-2">
                      <span>Rejected by: <span className="text-gray-200 font-medium">{payment.verified_by || 'CR'}</span></span>
                      <span>Time: <span className="text-gray-200 font-medium">{universalFormatDate(payment.verified_at)}</span></span>
                    </div>

                    <p className="text-[11px] text-red-300/80 italic text-center pt-1">
                      If any information is wrong, please contact your Class Representative.
                    </p>
                  </div>
                )}

                {payment.status === 'disputed' && (
                  <p className="text-sm text-amber-400 font-medium animate-pulse">
                    Your payment is currently under admin review. Please wait or contact your CR.
                  </p>
                )}

                <div className="pt-4">
                  {payment.status === 'rejected' && (
                    <Button variant="violet" onClick={() => window.location.href = '/submit'}>
                      Resubmit Payment
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* --- DYNAMIC STATUS THANK YOU MESSAGE --- */}
        <AnimatePresence>
          {payment && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl text-center space-y-3"
            >
              {payment.status === 'approved' && (
                <div className="text-green-400">
                  <p className="font-bold text-sm uppercase tracking-widest mb-1">✅ Thank you for completing your payment</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Your payment has been successfully verified. We appreciate your support in making Farewell '26 a grand success.
                  </p>
                </div>
              )}

              {payment.status === 'pending' && (
                <div className="text-yellow-400">
                  <p className="font-bold text-sm uppercase tracking-widest mb-1">⏳ Thank you for making the payment</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Your payment is currently under verification by the Finance Committee. Please wait until the verification process is completed.
                  </p>
                </div>
              )}

              {payment.status === 'rejected' && (
                <div className="text-red-400">
                  <p className="font-bold text-sm uppercase tracking-widest mb-1">❌ Thank you for your effort</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    There seems to be an issue with your payment. Kindly make the payment again correctly and ensure all details are accurate.
                    <br/>
                    <span className="text-gray-400 block mt-2 italic">If you need help, please contact your Class Representative.</span>
                  </p>
                </div>
              )}

              {payment.status === 'disputed' && (
                <div className="text-amber-400">
                  <p className="font-bold text-sm uppercase tracking-widest mb-1">⚠️ Under Review</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Your payment is being cross-checked. Please wait for further updates from the Admin.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StatusCheck;