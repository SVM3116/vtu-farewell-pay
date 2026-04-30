import { supabase } from './supabase';

// --- CR AUTH LOGIC ---
export const loginCR = async (email, password) => {
  const { data, error } = await supabase
    .from('cr_accounts')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password)
    .single();

  if (error || !data) throw new Error("Invalid CR credentials.");

  localStorage.setItem('cr_session', JSON.stringify(data));
  return data;
};

export const getCurrentCR = () => {
  const session = localStorage.getItem('cr_session');
  return session ? JSON.parse(session) : null;
};

export const logoutCR = () => {
  localStorage.removeItem('cr_session');
  window.location.href = '/cr-login';
};

// --- ADMIN AUTH LOGIC (Now targeting admin_accounts table) ---
export const loginAdmin = async (email, password) => {
  const { data, error } = await supabase
    .from('admin_accounts') // Now pointing to the dedicated table
    .select('*')
    .eq('email', email)
    .eq('password_hash', password)
    .single();

  if (error || !data) throw new Error("Invalid Admin credentials.");

  localStorage.setItem('admin_session', JSON.stringify(data));
  return data;
};

export const getCurrentAdmin = () => {
  const session = localStorage.getItem('admin_session');
  return session ? JSON.parse(session) : null;
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_session');
  window.location.href = '/admin-login';
};