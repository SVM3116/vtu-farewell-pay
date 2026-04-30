import React from 'react';
import { Link } from 'react-router-dom';
import { EVENT_DETAILS } from '../../utils/constants';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-3 glass-card rounded-none border-t-0 border-x-0 backdrop-blur-md flex items-center justify-between">
      <Link to="/" className="flex items-center gap-4 group">
        <img 
          src="/logo-vtu.png" 
          alt="VTU Logo" 
          className="h-12 w-12 object-contain transition-transform group-hover:scale-110" 
        />
        <div>
          <h1 className="text-xl font-bold neon-text-gradient leading-none">
            {EVENT_DETAILS.name}
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            {EVENT_DETAILS.batch} | {EVENT_DETAILS.dates}
          </p>
        </div>
      </Link>

      <div className="flex gap-6 items-center">
        <Link to="/submit" className="text-sm text-gray-300 hover:text-neonCyan transition-colors">Submit Payment</Link>
        <Link to="/status" className="text-sm text-gray-300 hover:text-neonCyan transition-colors">Check Status</Link>
        {/* ADDED CR LOGIN LINK BELOW */}
        <Link to="/cr-login" className="text-sm text-gray-300 hover:text-neonCyan transition-colors font-medium">CR Login</Link>
      </div>
    </nav>
  );
};

export default Navbar;