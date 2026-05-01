import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabase';
import { getCurrentCR, logoutCR } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';

const CRDashboard = () => {
  const cr = getCurrentCR();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    paymentId: null,
    reason: '',
    isOther: false
  });

  const REJECTION_OPTIONS = [
    "Wrong UTR",
    "Payment not found",
    "Amount mismatch",
    "Note mismatch",
    "Other"
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('year', cr.year)
      .eq('branch', cr.branch)
      .eq('division', cr.division)
      .order('created_at', { ascending: false });

    if (error) console.error("Fetch error:", error);
    else setPayments(data || []);
    setLoading(false);
  };

  const formatPaymentTime = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return timestamp;
    }
  };

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: 'approved', 
        verified_by: cr.name, 
        verified_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) alert(error.message);
    else {
      await supabase.from('audit_logs').insert([{
        action: 'approved', performed_by: cr.name, role: 'cr', payment_id: id
      }]);
      fetchPayments();
    }
  };

  const handleRejectSubmit = async () => {
    const finalReason = rejectModal.reason;
    if (!finalReason || finalReason.trim() === '') {
      alert("Please provide a rejection reason.");
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({ 
        status: 'rejected', 
        rejection_reason: finalReason,
        verified_by: cr.name, 
        verified_at: new Date().toISOString() 
      })
      .eq('id', rejectModal.paymentId);

    if (error) alert(error.message);
    else {
      await supabase.from('audit_logs').insert([{
        action: 'rejected', performed_by: cr.name, role: 'cr', payment_id: rejectModal.paymentId, reason: finalReason
      }]);
      setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false });
      fetchPayments();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold neon-text-gradient">CR Dashboard</h2>
          <p className="text-gray-400 text-xs md:text-sm">
            {cr.year} | {cr.branch} | Div: {cr.division} | Welcome, {cr.name}
          </p>
        </div>
        <Button variant="violet" onClick={logoutCR} className="w-full md:w-auto">Logout</Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-10 text-gray-500 animate-pulse">Loading payments...</div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <GlassCard className="overflow-x-auto p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-glassBorder">
                      <th className="p-3">Student</th>
                      <th className="p-3">USN</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">UTR</th>
                      <th className="p-3">Payment Note</th>
                      <th className="p-3">Payment Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                        <td className="p-3">{p.name}</td>
                        <td className="p-3 font-mono text-xs">{p.usn}</td>
                        <td className="p-3">₹{p.amount}</td>
                        <td className="p-3 font-mono text-xs">{p.utr}</td>
                        <td className="p-3 text-neonViolet font-mono text-xs">{p.usn}_{p.name.toUpperCase()}</td>
                        <td className="p-3 text-gray-400 text-xs">{formatPaymentTime(p.payment_timestamp)}</td>
                        <td className="p-3"><StatusBadge status={p.status} /></td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => handleApprove(p.id)} className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-md text-xs hover:bg-green-500/40 transition-all">Approve</button>
                          <button onClick={() => setRejectModal({ isOpen: true, paymentId: p.id, reason: '', isOther: false })} className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-md text-xs hover:bg-red-500/40 transition-all">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {payments.map(p => (
                <GlassCard key={p.id} className="p-4 space-y-4 border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.usn}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-y border-white/10 py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px]">Amount</span>
                      <span className="text-white font-semibold">₹{p.amount}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-gray-500 uppercase text-[10px]">Time</span>
                      <span className="text-gray-300">{formatPaymentTime(p.payment_timestamp)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[10px]">UTR</span>
                      <span className="text-white font-mono">{p.utr}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-gray-500 uppercase text-[10px]">Note</span>
                      <span className="text-neonViolet font-mono">{p.usn}_{p.name.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => handleApprove(p.id)} className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg text-xs font-bold hover:bg-green-500/40">Approve</button>
                    <button onClick={() => setRejectModal({ isOpen: true, paymentId: p.id, reason: '', isOther: false })} className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-xs font-bold hover:bg-red-500/40">Reject</button>
                  </div>
                </GlassCard>
              ))}
              {payments.length === 0 && <div className="text-center p-10 text-gray-500">No payments found for your scope.</div>}
            </div>
          </>
        )}
      </div>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {rejectModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })}
              className="absolute inset-0 bg-darkBg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md p-6 md:p-8 glass-card border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] rounded-3xl"
            >
              <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wider">Reject Payment</h3>
              <p className="text-gray-400 text-sm mb-6">Please specify the reason for rejection. This will be visible to the student.</p>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 ml-1">Select Reason</label>
                  <select 
                    className="input-glass w-full"
                    value={rejectModal.reason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRejectModal(prev => ({ ...prev, reason: val, isOther: val === 'Other' }));
                    }}
                  >
                    <option value="">-- Choose Reason --</option>
                    {REJECTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {rejectModal.isOther && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 ml-1">Specify Custom Reason</label>
                    <Input 
                      placeholder="Enter detailed reason..." 
                      value={rejectModal.reason} 
                      onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))} 
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="violet" className="flex-1" onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-red-600 text-white border-red-400 hover:bg-red-700" onClick={handleRejectSubmit}>
                  Confirm Reject
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRDashboard;