import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../api/supabase';
import { getCurrentAdmin, logoutAdmin } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
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
  
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Authentication Error</h2>
          <p className="text-gray-400">Admin session not found. Please login again.</p>
          <Button variant="cyan" onClick={() => window.location.href = '/admin-login'}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('payments'); 
  const [payments, setPayments] = useState([]);
  const [crAccounts, setCrAccounts] = useState([]);
  
  // --- [CHANGE 1]: Updated Filters for Date Range ---
  const [filters, setFilters] = useState({ 
    year: '', branch: '', division: '', startDate: '', endDate: '', verifiedBy: '', status: '' 
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);
  const [newCR, setNewCR] = useState({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });

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
      const normalizedDate = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
      const date = new Date(normalizedDate);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString("en-IN", {
        timeZone: 'UTC', day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
      });
    } catch (e) { return dateString; }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const { data: pData } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments(pData || []);
    const { data: cData } = await supabase.from('cr_accounts').select('*');
    setCrAccounts(cData || []);
  };

  // --- [CHANGE 2]: Global Stats & Range Logic ---
  
  // GLOBAL STATS (All time - Ignores all filters)
  const globalStats = useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved');
    return {
      totalAmount: approved.reduce((sum, p) => sum + p.amount, 0),
      approvedCount: approved.length,
      pending: payments.filter(p => p.status === 'pending').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      disputed: payments.filter(p => p.status === 'disputed').length,
    };
  }, [payments]);

  // FILTERED PAYMENTS (Based on Range and Categories)
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchYear = !filters.year || p.year === filters.year;
      const matchBranch = !filters.branch || p.branch === filters.branch;
      const matchDiv = !filters.division || p.division === filters.division;
      const matchStatus = !filters.status || p.status === filters.status;
      const matchVerifier = !filters.verifiedBy || 
        (filters.verifiedBy === 'Finance Head' && p.verified_by === admin.name) ||
        (filters.verifiedBy === 'SYSTEM' && p.verified_by === 'SYSTEM') ||
        (filters.verifiedBy === 'CR' && p.verified_by !== admin.name && p.verified_by !== 'SYSTEM');

      // Range Date Logic
      let matchDate = true;
      if (filters.startDate || filters.endDate) {
        const pDate = new Date(p.created_at).setHours(0,0,0,0);
        const start = filters.startDate ? new Date(filters.startDate).setHours(0,0,0,0) : -Infinity;
        const end = filters.endDate ? new Date(filters.endDate).setHours(23,59,59,999) : Infinity;
        matchDate = pDate >= start && pDate <= end;
      }

      return matchYear && matchBranch && matchDiv && matchStatus && matchVerifier && matchDate;
    });
  }, [payments, filters, admin.name]);

  // RANGE STATS (Sums based on filtered result)
  const rangeStats = useMemo(() => {
    const approvedInRange = filteredPayments.filter(p => p.status === 'approved');
    return {
      total: approvedInRange.reduce((sum, p) => sum + p.amount, 0),
      count: approvedInRange.length,
      pending: filteredPayments.filter(p => p.status === 'pending').length
    };
  }, [filteredPayments]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ year: '', branch: '', division: '', startDate: '', endDate: '', verifiedBy: '', status: '' });
    setCurrentPage(1);
  };

  const handlePaymentAction = async (paymentId, status) => {
    try {
      const istNow = getISTTimestamp();
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: status, verified_by: admin.name, verified_at: istNow })
        .eq('id', paymentId);
      if (updateError) throw updateError;
      await fetchAllData();
    } catch (error) {
      alert(`Update failed: ${error.message}`);
    }
  };

  // --- [CHANGE 3]: The Reset Function (Supabase Killer) ---
  const handleResetPayment = async (paymentId) => {
    if (!window.confirm("Reset this payment to PENDING? This will clear all verification details.")) return;
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'pending', verified_by: null, verified_at: null })
        .eq('id', paymentId);
      if (error) throw error;
      await fetchAllData();
    } catch (err) {
      alert("Reset failed: " + err.message);
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
            await updatePaymentBySystem(record.id, { status: 'approved', verified_by: 'SYSTEM', verified_at: istNow, bank_transaction_time: record.bankTime });
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
    const { password, ...crDataWithoutPassword } = newCR;
    const { error } = await supabase.from('cr_accounts').insert([{ ...crDataWithoutPassword, password_hash: password }]);
    if (error) { alert(error.message); } else {
      alert("CR account created successfully!");
      setNewCR({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });
      fetchAllData();
    }
  };

  const exportCSV = () => {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\//g, '');
    const fileName = `Admin_Export_${dateStr}.csv`;
    const headers = "Name,USN,Mobile,Year,Branch,Division,Amount,UTR,Bank Transaction Time,Verified By,Verified At,Status\n";
    const rows = filteredPayments.map(p => [`"${p.name}"`, `"${p.usn}"`, `"${p.mobile || 'N/A'}"`, `"${p.year}"`, `"${p.branch}"`, `"${p.division}"`, p.amount, `"${p.utr}"`, `"${universalFormatDate(p.bank_transaction_time)}"`, `"${p.verified_by || 'Not Verified'}"`, `"${universalFormatDate(p.verified_at)}"`, `"${p.status}"`].join(",")).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url); a.setAttribute('download', fileName); a.click();
  };

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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

      <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl w-fit backdrop-blur-md">
        {[
          { id: 'payments', label: 'Payments 💳' },
          { id: 'cr', label: 'CR Management 👥' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-neonCyan text-black shadow-[0_0_15px_rgba(0,245,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* --- [CHANGE 4]: RESTORED GLOBAL STATS --- */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SummaryCard title="Global Collected" value={`₹${globalStats.totalAmount}`} color="text-neonCyan" />
            <SummaryCard title="All Approved" value={globalStats.approvedCount} color="text-green-400" />
            <SummaryCard title="Total Pending" value={globalStats.pending} color="text-yellow-400" />
            <SummaryCard title="Total Rejected" value={globalStats.rejected} color="text-red-400" />
            <SummaryCard title="Total Disputed" value={globalStats.disputed} color="text-orange-400" />
          </div>

          {/* SUPER FILTER BAR WITH DATE RANGE */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              <div className="flex flex-col"><label className={labelStyle}>Year</label><select name="year" value={filters.year} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Years</option>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Branch</label><select name="branch" value={filters.branch} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Branches</option>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Division</label><select name="division" value={filters.division} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Divisions</option>{DIVISIONS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>From Date</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>To Date</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Verified By</label><select name="verifiedBy" value={filters.verifiedBy} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Verifiers</option><option value="CR" className="bg-[#0f172a]">Class Representatives</option><option value="SYSTEM" className="bg-[#0f172a]">System (CSV)</option><option value="Finance Head" className="bg-[#0f172a]">Finance Head</option></select></div>
              <div className="flex flex-col"><label className={labelStyle}>Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Statuses</option><option value="approved" className="bg-[#0f172a]">Approved</option><option value="pending" className="bg-[#0f172a]">Pending</option><option value="rejected" className="bg-[#0f172a]">Rejected</option><option value="disputed" className="bg-[#0f172a]">Disputed</option></select></div>
            </div>
            <div className="flex justify-end">
              <Button variant="violet" onClick={clearFilters} className="h-[40px]">Clear All Filters</Button>
            </div>
          </div>

          {/* RANGE SNAPSHOT */}
          {(filters.startDate || filters.endDate) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-4 border-l-4 border-neonCyan text-center">
                <p className="text-xs text-gray-500 uppercase">Range Approved Amount</p>
                <p className="text-2xl font-bold text-neonCyan">₹{rangeStats.total}</p>
              </GlassCard>
              <GlassCard className="p-4 border-l-4 border-green-400 text-center">
                <p className="text-xs text-gray-500 uppercase">Students Approved in Range</p>
                <p className="text-2xl font-bold text-green-400">{rangeStats.count}</p>
              </GlassCard>
              <GlassCard className="p-4 border-l-4 border-yellow-400 text-center">
                <p className="text-xs text-gray-500 uppercase">Pending in Range</p>
                <p className="text-2xl font-bold text-yellow-400">{rangeStats.pending}</p>
              </GlassCard>
            </div>
          )}

          <GlassCard className="p-4 md:p-6 border-l-4 border-neonCyan">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neonCyan">Auto Verify CSV</h3>
                <p className="text-sm text-gray-400">Process bank statement to batch-approve payments.</p>
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

          <div className="overflow-x-auto">
            <GlassCard className="p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-glassBorder">
                    <th className="p-3 font-bold">Student</th>
                    <th className="p-3 font-bold">Mobile</th>
                    <th className="p-3 font-bold">Year/Branch</th>
                    <th className="p-3 font-bold">UTR</th>
                    <th className="p-3 font-bold">Bank Txn Time</th>
                    <th className="p-3 font-bold">Verified By</th>
                    <th className="p-3 font-bold">Verified At</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map(p => (
                    <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium">{p.name} <span className="text-neonCyan font-mono text-xs ml-1">({p.usn})</span></td>
                      <td className="p-3 font-mono text-xs">{p.mobile}</td>
                      <td className="p-3 text-gray-400">{p.year} {p.branch}</td>
                      <td className="p-3 font-mono text-xs">{p.utr}</td>
                      <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.bank_transaction_time)}</td>
                      <td className="p-3">{p.verified_by || '—'}</td>
                      <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.verified_at)}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 flex justify-center gap-3">
                        <button onClick={() => handlePaymentAction(p.id, 'approved')} className="text-green-400 text-xs hover:underline">Approve</button>
                        <button onClick={() => handlePaymentAction(p.id, 'disputed')} className="text-orange-400 text-xs hover:underline">Dispute</button>
                        <button onClick={() => handlePaymentAction(p.id, 'rejected')} className="text-red-400 text-xs hover:underline">Reject</button>
                        <button onClick={() => handleResetPayment(p.id)} className="text-gray-400 text-xs hover:text-white underline ml-1" title="Reset to Pending">Reset ⟲</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Prev</button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold ${currentPage === i + 1 ? 'bg-neonCyan text-black shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Next</button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'cr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold neon-text-gradient mb-6">Create CR</h3>
            <form onSubmit={createCR} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col"><label className={labelStyle}>Full Name</label><input required className={neonInputStyle} value={newCR.name} onChange={(e) => setNewCR({...newCR, name: e.target.value})} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Email</label><input required type="email" className={neonInputStyle} value={newCR.email} onChange={(e) => setNewCR({...newCR, email: e.target.value})} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Mobile</label><input required className={neonInputStyle} value={newCR.mobile} onChange={(e) => setNewCR({...newCR, mobile: e.target.value})} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Password</label><input required type="password" className={neonInputStyle} value={newCR.password} onChange={(e) => setNewCR({...newCR, password: e.target.value})} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Year</label><select value={newCR.year} onChange={(e) => setNewCR({...newCR, year: e.target.value})} className={neonInputStyle}>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Branch</label><select value={newCR.branch} onChange={(e) => setNewCR({...newCR, branch: e.target.value})} className={neonInputStyle}>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
              <div className="flex flex-col sm:col-span-2"><label className={labelStyle}>Division</label><select value={newCR.division} onChange={(e) => setNewCR({...newCR, division: e.target.value})} className={neonInputStyle}>{DIVISIONS.map(d => (<option key={d} value={d} className="bg-[#0f172a]">{d}</option>))}</select></div>
              <Button className="sm:col-span-2 w-full py-3" onClick={createCR}>Create CR Account</Button>
            </form>
          </GlassCard>
          <GlassCard className="p-6 overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold neon-text-gradient">Existing CRs</h3>
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-full border border-white/10 px-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Global Control:</span>
                <button onClick={async () => {
                  const anyDisabled = crAccounts.some(cr => !cr.verification_enabled);
                  const statusToSet = !anyDisabled;
                  if (!window.confirm(`Are you sure?`)) return;
                  try {
                    const { error } = await supabase.from('cr_accounts').update({ verification_enabled: statusToSet }).neq('id', '00000000-0000-0000-0000-000000000000');
                    if (error) throw error;
                    alert(`Access ${statusToSet ? 'ENABLED' : 'DISABLED'}`);
                    await fetchAllData(); 
                  } catch (err) { alert("Failed to update global permissions."); }
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all duration-300 uppercase ${crAccounts.every(cr => cr.verification_enabled) ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                >
                  {crAccounts.every(cr => cr.verification_enabled) ? 'All Enabled 🟢' : 'Disable All 🔴'}
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead><tr className="text-gray-500 border-b border-glassBorder"><th className="p-3">Name</th><th className="p-3">Mobile</th><th className="p-3">Scope</th><th className="p-3 text-center">Access</th></tr></thead>
              <tbody>
                {crAccounts.map(cr => (
                  <tr key={cr.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                    <td className="p-3">{cr.name}</td><td className="p-3 font-mono text-xs">{cr.mobile}</td><td className="p-3 text-gray-400">{cr.year} {cr.branch} {cr.division}</td>
                    <td className="p-3 text-center">
                      <button onClick={async () => { try { await supabase.from('cr_accounts').update({ verification_enabled: !cr.verification_enabled }).eq('id', cr.id); await fetchAllData(); } catch (err) { alert("Update failed"); } }}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${cr.verification_enabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                      >{cr.verification_enabled ? 'ON' : 'OFF'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      )}
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