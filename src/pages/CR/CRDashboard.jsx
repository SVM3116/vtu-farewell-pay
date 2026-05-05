import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabase';
import { getCurrentCR, logoutCR } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StampBadge from '../../components/ui/StampBadge'; 
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';

const CRDashboard = () => {
  const cr = getCurrentCR();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // --- PERMISSION STATE ---
  const [canVerify, setCanVerify] = useState(true);

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    paymentId: null,
    reason: '',
    isOther: false
  });

  const REJECTION_OPTIONS = [
    "Wrong Amount",
    "Payment not received",
    "UTR Mismatch",
    "Other"
  ];

  // --- TIME HELPERS ---
  const getISTTimestamp = () => {
  // Return a standard ISO string. 
  // Supabase stores this as UTC, which is the correct standard.
  return new Date().toISOString(); 
};

  const universalFormatDate = (dateString, isUtc = true) => {
  if (!dateString) return "—";
  try {
    // 1. Normalize the date string
    let normalizedDate = dateString.includes('T') 
      ? dateString 
      : dateString.replace(' ', 'T');

    // 2. THE KEY FIX: If it's NOT UTC (like Bank Time), 
    // we remove any 'Z' or timezone offset to force the browser to treat it as local time.
    if (!isUtc) {
      normalizedDate = normalizedDate.replace('Z', '').split('+')[0];
    }

    const date = new Date(normalizedDate);
    if (isNaN(date.getTime())) return dateString;

    // 3. Formatting
    return date.toLocaleString("en-IN", {
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

  useEffect(() => {
    fetchPayments();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { data } = await supabase
      .from('cr_accounts')
      .select('verification_enabled')
      .eq('email', cr.email)
      .single();
    if (data) setCanVerify(data.verification_enabled);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('year', cr.year)
        .eq('branch', cr.branch)
        .eq('division', cr.division)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ANALYTICS CALCULATION ---
  const analytics = useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved');
    const cashApproved = approved.filter(p => p.utr === 'CASH');
    const upiApproved = approved.filter(p => p.utr !== 'CASH');

    return {
      totalCount: payments.length,
      overallAmount: approved.reduce((sum, p) => sum + p.amount, 0),
      cashAmount: cashApproved.reduce((sum, p) => sum + p.amount, 0),
      upiAmount: upiApproved.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  const filteredPayments = payments.filter(p => 
    statusFilter === 'all' || p.status === statusFilter
  );

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadCSV = () => {
    const cleanYear = cr.year.replace(/\s+/g, '');
    const fileName = `${cleanYear}_${cr.branch}_${cr.division}.csv`;
    const headers = "Name,USN,Amount,UTR,Submission Time,Bank Txn Time,Verified By,Verified At,Status\n";
    const rows = filteredPayments.map(p => [
      `"${p.name}"`, `"${p.usn}"`, p.amount, `"${p.utr}"`,
      `"${universalFormatDate(p.created_at, true)}"`,
      `"${universalFormatDate(p.bank_transaction_time, false)}"`,
      `"${p.verified_by || '—'}"`, `"${universalFormatDate(p.verified_at)}"`, `"${p.status}"`
    ].join(",")).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    a.click();
  };

  const handleApprove = async (id) => {
    if (!canVerify) return alert("Your verification access is disabled by Admin.");
    try {
      const istNow = getISTTimestamp();
      const { error } = await supabase
        .from('payments')
        .update({ status: 'approved', verified_by: cr.name, verified_at: istNow })
        .eq('id', id);

      if (error) throw error;
      await supabase.from('audit_logs').insert([{
        action: 'approved', performed_by: cr.name, role: 'cr', payment_id: id, timestamp: istNow
      }]);
      fetchPayments();
    } catch (err) { alert(err.message); }
  };

  const handleRejectSubmit = async () => {
    if (!canVerify) return alert("Your verification access is disabled by Admin.");
    const finalReason = rejectModal.reason;
    if (!finalReason || finalReason.trim() === '') return alert("Please provide a reason.");
    try {
      const istNow = getISTTimestamp();
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected', rejection_reason: finalReason, verified_by: cr.name, verified_at: istNow })
        .eq('id', rejectModal.paymentId);

      if (error) throw error;
      await supabase.from('audit_logs').insert([{
        action: 'rejected', performed_by: cr.name, role: 'cr', payment_id: rejectModal.paymentId, reason: finalReason, timestamp: istNow
      }]);
      setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false });
      fetchPayments();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold neon-text-gradient">Class Verification Hub</h2>
          <p className="text-gray-400 text-xs md:text-sm">
            {cr.year} | {cr.branch} | Div: {cr.division} | Welcome, {cr.name}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={downloadCSV} variant="cyan" className="flex-1 md:flex-none">Download CSV 📥</Button>
          <Button variant="violet" onClick={logoutCR} className="flex-1 md:flex-none">Logout</Button>
        </div>
      </div>

      {/* --- THREE-TIER ANALYTICS SECTION --- */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center border-l-4 border-white/20">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Total Submissions</p>
          <p className="text-2xl font-black text-white">{analytics.totalCount}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center border-l-4 border-neonCyan">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Overall Collection (UPI + Cash)</p>
          <p className="text-2xl font-black text-neonCyan">₹{analytics.overallAmount}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center border-l-4 border-neonViolet">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">My Cash Collection</p>
          <p className="text-2xl font-black text-neonViolet">₹{analytics.cashAmount}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center border-l-4 border-blue-400">
          <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">UPI Collections</p>
          <p className="text-2xl font-black text-blue-400">₹{analytics.upiAmount}</p>
        </GlassCard>
      </div>

      {!canVerify && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl text-amber-400 text-sm text-center font-medium animate-pulse">
          ⚠️ Verification access is currently disabled by the Admin. Please wait for permission.
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center justify-start bg-white/5 p-4 rounded-2xl border border-white/10">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mr-2">Filter Status:</span>
        {[
          { id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' }, { id: 'rejected', label: 'Rejected' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
              statusFilter === filter.id ? 'bg-neonCyan/20 border-neonCyan text-neonCyan shadow-[0_0_10px_rgba(0,245,255,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-10 text-gray-500 animate-pulse">Loading student payments...</div>
        ) : (
          <>
            <div className="hidden lg:block">
              <GlassCard className="overflow-x-auto p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-glassBorder">
                      <th className="p-3">Student</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Year/Branch</th>
                      <th className="p-3">UTR / Method</th>
                      <th className="p-3">Sub. Time</th>
                      <th className="p-3">Bank Time</th>
                      <th className="p-3">Verified By</th>
                      <th className="p-3">Verified At</th>
                      <th className="p-3">Status</th>
                      {canVerify && <th className="p-3 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map(p => {
                      const isCash = p.utr === 'CASH';
                      const isLocked = !isCash || !canVerify;

                      return (
                        <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3 font-mono text-xs">{p.mobile}</td>
                          <td className="p-3 text-gray-400">{p.year} {p.branch}</td>
                          <td className="p-3 font-mono text-xs">
                            {isCash ? (
                              <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold">CASH</span>
                            ) : (
                              <span className="text-gray-400">{p.utr || '—'}</span>
                            )}
                          </td>
                          <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.created_at, true)}</td>
                          <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.bank_transaction_time, false)}</td>
                          <td className="p-3">{p.verified_by || '—'}</td>
                          <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.verified_at, true)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center">
                              <StampBadge status={p.status} verified_by={p.verified_by} />
                            </div>
                          </td>
                          {canVerify && (
                            <td className="p-3 flex justify-center gap-3">
                              <button 
                                onClick={() => handleApprove(p.id)} 
                                disabled={isLocked}
                                className={`text-xs font-bold transition-colors ${isLocked ? 'text-gray-600 cursor-not-allowed' : 'text-green-400 hover:underline'}`}
                              >
                                {isLocked ? 'Admin Only' : 'Approve'}
                              </button>
                              <button 
                                onClick={() => setRejectModal({ isOpen: true, paymentId: p.id, reason: '', isOther: false })} 
                                disabled={isLocked}
                                className={`text-xs font-bold transition-colors ${isLocked ? 'text-gray-600 cursor-not-allowed' : 'text-red-400 hover:underline'}`}
                              >
                                {isLocked ? 'Blocked' : 'Reject'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </GlassCard>
            </div>

            <div className="lg:hidden grid grid-cols-1 gap-4">
              {paginatedPayments.map(p => {
                const isCash = p.utr === 'CASH';
                const isLocked = !isCash || !canVerify;

                return (
                  <GlassCard key={p.id} className="p-4 space-y-3 border-white/10">
                    <div className="relative flex justify-between items-start">
                      <div><p className="text-white font-bold">{p.name}</p><p className="text-xs text-neonCyan font-mono">{p.usn}</p></div>
                      <div className="absolute -top-3 -right-3 z-10"><StampBadge status={p.status} verified_by={p.verified_by} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-y border-white/10 py-3">
                      <div className="flex flex-col"><span className="text-gray-500 uppercase text-[10px]">Amount</span><span className="text-white font-semibold">₹{p.amount}</span></div>
                      <div className="flex flex-col text-right"><span className="text-gray-500 uppercase text-[10px]">Verified At</span><span className="text-gray-300">{universalFormatDate(p.verified_at)}</span></div>
                      <div className="flex flex-col"><span className="text-gray-500 uppercase text-[10px]">UTR/Method</span><span className={`font-mono ${isCash ? 'text-violet-400 font-bold' : 'text-white'}`}>{p.utr}</span></div>
                      <div className="flex flex-col text-right"><span className="text-gray-500 uppercase text-[10px]">Bank Time</span><span className="text-gray-300">{universalFormatDate(p.bank_transaction_time)}</span></div>
                    </div>
                    {canVerify && (
                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => handleApprove(p.id)} 
                          disabled={isLocked}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${isLocked ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' : 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/40'}`}
                        >
                          {isLocked ? 'Admin Only' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => setRejectModal({ isOpen: true, paymentId: p.id, reason: '', isOther: false })} 
                          disabled={isLocked}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${isLocked ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' : 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40'}`}
                        >
                          {isLocked ? 'Blocked' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white">Prev</button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-neonCyan text-black shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white">Next</button>
              </div>
            )}

            {filteredPayments.length === 0 && <div className="text-center p-10 text-gray-500">No matching records found.</div>}
          </>
        )}
      </div>

      {/* REJECTION MODAL */}
      <AnimatePresence>
        {rejectModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })} className="absolute inset-0 bg-darkBg/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative z-10 w-full max-w-md p-6 md:p-8 glass-card border-red-500/30 rounded-3xl">
              <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wider">Reject Payment</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 ml-1">Select Reason</label>
                  <Select options={REJECTION_OPTIONS} value={rejectModal.reason} onChange={(val) => { setRejectModal(prev => ({ ...prev, reason: val, isOther: val === 'Other' })); }} />
                </div>
                {rejectModal.isOther && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 ml-1">Specify Reason</label>
                    <Input placeholder="Enter detailed reason..." value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} />
                  </motion.div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="violet" className="flex-1" onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white border-red-400" onClick={handleRejectSubmit}>Confirm Reject</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRDashboard;