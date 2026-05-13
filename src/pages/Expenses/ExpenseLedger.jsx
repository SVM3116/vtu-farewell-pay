import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  ListChecks, 
  FileText, 
  ExternalLink, 
  X,
  Filter,
  Calendar
} from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { expenseApi } from '../../api/expenses';

const ExpenseLedger = () => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ totalExpenses: 0, count: 0 });
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    payment_method: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [expData, summaryData, budgetData, collectedData] = await Promise.all([
        expenseApi.fetchExpenses(),
        expenseApi.fetchExpenseSummary(),
        expenseApi.fetchCategoryBudgets(),
        expenseApi.fetchTotalCollection()
      ]);
      
      setExpenses(expData);
      setSummary(summaryData);
      setBudgets(budgetData);
      setTotalCollected(collectedData);
    } catch (error) {
      console.error("Error loading ledger data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredExpenses = expenses.filter(exp => {
    return (
      (!filters.category || exp.category === filters.category) &&
      (!filters.payment_method || exp.payment_method === filters.payment_method) &&
      (!filters.search || exp.title.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.startDate || exp.expense_date >= filters.startDate) &&
      (!filters.endDate || exp.expense_date <= filters.endDate)
    );
  });

  const calculateCategorySpent = (category) => {
    return expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getBudgetColor = (percent) => {
    if (percent >= 100) return 'bg-red-500 shadow-[0_0_10px_#ef4444]';
    if (percent >= 80) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
    return 'bg-[#00f5ff] shadow-[0_0_10px_#00f5ff]';
  };

  if (loading) return <PageWrapper><div className="h-screen flex items-center justify-center text-neon-cyan animate-pulse text-xl">Loading Ledger...</div></PageWrapper>;

  return (
    <PageWrapper>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            CELESTIA 2K26: Expense <span className="text-neon-cyan">Transparency</span> Ledger
          </h1>
          <p className="text-gray-400 text-lg">Complete record of all farewell event expenses — VTU Batch 2022–23</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard 
            title="Total Collected" 
            value={`₹${totalCollected.toLocaleString()}`} 
            icon={<Wallet className="text-neon-cyan" />} 
            color="text-neon-cyan" 
          />
          <SummaryCard 
            title="Total Expenses" 
            value={`₹${summary.totalExpenses.toLocaleString()}`} 
            icon={<TrendingDown className="text-neon-violet" />} 
            color="text-neon-violet" 
          />
          <SummaryCard 
            title="Remaining Balance" 
            value={`₹${(totalCollected - summary.totalExpenses).toLocaleString()}`} 
            icon={<TrendingUp className="text-green-400" />} 
            color="text-green-400" 
          />
          <SummaryCard 
            title="Expense Entries" 
            value={summary.count} 
            icon={<ListChecks className="text-white" />} 
            color="text-white" 
          />
        </div>

        {/* Budget Progress Section */}
        {budgets.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <TrendingUp size={24} className="text-neon-cyan" /> Budget Allocation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map(budget => {
                const spent = calculateCategorySpent(budget.category);
                const percent = (spent / budget.budget_amount) * 100;
                return (
                  <GlassCard key={budget.category} className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300 font-medium">{budget.category}</span>
                      <span className="text-white font-bold">₹{spent} / ₹{budget.budget_amount}</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percent, 100)}%` }}
                        className={`h-full ${getBudgetColor(percent)} transition-colors duration-500`}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className={percent > 100 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                        {percent > 100 ? '⚠️ Over Budget' : `${percent.toFixed(1)}% used`}
                      </span>
                      <span className="text-gray-400">₹{Math.max(0, budget.budget_amount - spent).toLocaleString()} left</span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4 text-white font-medium">
            <Filter size={20} className="text-neon-cyan" /> Filter Ledger
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input 
              name="search" 
              placeholder="Search title..." 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none transition-all"
              onChange={handleFilterChange}
            />
            <select 
              name="category" 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none transition-all"
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {Array.from(new Set(expenses.map(e => e.category))).map(cat => (
                <option key={cat} value={cat} className="bg-[#0a0f1e]">{cat}</option>
              ))}
            </select>
            <select 
              name="payment_method" 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none transition-all"
              onChange={handleFilterChange}
            >
              <option value="">All Methods</option>
              <option value="Cash" className="bg-[#0a0f1e]">Cash</option>
              <option value="UPI" className="bg-[#0a0f1e]">UPI</option>
              <option value="Bank Transfer" className="bg-[#0a0f1e]">Bank Transfer</option>
            </select>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                name="startDate" 
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:border-neon-cyan outline-none transition-all w-full"
                onChange={handleFilterChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                name="endDate" 
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:border-neon-cyan outline-none transition-all w-full"
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </GlassCard>

        {/* Ledger Table / Mobile Cards */}
        <div className="pb-10">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase text-xs tracking-widest">
                  <th className="px-4 py-4 font-medium">ID</th>
                  <th className="px-4 py-4 font-medium">Expense</th>
                  <th className="px-4 py-4 font-medium">Category</th>
                  <th className="px-4 py-4 font-medium text-right">Amount</th>
                  <th className="px-4 py-4 font-medium">Paid To</th>
                  <th className="px-4 py-4 font-medium">Contact</th>
                  <th className="px-4 py-4 font-medium">Method</th>
                  <th className="px-4 py-4 font-medium">Date</th>
                  <th className="px-4 py-4 font-medium">Notes</th> {/* Added this */}
                  <th className="px-4 py-4 font-medium text-center">Documents</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {filteredExpenses.length > 0 ? filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 text-xs font-mono text-gray-500">{exp.expense_id}</td>
                    <td className="px-4 py-4 font-medium">{exp.title}</td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] px-2 py-1 rounded bg-neonCyan/10 border border-neonCyan/30 text-neonCyan font-bold uppercase tracking-wider">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-neon-cyan">₹{exp.amount}</td>
                    <td className="px-4 py-4 text-gray-300">{exp.paid_to || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-400">{exp.vendor_contact || '—'}</td>
                    <td className="px-4 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-sm">{exp.expense_date}</td>
                    <td className="px-4 py-4 text-gray-400 text-sm italic">{exp.notes || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        {exp.bill_url && (
                          <FileButton 
                            label="Bill" 
                            onClick={() => setPreviewFile({ url: exp.bill_url, title: `Bill: ${exp.title}` })} 
                          />
                        )}
                        {exp.payment_proof_url && (
                          <FileButton 
                            label="Proof" 
                            onClick={() => setPreviewFile({ url: exp.payment_proof_url, title: `Proof: ${exp.title}` })} 
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-10 text-center text-gray-500">No matching expenses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredExpenses.length > 0 ? filteredExpenses.map((exp) => (
              <GlassCard key={exp.id} className="p-4 space-y-3 border-l-4 border-neonCyan">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-500">{exp.expense_id}</p>
                    <h4 className="text-lg font-bold text-white">{exp.title}</h4>
                  </div>
                  <span className="text-lg font-bold text-neon-cyan">₹{exp.amount}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded bg-neonCyan/10 border border-neonCyan/30 text-neonCyan font-bold uppercase tracking-wider">
                    {exp.category}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded bg-white/10 border border-white/10 text-gray-300">
                    {exp.payment_method}
                  </span>
                </div>

                <div className="text-sm space-y-1 border-t border-white/5 pt-3">
                  <p className="text-gray-400"><span className="text-gray-500 font-medium">Vendor:</span> <span className="text-gray-200">{exp.paid_to || '—'}</span></p>
                  <p className="text-gray-400"><span className="text-gray-500 font-medium">Contact:</span> <span className="text-gray-200 font-mono">{exp.vendor_contact || '—'}</span></p>
                  <p className="text-gray-400"><span className="text-gray-500 font-medium">Date:</span> {exp.expense_date}</p>
                  <p className="text-gray-400"><span className="text-gray-500 font-medium">Notes:</span> <span className="text-gray-200 italic">{exp.notes || '—'}</span></p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {exp.bill_url && (
                    <FileButton 
                      label="Bill" 
                      onClick={() => setPreviewFile({ url: exp.bill_url, title: `Bill: ${exp.title}` })} 
                    />
                  )}
                  {exp.payment_proof_url && (
                    <FileButton 
                      label="Proof" 
                      onClick={() => setPreviewFile({ url: exp.payment_proof_url, title: `Proof: ${exp.title}` })} 
                    />
                  )}
                </div>
              </GlassCard>
            )) : (
              <div className="text-center py-10 text-gray-500">No matching expenses found.</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0f1e] border border-white/20 rounded-2xl max-w-4xl w-full overflow-hidden relative"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-medium">{previewFile.title}</h3>
                <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-2 bg-black flex justify-center items-center min-h-[400px]">
                {previewFile.url.toLowerCase().endsWith('.pdf') ? (
                  <a 
                    href={previewFile.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex flex-col items-center gap-4 text-white group"
                  >
                    <FileText size={64} className="text-neon-cyan group-hover:scale-110 transition-transform" />
                    <span className="flex items-center gap-2 text-xl">Open PDF Document <ExternalLink size={20} /></span>
                  </a>
                ) : (
                  <img src={previewFile.url} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

const SummaryCard = ({ title, value, icon, color }) => (
  <GlassCard className="p-6 flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <span className="text-gray-400 text-sm font-medium">{title}</span>
      <div className="p-2 rounded-lg bg-white/5">{icon}</div>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </GlassCard>
);

const FileButton = ({ label, onClick }) => (
  <button 
    onClick={onClick} 
    className="p-2 text-[10px] uppercase font-bold rounded bg-white/10 border border-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all"
  >
    {label}
  </button>
);

export default ExpenseLedger;