import { supabase } from './supabase';

export const loginCR = async (email, password) => {
  // In a real production app, we'd use bcrypt on the server. 
  // Since we are client-side, we'll check the password_hash in our cr_accounts table.
  const { data, error } = await supabase
    .from('cr_accounts')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password) // For this project, we'll store simple passwords or pre-hashed ones
    .single();

  if (error || !data) throw new Error('Invalid email or password');
  
  // Store CR info in localStorage to maintain the session
  localStorage.setItem('cr_session', JSON.stringify(data));
  return data;
};

export const logoutCR = () => {
  localStorage.removeItem('cr_session');
  window.location.href = '/cr-login';
};

export const getCurrentCR = () => {
  const session = localStorage.getItem('cr_session');
  return session ? JSON.parse(session) : null;
};

export const loginAdmin = async (email, password) => {
  // For this project, the admin account is manually added to the cr_accounts table 
  // but given a specific flag or simply managed via the admin-login page.
  const { data, error } = await supabase
    .from('cr_accounts')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password)
    .single();

  if (error || !data) throw new Error('Invalid Admin credentials');
  
  localStorage.setItem('admin_session', JSON.stringify(data));
  return data;
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_session');
  window.location.href = '/admin-login';
};

export const getCurrentAdmin = () => {
  const session = localStorage.getItem('admin_session');
  return session ? JSON.parse(session) : null;
};