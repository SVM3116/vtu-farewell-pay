import { supabase } from './supabase';

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
      // RESUBMISSION: Update UTR, Timestamp, and Mobile Number
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          utr: paymentData.utr,
          payment_timestamp: paymentData.payment_timestamp,
          mobile: paymentData.mobile, // Now updates mobile too
          status: 'pending',
          rejection_reason: null,
          verified_by: null,
          verified_at: null,
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      await supabase.from('audit_logs').insert({
        action: 'resubmitted',
        performed_by: 'Student',
        role: 'student',
        payment_id: existing.id,
        usn: paymentData.usn,
        timestamp: new Date().toISOString(),
      });

      return { success: true, resubmitted: true };
    }
  }

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

  // PGRST116 means "No rows found". This is NOT a system error, it just means the USN doesn't exist.
  if (error && error.code === 'PGRST116') {
    return null; 
  }

  if (error) throw error;
  return data;
};