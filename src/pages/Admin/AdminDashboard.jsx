import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { getCurrentAdmin, logoutAdmin } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { YEARS, BRANCHES, DIVISIONS } from '../../utils/constants';

import Papa from 'papaparse';
import { processPaymentCSV } from '../../utils/csvProcessor';
import { 
  getPendingPayments, 
  getApprovedUTRs, 
  updatePaymentBySystem, 
  logSystemAction 
} from '../../api/payments';

const AdminDashboard = () => {
  const admin = getCurrentAdmin();
  
  // --- CORE STATE ---
  const [payments, setPayments] = useState([]);
  const [crAccounts, setCrAccounts] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, disputed: 0 });
  const [filters, setFilters] = useState({ year: '', branch: '', division: '' });
  const [newCR, setNewCR] = useState({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const neonInputStyle = "w-full bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:shadow-[0_0_8px_rgba(0,245,255,0.4)] transition-all duration-200 placeholder:text-white/40";
  const labelStyle = "text-[10px] font-bold uppercase tracking-wider text-neonCyan ml-1 mb-1";

  const getISTTimestamp = () => {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; 
    const istDate = new Date(now.getTime() + offset);
    return istDate.toISOString().slice(0, -1); 
  };

  const universalFormatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const normalizedDate = dateString.includes('T') 
        ? dateString 
        : dateString.replace(' ', 'T');
      const date = new Date(normalizedDate);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleString("en-IN", {
        timeZone: 'UTC', 
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
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    let query = supabase.from('payments').select('*');
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.branch) query = query.eq('branch', filters.branch);
    if (filters.division) query = query.eq('division', filters.division);
    const { data: pData } = await query.order('created_at', { ascending: false });
    setPayments(pData || []);
    const { data: cData } = await supabase.from('cr_accounts').select('*');
    setCrAccounts(cData || []);
    const approved = (pData || []).filter(p => p.status === 'approved');
    setStats({
      total: approved.reduce((sum, p) => sum + p.amount, 0),
      approved: approved.length,
      pending: (pData || []).filter(p => p.status === 'pending').length,
      rejected: (pData || []).filter(p => p.status === 'rejected').length,
      disputed: (pData || []).filter(p => p.status === 'disputed').length,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // RESET to first page when filter changes
  };

  const clearFilters = () => {
    setFilters({ year: '', branch: '', division: '' });
    setCurrentPage(1); // RESET to first page
  };

  const handlePaymentAction = async (paymentId, status) => {
    try {
      const istNow = getISTTimestamp();
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: status, verified_by: admin.name, verified_at: istNow })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert([{
        action: status, performed_by: admin.name, role: 'admin', payment_id: paymentId, timestamp: istNow
      }]);

      await fetchAllData();
    } catch (error) {
      console.error("Action failed:", error);
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleProcessCSV = async () => {
    if (!csvFile) return alert("Please select a CSV file first.");
    setIsProcessing(true);
    setCsvSummary(null);
    Papa.parse(csvFile, {
      header: false, skipEmptyLines: true,
      complete: async (results) => {
        try {
          const csvData = results.data.slice(1); 
          const pendingPayments = await getPendingPayments();
          const approvedUTRs = await getApprovedUTRs();
          const matchResults = processPaymentCSV(csvData, pendingPayments, approvedUTRs);
          
          const istNow = getISTTimestamp();

          for (const record of matchResults.toApprove) {
            await updatePaymentBySystem(record.id, { 
              status: 'approved', 
              verified_by: 'SYSTEM', 
              verified_at: istNow, 
              bank_transaction_time: record.bankTime 
            });
            logSystemAction({ action: 'auto_approved', payment_id: record.id, usn: record.usn, reason: 'Matched via CSV' }).catch(() => {});
          }

          for (const record of matchResults.toFlag) {
            await updatePaymentBySystem(record.id, { amount_flag: true });
            logSystemAction({ action: 'flag_amount_mismatch', payment_id: record.id, usn: record.usn, reason: 'UTR matched, amount differs' }).catch(() => {});
          }

          setCsvSummary({ approved: matchResults.toApprove.length, flagged: matchResults.toFlag.length, skipped: matchResults.skippedCount, total: matchResults.totalProcessed });
          await fetchAllData();
        } catch (err) { alert("Error during verification"); }
        setIsProcessing(false);
      }
    });
  };

  const createCR = async (e) => {
    e.preventDefault();
    
    // 1. Destructure password out of the newCR object so it's not sent to the DB
    const { password, ...crDataWithoutPassword } = newCR;

    // 2. Send the cleaned data and map 'password' to 'password_hash'
    const { error } = await supabase.from('cr_accounts').insert([{ 
      ...crDataWithoutPassword, 
      password_hash: password 
    }]);

    if (error) {
      console.error("Create CR Error:", error);
      alert(error.message);
    } else {
      alert("CR account created successfully!");
      setNewCR({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });
      fetchAllData();
    }
  };

  // --- FIXED EXPORT CSV ---
  const exportCSV = () => {
    // Filename: Admin_Export_02May2026.csv
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\//g, '');
    const fileName = `Admin_Export_${dateStr}.csv`;

    const headers = "Name,USN,Mobile,Year,Branch,Division,Amount,UTR,Bank Transaction Time,Verified By,Verified At,Status\n";
    
    // Export FULL filtered dataset, not just current page
    const rows = payments.map(p => [
      `"${p.name}"`,
      `"${p.usn}"`,
      `"${p.mobile || 'N/A'}"`,
      `"${p.year}"`,
      `"${p.branch}"`,
      `"${p.division}"`,
      p.amount,
      `"${p.utr}"`,
      `"${universalFormatDate(p.bank_transaction_time)}"`,
      `"${p.verified_by || 'Not Verified'}"`,
      `"${universalFormatDate(p.verified_at)}"`,
      `"${p.status}"`
    ].join(",")).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    a.click();
  };

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(payments.length / rowsPerPage);
  const paginatedPayments = payments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold neon-text-gradient">Finance Command Center</h2>
          <p className="text-gray-400 text-sm">Global Overview | {admin.name}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={exportCSV} variant="cyan" className="flex-1 md:flex-none">Export CSV 📥</Button>
          <Button variant="violet" onClick={logoutAdmin} className="flex-1 md:flex-none">Logout</Button>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-end gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="flex flex-col"><label className={labelStyle}>Year</label><select name="year" value={filters.year} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Years</option>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Branch</label><select name="branch" value={filters.branch} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Branches</option>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Division</label><select name="division" value={filters.division} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Divisions</option>{DIVISIONS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}</select></div>
            </div>
            <Button variant="violet" onClick={clearFilters} className="w-full lg:w-auto h-[42px]">Clear Filters</Button>
          </div>
        </div>

        <GlassCard className="p-4 md:p-6 border-l-4 border-neonCyan">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-neonCyan">Auto Verify CSV</h3>
              <p className="text-sm text-gray-400">Automatically approve payments from bank statement.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neonCyan/20 file:text-neonCyan hover:file:bg-neonCyan/30 cursor-pointer" />
              <Button onClick={handleProcessCSV} variant="cyan" disabled={isProcessing} className="whitespace-nowrap">{isProcessing ? "Processing..." : "Process CSV 🚀"}</Button>
            </div>
          </div>
          {csvSummary && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-glassBorder">
              <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Just Approved</p><p className="text-lg font-bold text-green-400">✅ {csvSummary.approved}</p></div>
              <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Amount Mismatch</p><p className="text-lg font-bold text-yellow-400">⚠️ {csvSummary.flagged}</p></div>
              <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Already Approved</p><p className="text-lg font-bold text-gray-400">⏭️ {csvSummary.skipped}</p></div>
              <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">CSV Rows</p><p className="text-lg font-bold text-neonCyan">{csvSummary.total}</p></div>
            </div>
          )}
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard title="Total" value={`₹${stats.total}`} color="text-neonCyan" />
          <SummaryCard title="Approved" value={stats.approved} color="text-green-400" />
          <SummaryCard title="Pending" value={stats.pending} color="text-yellow-400" />
          <SummaryCard title="Rejected" value={stats.rejected} color="text-red-400" />
          <SummaryCard title="Disputed" value={stats.disputed} color="text-orange-400" />
        </div>

        <div className="space-y-4">
          <div className="hidden lg:block overflow-x-auto">
            <GlassCard className="p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-glassBorder">
                    <th className="p-3">Student</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Year/Branch</th>
                    <th className="p-3">UTR</th>
                    <th className="p-3">Bank Txn Time</th>
                    <th className="p-3">Verified By</th>
                    <th className="p-3">Verified At</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map(p => (
                    <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span>{p.name} ({p.usn})</span>
                          {p.amount_flag && <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold w-fit animate-pulse backdrop-blur-sm"><span>⚠️</span><span>AMOUNT MISMATCH</span></div>}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{p.mobile}</td>
                      <td className="p-3 text-gray-400">{p.year} {p.branch}</td>
                      <td className="p-3 font-mono text-xs">{p.utr}</td>
                      <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.bank_transaction_time)}</td>
                      <td className="p-3">{p.verified_by}</td>
                      <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.verified_at)}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 flex gap-3">
                        <button onClick={() => handlePaymentAction(p.id, 'approved')} className="text-green-400 text-xs hover:underline transition-colors">Approve</button>
                        <button onClick={() => handlePaymentAction(p.id, 'disputed')} className="text-orange-400 text-xs hover:underline transition-colors">Dispute</button>
                        <button onClick={() => handlePaymentAction(p.id, 'rejected')} className="text-red-400 text-xs hover:underline transition-colors">Reject</button>
                        {p.amount_flag && <button onClick={async () => { await supabase.from('payments').update({ amount_flag: false }).eq('id', p.id); fetchAllData(); }} className="text-gray-400 text-xs hover:text-white underline ml-1">Clear Flag</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* PAGINATION UI - DESKTOP */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Prev</button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-neonCyan text-black shadow-[0_0_10px_rgba(0,245,255,0.6)]' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Next</button>
                </div>
              )}
            </GlassCard>
          </div>

          <div className="lg:hidden grid grid-cols-1 gap-4">
            {paginatedPayments.map(p => (
              <GlassCard key={p.id} className="p-4 space-y-3 border-white/10">
                <div className="flex justify-between items-start">
                  <div><p className="font-bold text-white">{p.name}</p><p className="text-xs text-neonCyan font-mono">{p.usn}</p></div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-y border-white/10 py-3">
                  <div className="flex flex-col"><span className="text-gray-500 uppercase text-[10px]">Amount</span><span className="text-white font-semibold">₹{p.amount}</span></div>
                  <div className="flex flex-col text-right"><span className="text-gray-500 uppercase text-[10px]">Verified At</span><span className="text-gray-300">{universalFormatDate(p.verified_at)}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500 uppercase text-[10px]">UTR</span><span className="text-white font-mono">{p.utr}</span></div>
                  <div className="flex flex-col text-right"><span className="text-gray-500 uppercase text-[10px]">Bank Time</span><span className="text-gray-300">{universalFormatDate(p.bank_transaction_time)}</span></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => handlePaymentAction(p.id, 'approved')} className="flex-1 py-2 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">Approve</button>
                  <button onClick={() => handlePaymentAction(p.id, 'disputed')} className="flex-1 py-2 text-xs bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">Dispute</button>
                  <button onClick={() => handlePaymentAction(p.id, 'rejected')} className="flex-1 py-2 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Reject</button>
                </div>
              </GlassCard>
            ))}
            {/* PAGINATION UI - MOBILE */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Prev</button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold ${currentPage === i + 1 ? 'bg-neonCyan text-black shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Next</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold neon-text-gradient mb-6">Create CR</h3>
              <form onSubmit={createCR} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col"><label className={labelStyle}>Full Name</label><input required className={neonInputStyle} value={newCR.name} onChange={(e) => setNewCR({...newCR, name: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Email</label><input required type="email" className={neonInputStyle} value={newCR.email} onChange={(e) => setNewCR({...newCR, email: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Mobile</label><input required className={neonInputStyle} value={newCR.mobile} onChange={(e) => setNewCR({...newCR, mobile: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Password</label><input required type="password" className={neonInputStyle} value={newCR.password} onChange={(e) => setNewCR({...newCR, password: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Year</label><select value={newCR.year} onChange={(e) => setNewCR({...newCR, year: e.target.value})} className={neonInputStyle}>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
                <div className="flex flex-col"><label className={labelStyle}>Branch</label><select value={newCR.branch} onChange={(e) => setNewCR({...newCR, branch: e.target.value})} className={neonInputStyle}>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
                                    <div className="flex flex-col sm:col-span-2">
                        <label className={labelStyle}>Division</label>
                        <select 
                          value={newCR.division} 
                          onChange={(e) => setNewCR({...newCR, division: e.target.value})} 
                          className={neonInputStyle}
                        >
                          {DIVISIONS.map(d => (
                            <option key={d} value={d} className="bg-[#0f172a]">
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                <Button className="sm:col-span-2 w-full py-3" onClick={createCR}>Create CR Account</Button>
              </form>
            </GlassCard>
            <GlassCard className="p-6 overflow-x-auto">
              <h3 className="text-xl font-bold neon-text-gradient mb-6">Existing CRs</h3>
              <table className="w-full text-left text-sm">
                <thead><tr className="text-gray-500 border-b border-glassBorder"><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3">Scope</th></tr></thead>
                <tbody>{crAccounts.map(cr => <tr key={cr.id} className="border-b border-glassBorder hover:bg-white/5"><td className="p-3">{cr.name}</td><td className="p-3 font-mono text-xs">{cr.mobile}</td><td className="p-3 text-gray-400">{cr.year} {cr.branch} {cr.division}</td></tr>)}</tbody>
              </table>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <GlassCard className="p-4 text-center">
    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </GlassCard>
);

export default AdminDashboard;