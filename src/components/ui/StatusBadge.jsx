import React from 'react';

const StatusBadge = ({ status }) => {
  const config = {
    approved: {
      label: 'Approved ✅',
      className: 'bg-green-500/10 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
    },
    pending: {
      label: 'Pending ⏳',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] animate-pulse',
    },
    rejected: {
      label: 'Rejected ❌',
      className: 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    },
    disputed: {
      label: '⚠️ Disputed',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    },
  };

  const current = config[status] || config.pending;

  return (
    <span className={`
      inline-flex items-center justify-center 
      px-2 py-0.5 
      rounded-full border 
      text-[10px] font-bold uppercase 
      whitespace-nowrap 
      transition-all duration-200
      ${current.className}
    `}>
      {current.label}
    </span>
  );
};

export default StatusBadge;