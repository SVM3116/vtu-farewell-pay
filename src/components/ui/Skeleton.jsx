const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/10 rounded-md ${className}`}>
    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-shimmer" />
  </div>
);

export default Skeleton;