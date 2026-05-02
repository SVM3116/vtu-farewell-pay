import React from 'react';

const StampBadge = ({ status, verified_by }) => {
  // STATUS COLORS (Outer Ring Glow)
  const statusConfig = {
    approved: {
      label: 'APPROVED',
      color: 'text-green-400',
      glow: 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)]',
      bg: 'bg-green-500/10',
    },
    pending: {
      label: 'PENDING',
      color: 'text-yellow-400',
      glow: 'border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]',
      bg: 'bg-yellow-500/10',
    },
    rejected: {
      label: 'REJECTED',
      color: 'text-red-400',
      glow: 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
      bg: 'bg-red-500/10',
    },
  };

  // VERIFIED BY COLORS (Inner Core)
  const getVerifierStyle = (name) => {
    if (!name || name === '—' || name === 'Not Verified') {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
    const upperName = name.toUpperCase();
    if (upperName === 'SYSTEM') return 'bg-neonCyan/20 text-neonCyan border-neonCyan/50';
    if (upperName.includes('FINANCE') || upperName.includes('HEAD')) return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
    return 'bg-neonViolet/20 text-neonViolet border-neonViolet/50';
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;
  const verifierName = (status === 'pending') ? '—' : (verified_by || 'NOT VERIFIED');

  return (
    <div className="relative group cursor-default transition-transform duration-300 hover:scale-110">
      {/* The Outer Seal Ring */}
      <div className={`
        relative w-16 h-16 rounded-full border-2 border-double 
        flex items-center justify-center text-center
        ${currentStatus.glow} ${currentStatus.bg}
        rotate-[-12deg] transition-all duration-500
      `}>
        
        {/* Circular Status Text (Simulated by top/bottom arcs) */}
        <div className="absolute inset-0 p-1">
          <span className={`absolute top-0 left-0 w-full text-center text-[7px] font-black uppercase tracking-tighter ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
          <span className={`absolute bottom-0 left-0 w-full text-center text-[7px] font-black uppercase tracking-tighter ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Inner Center Core */}
        <div className={`
          w-8 h-8 rounded-full border flex items-center justify-center
          text-[8px] font-black text-center leading-tight uppercase p-1
          ${getVerifierStyle(verifierName)}
        `}>
          {verifierName.length > 10 ? verifierName.substring(0, 10) : verifierName}
        </div>
      </div>
    </div>
  );
};

export default StampBadge;