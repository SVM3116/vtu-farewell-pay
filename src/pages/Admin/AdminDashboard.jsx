import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../api/supabase';
import { getCurrentAdmin, logoutAdmin } from '../../api/auth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { YEARS, BRANCHES, DIVISIONS } from '../../utils/constants';
import { expenseApi } from '../../api/expenses';
import { 
  TrendingDown, TrendingUp, Wallet, FileText, 
  Trash2, Edit3, Plus, Download, Filter as FilterIcon, X 
} from 'lucide-react';

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
  const [filters, setFilters] = useState({ 
    year: '', branch: '', division: '', startDate: '', endDate: '', verifiedBy: '', status: '' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);
  const [newCR, setNewCR] = useState({ name: '', email: '', mobile: '', password: '', year: '1st Year', branch: 'CSE', division: 'A' });

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    paymentId: null,
    reason: '',
    isOther: false
  });

  // --- EXPENSE STATES ---
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expSummary, setExpSummary] = useState({ totalExpenses: 0, count: 0, cashSum: 0, digitalSum: 0 });
  const [expFilters, setExpFilters] = useState({ category: '', payment_method: '', startDate: '', endDate: '', search: '' });
  const [expPage, setExpPage] = useState(1);
  
  // Modals State
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [isExpEditModalOpen, setIsExpEditModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isBudgetEditModalOpen, setIsBudgetEditModalOpen] = useState(false);
  const [isBudgetDeleteModalOpen, setIsBudgetDeleteModalOpen] = useState(false);

  // Form States
  const [expFormData, setExpFormData] = useState({ title: '', category: '', amount: '', paid_to: '', vendor_contact: '', payment_method: 'UPI', expense_date: new Date().toISOString().split('T')[0], notes: '' });
  const [expEditFormData, setExpEditFormData] = useState(null);
  const [budgetFormData, setBudgetFormData] = useState({ category: '', amount: '' });
  const [billFile, setBillFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [editBillFile, setEditBillFile] = useState(null);
  const [editProofFile, setEditProofFile] = useState(null);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const REJECTION_OPTIONS = ["Wrong UTR", "Amount Mismatch", "Payment not found", "Note mismatch", "Other"];
  const EXPENSE_CATEGORIES = ["Stage Decoration", "DJ & Sound System", "Photography", "Food & Snacks", "Printing & Banners", "Gifts & Mementos", "Auditorium", "Certificates", "Anchoring", "Transport", "Miscellaneous"];

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
    
    const expData = await expenseApi.fetchExpenses();
    const summaryData = await expenseApi.fetchExpenseSummary();
    const budgetData = await expenseApi.fetchCategoryBudgets();
    setExpenses(expData || []);
    setExpSummary(summaryData || { totalExpenses: 0, count: 0, cashSum: 0, digitalSum: 0 });
    setBudgets(budgetData || []);
  };

  // FIXED: Updated globalStats to correctly identify Cash vs UPI payments
  const globalStats = useMemo(() => {
    const approved = payments.filter(p => p.status === 'approved');
    
    // A payment is Cash if the UTR starts with "cash" (case-insensitive)
    const cashApproved = approved.filter(p => p.utr?.toLowerCase().startsWith('cash'));
    
    // A payment is UPI if the UTR does NOT start with "cash"
    const upiApproved = approved.filter(p => !p.utr?.toLowerCase().startsWith('cash'));

    return {
      totalAmount: approved.reduce((sum, p) => sum + p.amount, 0),
      upiAmount: upiApproved.reduce((sum, p) => sum + p.amount, 0),
      cashAmount: cashApproved.reduce((sum, p) => sum + p.amount, 0),
      approvedCount: approved.length,
      pending: payments.filter(p => p.status === 'pending').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      disputed: payments.filter(p => p.status === 'disputed').length,
    };
  }, [payments]);

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

  const handleRejectSubmit = async () => {
    const finalReason = rejectModal.reason;
    if (!finalReason || finalReason.trim() === '') {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      const istNow = getISTTimestamp();
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected', rejection_reason: finalReason, verified_by: admin.name, verified_at: istNow })
        .eq('id', rejectModal.paymentId);

      if (error) throw error;
      await supabase.from('audit_logs').insert([{
        action: 'rejected', performed_by: admin.name, role: 'admin', payment_id: rejectModal.paymentId, reason: finalReason, timestamp: istNow
      }]);
      setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false });
      await fetchAllData();
    } catch (err) {
      alert("Rejection failed: " + err.message);
    }
  };

  const handleResetPayment = async (paymentId) => {
    if (!window.confirm("Reset this payment to PENDING?")) return;
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
    const rows = filteredPayments.map(p => [`"${p.name}"`, `"${p.usn}"`, `"${p.mobile || 'N/A'}"`, `"${p.year}"`, `"${p.branch}"`, `"${p.division}"`, p.amount, `"${p.utr}"`, `"${universalFormatDate(p.bank_transaction_time, false)}"`, `"${p.verified_by || 'Not Verified'}"`, `"${universalFormatDate(p.verified_at)}"`, `"${p.status}"`].join(",")).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url); a.setAttribute('download', fileName); a.click();
  };

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // --- EXPENSE HANDLERS ---
  const handleExpFilterChange = (e) => {
    const { name, value } = e.target;
    setExpFilters(prev => ({ ...prev, [name]: value }));
    setExpPage(1);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      return (
        (!expFilters.category || exp.category === expFilters.category) &&
        (!expFilters.payment_method || exp.payment_method === expFilters.payment_method) &&
        (!expFilters.search || exp.title.toLowerCase().includes(expFilters.search.toLowerCase())) &&
        (!expFilters.startDate || exp.expense_date >= expFilters.startDate) &&
        (!expFilters.endDate || exp.expense_date <= expFilters.endDate)
      );
    });
  }, [expenses, expFilters]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseApi.addExpense(expFormData, billFile, proofFile);
      setIsExpModalOpen(false);
      setExpFormData({ title: '', category: '', amount: '', paid_to: '', vendor_contact: '', payment_method: 'UPI', expense_date: new Date().toISOString().split('T')[0], notes: '' });
      setBillFile(null); setProofFile(null);
      await fetchAllData();
    } catch (err) { alert(`Error adding expense: ${err.message}`); }
  };

  const handleSetBudget = async () => {
    if (!budgetFormData.category || !budgetFormData.amount) return alert("Fill all fields");
    try {
      await expenseApi.setCategoryBudget(budgetFormData.category, budgetFormData.amount);
      setIsBudgetModalOpen(false);
      setIsBudgetEditModalOpen(false);
      await fetchAllData();
    } catch (err) { alert(`Error setting budget: ${err.message}`); }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      const { error } = await supabase.from('category_budgets').delete().eq('category', budgetToDelete);
      if (error) throw error;
      setIsBudgetDeleteModalOpen(false);
      setBudgetToDelete(null);
      await fetchAllData();
    } catch (err) { alert(`Error deleting budget: ${err.message}`); }
  };

  const handleOpenEditExpense = (exp) => {
    setExpEditFormData({ ...exp });
    setEditBillFile(null);
    setEditProofFile(null);
    setIsExpEditModalOpen(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseApi.updateExpense(expEditFormData.id, expEditFormData, editBillFile, editProofFile);
      setIsExpEditModalOpen(false);
      await fetchAllData();
    } catch (err) { alert(`Error updating expense: ${err.message}`); }
  };

  const handleDeleteExpense = async (id, billUrl, proofUrl) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await expenseApi.deleteExpense(id, billUrl, proofUrl);
      await fetchAllData();
    } catch (err) { alert(`Error deleting: ${err.message}`); }
  };

  const exportExpensesCSV = () => {
    const fileName = `Farewell_Expenses_Admin.csv`;
    const headers = "ExpenseID,Title,Category,Amount,PaidTo,Contact,Method,Date,Notes\n";
    const rows = filteredExpenses.map(e => [`"${e.expense_id}"`, `"${e.title}"`, `"${e.category}"`, e.amount, `"${e.paid_to}"`, `"${e.vendor_contact}"`, `"${e.payment_method}"`, `"${e.expense_date}"`, `"${e.notes}"`].join(",")).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url); a.setAttribute('download', fileName); a.click();
  };

  const expTotalPages = Math.ceil(filteredExpenses.length / rowsPerPage);
  const paginatedExpenses = filteredExpenses.slice((expPage - 1) * rowsPerPage, expPage * rowsPerPage);

  return (
    <div className="p-4 md:p-6 max-w-[98vw] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold neon-text-gradient">CELESTIA 2K26: Finance Command Center</h2>
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
          { id: 'expenses', label: 'Expenses 📊' }, 
          { id: 'cr', label: 'CR Management 👥' } 
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-neonCyan text-black shadow-[0_0_15px_rgba(0,245,255,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <SummaryCard title="Total Collection" value={`₹${globalStats.totalAmount}`} color="text-white" border="border-white/20" />
            <SummaryCard title="UPI Approved" value={`₹${globalStats.upiAmount}`} color="text-blue-400" border="border-blue-400/30" />
            <SummaryCard title="Cash Approved" value={`₹${globalStats.cashAmount}`} color="text-neonViolet" border="border-neonViolet/30" />
            <SummaryCard title="Approved Students" value={globalStats.approvedCount} color="text-green-400" border="border-green-400/30" />
            <SummaryCard title="Total Pending" value={globalStats.pending} color="text-yellow-400" border="border-yellow-400/30" />
            <SummaryCard title="Total Rejected" value={globalStats.rejected} color="text-red-400" border="border-red-400/30" />
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              <div className="flex flex-col"><label className={labelStyle}>Year</label><select name="year" value={filters.year} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Years</option>{YEARS.map(y => <option key={y} value={y} className="bg-[#0f172a]">{y}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Branch</label><select name="branch" value={filters.branch} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Branches</option>{BRANCHES.map(b => <option key={b} value={b} className="bg-[#0f172a]">{b}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Division</label><select name="division" value={filters.division} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Divisions</option>{DIVISIONS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>From Date</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>To Date</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Verified By</label><select name="verifiedBy" value={filters.verifiedBy} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Verifiers</option><option value="CR" className="bg-[#0f172a]">CRs</option><option value="SYSTEM" className="bg-[#0f172a]">System (CSV)</option><option value="Finance Head" className="bg-[#0f172a]">Finance Head</option></select></div>
              <div className="flex flex-col"><label className={labelStyle}>Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All Statuses</option><option value="approved" className="bg-[#0f172a]">Approved</option><option value="pending" className="bg-[#0f172a]">Pending</option><option value="rejected" className="bg-[#0f172a]">Rejected</option><option value="disputed" className="bg-[#0f172a]">Disputed</option></select></div>
            </div>
            <div className="flex justify-end"><Button variant="violet" onClick={clearFilters} className="h-[40px]">Clear All Filters</Button></div>
          </div>

          {(filters.startDate || filters.endDate) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-4 border-l-4 border-neonCyan text-center"><p className="text-xs text-gray-500 uppercase">Range Approved Total</p><p className="text-2xl font-bold text-neonCyan">₹{rangeStats.total}</p></GlassCard>
              <GlassCard className="p-4 border-l-4 border-green-400 text-center"><p className="text-xs text-gray-500 uppercase">Students Approved</p><p className="text-2xl font-bold text-green-400">{rangeStats.count}</p></GlassCard>
              <GlassCard className="p-4 border-l-4 border-yellow-400 text-center"><p className="text-xs text-gray-500 uppercase">Pending in Range</p><p className="text-2xl font-bold text-yellow-400">{rangeStats.pending}</p></GlassCard>
            </div>
          )}

          <GlassCard className="p-4 md:p-6 border-l-4 border-neonCyan">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1"><h3 className="text-xl font-bold text-neonCyan">Auto Verify CSV</h3><p className="text-sm text-gray-400">Process bank statement to batch-approve payments.</p></div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-neonCyan/20 file:text-neonCyan hover:file:bg-neonCyan/30 cursor-pointer" />
                <Button onClick={handleProcessCSV} variant="cyan" disabled={isProcessing} className="whitespace-nowrap">{isProcessing ? "Processing..." : "Process CSV 🚀"}</Button>
              </div>
            </div>
            {csvSummary && (
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-glassBorder">
                <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Approved</p><p className="text-lg font-bold text-green-400">✅ {csvSummary.approved}</p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Flagged</p><p className="text-lg font-bold text-yellow-400">⚠️ {csvSummary.flagged}</p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Skipped</p><p className="text-lg font-bold text-gray-400">⏭️ {csvSummary.skipped}</p></div>
                <div className="text-center"><p className="text-[10px] text-gray-500 uppercase">Rows</p><p className="text-lg font-bold text-neonCyan">{csvSummary.total}</p></div>
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
                    <th className="p-3 font-bold">Division</th>
                    <th className="p-3 font-bold">UTR</th>
                    <th className="p-3 font-bold">Bank Time</th>
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
                      <td className="p-3 text-gray-400">{p.division}</td>
                      <td className="p-3 font-mono text-xs">{p.utr}</td>
                      <td className="p-3 text-gray-400 text-xs">
                        {universalFormatDate(p.bank_transaction_time, 'bank')}
                      </td>
                      <td className="p-3">{p.verified_by || '—'}</td>
                      <td className="p-3 text-gray-400 text-xs">
                        {universalFormatDate(p.verified_at, 'verified')}
                      </td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3 flex justify-center gap-3">
                        <button onClick={() => handlePaymentAction(p.id, 'approved')} className="text-green-400 text-xs hover:underline">Approve</button>
                        <button onClick={() => setRejectModal({ isOpen: true, paymentId: p.id, reason: '', isOther: false })} className="text-red-400 text-xs hover:underline">Reject</button>
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

      {activeTab === 'expenses' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <SummaryCard title="Total Collection" value={`₹${globalStats.totalAmount}`} color="text-white" border="border-white/20" />
            <SummaryCard title="Total Spent" value={`₹${expSummary.totalExpenses}`} color="text-neonViolet" border="border-neonViolet/30" />
            <SummaryCard title="Remaining" value={`₹${globalStats.totalAmount - expSummary.totalExpenses}`} color="text-green-400" border="border-green-400/30" />
            <SummaryCard title="Cash Exp." value={`₹${expSummary.cashSum}`} color="text-amber-400" border="border-amber-400/30" />
            <SummaryCard title="Digital Exp." value={`₹${expSummary.digitalSum}`} color="text-blue-400" border="border-blue-400/30" />
            <SummaryCard title="Entries" value={expSummary.count} color="text-gray-300" border="border-gray-300/30" />
          </div>

          {/* Budget Management Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold neon-text-gradient flex items-center gap-2">
                <TrendingUp size={20} /> Budget Allocation
              </h3>
              <Button onClick={() => { setBudgetFormData({ category: '', amount: '' }); setIsBudgetModalOpen(true); }} variant="cyan" className="h-9 text-xs">Set Budget ⚙️</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {budgets.map(b => {
                const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
                const percent = (spent / b.budget_amount) * 100;
                return (
                  <GlassCard key={b.category} className="p-4 space-y-3 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-300">{b.category}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setBudgetFormData({ category: b.category, amount: b.budget_amount }); setIsBudgetEditModalOpen(true); }} className="p-1 text-neonCyan hover:text-white transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => { setBudgetToDelete(b.category); setIsBudgetDeleteModalOpen(true); }} className="p-1 text-red-400 hover:text-white transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-mono text-white">₹{spent} / ₹{b.budget_amount}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
                        className={`h-full ${percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-neonCyan'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter">
                      <span className={percent > 100 ? 'text-red-400' : 'text-gray-500'}>{percent.toFixed(1)}% Used</span>
                      <span className="text-gray-400">₹{Math.max(0, b.budget_amount - spent)} Left</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          {/* Expense Entry Section */}
          <GlassCard className="p-6 border-l-4 border-neonViolet">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neonViolet">Expense Registry</h3>
                <p className="text-sm text-gray-400">Log and manage all event expenditures</p>
              </div>
              <Button onClick={() => { setExpFormData({ title: '', category: '', amount: '', paid_to: '', vendor_contact: '', payment_method: 'UPI', expense_date: new Date().toISOString().split('T')[0], notes: '' }); setIsExpModalOpen(true); }} variant="violet" className="flex items-center gap-2">
                <Plus size={18} /> Add Expense
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="flex flex-col"><label className={labelStyle}>Search</label><input name="search" value={expFilters.search} onChange={handleExpFilterChange} placeholder="Search title..." className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>Category</label><select name="category" value={expFilters.category} onChange={handleExpFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}</select></div>
              <div className="flex flex-col"><label className={labelStyle}>Method</label><select name="payment_method" value={expFilters.payment_method} onChange={handleExpFilterChange} className={neonInputStyle}><option value="" className="bg-[#0f172a]">All</option><option value="Cash" className="bg-[#0f172a]">Cash</option><option value="UPI" className="bg-[#0f172a]">UPI</option><option value="Bank Transfer" className="bg-[#0f172a]">Bank Transfer</option></select></div>
              <div className="flex flex-col"><label className={labelStyle}>From</label><input type="date" name="startDate" value={expFilters.startDate} onChange={handleExpFilterChange} className={neonInputStyle} /></div>
              <div className="flex flex-col"><label className={labelStyle}>To</label><input type="date" name="endDate" value={expFilters.endDate} onChange={handleExpFilterChange} className={neonInputStyle} /></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-glassBorder">
                    <th className="p-3 font-bold">ID</th>
                    <th className="p-3 font-bold">Title</th>
                    <th className="p-3 font-bold">Category</th>
                    <th className="p-3 font-bold text-right">Amount</th>
                    <th className="p-3 font-bold">Vendor</th>
                    <th className="p-3 font-bold">Contact</th>
                    <th className="p-3 font-bold">Method</th>
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold text-center">Files</th>
                    <th className="p-3 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map(exp => (
                    <tr key={exp.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-gray-500">{exp.expense_id}</td>
                      <td className="p-3 font-medium">{exp.title}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-1 rounded bg-neonViolet/10 border border-neonViolet/30 text-neonViolet font-bold uppercase tracking-wider">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-neonViolet">₹{exp.amount}</td>
                      <td className="p-3 text-gray-400">{exp.paid_to || '—'}</td>
                      <td className="p-3 font-mono text-xs text-gray-400">{exp.vendor_contact || '—'}</td>
                      <td className="p-3"><span className="text-[10px] px-2 py-1 rounded bg-white/10 border border-white/10">{exp.payment_method}</span></td>
                      <td className="p-3 text-gray-400 text-xs">{exp.expense_date}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {exp.bill_url && <a href={exp.bill_url} target="_blank" rel="noreferrer" className="p-1 bg-white/10 rounded text-gray-400 hover:text-white" title="Bill"><FileText size={14} /></a>}
                          {exp.payment_proof_url && <a href={exp.payment_proof_url} target="_blank" rel="noreferrer" className="p-1 bg-white/10 rounded text-gray-400 hover:text-white" title="Proof"><FileText size={14} /></a>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleOpenEditExpense(exp)} className="text-neonCyan hover:text-white transition-colors"><Edit3 size={16} /></button>
                          <button onClick={() => handleDeleteExpense(exp.id, exp.bill_url, exp.payment_proof_url)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button disabled={expPage === 1} onClick={() => setExpPage(p => p - 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Prev</button>
                  <div className="flex gap-1">
                    {[...Array(expTotalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => setExpPage(i + 1)} className={`w-8 h-8 rounded-full text-xs font-bold ${expPage === i + 1 ? 'bg-neonViolet text-white shadow-lg' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button disabled={expPage === expTotalPages} onClick={() => setExpPage(p => p + 1)} className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30">Next</button>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={exportExpensesCSV} variant="violet" className="h-9 text-xs">Export Expense CSV 📥</Button>
            </div>
          </GlassCard>
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
              <div className="flex flex-col sm:col-span-2"><label className={labelStyle}>Division</label><select value={newCR.division} onChange={(e) => setNewCR({...newCR, division: e.target.value})} className={neonInputStyle}>{DIVISIONS.map(d => <option key={d} value={d} className="bg-[#0f172a]">{d}</option>)}</select></div>
              <Button className="sm:col-span-2 w-full py-3" onClick={createCR}>Create CR Account</Button>
            </form>
          </GlassCard>
          <GlassCard className="p-6 overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold neon-text-gradient">CR Collection Report</h3>
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
              <thead><tr className="text-gray-500 border-b border-glassBorder"><th className="p-3">CR Name</th><th className="p-3">Scope</th><th className="p-3 text-center">Cash Collected</th><th className="p-3 text-center">Access</th></tr></thead>
              <tbody>
                {crAccounts.map(crItem => {
                  const collectedCash = payments
                    .filter(p => p.year === crItem.year && p.branch === crItem.branch && p.division === crItem.division && p.status === 'approved' && p.utr?.toLowerCase().startsWith('cash'))
                    .reduce((sum, p) => sum + p.amount, 0);
                  return (
                    <tr key={crItem.id} className="border-b border-glassBorder hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium">{crItem.name}</td>
                      <td className="p-3 text-gray-400">{crItem.year} {crItem.branch} {crItem.division}</td>
                      <td className="p-3 text-center font-black text-neonViolet">₹{collectedCash}</td>
                      <td className="p-3 text-center">
                        <button onClick={async () => { try { await supabase.from('cr_accounts').update({ verification_enabled: !crItem.verification_enabled }).eq('id', crItem.id); await fetchAllData(); } catch (err) { alert("Update failed"); } }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${crItem.verification_enabled ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                        >{crItem.verification_enabled ? 'ON' : 'OFF'}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        </div>
      )}

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* Add Expense Modal */}
        {isExpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-2xl p-8 GlassCard border-neonViolet/30 rounded-3xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-neonViolet">Add New Expense</h3>
                <button onClick={() => setIsExpModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2"><label className={labelStyle}>Expense Title</label><Input required value={expFormData.title} onChange={e => setExpFormData({...expFormData, title: e.target.value})} placeholder="e.g. Stage Decoration Final Payment" /></div>
                <div className="flex flex-col"><label className={labelStyle}>Category</label><select value={expFormData.category} onChange={e => setExpFormData({...expFormData, category: e.target.value})} className={neonInputStyle}><option value="">Select Category</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}</select></div>
                <div className="flex flex-col"><label className={labelStyle}>Amount (₹)</label><Input required type="number" value={expFormData.amount} onChange={e => setExpFormData({...expFormData, amount: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Paid To / Vendor</label><Input value={expFormData.paid_to} onChange={e => setExpFormData({...expFormData, paid_to: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Vendor Contact</label><Input value={expFormData.vendor_contact} onChange={e => setExpFormData({...expFormData, vendor_contact: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Payment Method</label><select value={expFormData.payment_method} onChange={e => setExpFormData({...expFormData, payment_method: e.target.value})} className={neonInputStyle}><option value="UPI" className="bg-[#0f172a]">UPI</option><option value="Cash" className="bg-[#0f172a]">Cash</option><option value="Bank Transfer" className="bg-[#0f172a]">Bank Transfer</option></select></div>
                <div className="flex flex-col"><label className={labelStyle}>Expense Date</label><input type="date" value={expFormData.expense_date} onChange={e => setExpFormData({...expFormData, expense_date: e.target.value})} className={neonInputStyle} /></div>
                <div className="flex flex-col md:col-span-2"><label className={labelStyle}>Notes</label><textarea rows="3" value={expFormData.notes} onChange={e => setExpFormData({...expFormData, notes: e.target.value})} className={neonInputStyle} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Upload Bill</label><input type="file" accept="image/*,application/pdf" onChange={e => setBillFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neonViolet/20 file:text-neonViolet cursor-pointer" /></div>
                <div className="flex flex-col"><label className={labelStyle}>Upload Proof</label><input type="file" accept="image/*,application/pdf" onChange={e => setProofFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neonViolet/20 file:text-neonViolet cursor-pointer" /></div>
                <Button className="md:col-span-2 w-full py-3 mt-4" variant="violet" type="submit">Save Expense Entry</Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {isExpEditModalOpen && expEditFormData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-2xl p-8 GlassCard border-neonCyan/30 rounded-3xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-neonCyan">Edit Expense {expEditFormData.expense_id}</h3>
                <button onClick={() => setIsExpEditModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2"><label className={labelStyle}>Expense Title</label><Input required value={expEditFormData.title} onChange={e => setExpEditFormData({...expEditFormData, title: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Category</label><select value={expEditFormData.category} onChange={e => setExpEditFormData({...expEditFormData, category: e.target.value})} className={neonInputStyle}><option value="">Select Category</option>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}</select></div>
                <div className="flex flex-col"><label className={labelStyle}>Amount (₹)</label><Input required type="number" value={expEditFormData.amount} onChange={e => setExpEditFormData({...expEditFormData, amount: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Paid To / Vendor</label><Input value={expEditFormData.paid_to} onChange={e => setExpEditFormData({...expEditFormData, paid_to: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Vendor Contact</label><Input value={expEditFormData.vendor_contact} onChange={e => setExpEditFormData({...expEditFormData, vendor_contact: e.target.value})} /></div>
                <div className="flex flex-col"><label className={labelStyle}>Payment Method</label><select value={expEditFormData.payment_method} onChange={e => setExpEditFormData({...expEditFormData, payment_method: e.target.value})} className={neonInputStyle}><option value="UPI" className="bg-[#0f172a]">UPI</option><option value="Cash" className="bg-[#0f172a]">Cash</option><option value="Bank Transfer" className="bg-[#0f172a]">Bank Transfer</option></select></div>
                <div className="flex flex-col"><label className={labelStyle}>Expense Date</label><input type="date" value={expEditFormData.expense_date} onChange={e => setExpEditFormData({...expEditFormData, expense_date: e.target.value})} className={neonInputStyle} /></div>
                <div className="flex flex-col md:col-span-2"><label className={labelStyle}>Notes</label><textarea rows="3" value={expEditFormData.notes} onChange={e => setExpEditFormData({...expEditFormData, notes: e.target.value})} className={neonInputStyle} /></div>
                <div className="flex flex-col">
                  <label className={labelStyle}>Update Bill</label>
                  <div className="text-[10px] text-gray-500 mb-1">{expEditFormData.bill_url ? '✓ Bill already uploaded' : 'No bill uploaded'}</div>
                  <input type="file" accept="image/*,application/pdf" onChange={e => setEditBillFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neonCyan/20 file:text-neonCyan cursor-pointer" />
                </div>
                <div className="flex flex-col">
                  <label className={labelStyle}>Update Proof</label>
                  <div className="text-[10px] text-gray-500 mb-1">{expEditFormData.payment_proof_url ? '✓ Proof already uploaded' : 'No proof uploaded'}</div>
                  <input type="file" accept="image/*,application/pdf" onChange={e => setEditProofFile(e.target.files[0])} className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-neonCyan/20 file:text-neonCyan cursor-pointer" />
                </div>
                <div className="flex gap-3 md:col-span-2 mt-4">
                  <Button className="flex-1 py-3" variant="cyan" type="submit">Save Changes</Button>
                  <Button className="flex-1 py-3 border border-white/20" onClick={() => setIsExpEditModalOpen(false)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Budget Modal (Add/Edit) */}
        { (isBudgetModalOpen || isBudgetEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-md p-8 GlassCard border-neonCyan/30 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-neonCyan">{isBudgetEditModalOpen ? 'Edit Budget' : 'Set Budget'}</h3>
                <button onClick={() => { setIsBudgetModalOpen(false); setIsBudgetEditModalOpen(false); }} className="text-gray-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className={labelStyle}>Category</label>
                  <select value={budgetFormData.category} onChange={e => setBudgetFormData({...budgetFormData, category: e.target.value})} className={`${neonInputStyle} ${isBudgetEditModalOpen ? 'opacity-60 pointer-events-none' : ''}`}>
                    <option value="">Select Category</option>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className={labelStyle}>Budget Amount (₹)</label>
                  <Input type="number" value={budgetFormData.amount} onChange={e => setBudgetFormData({...budgetFormData, amount: e.target.value})} />
                </div>
                <Button className="w-full py-3 mt-4" variant="cyan" onClick={handleSetBudget}>Save Budget</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Budget Delete Confirmation */}
        {isBudgetDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-sm p-8 GlassCard border-red-500/30 rounded-3xl text-center">
              <div className="mb-6 text-red-400"><Trash2 size={48} className="mx-auto" /></div>
              <h3 className="text-xl font-bold text-white mb-2">Remove Budget?</h3>
              <p className="text-gray-400 text-sm mb-8">Are you sure you want to remove the budget for <span className="text-white font-bold">{budgetToDelete}</span>? This will not delete any expenses.</p>
              <div className="flex gap-3">
                <Button className="flex-1 py-2 border border-white/20" onClick={() => { setIsBudgetDeleteModalOpen(false); setBudgetToDelete(null); }}>Cancel</Button>
                <Button className="flex-1 py-2 bg-red-600 text-white border-red-400" onClick={handleDeleteBudget}>Confirm Delete</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- REJECTION MODAL --- */}
        {rejectModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })} className="absolute inset-0 bg-darkBg/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative z-10 w-full max-w-md p-6 md:p-8 glass-card border-red-500/30 rounded-3xl shadow-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-4 uppercase tracking-wider">Reject Payment</h3>
              <p className="text-gray-400 text-sm mb-6">Provide a specific reason for the student to fix their submission.</p>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-500 ml-1">Reason</label>
                  <Select options={REJECTION_OPTIONS} value={rejectModal.reason} onChange={(val) => { setRejectModal(prev => ({ ...prev, reason: val, isOther: val === 'Other' })); }} />
                </div>
                {rejectModal.isOther && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 ml-1">Specify Details</label>
                    <Input placeholder="e.g. Incorrect amount, please pay ₹400" value={rejectModal.reason} onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} />
                  </motion.div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="violet" className="flex-1" onClick={() => setRejectModal({ isOpen: false, paymentId: null, reason: '', isOther: false })}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white border-red-400 hover:bg-red-700" onClick={handleRejectSubmit}>Confirm Reject</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCard = ({ title, value, color, border }) => (
  <GlassCard className={`p-4 text-center ${border}`}>
    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </GlassCard>
);

export default AdminDashboard;