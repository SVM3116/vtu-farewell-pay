import { motion } from 'framer-motion';

const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Neon Cyan Orb */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]"
      />
      {/* Neon Violet Orb */}
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 -right-20 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]"
      />
      {/* Subtle Deep Blue Orb */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -80, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-900/30 rounded-full blur-[80px]"
      />
    </div>
  );
};

// Inside your LandingPage return statement:
// <div className="relative min-h-screen">
//    <BackgroundOrbs /> 
//    ... rest of your landing content
// </div>