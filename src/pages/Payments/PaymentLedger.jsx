import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../api/supabase';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { YEARS, BRANCHES, DIVISIONS } from '../../utils/constants';

const PaymentLedger = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ 
    year: '', branch: '', division: '', startDate: '', endDate: '', verifiedBy: '', status: '' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const neonInputStyle = "w-full bg-white/5 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:shadow-[0_0_8px_rgba(0,245,255,0.4)] transition-all duration-200 placeholder:text-white/40";
  const labelStyle = "text-[10px] font-bold uppercase tracking-wider text-neonCyan ml-1 mb-1";

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const globalStats = useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved');
    const cashApproved = approved.filter(p => p.utr?.toLowerCase().startsWith('cash'));
    const upiApproved = approved.filter(p => !p.utr?.toLowerCase().startsWith('cash'));

    return {
      totalAmount: approved.reduce((sum, p) => sum + p.amount, 0),
      upiAmount: upiApproved.reduce((sum, p) => sum + p.amount, 0),
      cashAmount: cashApproved.reduce((sum, p) => sum + p.amount, 0),
      approvedCount: approved.length,
      pending: payments.filter(p => p.status === 'pending').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchYear = !filters.year || p.year === filters.year;
      const matchBranch = !filters.branch || p.branch === filters.branch;
      const matchDiv = !filters.division || p.division === filters.division;
      const matchStatus = !filters.status || p.status === filters.status;
      
      let matchDate = true;
      if (filters.startDate || filters.endDate) {
        const pDate = new Date(p.created_at).setHours(0,0,0,0);
        const start = filters.startDate ? new Date(filters.startDate).setHours(0,0,0,0) : -Infinity;
        const end = filters.endDate ? new Date(filters.endDate).setHours(23,59,59,999) : Infinity;
        matchDate = pDate >= start && pDate <= end;
      }
      return matchYear && matchBranch && matchDiv && matchStatus && matchDate;
    });
  }, [payments, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
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

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) return <div className="h-screen flex items-center justify-center text-neon-cyan animate-pulse text-xl">Loading Ledger...</div>;

  return (
    <div className="p-4 md:p-6 max-w-[98vw] mx-auto space-y-8">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl md:text-5xl font-bold neon-text-gradient">CELESTIA 2K26: Payment Transparency Ledger</h2>
        <p className="text-gray-400 text-sm">Live record of all approved and pending contributions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <SummaryCard title="Total Collection" value={`₹${globalStats.totalAmount}`} color="text-white" border="border-white/20" />
        <SummaryCard title="UPI Approved" value={`₹${globalStats.upiAmount}`} color="text-blue-400" border="border-blue-400/30" />
        <SummaryCard title="Cash Approved" value={`₹${globalStats.cashAmount}`} color="text-neonViolet" border="border-neonViolet/30" />
        <SummaryCard title="Approved Students" value={globalStats.approvedCount} color="text-green-400" border="border-green-400/30" />
        <SummaryCard title="Total Pending" value={globalStats.pending} color="text-yellow-400" border="border-yellow-400/30" />
        <SummaryCard title="Total Rejected" value={globalStats.rejected} color="text-red-400" border="border-red-400/30" />
      </div>

      {/* Public Filters */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col"><label className={labelStyle}>Year</label><select name="year" value={filters.year} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Years</option>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
          <div className="flex flex-col"><label className={labelStyle}>Branch</label><select name="branch" value={filters.branch} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Branches</option>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
          <div className="flex flex-col"><label className={labelStyle}>Division</label><select name="division" value={filters.division} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Divisions</option>{DIVISIONS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}</select></div>
          <div className="flex flex-col"><label className={labelStyle}>From Date</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
          <div className="flex flex-col"><label className={labelStyle}>To Date</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
          <div className="flex flex-col"><label className={labelStyle}>Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Statuses</option><option value="approved" className="bg-[#0f172a]">Approved</option><option value="pending" className="bg-[#0f172a]">Pending</option><option value="rejected" className="bg-[#0f172a]">Rejected</option><option value="disputed" className="bg-[#0f172a]">Disputed</option></select></div>
        </div>
      </div>

      {/* Public Table */}
      <div className="overflow-x-auto">
        <GlassCard className="p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-glassBorder">
                <th className="p-3 font-bold">Student</th>
                <th className="p-3 font-bold">Mobile</th>
                <th className="p-3 font-bold">Year/Branch</th>
                <th className="p-3 font-bold">Division</th>
                <th className="p-3 font-bold">UTR</th>
                <th className="p-3 font-bold">Bank Time</th>
                <th className="p-3 font-bold">Verified By</th>
                <th className="p-3 font-bold">Verified At</th>
                <th className="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map(p => (
                <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium">{p.name} <span className="text-neonCyan font-mono text-xs ml-1">({p.usn})</span></td>
                  <td className="p-3 font-mono text-xs">{p.mobile}</td>
                  <td className="p-3 text-gray-400">{p.year} {p.branch}</td>
                  <td className="p-3 text-gray-400">{p.division}</td>
                  <td className="p-3 font-mono text-xs">{p.utr}</td>
                  <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.bank_transaction_time)}</td>
                  <td className="p-3">{p.verified_by || '—'}</td>
                  <td className="p-3 text-gray-400 text-xs">{universalFormatDate(p.verified_at)}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
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
  );
};

const SummaryCard = ({ title, value, color, border }) => (
  <GlassCard className={`p-4 text-center ${border}`}>
    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </GlassCard>
);

export default PaymentLedger;