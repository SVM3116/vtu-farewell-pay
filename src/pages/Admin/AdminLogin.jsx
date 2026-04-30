import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { loginAdmin } from '../../api/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/admin-dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-[80vh] p-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neonViolet/20 rounded-full blur-[120px] pointer-events-none" />
      
      <GlassCard className="relative w-full max-w-md p-10 text-center border-neonViolet backdrop-blur-2xl shadow-2xl">
        <h2 className="text-3xl font-bold neon-text-gradient mb-2">Finance Command</h2>
        <p className="text-gray-500 mb-8 text-sm tracking-widest uppercase">Restricted Admin Access Only</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Admin Email" 
            placeholder="admin@vtu.edu" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Admin Password" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Button variant="violet" className="w-full py-3" onClick={handleLogin} disabled={loading}>
            {loading ? 'Authenticating...' : 'Enter Command Center'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminLogin;