import { supabase } from './supabase';

// --- INTERNAL HELPER: Forces Indian Standard Time (IST) for Database storage ---
const getISTTime = () => {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins in ms
  const istDate = new Date(now.getTime() + offset);
  // Remove 'Z' at the end so Supabase treats it as a local timestamp, not UTC
  return istDate.toISOString().slice(0, -1); 
};

// Check if a USN or UTR already exists in the database
export const checkDuplicate = async (column, value) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id')
    .eq(column, value)
    .single();

  if (error && error.code === 'PGRST116') return false; 
  return !!data; 
};

// Submit payment to the database with Resubmission Logic
export const submitPayment = async (paymentData) => {
  const { data: existing, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('usn', paymentData.usn)
    .single();

  if (existing) {
    if (existing.status === 'pending') {
      throw new Error("Your payment is already submitted and under review.");
    }
    if (existing.status === 'approved') {
      throw new Error("Your payment is already approved. No action needed.");
    }
    
    if (existing.status === 'rejected') {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          utr: paymentData.utr,
          // REMOVED: payment_timestamp as it's now handled by the bank CSV
          mobile: paymentData.mobile,
          status: 'pending',
          rejection_reason: null,
          verified_by: null,
          verified_at: null,
          amount_flag: false,
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      // FIX: Save resubmission audit log in IST
      await supabase.from('audit_logs').insert({
        action: 'resubmitted',
        performed_by: 'Student',
        role: 'student',
        payment_id: existing.id,
        usn: paymentData.usn,
        timestamp: getISTTime(), 
      });

      return { success: true, resubmitted: true };
    }
  }

  // Standard Insert
  const { data, error: insertError } = await supabase
    .from('payments')
    .insert([paymentData])
    .select();

  if (insertError) throw insertError;
  return data;
};

export const checkPaymentStatus = async (usn) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('usn', usn)
    .single();

  if (error && error.code === 'PGRST116') return null; 
  if (error) throw error;
  return data;
}; 

/** 
 * SYSTEM UTILITIES 
 */

export const getPendingPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'pending');
  if (error) throw error;
  return data || [];
};

export const getApprovedUTRs = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('utr')
    .eq('status', 'approved');
  if (error) throw error;
  return new Set((data || []).map(item => item.utr));
};

export const updatePaymentBySystem = async (paymentId, updates) => {
  const { error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId);
  if (error) throw error;
  return true;
};

// System level audit logging - FORCED IST VERSION
export const logSystemAction = async (logData) => {
  try {
    const cleanData = { ...logData };
    delete cleanData.timestamp; 

    const finalPayload = {
      ...cleanData,
      performed_by: 'SYSTEM',
      role: 'system',
      timestamp: getISTTime(), // <--- FORCE IST IN ALL SYSTEM LOGS
    };

    const { error } = await supabase.from('audit_logs').insert([finalPayload]);
    if (error) console.error("Audit Log Error:", error.message);
    return true;
  } catch (err) {
    console.error("Critical Audit Log Exception:", err);
    return false;
  }
};