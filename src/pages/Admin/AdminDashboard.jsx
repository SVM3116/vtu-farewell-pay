import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import { getCurrentAdmin, logoutAdmin } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; 
import StatusBadge from '../../components/ui/StatusBadge';
import { YEARS, BRANCHES, DIVISIONS } from '../../utils/constants';

const AdminDashboard = () => {
  const admin = getCurrentAdmin();
  const [payments, setPayments] = useState([]);
  const [crAccounts, setCrAccounts] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, disputed: 0 });
  
  const [filters, setFilters] = useState({
    year: '',
    branch: '',
    division: ''
  });

  const [newCR, setNewCR] = useState({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });

  const formatVerificationDate = (dateString) => {
    if (!dateString) return "Not Verified";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    let query = supabase.from('payments').select('*');
    if (filters.year) query = query.eq('year', filters.year);
    if (filters.branch) query = query.eq('branch', filters.branch);
    if (filters.division) query = query.eq('division', filters.division);
    const { data: pData, error: pError } = await query.order('created_at', { ascending: false });
    
    if (pError) {
      console.error("Payment fetch error:", pError);
    } else {
      setPayments(pData || []);
    }

    const { data: cData } = await supabase.from('cr_accounts').select('*');
    setCrAccounts(cData || []);
    
    const filteredPayments = pData || [];
    const approved = filteredPayments.filter(p => p.status === 'approved');
    
    setStats({
      total: approved.reduce((sum, p) => sum + p.amount, 0),
      approved: approved.length,
      pending: filteredPayments.filter(p => p.status === 'pending').length,
      rejected: filteredPayments.filter(p => p.status === 'rejected').length,
      disputed: filteredPayments.filter(p => p.status === 'disputed').length,
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ year: '', branch: '', division: '' });
  };

  const handlePaymentAction = async (paymentId, status) => {
    await supabase.from('payments').update({ status }).eq('id', paymentId);
    await supabase.from('audit_logs').insert([{
      action: status, performed_by: admin.name, role: 'admin', payment_id: paymentId
    }]);
    fetchAllData();
  };

  const createCR = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('cr_accounts').insert([{
      name: newCR.name, email: newCR.email, mobile: newCR.mobile, 
      password_hash: newCR.password, year: newCR.year, branch: newCR.branch, division: newCR.division
    }]);
    if (error) alert(error.message);
    else {
      alert("CR account created successfully!");
      setNewCR({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });
      fetchAllData();
    }
  };

  const exportCSV = () => {
    const headers = "Name,USN,Mobile,Year,Branch,Division,Amount,UTR,Status,Approved By,Verified At,Created At\n";
    const rows = payments.map(p => {
      const approvedBy = p.verified_by || "Not Verified";
      const verifiedAt = formatVerificationDate(p.verified_at);
      const createdAt = p.created_at ? new Date(p.created_at).toLocaleString("en-IN") : "N/A";
      return [p.name, p.usn, p.mobile || "N/A", p.year, p.branch, p.division, p.amount, p.utr, p.status, approvedBy, `"${verifiedAt}"`, `"${createdAt}"`].join(",");
    }).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Farewell_Detailed_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold neon-text-gradient">Finance Command Center</h2>
          <p className="text-gray-400">Global Overview | {admin.name}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={exportCSV} variant="cyan">Export CSV 📥</Button>
          <Button variant="violet" onClick={logoutAdmin}>Logout</Button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 ml-1">Year</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} className="input-glass text-sm">
                <option value="">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 ml-1">Branch</label>
              <select name="branch" value={filters.branch} onChange={handleFilterChange} className="input-glass text-sm">
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 ml-1">Division</label>
              <select name="division" value={filters.division} onChange={handleFilterChange} className="input-glass text-sm">
                <option value="">All Divisions</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <Button variant="violet" onClick={clearFilters} className="h-10">Clear Filters</Button>
        </div>
        <div className="mt-3 text-right">
          <p className="text-xs text-gray-500 italic">Showing {payments.length} records matching current filters</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="Total Collected" value={`₹${stats.total}`} color="text-neonCyan" />
        <SummaryCard title="Approved" value={stats.approved} color="text-green-400" />
        <SummaryCard title="Pending" value={stats.pending} color="text-yellow-400" />
        <SummaryCard title="Rejected" value={stats.rejected} color="text-red-400" />
        <SummaryCard title="Disputed" value={stats.disputed} color="text-orange-400" />
      </div>

      <GlassCard className="overflow-x-auto p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-glassBorder">
              <th className="p-3">Student</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Year/Branch</th>
              <th className="p-3">UTR</th>
              <th className="p-3">Verified By</th>
              <th className="p-3">Verified At</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-glassBorder hover:bg-white/5">
                <td className="p-3">{p.name} ({p.usn})</td>
                <td className="p-3 font-mono text-xs">{p.mobile || 'N/A'}</td>
                <td className="p-3 text-gray-400">{p.year} {p.branch} - {p.division}</td>
                <td className="p-3 font-mono text-xs">{p.utr}</td>
                <td className="p-3">{p.verified_by ? <span className="text-gray-300 font-medium">{p.verified_by}</span> : <span className="text-gray-600 italic text-xs">Not Verified</span>}</td>
                <td className="p-3 text-gray-400 text-xs">{formatVerificationDate(p.verified_at)}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handlePaymentAction(p.id, 'approved')} className="text-green-400 text-xs hover:underline">Approve</button>
                  <button onClick={() => handlePaymentAction(p.id, 'disputed')} className="text-orange-400 text-xs hover:underline">Dispute</button>
                  <button onClick={() => handlePaymentAction(p.id, 'rejected')} className="text-red-400 text-xs hover:underline">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold neon-text-gradient mb-6">Create New CR Account</h3>
          <form onSubmit={createCR} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" required value={newCR.name} onChange={(e) => setNewCR({...newCR, name: e.target.value})} />
            <Input label="Email" type="email" required value={newCR.email} onChange={(e) => setNewCR({...newCR, email: e.target.value})} />
            <Input label="Mobile Number" required value={newCR.mobile} onChange={(e) => setNewCR({...newCR, mobile: e.target.value})} />
            <Input label="Password" type="password" required value={newCR.password} onChange={(e) => setNewCR({...newCR, password: e.target.value})} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 ml-1">Year</label>
              <select value={newCR.year} onChange={(e) => setNewCR({...newCR, year: e.target.value})} className="input-glass text-sm">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 ml-1">Branch</label>
              <select value={newCR.branch} onChange={(e) => setNewCR({...newCR, branch: e.target.value})} className="input-glass text-sm">
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-gray-400 ml-1">Division</label>
              <select value={newCR.division} onChange={(e) => setNewCR({...newCR, division: e.target.value})} className="input-glass text-sm">
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <Button className="md:col-span-2 w-full py-3 mt-2" onClick={createCR}>Create CR Account</Button>
          </form>
        </GlassCard>
        <GlassCard className="p-6 overflow-x-auto">
          <h3 className="text-xl font-bold neon-text-gradient mb-6">Existing CRs</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-glassBorder">
                <th className="p-3">Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Year/Branch/Div</th>
              </tr>
            </thead>
            <tbody>
              {crAccounts.map(cr => (
                <tr key={cr.id} className="border-b border-glassBorder hover:bg-white/5">
                  <td className="p-3">{cr.name}</td>
                  <td className="p-3 font-mono text-xs">{cr.mobile || 'N/A'}</td>
                  <td className="p-3 text-gray-400">{cr.year} {cr.branch} {cr.division}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
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