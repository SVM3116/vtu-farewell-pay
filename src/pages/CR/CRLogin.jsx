import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input'; // New Elite Input
import { loginCR } from '../../api/auth';

const CRLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginCR(email, password);
      navigate('/cr-dashboard');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-[80vh] p-6">
      {/* ATMOSPHERIC LIGHTING */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-neonCyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-neonViolet/10 rounded-full blur-[120px] pointer-events-none" />
      
      <GlassCard className="relative w-full max-w-md p-10 text-center backdrop-blur-2xl border-white/10 shadow-2xl">
        <h2 className="text-3xl font-bold neon-text-gradient mb-8">CR Portal Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="Email Address"
            placeholder="cr@example.com" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Password"
            type="password" 
            placeholder="••••••••" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Button className="w-full py-3" onClick={handleLogin} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};

export default CRLogin;