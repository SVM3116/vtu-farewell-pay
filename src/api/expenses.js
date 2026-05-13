import { supabase } from './supabase';

/**
 * Helper to generate the sequential Expense ID: EXP-2026-001, EXP-2026-002, etc.
 */
async function generateExpenseId() {
  const { data, error } = await supabase
    .from('expenses')
    .select('expense_id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return 'EXP-2026-001';
  }

  const lastId = data[0].expense_id;
  const currentNumber = parseInt(lastId.split('-')[2]);
  const nextNumber = currentNumber + 1;
  
  return `EXP-2026-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Helper to handle file uploads to Supabase Storage
 */
async function uploadExpenseFile(bucket, file) {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export const expenseApi = {
  async fetchExpenses(filters = {}) {
    let query = supabase.from('expenses').select('*');

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method);
    if (filters.startDate) query = query.gte('expense_date', filters.startDate);
    if (filters.endDate) query = query.lte('expense_date', filters.endDate);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);

    const { data, error } = await query.order('expense_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async fetchExpenseSummary() {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, payment_method');

    if (error) throw error;

    const total = data.reduce((sum, row) => sum + row.amount, 0);
    const cash = data
      .filter(row => row.payment_method === 'Cash')
      .reduce((sum, row) => sum + row.amount, 0);
    const digital = total - cash;

    return {
      totalExpenses: total,
      count: data.length,
      cashSum: cash,
      digitalSum: digital,
    };
  },

  async addExpense(data, billFile, proofFile) {
    const expenseId = await generateExpenseId();
    const billUrl = await uploadExpenseFile('expense-bills', billFile);
    const proofUrl = await uploadExpenseFile('expense-payment-proofs', proofFile);

    const expenseData = { ...data, expense_id: expenseId, bill_url: billUrl, payment_proof_url: proofUrl };

    const { data: insertedData, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;

    await this.logExpenseAction('expense_added', {
      payment_id: insertedData.id,
      reason: `Added ₹${data.amount} for ${data.category} — ${data.title}`,
    });

    return insertedData;
  },

  async updateExpense(id, data, billFile, proofFile) {
    const { data: current } = await supabase
      .from('expenses')
      .select('bill_url, payment_proof_url')
      .eq('id', id)
      .single();

    const billUrl = billFile ? await uploadExpenseFile('expense-bills', billFile) : current.bill_url;
    const proofUrl = proofFile ? await uploadExpenseFile('expense-payment-proofs', proofFile) : current.payment_proof_url;

    const updatedData = { ...data, bill_url: billUrl, payment_proof_url: proofUrl };

    const { data: result, error } = await supabase
      .from('expenses')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logExpenseAction('expense_edited', {
      payment_id: id,
      reason: `Updated expense ${data.expense_id}`,
    });

    return result;
  },

  async deleteExpense(id, billUrl, proofUrl) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    await this.logExpenseAction('expense_deleted', {
      payment_id: id,
      reason: `Deleted expense record`,
    });
  },

  async fetchCategoryBudgets() {
    const { data, error } = await supabase.from('category_budgets').select('*');
    if (error) throw error;
    return data;
  },

  async setCategoryBudget(category, amount) {
    const { data, error } = await supabase
      .from('category_budgets')
      .upsert({ category, budget_amount: amount }, { onConflict: 'category' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async fetchTotalCollection() {
    const { data, error } = await supabase.from('payments').select('amount').eq('status', 'approved');
    if (error) throw error;
    return data.reduce((sum, row) => sum + row.amount, 0);
  },

  async logExpenseAction(action, details) {
    const { error } = await supabase.from('audit_logs').insert([{
      action: action,
      performed_by: 'Finance Head',
      role: 'admin',
      payment_id: details.payment_id,
      reason: details.reason,
      timestamp: new Date().toISOString(),
    }]);
    if (error) console.error('Audit Log Error:', error);
  },
};