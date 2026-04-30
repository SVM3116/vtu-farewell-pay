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

  const handleSearch = async (e) => {
    e.preventDefault();
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
      
      <GlassCard className="relative w-full max-w-lg p-8 backdrop-blur-2xl border-white/10 shadow-2xl">
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

              {/* Verified details ONLY for approved payments */}
              {payment.status === 'approved' && (
                <p className="text-xs text-green-400/70 italic">
                  Verified by {payment.verified_by} on {new Date(payment.verified_at).toLocaleDateString()}
                </p>
              )}

              {/* SPECIFIC DISPUTED MESSAGE */}
              {payment.status === 'disputed' && (
                <p className="text-sm text-amber-400 font-medium animate-pulse">
                  Your payment is currently under admin review. Please wait or contact your CR.
                </p>
              )}

              {payment.status === 'rejected' && (
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-red-400 font-medium mb-2">Reason: {payment.rejection_reason}</p>
                </div>
              )}

              <div className="pt-4">
                {/* Resubmit Button ONLY for rejected payments */}
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
    </div>
  );
};

export default StatusCheck;