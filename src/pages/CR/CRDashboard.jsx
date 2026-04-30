import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { getCurrentCR, logoutCR } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';

const CRDashboard = () => {
  const cr = getCurrentCR();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    // CR SCOPING: Filter by cr.year, cr.branch, and cr.division
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('year', cr.year)
      .eq('branch', cr.branch)
      .eq('division', cr.division)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setPayments(data);
    setLoading(false);
  };

  const updateStatus = async (paymentId, newStatus, reason = '') => {
    // 1. Update the payment record
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ 
        status: newStatus, 
        verified_by: cr.name, 
        verified_at: new Date().toISOString(), 
        rejection_reason: reason 
      })
      .eq('id', paymentId);

    if (updateErr) return alert("Update failed!");

    // 2. Log to audit_logs
    await supabase.from('audit_logs').insert([{
      action: newStatus === 'approved' ? 'approved' : 'rejected',
      performed_by: cr.name,
      role: 'cr',
      payment_id: paymentId,
      usn: payments.find(p => p.id === paymentId).usn,
      reason: reason
    }]);

    fetchPayments(); // Refresh list
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold neon-text-gradient">CR Dashboard</h2>
          <p className="text-gray-400">{cr.year} | {cr.branch} | Div: {cr.division} | Welcome, {cr.name}</p>
        </div>
        <Button variant="violet" onClick={logoutCR}>Logout</Button>
      </div>

      <GlassCard className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-glassBorder">
              <th className="p-3">Student</th>
              <th className="p-3">USN</th>
              <th className="p-3">Amount</th>
              <th className="p-3">UTR</th>
              <th className="p-3">Payment Note</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-10">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-10">No payments found for your section.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-400">{p.usn}</td>
                  <td className="p-3">₹{p.amount}</td>
                  <td className="p-3 font-mono text-xs">{p.utr}</td>
                  <td className="p-3 text-neonViolet font-bold text-xs">{`${p.usn}_${p.name.toUpperCase()}`}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 flex gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(p.id, 'approved')} className="px-2 py-1 bg-green-500/20 text-green-400 rounded border border-green-500/50 text-xs hover:bg-green-500 hover:text-white transition-all">Approve</button>
                        <button onClick={() => {
                          const reason = prompt("Enter rejection reason (Wrong UTR / Amount Mismatch / etc):");
                          if(reason) updateStatus(p.id, 'rejected', reason);
                        }} className="px-2 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/50 text-xs hover:bg-red-500 hover:text-white transition-all">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};

export default CRDashboard;